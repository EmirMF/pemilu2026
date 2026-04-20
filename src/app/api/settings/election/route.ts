import { NextResponse } from 'next/server'
import { getElectionSettings, setElectionOpen, invalidateElectionSettingsCache } from '@/lib/election'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { verifyCookie } from '@/lib/secureCookie'

const VOTE_BUTTON_STATES = ['default', 'before', 'hidden', 'lihat hasil'] as const
type VoteButtonState = (typeof VOTE_BUTTON_STATES)[number]

function isVoteButtonState(value: unknown): value is VoteButtonState {
  return typeof value === 'string' && VOTE_BUTTON_STATES.includes(value as VoteButtonState)
}

function formatElectionSettings(settings: {
  isOpen: boolean
  microsoftLoginEnabled?: boolean | null
  countdownEnd: Date | string | null
  countdownType: string | null
  bgGradientFrom: string | null
  bgGradientVia: string | null
  bgGradientTo: string | null
  showTotalVotes: boolean | null
  showVotingStatus?: boolean | null
  showUserVoteStatus?: boolean | null
  voteButtonState?: string | null
  updatedAt: Date | string
}) {
  return {
    isOpen: settings.isOpen,
    microsoftLoginEnabled: settings.microsoftLoginEnabled ?? true,
    countdownEnd: settings.countdownEnd
      ? (settings.countdownEnd instanceof Date
          ? settings.countdownEnd.toISOString()
          : settings.countdownEnd)
      : null,
    countdownType: settings.countdownType || 'end',
    bgGradientFrom: settings.bgGradientFrom || '#FFC300',
    bgGradientVia: settings.bgGradientVia || '#FF8040',
    bgGradientTo: settings.bgGradientTo || '#FFE6B3',
    showTotalVotes: settings.showTotalVotes ?? true,
    showVotingStatus: settings.showVotingStatus ?? true,
    showUserVoteStatus: settings.showUserVoteStatus ?? true,
    voteButtonState: isVoteButtonState(settings.voteButtonState) ? settings.voteButtonState : 'default',
    updatedAt: settings.updatedAt instanceof Date ? settings.updatedAt : new Date(settings.updatedAt),
  }
}

export async function GET() {
  try {
    const settings = await getElectionSettings()
    return NextResponse.json(formatElectionSettings(settings))
  } catch (error) {
    console.error('Error fetching election settings:', error)
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server.'
    return NextResponse.json({
      error: 'Gagal mengambil status pemilihan.',
      details: errorMessage
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // Check admin auth for settings changes (except voteButtonState which uses password)
    const hasSettingsChange = 'showTotalVotes' in body || 'bgGradientFrom' in body || 'bgGradientVia' in body || 'bgGradientTo' in body || 'countdownEnd' in body || 'countdownType' in body || 'isOpen' in body || 'microsoftLoginEnabled' in body;
    
    if (hasSettingsChange) {
      const cookieStore = await cookies();
      const signedSession = cookieStore.get('voter_session')?.value;

      if (!signedSession) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const email = verifyCookie(signedSession);
      if (!email) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }

      const nim = email.split('@')[0];
      const admin = await prisma.admin.findUnique({ where: { nim } });

      if (!admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    // Handle vote button state update
    if ('voteButtonState' in body) {
      if (!isVoteButtonState(body.voteButtonState)) {
        return NextResponse.json(
          { error: 'State tombol vote tidak valid.' },
          { status: 400 },
        )
      }

      // Password required for sensitive states
      if (body.voteButtonState === 'default' || body.voteButtonState === 'lihat hasil') {
        if (!body.password) {
          return NextResponse.json(
            { error: 'Password sistem diperlukan.' },
            { status: 400 },
          )
        }

        const settings = await prisma.electionSettings.findUnique({
          where: { key: 'main' },
        })

        const storedPassword = (settings as any)?.publishPassword
        if (!storedPassword) {
          return NextResponse.json(
            { error: 'Password sistem belum dikonfigurasi.' },
            { status: 500 },
          )
        }

        const isValid = await bcrypt.compare(body.password, storedPassword)
        if (!isValid) {
          return NextResponse.json(
            { error: 'Password sistem salah.' },
            { status: 401 },
          )
        }
      }

      const updated = await prisma.electionSettings.upsert({
        where: { key: 'main' },
        update: { voteButtonState: body.voteButtonState },
        create: {
          key: 'main',
          isOpen: true,
          voteButtonState: body.voteButtonState,
        },
      })

      // Invalidate cache
      await invalidateElectionSettingsCache()

      return NextResponse.json(formatElectionSettings(updated))
    }
    
    // Handle showTotalVotes update
    if ('showTotalVotes' in body) {
      const updated = await prisma.electionSettings.upsert({
        where: { key: 'main' },
        update: { showTotalVotes: Boolean(body.showTotalVotes) },
        create: {
          key: 'main',
          isOpen: true,
          showTotalVotes: Boolean(body.showTotalVotes),
        },
      })
      
      // Invalidate cache
      await invalidateElectionSettingsCache()
      
      return NextResponse.json(formatElectionSettings(updated))
    }

    // Handle Microsoft login toggle
    if ('microsoftLoginEnabled' in body) {
      const updated = await prisma.electionSettings.upsert({
        where: { key: 'main' },
        update: { microsoftLoginEnabled: Boolean(body.microsoftLoginEnabled) },
        create: {
          key: 'main',
          isOpen: true,
          microsoftLoginEnabled: Boolean(body.microsoftLoginEnabled),
        },
      })

      await invalidateElectionSettingsCache()

      return NextResponse.json(formatElectionSettings(updated))
    }
    
    // Handle gradient colors update
    if ('bgGradientFrom' in body || 'bgGradientVia' in body || 'bgGradientTo' in body) {
      const settings = await getElectionSettings()
      const updated = await setElectionOpen(
        settings.isOpen,
        settings.countdownEnd,
        settings.countdownType || 'end',
        body.bgGradientFrom,
        body.bgGradientVia,
        body.bgGradientTo
      )
      return NextResponse.json(formatElectionSettings(updated))
    }
    
    // Handle countdown update
    if ('countdownEnd' in body || 'countdownType' in body) {
      const countdownEnd = body.countdownEnd ? new Date(body.countdownEnd) : null
      const countdownType = body.countdownType || 'end'
      const settings = await getElectionSettings()
      const updated = await setElectionOpen(settings.isOpen, countdownEnd, countdownType)
      return NextResponse.json(formatElectionSettings(updated))
    }
    
    // Handle isOpen update
    if ('isOpen' in body) {
      const newIsOpen = Boolean(body.isOpen)
      const settings = await getElectionSettings()
      
      // Require password for changing isOpen
      if (!body.password) {
        return NextResponse.json(
          { error: 'Password sistem diperlukan.' },
          { status: 400 },
        )
      }

      const storedPassword = (settings as any)?.publishPassword
      if (!storedPassword) {
        return NextResponse.json(
          { error: 'Password sistem belum dikonfigurasi.' },
          { status: 500 },
        )
      }

      const isValid = await bcrypt.compare(body.password, storedPassword)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Password sistem salah.' },
          { status: 401 },
        )
      }

      const updated = await setElectionOpen(newIsOpen)
      return NextResponse.json(formatElectionSettings(updated))
    }
  } catch (error) {
    console.error('Error updating election settings:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    // Check admin auth
    const cookieStore = await cookies();
    const signedSession = cookieStore.get('voter_session')?.value;

    if (!signedSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = verifyCookie(signedSession);
    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const nim = email.split('@')[0];
    const admin = await prisma.admin.findUnique({ where: { nim } });

    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json()
    
    const updateData: Record<string, unknown> = {}
    
    if ('showVotingStatus' in body) {
      updateData.showVotingStatus = Boolean(body.showVotingStatus)
    }
    
    if ('showUserVoteStatus' in body) {
      updateData.showUserVoteStatus = Boolean(body.showUserVoteStatus)
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diupdate.' }, { status: 400 })
    }
    
    const updated = await prisma.electionSettings.upsert({
      where: { key: 'main' },
      update: updateData,
      create: {
        key: 'main',
        isOpen: true,
        ...updateData,
      },
    })
    
    // Invalidate cache
    await invalidateElectionSettingsCache()
    
    const result = updated as typeof updated & { showVotingStatus?: boolean; showUserVoteStatus?: boolean }
    
    return NextResponse.json({
      showVotingStatus: result.showVotingStatus ?? true,
      showUserVoteStatus: result.showUserVoteStatus ?? true,
    })
  } catch (error) {
    console.error('Error updating badge visibility settings:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

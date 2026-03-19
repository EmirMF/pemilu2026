import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getElectionSettings } from '@/lib/election';
import { rateLimit } from '@/lib/rateLimit';
import { verifyCookie } from '@/lib/secureCookie';
import { acquireVoteLock, releaseVoteLock } from '@/lib/voteLock';
import { createAuditLog } from '@/lib/auditLog';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const signedSession = cookieStore.get('voter_session')?.value;

    if (!signedSession) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan atau kedaluwarsa. Silakan login kembali.' }, { status: 401 });
    }

    // Verify signed session cookie
    const email = verifyCookie(signedSession);
    if (!email) {
      return NextResponse.json({ error: 'Sesi tidak valid. Silakan login kembali.' }, { status: 401 });
    }

    // Rate limiting by email
    const rateLimitResult = await rateLimit(`vote:${email}`, {
      interval: 60, // 1 minute
      maxRequests: 10 // max 10 vote attempts per minute
    });

    if (!rateLimitResult.success) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${resetIn} detik.` },
        { status: 429 }
      );
    }

    const { candidateId } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'Kandidat tidak dipilih.' }, { status: 400 });
    }

    const settings = await getElectionSettings();
    if (!settings.isOpen) {
      return NextResponse.json({ error: 'Pemilihan sedang ditutup.' }, { status: 403 });
    }

    const nim = email.split('@')[0];

    // Acquire distributed lock to prevent concurrent voting attempts
    const lockAcquired = await acquireVoteLock(nim, 10); // 10 second lock
    
    if (!lockAcquired) {
      // Audit: blocked vote attempt
      await createAuditLog({
        action: 'VOTE_ATTEMPT_FAILED',
        actorNim: nim,
        actorEmail: email,
        actorRole: 'VOTER',
        targetId: candidateId,
        targetType: 'CANDIDATE',
        status: 'BLOCKED',
        errorMsg: 'Lock acquisition failed - concurrent request',
      });
      
      return NextResponse.json({
        error: 'Permintaan voting sedang diproses. Silakan tunggu sebentar.'
      }, { status: 429 });
    }

    // Transaction to ensure atomic voting operation with race condition protection
    try {
      await prisma.$transaction(async (tx) => {
        // Check if user is in DPT (whitelist with isInDPT = true)
        const whitelistEntry = await tx.whitelist.findUnique({ where: { nim } });
        
        if (!whitelistEntry) {
          throw new Error('NOT_IN_WHITELIST');
        }
        
        if (!(whitelistEntry as any).isInDPT) {
          throw new Error('NOT_IN_DPT');
        }

        // Check voter exists and hasn't voted yet (inside transaction)
        const voter = await tx.voter.findUnique({ where: { nim } });

        if (!voter) {
          throw new Error('VOTER_NOT_FOUND');
        }

        if (voter.hasVoted) {
          throw new Error('ALREADY_VOTED');
        }

        // Update voter and create vote record atomically
        await tx.voter.update({
          where: {
            nim,
            hasVoted: false // Additional safety: only update if still false
          },
          data: {
            hasVoted: true,
            votedAt: new Date()
          }
        });

        await tx.voteRecord.create({
          data: {
            candidateId: candidateId.toString()
          }
        });
      });
    } catch (error: any) {
      // Release lock on error
      await releaseVoteLock(nim);
      
      // Handle custom errors from transaction
      if (error.message === 'NOT_IN_WHITELIST') {
        await createAuditLog({
          action: 'VOTE_ATTEMPT_FAILED',
          actorNim: nim,
          actorEmail: email,
          actorRole: 'VOTER',
          targetId: candidateId,
          targetType: 'CANDIDATE',
          status: 'FAILED',
          errorMsg: 'Not in whitelist',
        });
        return NextResponse.json({ error: 'Anda tidak terdaftar dalam whitelist.' }, { status: 403 });
      }
      if (error.message === 'NOT_IN_DPT') {
        await createAuditLog({
          action: 'VOTE_ATTEMPT_FAILED',
          actorNim: nim,
          actorEmail: email,
          actorRole: 'VOTER',
          targetId: candidateId,
          targetType: 'CANDIDATE',
          status: 'FAILED',
          errorMsg: 'Not in DPT',
        });
        return NextResponse.json({ error: 'Anda tidak terdaftar dalam DPT (Daftar Pemilih Tetap).' }, { status: 403 });
      }
      if (error.message === 'VOTER_NOT_FOUND') {
        await createAuditLog({
          action: 'VOTE_ATTEMPT_FAILED',
          actorNim: nim,
          actorEmail: email,
          actorRole: 'VOTER',
          targetId: candidateId,
          targetType: 'CANDIDATE',
          status: 'FAILED',
          errorMsg: 'Voter not found',
        });
        return NextResponse.json({ error: 'Data pemilih tidak ditemukan.' }, { status: 404 });
      }
      if (error.message === 'ALREADY_VOTED') {
        await createAuditLog({
          action: 'VOTE_ATTEMPT_FAILED',
          actorNim: nim,
          actorEmail: email,
          actorRole: 'VOTER',
          targetId: candidateId,
          targetType: 'CANDIDATE',
          status: 'FAILED',
          errorMsg: 'Already voted',
        });
        return NextResponse.json({ error: 'Anda sudah memberikan suara.' }, { status: 403 });
      }
      // If update fails due to condition (hasVoted changed to true), it's a race condition
      if (error.code === 'P2025') {
        await createAuditLog({
          action: 'VOTE_ATTEMPT_FAILED',
          actorNim: nim,
          actorEmail: email,
          actorRole: 'VOTER',
          targetId: candidateId,
          targetType: 'CANDIDATE',
          status: 'FAILED',
          errorMsg: 'Race condition detected',
        });
        return NextResponse.json({ error: 'Anda sudah memberikan suara.' }, { status: 403 });
      }
      throw error; // Re-throw unexpected errors
    }

    // Release lock after successful vote
    await releaseVoteLock(nim);

    // Audit: successful vote
    await createAuditLog({
      action: 'VOTE',
      actorNim: nim,
      actorEmail: email,
      actorRole: 'VOTER',
      targetId: candidateId,
      targetType: 'CANDIDATE',
      status: 'SUCCESS',
    });

    // Keeping session cookie active as per user request
    const response = NextResponse.json({ success: true, message: 'Suara berhasil direkam.' });

    return response;

  } catch (error) {
    console.error('Voting Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

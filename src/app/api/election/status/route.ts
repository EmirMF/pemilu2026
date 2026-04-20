import { NextResponse } from 'next/server'
import { getElectionSettings } from '@/lib/election'

export async function GET() {
  try {
    const settings = await getElectionSettings()
    return NextResponse.json({
      isOpen: settings.isOpen,
      voteButtonState: settings.voteButtonState || 'default',
    })
  } catch (error) {
    console.error('Error fetching election status:', error)
    return NextResponse.json({ isOpen: true, voteButtonState: 'default' }, { status: 200 })
  }
}
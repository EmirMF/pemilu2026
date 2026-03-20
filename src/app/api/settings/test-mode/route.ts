import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch test mode settings
export async function GET() {
  try {
    const settings = await prisma.electionSettings.findFirst({
      where: { key: 'main' },
    }) as any;

    return NextResponse.json({
      testMode: settings?.testMode ?? true, // Default true for safety
      testEmail: settings?.testEmail ?? '',
    });
  } catch (error) {
    console.error('Error fetching test mode settings:', error);
    return NextResponse.json({ error: 'Failed to fetch test mode settings' }, { status: 500 });
  }
}

// POST: Update test mode settings
export async function POST(request: Request) {
  try {
    const { testMode, testEmail } = await request.json();

    if (typeof testMode !== 'boolean') {
      return NextResponse.json({ error: 'testMode must be a boolean' }, { status: 400 });
    }

    const settings = await prisma.electionSettings.upsert({
      where: { key: 'main' },
      update: {
        testMode,
        testEmail: testEmail || null,
      } as any,
      create: {
        key: 'main',
        testMode,
        testEmail: testEmail || null,
      } as any,
    }) as any;

    return NextResponse.json({
      success: true,
      testMode: settings.testMode,
      testEmail: settings.testEmail,
    });
  } catch (error) {
    console.error('Error updating test mode settings:', error);
    return NextResponse.json({ error: 'Failed to update test mode settings' }, { status: 500 });
  }
}

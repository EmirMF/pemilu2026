import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { otpEnabled } = await request.json();

    if (typeof otpEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid otpEnabled value' }, { status: 400 });
    }

    // Update or create election settings
    const settings = await prisma.electionSettings.upsert({
      where: { key: 'main' },
      update: { otpEnabled },
      create: { key: 'main', otpEnabled }
    });

    return NextResponse.json({ 
      success: true, 
      otpEnabled: settings.otpEnabled 
    });
  } catch (error) {
    console.error('Error updating OTP settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

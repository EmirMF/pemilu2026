import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/adminAuth';
import { isSuperAdminNim } from '@/lib/superAdmin';

export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const voters = await prisma.voter.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Create CSV content
    const csvHeader = 'NIM,Nama,Email,DPT\n';
    const csvRows = voters.map(voter => 
      `${voter.nim},"${voter.name || ''}",${voter.email},${voter.isInDPT ? 'Ya' : 'Tidak'}`
    ).join('\n');
    
    const csv = csvHeader + csvRows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { error: 'Gagal export data users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    if (!isSuperAdminNim(auth.nim)) {
      return NextResponse.json({ error: 'Hanya super admin yang dapat mengimpor data users' }, { status: 403 });
    }

    const { csvData } = await request.json();
    
    if (!csvData || typeof csvData !== 'string') {
      return NextResponse.json(
        { error: 'Data CSV tidak valid' },
        { status: 400 }
      );
    }

    // Parse CSV
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'File CSV kosong atau tidak valid' },
        { status: 400 }
      );
    }

    // Skip header
    const dataLines = lines.slice(1);
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const line of dataLines) {
      if (!line.trim()) continue;

      // Parse CSV line (handle quoted fields) - now with 4 columns: NIM,Nama,Email,DPT
      const match = line.match(/^([^,]+),"?([^"]*)"?,([^,]+),(.+)$/);
      if (!match) {
        results.failed++;
        results.errors.push(`Format tidak valid: ${line}`);
        continue;
      }

      const [, nim, name, email, dpt] = match;
      const trimmedNim = nim.trim();
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const trimmedDpt = dpt.trim().toLowerCase();
      const isInDPT = trimmedDpt === 'ya' || trimmedDpt === 'yes' || trimmedDpt === '1' || trimmedDpt === 'true';

      if (!trimmedNim || !trimmedEmail) {
        results.failed++;
        results.errors.push(`NIM atau Email kosong: ${line}`);
        continue;
      }

      try {
        // Upsert voter with isInDPT
        await prisma.voter.upsert({
          where: { nim: trimmedNim },
          update: {
            name: trimmedName || null,
            email: trimmedEmail,
            isInDPT: isInDPT,
          },
          create: {
            nim: trimmedNim,
            name: trimmedName || null,
            email: trimmedEmail,
            isInDPT: isInDPT,
          },
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Gagal menyimpan ${trimmedNim}: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: `Import selesai. Berhasil: ${results.success}, Gagal: ${results.failed}`,
      results,
    });
  } catch (error) {
    console.error('Error importing users:', error);
    return NextResponse.json(
      { error: 'Gagal import data users' },
      { status: 500 }
    );
  }
}

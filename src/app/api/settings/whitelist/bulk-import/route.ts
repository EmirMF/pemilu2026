import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createAuditLog } from '@/lib/auditLog';

export async function POST(request: Request) {
  try {
    const { voters } = await request.json();
    
    if (!Array.isArray(voters) || voters.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of voters.' },
        { status: 400 }
      );
    }
    
    // Validate format
    const validVoters = voters.filter(voter => 
      voter.nim && 
      typeof voter.nim === 'string' && 
      /^[0-9]+$/.test(voter.nim)
    );
    
    if (validVoters.length === 0) {
      return NextResponse.json(
        { error: 'No valid voters found in the data.' },
        { status: 400 }
      );
    }
    
    // Bulk upsert to whitelist
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const voter of validVoters) {
      try {
        await prisma.voter.upsert({
          where: { nim: voter.nim },
          update: { 
            name: voter.name || null 
          },
          create: {
            nim: voter.nim,
            name: voter.name || null,
            email: `${voter.nim}@mahasiswa.itb.ac.id`
          }
        });
        
        // Check if it was an update or create
        const existing = await prisma.voter.findUnique({
          where: { nim: voter.nim }
        });
        
        if (existing) {
          results.updated++;
        } else {
          results.created++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import NIM ${voter.nim}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Audit log
    await createAuditLog({
      action: 'BULK_IMPORT_DPT',
      actorRole: 'ADMIN',
      status: 'SUCCESS',
      details: {
        total: voters.length,
        valid: validVoters.length,
        created: results.created,
        updated: results.updated,
        failed: results.failed
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Bulk Import Error:', error);
    return NextResponse.json(
      { error: 'Failed to import voters' },
      { status: 500 }
    );
  }
}

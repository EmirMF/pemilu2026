import prisma from '@/lib/prisma';
import CandidateClient from './CandidateClient';

export const dynamic = 'force-dynamic';

export default async function CandidatesPage() {
  const candidates = await prisma.candidate.findMany({
    orderBy: { id: 'asc' }
  });

  return (
    <div className="max-w-6xl mx-auto">
      <CandidateClient initialCandidates={candidates} />
    </div>
  );
}


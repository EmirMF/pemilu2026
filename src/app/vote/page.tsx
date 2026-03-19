import prisma from '@/lib/prisma';
import VoteClient from './VoteClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getElectionSettings } from '@/lib/election';
import { verifyCookie } from '@/lib/secureCookie';
import GradientBackground from '@/components/GradientBackground';
import SplitText from '@/components/SplitText';

export const dynamic = 'force-dynamic';

export default async function VotePage() {
  const cookieStore = await cookies();
  const signedSession = cookieStore.get('voter_session')?.value;

  if (!signedSession) {
    redirect('/login');
  }

  // Verify signed session cookie
  const email = verifyCookie(signedSession);
  if (!email) {
    redirect('/login');
  }

  // Check if election is open
  const electionSettings = await getElectionSettings();
  if (!electionSettings.isOpen) {
    return (
      <>
        <GradientBackground />
        <main className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-primary-200 dark:border-neutral-700 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Pemilihan Ditutup</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Maaf, pemilihan saat ini sedang tidak berlangsung.</p>
          </div>
        </main>
      </>
    );
  }

  const nim = email.split('@')[0];
  
  // Check if user is in DPT
  const whitelistEntry = await prisma.whitelist.findUnique({ where: { nim } });
  
  if (!whitelistEntry || !(whitelistEntry as any).isInDPT) {
    return (
      <>
        <GradientBackground />
        <main className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-primary-200 dark:border-neutral-700 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Akses Ditolak</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Anda tidak terdaftar dalam DPT (Daftar Pemilih Tetap).</p>
            <a
              href="/"
              className="cursor-default inline-block w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 transition-all duration-300 font-medium text-white shadow-lg hover:shadow-xl transform"
            >
              Kembali ke Home
            </a>
          </div>
        </main>
      </>
    );
  }
  
  // Check if user is admin
  const admin = await prisma.admin.findUnique({ where: { nim } }).catch(() => null);
  const isAdmin = !!admin;

  const voter = await prisma.voter.findUnique({ where: { nim } });

  // If user has voted
  if (voter?.hasVoted) {
    // Admin who has voted - show different message with dashboard link
    if (isAdmin) {
      return (
        <>
          <GradientBackground />
          <main className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-primary-200 dark:border-neutral-700 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Terima Kasih!</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Anda sudah memberikan suara pada pemilihan ini.</p>
            <div className="space-y-3">
              <a
                href="/dashboard"
                className="inline-block w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 transition-all duration-300 font-medium text-white shadow-lg hover:shadow-xl transform"
              >
                Ke Dashboard
              </a>
              <a
                href="/"
                className="inline-block w-full py-3 rounded-2xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-all duration-300 font-medium text-neutral-800 dark:text-neutral-200"
              >
                Kembali ke Home
              </a>
            </div>
          </div>
        </main>
        </>
      );
    }
    
    // Non-admin who has voted - show regular message
    return (
      <>
        <GradientBackground />
        <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-900 border border-primary-200 dark:border-neutral-700 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">Terima Kasih!</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">Anda sudah memberikan suara pada pemilihan ini.</p>
          <a
            href="/"
            className="inline-block w-full py-3 rounded-2xl bg-red-600 hover:bg-secondary-600 transition-all duration-300 font-medium text-white shadow-lg hover:shadow-xl transform"
          >
            Kembali ke Home
          </a>
        </div>
      </main>
      </>
    );
  }

  const candidates = await prisma.candidate.findMany({
    orderBy: { id: 'asc' }
  });

  if (candidates.length === 0) {
    return (
      <>
        <GradientBackground />
        <main className="min-h-screen flex items-center justify-center p-4">
          <div className="text-neutral-900 dark:text-neutral-50">Belum ada kandidat yang terdaftar di database.</div>
        </main>
      </>
    );
  }

  return (
    <>
      <GradientBackground />
      <main className="min-h-screen text-neutral-900 dark:text-neutral-50 pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-16">
          <div className="text-center my-12">
            <SplitText
              text="Surat Suara Digital"
              className="text-6xl font-bold text-center mb-4"
              delay={50}
              duration={1.25}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
            <p className="text-neutral-600 dark:text-neutral-400">Pilih salah satu kandidat di bawah ini.</p>
          </div>

          <VoteClient candidates={candidates} />
        </div>
      </main>
    </>
  );
}


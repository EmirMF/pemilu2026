import Sidebar from '@/components/Sidebar';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyCookie } from '@/lib/secureCookie';
import prisma from '@/lib/prisma';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is admin
  const cookieStore = await cookies();
  const signedSession = cookieStore.get('voter_session')?.value;

  if (!signedSession) {
    redirect('/login');
  }

  const email = verifyCookie(signedSession);
  if (!email) {
    redirect('/login');
  }

  const nim = email.split('@')[0];
  const admin = await prisma.admin.findUnique({ where: { nim } });

  if (!admin) {
    // Not an admin, redirect to home
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        <header className="h-16 lg:h-20 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-8">
          <h1 className="text-lg lg:text-xl font-semibold text-neutral-800 dark:text-neutral-100 ml-12 lg:ml-0">Dashboard Panel</h1>
          <div className="flex items-center gap-2 lg:gap-4">
            <span className="text-xs lg:text-sm font-medium text-neutral-600 dark:text-neutral-400">{nim}</span>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-sm lg:text-base">
              A
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import FloatingThemeToggle from '@/components/FloatingThemeToggle';

export default function DashboardClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <FloatingThemeToggle />
    </>
  );
}

"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, LayoutDashboard, Users, UserSquare2, Settings, LogOut, UserCog, Menu, X, FileText } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Hasil Pemilihan', icon: BarChart3, href: '/dashboard/results' },
    { name: 'Data Pemilih', icon: Users, href: '/dashboard/voters' },
    { name: 'Kandidat', icon: UserSquare2, href: '/dashboard/candidates' },
    { name: 'Manajemen User', icon: UserCog, href: '/dashboard/users' },
    { name: 'Audit Trail', icon: FileText, href: '/dashboard/audit' },
    { name: 'Pengaturan', icon: Settings, href: '/dashboard/settings' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-20 dark:bg-opacity-40 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Pemilu<span className="text-red-500">2026</span></h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'}`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Keluar
          </Link>
        </div>
      </aside>
      
      {/* Floating Theme Toggle - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle className="p-3 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-700 transition-all hover:scale-110" />
      </div>
    </>
  );
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react'
import Image from 'next/image'
import DPTModal from './DPTModal'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const [isDPTModalOpen, setIsDPTModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userNim, setUserNim] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch user session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.nim) {
          setUserNim(data.nim)
          setIsAdmin(data.isAdmin || false)
        }
      })
      .catch(err => console.error('Failed to fetch session:', err))
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      // Call logout API to clear session server-side
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      if (res.ok) {
        // Redirect to home after successful logout
        window.location.href = '/'
      } else {
        console.error('Logout failed')
      }
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const navItems: Array<{ label: string; href?: string; onClick: () => void; disabled?: boolean }> = [
    { label: 'Beranda', href: '/', onClick: () => {} },
    { label: 'DPT', onClick: () => setIsDPTModalOpen(true) },
    { label: 'Tata Cara', href: '/tata-cara', onClick: () => {} },
    { label: 'Peraturan', href: '/peraturan', onClick: () => {} },
  ]

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-cream-50/90 dark:bg-neutral-950/90 backdrop-blur-lg border-b border-primary-200/50 dark:border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="flex items-center gap-2">
                <Image 
                  src="/logo.png" 
                  alt="Logo 8EH" 
                  width={40} 
                  height={40}
                  className="object-contain"
                />
                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Pemilu<span className="text-secondary-600 dark:text-secondary-400">2026</span></h1>
              </a>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              {navItems.map((item) => (
                item.disabled ? (
                  <span
                    key={item.label}
                    className="text-gray-400 text-sm font-medium cursor-not-allowed"
                  >
                    {item.label}
                  </span>
                ) : item.href && item.label !== 'DPT' ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-neutral-700 dark:text-neutral-300 hover:text-secondary-600 dark:hover:text-secondary-400 text-sm font-medium transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="text-neutral-700 dark:text-neutral-300 hover:text-secondary-600 dark:hover:text-secondary-400 text-sm font-medium transition-colors"
                  >
                    {item.label === 'DPT' && <Users size={16} className="inline mr-1" />}
                    {item.label}
                  </button>
                )
              ))}
              
              {/* Theme Toggle Button */}
              <ThemeToggle className="p-2 text-neutral-700 dark:text-neutral-300 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-primary-100/50 dark:hover:bg-neutral-800/50 rounded-lg transition-colors" />
              
              {userNim && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 rounded-full text-sm font-medium hover:bg-secondary-200 dark:hover:bg-secondary-800 transition-colors"
                  >
                    <User size={16} />
                    <span>{userNim}</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-primary-200 dark:border-neutral-700 py-1 z-50">
                      {isAdmin && (
                        <a
                          href="/dashboard"
                          className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors block"
                        >
                          <LayoutDashboard size={16} />
                          <span>Dashboard</span>
                        </a>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-neutral-700 dark:text-neutral-300 hover:text-secondary-600 dark:hover:text-secondary-400 transition-colors"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden border-t border-primary-200/50 dark:border-neutral-800/50 bg-cream-50/95 dark:bg-neutral-950/95 backdrop-blur-lg overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                item.disabled ? (
                  <div
                    key={item.label}
                    className="block px-4 py-2 text-gray-400 dark:text-gray-600 text-sm font-medium cursor-not-allowed"
                  >
                    {item.label}
                  </div>
                ) : item.href && item.label !== 'DPT' ? (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-primary-100/50 dark:hover:bg-gray-700/50 rounded-lg text-sm font-medium transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.onClick?.()
                      setIsMobileMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-primary-100/50 dark:hover:bg-gray-700/50 rounded-lg text-sm font-medium transition-colors"
                  >
                    {item.label === 'DPT' && <Users size={16} className="inline mr-2" />}
                    {item.label}
                  </button>
                )
              ))}
              
              {/* Theme Toggle in Mobile Menu */}
              <ThemeToggle
                showLabel
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-primary-100/50 dark:hover:bg-gray-700/50 rounded-lg text-sm font-medium transition-colors"
              />
              
              {/* User Menu in Mobile */}
              {userNim && (
                <>
                  <div className="border-t border-primary-200/50 dark:border-neutral-800/50 my-2"></div>
                  <div className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Logged in as: {userNim}
                  </div>
                  {isAdmin && (
                    <a
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-primary-100/50 dark:hover:bg-gray-700/50 rounded-lg text-sm font-medium transition-colors"
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-secondary-600 dark:hover:text-secondary-400 hover:bg-primary-100/50 dark:hover:bg-gray-700/50 rounded-lg text-sm font-medium transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
        </div>
      </nav>

      <DPTModal isOpen={isDPTModalOpen} onClose={() => setIsDPTModalOpen(false)} />
    </>
  )
}

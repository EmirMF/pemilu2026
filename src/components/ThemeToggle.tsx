'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  try {
    const { theme, toggleTheme } = useTheme()
    
    if (showLabel) {
      return (
        <button
          onClick={toggleTheme}
          className={className}
        >
          {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
          <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      )
    }
    
    return (
      <button
        onClick={toggleTheme}
        className={className}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    )
  } catch (error) {
    // If not within ThemeProvider, return null or a fallback
    return null
  }
}

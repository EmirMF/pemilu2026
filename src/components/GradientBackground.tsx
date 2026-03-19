'use client'

import { useEffect, useState } from 'react'

type GradientBackgroundProps = {
  fromColor?: string
  viaColor?: string
  toColor?: string
}

export default function GradientBackground({
  fromColor,
  viaColor,
  toColor,
}: GradientBackgroundProps) {
  const defaultColors = {
    from: fromColor || '#FFC300',
    via: viaColor || '#FF8040',
    to: toColor || '#FFE6B3',
  }

  const [colors, setColors] = useState(defaultColors)

  useEffect(() => {
    // Try to load saved colors from localStorage first
    const saved = localStorage.getItem('gradientColors')
    if (saved) {
      try {
        setColors(JSON.parse(saved))
        return
      } catch {}
    }

    // Fetch gradient colors from settings if not provided
    if (!fromColor || !viaColor || !toColor) {
      fetch('/api/settings/election')
        .then((res) => res.json())
        .then((data) => {
          const newColors = {
            from: data.bgGradientFrom || '#FFC300',
            via: data.bgGradientVia || '#FF8040',
            to: data.bgGradientTo || '#FFE6B3',
          }
          setColors(newColors)
          // Save to localStorage for next page load
          localStorage.setItem('gradientColors', JSON.stringify(newColors))
        })
        .catch(() => {
          // Use default colors if fetch fails
        })
    }
  }, [fromColor, viaColor, toColor])

  return (
    <>
      {/* Light mode gradient */}
      <div
        className="fixed inset-0 -z-10 transition-colors duration-500 dark:opacity-0"
        style={{
          background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.via} 50%, ${colors.to} 100%)`,
        }}
      />
      {/* Dark mode gradient */}
      <div
        className="fixed inset-0 -z-10 transition-colors duration-500 opacity-0 dark:opacity-100"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 50%, #2a2416 100%)',
        }}
      />
      {/* Noise overlay */}
      <div
        className="fixed inset-0 -z-10 opacity-70 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay',
        }}
      />
    </>
  )
}

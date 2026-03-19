'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoadingOverlay() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Show loading when navigation starts
    setLoading(true)
    
    // Hide loading after a short delay
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-neutral-200 dark:border-neutral-700 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-secondary-500 rounded-full animate-spin" />
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 font-medium text-lg">Memuat...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

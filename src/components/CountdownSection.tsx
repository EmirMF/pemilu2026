'use client'

import { motion } from 'framer-motion'
import { Clock, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import SpotlightCard from './SpotlightCard'

type CountdownSectionProps = {
  countdownEnd: string | null
  countdownType?: string | null
}

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function CountdownSection({ countdownEnd, countdownType }: CountdownSectionProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!countdownEnd) return

    const calculateTimeLeft = () => {
      const difference = new Date(countdownEnd).getTime() - new Date().getTime()

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [countdownEnd])

  if (!countdownEnd || !timeLeft) return null

  const timeUnits = [
    { label: 'Hari', value: timeLeft.days },
    { label: 'Jam', value: timeLeft.hours },
    { label: 'Menit', value: timeLeft.minutes },
    { label: 'Detik', value: timeLeft.seconds },
  ]

  return (
    <section className="py-24 text-neutral-900 dark:text-neutral-50 relative overflow-hidden bg-white/0 backdrop-blur-sm">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary-300/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-300/40 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-secondary-100 dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-700 rounded-full px-6 py-2 mb-6">
            <Clock size={20} className="text-secondary-600 dark:text-secondary-400" />
            <span className="text-secondary-600 dark:text-secondary-400 font-medium">Waktu Tersisa</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {isExpired 
              ? (countdownType === 'start' ? 'Pemilihan Telah Dimulai!' : 'Pemilihan Telah Berakhir')
              : (countdownType === 'start' ? 'Countdown Menuju Voting' : 'Countdown Penutupan Voting')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            {isExpired
              ? (countdownType === 'start' ? 'Pemilihan sudah dibuka, segera berikan suara Anda!' : 'Terima kasih atas partisipasi Anda')
              : (countdownType === 'start' ? 'Bersiaplah untuk memberikan suara Anda' : 'Jangan lewatkan kesempatan untuk memberikan suara Anda')}
          </p>
        </motion.div>

        {!isExpired && (
          <div className="flex justify-center gap-2 md:gap-6 max-w-4xl mx-auto px-2">
            {timeUnits.map((unit, index) => (
              <motion.div
                key={unit.label}
                className="flex-1 min-w-0"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <SpotlightCard
                  className="custom-spotlight-card bg-white/90 dark:bg-neutral-900/90 !border-primary-200 dark:!border-neutral-700 hover:!border-secondary-400 dark:hover:!border-secondary-500 cursor-default !p-3 md:!p-8"
                  spotlightColor="rgba(255, 195, 10, 0.5)"
                >
                  <motion.div
                    className="text-2xl md:text-6xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-neutral-50 dark:to-neutral-300 bg-clip-text text-transparent mb-1 md:mb-2"
                    key={unit.value}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {String(unit.value).padStart(2, '0')}
                  </motion.div>
                  <div className="text-neutral-600 dark:text-neutral-400 text-[10px] md:text-base font-medium uppercase tracking-wider">
                    {unit.label}
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* End Date Info */}
        {!isExpired && (
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <Calendar size={18} />
              <span>
                {countdownType === 'start' ? 'Dibuka pada' : 'Berakhir pada'}:{' '}
                <span className="text-neutral-900 dark:text-neutral-50 font-medium">
                  {new Date(countdownEnd).toLocaleString('id-ID', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </span>
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

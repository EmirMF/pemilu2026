import prisma from '@/lib/prisma'
import { getCacheOrSet, deleteCache } from '@/lib/cache'

const ELECTION_SETTINGS_KEY = 'main'
const CACHE_KEY = 'election:settings'
const CACHE_TTL = 30 // 30 seconds

export async function getElectionSettings() {
  // Direct database query without caching for real-time settings
  return prisma.electionSettings.upsert({
    where: { key: ELECTION_SETTINGS_KEY },
    update: {},
    create: { 
      key: ELECTION_SETTINGS_KEY, 
      isOpen: true, 
      otpEnabled: true,
      otpLogEnabled: false,
      otpDashboardOnly: false,
      testMode: true
    },
  })
}

export async function invalidateElectionSettingsCache() {
  await deleteCache(CACHE_KEY)
}

export async function setElectionOpen(
  isOpen: boolean,
  countdownEnd?: Date | null,
  countdownType?: string,
  bgGradientFrom?: string,
  bgGradientVia?: string,
  bgGradientTo?: string
) {
  const updateData: any = { isOpen }
  if (countdownEnd !== undefined) {
    updateData.countdownEnd = countdownEnd
  }
  if (countdownType !== undefined) {
    updateData.countdownType = countdownType
  }
  if (bgGradientFrom !== undefined) {
    updateData.bgGradientFrom = bgGradientFrom
  }
  if (bgGradientVia !== undefined) {
    updateData.bgGradientVia = bgGradientVia
  }
  if (bgGradientTo !== undefined) {
    updateData.bgGradientTo = bgGradientTo
  }
  
  const result = await prisma.electionSettings.upsert({
    where: { key: ELECTION_SETTINGS_KEY },
    update: updateData,
    create: {
      key: ELECTION_SETTINGS_KEY,
      isOpen,
      countdownEnd: countdownEnd || null,
      countdownType: countdownType || 'end',
      bgGradientFrom: bgGradientFrom || '#FFC300',
      bgGradientVia: bgGradientVia || '#FF8040',
      bgGradientTo: bgGradientTo || '#FFE6B3',
      otpEnabled: true,
      otpLogEnabled: false,
      otpDashboardOnly: false,
      testMode: true
    },
  })
  
  // Invalidate cache after update
  await invalidateElectionSettingsCache()
  
  return result
}

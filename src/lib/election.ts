import prisma from '@/lib/prisma'

const ELECTION_SETTINGS_KEY = 'main'

export async function getElectionSettings() {
  return prisma.electionSettings.upsert({
    where: { key: ELECTION_SETTINGS_KEY },
    update: {},
    create: { key: ELECTION_SETTINGS_KEY, isOpen: true, otpEnabled: true },
  })
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
  
  return prisma.electionSettings.upsert({
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
    },
  })
}


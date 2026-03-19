import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get total voters in DPT
    const totalDPT = await prisma.whitelist.count();
    
    // Get total voters who have voted
    const totalVoted = await prisma.voter.count({
      where: { hasVoted: true }
    });
    
    // Calculate turnout rate
    const turnoutRate = totalDPT > 0 ? (totalVoted / totalDPT) * 100 : 0;
    
    // Get voting timeline (votes per hour)
    const voters = await prisma.voter.findMany({
      where: { hasVoted: true, votedAt: { not: null } },
      select: { votedAt: true },
      orderBy: { votedAt: 'asc' }
    });
    
    // Group votes by hour
    const votesPerHour: { [key: string]: number } = {};
    voters.forEach(voter => {
      if (voter.votedAt) {
        const hour = new Date(voter.votedAt).toISOString().slice(0, 13) + ':00:00';
        votesPerHour[hour] = (votesPerHour[hour] || 0) + 1;
      }
    });
    
    // Convert to array format for charts
    const votingTimeline = Object.entries(votesPerHour).map(([time, count]) => ({
      time,
      count
    }));
    
    // Get peak hours (top 5)
    const peakHours = Object.entries(votesPerHour)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([time, count]) => ({
        time: new Date(time).toLocaleString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          day: '2-digit',
          month: 'short'
        }),
        count
      }));
    
    return NextResponse.json({
      summary: {
        totalDPT,
        totalVoted,
        totalNotVoted: totalDPT - totalVoted,
        turnoutRate: Math.round(turnoutRate * 100) / 100
      },
      votingTimeline,
      peakHours
    });
  } catch (error) {
    console.error('Statistics Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

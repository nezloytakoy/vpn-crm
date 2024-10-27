import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { subDays, subMonths } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const moderatorId = url.searchParams.get("moderatorId");

    if (!moderatorId) {
      return NextResponse.json({ error: 'Moderator ID is required' }, { status: 400 });
    }

    const moderatorIdBigInt = BigInt(moderatorId);

    
    const moderator = await prisma.moderator.findUnique({
      where: { id: moderatorIdBigInt },
      select: {
        id: true,
        username: true,
      },
    });

    if (!moderator) {
      return NextResponse.json({ error: 'Moderator not found' }, { status: 404 });
    }

    
    const allTimeComplaintsCount = await prisma.complaint.count({
      where: {
        moderatorId: moderatorIdBigInt,
        status: 'REVIEWED',
      },
    });

    const complaintsThisMonth = await prisma.complaint.count({
      where: {
        moderatorId: moderatorIdBigInt,
        status: 'REVIEWED',
        createdAt: { gte: subMonths(new Date(), 1) },
      },
    });

    const complaintsThisWeek = await prisma.complaint.count({
      where: {
        moderatorId: moderatorIdBigInt,
        status: 'REVIEWED',
        createdAt: { gte: subDays(new Date(), 7) },
      },
    });

    const complaintsToday = await prisma.complaint.count({
      where: {
        moderatorId: moderatorIdBigInt,
        status: 'REVIEWED',
        createdAt: { gte: subDays(new Date(), 1) },
      },
    });

    
    const complaints = await prisma.complaint.findMany({
      where: { moderatorId: moderatorIdBigInt },
      select: {
        id: true,
        userId: true,
        decision: true,
        createdAt: true,
      },
    });

    const complaintData = await Promise.all(
      complaints.map(async (complaint) => {
        const assistantRequest = await prisma.assistantRequest.findUnique({
          where: { id: complaint.id },
          include: {
            conversation: {
              select: {
                messages: true,
              },
            },
          },
        });

        return {
          id: complaint.id.toString(),
          userId: complaint.userId.toString(),
          decision: complaint.decision,
          createdAt: complaint.createdAt.toISOString(),
          messages: assistantRequest?.conversation?.messages || [],
        };
      })
    );

    return NextResponse.json({
      moderator: {
        id: moderator.id.toString(),
        username: moderator.username,
      },
      complaintsStatistics: {
        allTime: allTimeComplaintsCount,
        thisMonth: complaintsThisMonth,
        thisWeek: complaintsThisWeek,
        today: complaintsToday,
      },
      complaintData,
    });
  } catch (error) {
    console.error('Error fetching moderator complaints:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

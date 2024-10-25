import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const moderatorId = url.searchParams.get("moderatorId");

    if (!moderatorId) {
      return NextResponse.json({ error: 'Moderator ID is required' }, { status: 400 });
    }

    const moderatorIdBigInt = BigInt(moderatorId);

    
    const complaints = await prisma.complaint.findMany({
      where: { moderatorId: moderatorIdBigInt },
      select: {
        id: true,
        userId: true,
        decision: true,
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
          messages: assistantRequest?.conversation?.messages || [],
        };
      })
    );

    return NextResponse.json(complaintData);
  } catch (error) {
    console.error('Error fetching moderator complaints:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

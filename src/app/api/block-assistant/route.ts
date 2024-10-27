import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    
    const { assistantId, hours } = await req.json();

    if (!assistantId || typeof hours !== 'number') {
      return NextResponse.json({ error: 'Assistant ID and hours are required' }, { status: 400 });
    }

    
    const unblockDate = new Date();
    unblockDate.setHours(unblockDate.getHours() + hours);

    
    await prisma.assistant.update({
      where: { telegramId: BigInt(assistantId) },
      data: {
        isBlocked: true,
        unblockDate: unblockDate,
      },
    });

    return NextResponse.json({ message: 'Assistant blocked successfully', unblockDate });
  } catch (error) {
    console.error('Error blocking assistant:', error);
    return NextResponse.json({ error: 'Failed to block assistant' }, { status: 500 });
  }
}

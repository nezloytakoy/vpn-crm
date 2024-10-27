import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId, hours } = await req.json();

    if (!userId || typeof hours !== 'number') {
      return NextResponse.json({ error: 'User ID and hours are required' }, { status: 400 });
    }

    const unblockDate = new Date();
    unblockDate.setHours(unblockDate.getHours() + hours);

    await prisma.user.update({
      where: { telegramId: BigInt(userId) },
      data: {
        isBlocked: true,
        unblockDate: unblockDate,
      },
    });

    return NextResponse.json({ message: 'User blocked successfully', unblockDate });
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
}

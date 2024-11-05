import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

export const revalidate = 1;

const prisma = new PrismaClient();

export async function GET() {
  try {
    
    const rewards = await prisma.rewards.findFirst();

    if (!rewards) {
      return NextResponse.json({ message: 'Данные о наградах не найдены' }, { status: 404 });
    }

    console.log(rewards)

    
    const response = {
      mentorReward: rewards.mentorReward,
      assistantReward: rewards.assistantReward,
      referralRequestCount: rewards.referralRequestCount,
      isPermanentReferral: rewards.isPermanentReferral,
      isRegularBonusEnabled: rewards.isRegularBonusEnabled,
      rewardRequestCount: rewards.rewardRequestCount,
      isPermanentBonus: rewards.isPermanentBonus,
      userReward: rewards.userReward
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении данных о наградах:', error);
    return NextResponse.json({ message: 'Ошибка на сервере' }, { status: 500 });
  }
}
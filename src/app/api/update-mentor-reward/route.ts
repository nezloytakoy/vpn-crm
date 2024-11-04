import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        
        const { mentorReward, assistantReward, referralRequestCount, isPermanentReferral } = await req.json();

        
        if (typeof mentorReward !== 'number' ||
            typeof assistantReward !== 'number' ||
            typeof referralRequestCount !== 'number' ||
            typeof isPermanentReferral !== 'boolean') {
            return NextResponse.json({ message: 'Некорректные данные' }, { status: 400 });
        }

        
        const updatedRewards = await prisma.rewards.update({
            where: { id: 1 }, 
            data: {
                mentorReward,
                assistantReward,
                referralRequestCount: referralRequestCount,
                isPermanentReferral
            }
        });

        return NextResponse.json({ message: 'Данные успешно обновлены', updatedRewards }, { status: 200 });
    } catch (error) {
        console.error('Ошибка при обновлении данных о наградах:', error);
        return NextResponse.json({ message: 'Ошибка на сервере' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

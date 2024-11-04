import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        
        const { 
            isRegularBonusEnabled, 
            isPermanentBonus, 
            giftCoinsAmount, 
            rewardRequestCount 
        } = await req.json();

        
        if (
            typeof isRegularBonusEnabled !== 'boolean' ||
            typeof isPermanentBonus !== 'boolean' ||
            typeof giftCoinsAmount !== 'number' ||
            typeof rewardRequestCount !== 'number' ||
            giftCoinsAmount < 0 ||
            rewardRequestCount < 0
        ) {
            return NextResponse.json({ message: 'Некорректные данные' }, { status: 400 });
        }

        
        const updatedRewards = await prisma.rewards.update({
            where: { id: 1 }, 
            data: {
                isRegularBonusEnabled,
                isPermanentBonus,
                userReward: giftCoinsAmount,
                rewardRequestCount
            }
        });

        return NextResponse.json({ message: 'Настройки успешно обновлены', updatedRewards }, { status: 200 });
    } catch (error) {
        console.error('Ошибка при обновлении настроек награды:', error);
        return NextResponse.json({ message: 'Ошибка на сервере' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

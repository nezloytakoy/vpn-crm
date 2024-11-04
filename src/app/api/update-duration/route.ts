import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        
        const { minutes } = await req.json();

        
        if (typeof minutes !== 'number' || minutes < 0) {
            return NextResponse.json({ message: 'Некорректные данные. Ожидалось положительное число.' }, { status: 400 });
        }

        
        const updatedDuration = await prisma.requestDuration.update({
            where: { id: 1 }, 
            data: { minutes },
        });

        return NextResponse.json({ message: 'Количество минут успешно обновлено', updatedDuration }, { status: 200 });
    } catch (error) {
        console.error('Ошибка при обновлении количества минут:', error);
        return NextResponse.json({ message: 'Ошибка на сервере' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

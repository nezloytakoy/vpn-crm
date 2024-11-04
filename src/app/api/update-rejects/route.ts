import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { newMaxRejects } = await request.json();

        if (newMaxRejects === undefined || isNaN(newMaxRejects)) {
            return NextResponse.json({ error: 'Некорректное значение для maxRejects' }, { status: 400 });
        }

        
        const updatedEdge = await prisma.edges.update({
            where: { id: 1 }, 
            data: { maxRejects: newMaxRejects },
        });

        return NextResponse.json({ message: 'Значение maxRejects обновлено', updatedEdge });
    } catch (error) {
        console.error('Ошибка при обновлении maxRejects:', error);
        return NextResponse.json({ error: 'Ошибка при обновлении данных' }, { status: 500 });
    }
}

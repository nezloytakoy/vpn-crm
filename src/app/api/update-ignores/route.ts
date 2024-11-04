import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    console.log("adfsdfsdf")
    try {
        const { newMaxIgnores } = await request.json();

        if (newMaxIgnores === undefined || isNaN(newMaxIgnores)) {
            return NextResponse.json({ error: 'Некорректное значение для maxIgnores' }, { status: 400 });
        }

        
        const updatedEdge = await prisma.edges.update({
            where: { id: 1 }, 
            data: { maxIgnores: newMaxIgnores },
        });

        return NextResponse.json({ message: 'Значение maxIgnores обновлено', updatedEdge });
    } catch (error) {
        console.error('Ошибка при обновлении maxIgnores:', error);
        return NextResponse.json({ error: 'Ошибка при обновлении данных' }, { status: 500 });
    }
}

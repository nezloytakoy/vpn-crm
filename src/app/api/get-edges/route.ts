import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

export const revalidate = 1;

const prisma = new PrismaClient();

export async function POST() {
    try {
        
        const assistant = await prisma.edges.findFirst({
            select: {
                maxRejects: true,
                maxIgnores: true
            }
        });

        if (!assistant) {
            return NextResponse.json({ error: 'Записи ассистента не найдены' }, { status: 404 });
        }

        return NextResponse.json({
            maxRejects: assistant.maxRejects,
            maxIgnores: assistant.maxIgnores
        });
    } catch (error) {
        console.error('Ошибка при получении maxRejects и maxIgnores:', error);
        return NextResponse.json({ error: 'Ошибка при получении данных' }, { status: 500 });
    }
}

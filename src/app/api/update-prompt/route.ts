import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { id, prompt } = await request.json();

        if (!id || !prompt) {
            return NextResponse.json({ error: 'id and prompt are required' }, { status: 400 });
        }

        
        const updatedSettings = await prisma.openAi.update({
            where: { id: id },
            data: { prompt: prompt },
        });

        return NextResponse.json(updatedSettings, { status: 200 });
    } catch (error) {
        console.error('Error updating prompt:', error);
        return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
    }
}

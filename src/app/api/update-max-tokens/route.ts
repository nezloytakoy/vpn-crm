import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { id, maxTokens } = await request.json();

        if (!id || maxTokens === undefined) {
            return NextResponse.json({ error: 'id and maxTokens are required' }, { status: 400 });
        }

        
        const updatedSettings = await prisma.openAi.update({
            where: { id: id },
            data: { maxTokensPerRequest: maxTokens },
        });

        return NextResponse.json(updatedSettings, { status: 200 });
    } catch (error) {
        console.error('Error updating max tokens:', error);
        return NextResponse.json({ error: 'Failed to update max tokens' }, { status: 500 });
    }
}

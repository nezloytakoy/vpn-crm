import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const revalidate = 1;

const prisma = new PrismaClient();

export async function GET() {
  try {
    
    const subscriptions = await prisma.subscription.findMany({
      select: {
        name: true,
        allowVoiceToAI: true,
        allowVoiceToAssistant: true,
        allowVideoToAssistant: true,
        allowFilesToAssistant: true,
      },
    });

    return NextResponse.json({ subscriptions }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении разрешений:', error);
    return NextResponse.json({ error: 'Ошибка при получении разрешений' }, { status: 500 });
  }
}

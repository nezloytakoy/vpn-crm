import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const { assistantId, coins } = body;
  
      if (!assistantId || typeof coins !== 'number' || coins <= 0) {
        return NextResponse.json(
          { error: 'Invalid assistantId or coins amount.' },
          { status: 400 }
        );
      }
  
      const assistant = await prisma.assistant.findUnique({
        where: {
          telegramId: BigInt(assistantId),
        },
      });
  
      if (!assistant) {
        return NextResponse.json({ error: 'Assistant not found.' }, { status: 404 });
      }
  
      const updatedAssistant = await prisma.assistant.update({
        where: {
          telegramId: BigInt(assistantId),
        },
        data: {
          coins: assistant.coins + coins,
        },
      });
  
      // Преобразуйте BigInt в строку
      return NextResponse.json({
        message: 'Coins added successfully.',
        assistant: {
          ...updatedAssistant,
          telegramId: updatedAssistant.telegramId.toString(), // Конвертируем BigInt в строку
        },
      });
    } catch (error) {
      console.error('Error updating coins:', error);
      return NextResponse.json(
        { error: 'An unexpected error occurred.' },
        { status: 500 }
      );
    }
  }

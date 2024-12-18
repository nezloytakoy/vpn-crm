import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

function serializeBigIntFields(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigIntFields(item));
  }

  const result: any = {};
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'bigint') {
      result[key] = value.toString();
    } else if (typeof value === 'object') {
      result[key] = serializeBigIntFields(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

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

    const serializedAssistant = serializeBigIntFields(updatedAssistant);

    return NextResponse.json({
      message: 'Coins added successfully.',
      assistant: serializedAssistant,
    });
  } catch (error) {
    console.error('Error updating coins:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function serializeBigIntFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  // Если не объект и не массив, возвращаем как есть
  if (typeof obj !== 'object') return obj;

  // Если массив
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigIntFields(item));
  }

  // Теперь obj – это объект, приводим к Record<string, unknown>
  const record = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const key in record) {
    const value = record[key];
    if (typeof value === 'bigint') {
      result[key] = value.toString();
    } else if (typeof value === 'object' && value !== null) {
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
    const { assistantId, coins } = body as { assistantId: string; coins: number };

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

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const revalidate = 1;

const prisma = new PrismaClient();

function calculateMode(numbers: number[]): number | null {
  const frequencyMap: { [key: number]: number } = {};
  let maxFrequency = 0;
  let mode: number | null = null;

  for (const num of numbers) {
    frequencyMap[num] = (frequencyMap[num] || 0) + 1;

    if (frequencyMap[num] > maxFrequency) {
      maxFrequency = frequencyMap[num];
      mode = num;
    }
  }

  return mode;
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        referralPercentage: true,
      },
    });

    const percentages = users.map(user => user.referralPercentage);
    const modePercentage = calculateMode(percentages);

    if (modePercentage === null) {
      return NextResponse.json({ error: 'Не удалось вычислить моду' }, { status: 400 });
    }

    return NextResponse.json({ mode: modePercentage }, { status: 200 });
  } catch (error) {
    console.error('Ошибка при получении моды процента от рефералов:', error);
    return NextResponse.json({ error: 'Ошибка при получении данных' }, { status: 500 });
  }
}

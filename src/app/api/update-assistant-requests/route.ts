import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { first, second, third, fourth } = await request.json();

    // Проверка, что все значения являются числами
    if (
      typeof first !== 'number' ||
      typeof second !== 'number' ||
      typeof third !== 'number' ||
      typeof fourth !== 'number'
    ) {
      return NextResponse.json({ error: 'All four numbers are required' }, { status: 400 });
    }

    // Обновление подписок по новым именам
    await prisma.subscription.updateMany({
      where: { name: 'FIRST' },
      data: { assistantRequestCount: first },
    });

    await prisma.subscription.updateMany({
      where: { name: 'SECOND' },
      data: { assistantRequestCount: second },
    });

    await prisma.subscription.updateMany({
      where: { name: 'THIRD' },
      data: { assistantRequestCount: third },
    });

    await prisma.subscription.updateMany({
      where: { name: 'FOURTH' },
      data: { assistantRequestCount: fourth },
    });

    return NextResponse.json({ message: 'Assistant request counts updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating assistant request counts:', error);
    return NextResponse.json({ error: 'Failed to update assistant request counts' }, { status: 500 });
  }
}
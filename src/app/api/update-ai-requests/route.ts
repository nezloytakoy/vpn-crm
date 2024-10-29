import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { first, second, third, fourth } = await request.json();

    if (
      typeof first !== 'number' ||
      typeof second !== 'number' ||
      typeof third !== 'number' ||
      typeof fourth !== 'number'
    ) {
      return NextResponse.json({ error: 'All four numbers are required' }, { status: 400 });
    }

    
    await prisma.subscription.updateMany({
      where: { name: 'AI + 5 запросов ассистенту' },
      data: { aiRequestCount: first },
    });

    await prisma.subscription.updateMany({
      where: { name: 'AI + 14 запросов ассистенту' },
      data: { aiRequestCount: second },
    });

    await prisma.subscription.updateMany({
      where: { name: 'AI + 30 запросов ассистенту' },
      data: { aiRequestCount: third },
    });

    await prisma.subscription.updateMany({
      where: { name: 'Только AI' },
      data: { aiRequestCount: fourth },
    });

    return NextResponse.json({ message: 'AI request counts updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating AI request counts:', error);
    return NextResponse.json({ error: 'Failed to update AI request counts' }, { status: 500 });
  }
}

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
      where: { name: 'FIRST' },
      data: { aiRequestCount: first },
    });

    await prisma.subscription.updateMany({
      where: { name: 'SECOND' },
      data: { aiRequestCount: second },
    });

    await prisma.subscription.updateMany({
      where: { name: 'THIRD' },
      data: { aiRequestCount: third },
    });

    await prisma.subscription.updateMany({
      where: { name: 'FOURTH' },
      data: { aiRequestCount: fourth },
    });

    return NextResponse.json({ message: 'AI request counts updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating AI request counts:', error);
    return NextResponse.json({ error: 'Failed to update AI request counts' }, { status: 500 });
  }
}

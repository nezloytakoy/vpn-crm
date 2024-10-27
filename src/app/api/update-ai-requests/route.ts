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

    
    await prisma.aIRequests.update({
      where: { subscriptionType: 'FIRST' },
      data: { aiRequestCount: first },
    });

    await prisma.aIRequests.update({
      where: { subscriptionType: 'SECOND' },
      data: { aiRequestCount: second },
    });

    await prisma.aIRequests.update({
      where: { subscriptionType: 'THIRD' },
      data: { aiRequestCount: third },
    });

    await prisma.aIRequests.update({
      where: { subscriptionType: 'FOURTH' },
      data: { aiRequestCount: fourth },
    });

    return NextResponse.json({ message: 'AI request counts updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating AI request counts:', error);
    return NextResponse.json({ error: 'Failed to update AI request counts' }, { status: 500 });
  }
}

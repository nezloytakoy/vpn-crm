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
      data: { assistantRequestCount: first },
    });

    await prisma.aIRequests.update({
      where: { subscriptionType: 'SECOND' },
      data: { assistantRequestCount: second },
    });

    await prisma.aIRequests.update({
      where: { subscriptionType: 'THIRD' },
      data: { assistantRequestCount: third },
    });

    await prisma.aIRequests.update({
      where: { subscriptionType: 'FOURTH' },
      data: { assistantRequestCount: fourth },
    });

    return NextResponse.json({ message: 'Assistant request counts updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating assistant request counts:', error);
    return NextResponse.json({ error: 'Failed to update assistant request counts' }, { status: 500 });
  }
}

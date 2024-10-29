import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Recursively converts all BigInt values to strings
function stringifyBigInt<T>(obj: T): T {
    if (typeof obj === 'bigint') {
        return obj.toString() as unknown as T;
    } else if (Array.isArray(obj)) {
        return obj.map((item) => stringifyBigInt(item)) as unknown as T;
    } else if (obj && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, stringifyBigInt(value)])
        ) as T;
    }
    return obj;
}

export async function GET() {
    try {
        const subscriptions = await prisma.subscription.findMany({
            select: {
                id: true,
                name: true,
                aiRequestCount: true,
                assistantRequestCount: true,
            },
        });

        
        const serializedSubscriptions = subscriptions.map(sub => ({
            subscriptionType: sub.name, 
            aiRequestCount: stringifyBigInt(sub.aiRequestCount) || 0,
            assistantRequestCount: stringifyBigInt(sub.assistantRequestCount) || 0,
        }));

        return NextResponse.json({ aiRequests: serializedSubscriptions }, { status: 200 });
    } catch (error) {
        console.error('Error fetching subscription data:', error);
        return NextResponse.json({ error: 'Failed to fetch subscription data' }, { status: 500 });
    }
}

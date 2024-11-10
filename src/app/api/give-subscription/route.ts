import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        console.log('Starting POST request for updating user requests based on subscription...');
        const body = await request.json();
        console.log('Received body:', body);
        const { userId, subscriptionId } = body;

        
        if (!userId || !subscriptionId) {
            console.log('Validation failed: Missing userId or subscriptionId');
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        console.log('Validation passed, fetching subscription details...');

        
        const subscription = await prisma.subscription.findUnique({
            where: { id: BigInt(subscriptionId) },
            select: {
                aiRequestCount: true,
                assistantRequestCount: true,
            },
        });

        if (!subscription) {
            console.log('Subscription not found');
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        console.log('Subscription found:', subscription);

        
        const updatedUser = await prisma.user.update({
            where: { telegramId: BigInt(userId) },
            data: {
                aiRequests: {
                    increment: subscription.aiRequestCount,
                },
                assistantRequests: {
                    increment: subscription.assistantRequestCount ?? 0, 
                },
                lastPaidSubscriptionId: BigInt(subscriptionId),
            },
        });

        console.log('User updated successfully:', updatedUser);

        
        const responseUser = {
            ...updatedUser,
            telegramId: updatedUser.telegramId.toString(),
            lastPaidSubscriptionId: updatedUser.lastPaidSubscriptionId?.toString() || null,
        };

        return NextResponse.json({
            message: 'User requests updated based on subscription successfully',
            updatedUser: responseUser,
        });
    } catch (error) {
        console.error('Error updating user requests based on subscription:', error);
        return NextResponse.json({ error: 'Failed to update user requests' }, { status: 500 });
    }
}

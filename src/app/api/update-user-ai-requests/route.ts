import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        console.log('Starting POST request...');
        const body = await request.json();
        console.log('Received body:', body);
        const { userId, aiRequests } = body;

        // Validate only the required fields
        if (!userId || typeof aiRequests !== 'number' || aiRequests < 0) {
            console.log('Validation failed: Invalid input data');
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        console.log('Validation passed, updating user AI requests...');

        // Update user AI requests in the database
        const updatedUser = await prisma.user.update({
            where: { telegramId: BigInt(userId) },
            data: { aiRequests },
        });

        console.log('User updated successfully:', updatedUser);

        // Convert all BigInt fields to strings
        const responseUser = {
            ...updatedUser,
            telegramId: updatedUser.telegramId.toString(), // Ensure BigInt is converted to string
            lastPaidSubscriptionId: updatedUser.lastPaidSubscriptionId?.toString() || null, // Convert if exists
        };

        console.log('Prepared response user object:', responseUser);

        return NextResponse.json({
            message: 'AI requests updated successfully',
            updatedUser: responseUser,
        });
    } catch (error) {
        console.error('Error updating AI requests:', error);
        return NextResponse.json({ error: 'Failed to update AI requests' }, { status: 500 });
    }
}

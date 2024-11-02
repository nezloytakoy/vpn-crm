import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        console.log('Starting POST request for assistant requests update...');
        const body = await request.json();
        console.log('Received body:', body);
        const { userId, assistantRequests } = body;

        // Validate only the required fields
        if (!userId || typeof assistantRequests !== 'number' || assistantRequests < 0) {
            console.log('Validation failed: Invalid input data');
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        console.log('Validation passed, updating user assistant requests...');

        // Update user assistant requests in the database
        const updatedUser = await prisma.user.update({
            where: { telegramId: BigInt(userId) },
            data: { assistantRequests },
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
            message: 'Assistant requests updated successfully',
            updatedUser: responseUser,
        });
    } catch (error) {
        console.error('Error updating assistant requests:', error);
        return NextResponse.json({ error: 'Failed to update assistant requests' }, { status: 500 });
    }
}

import { PrismaClient } from '@prisma/client';
import { sendTelegramMessageToUser, sendTelegramMessageToAssistant } from './telegramHelpers';  // Assume you have helper functions

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Find all active conversations that are older than one hour
    const oneHourAgo = new Date(Date.now() - 60); // 1 hour ago
    const conversations = await prisma.conversation.findMany({
      where: {
        status: 'IN_PROGRESS',
        createdAt: { lt: oneHourAgo },
      },
      include: { user: true }, // Assuming user details for messaging
    });

    if (conversations.length === 0) {
      return new Response(JSON.stringify({ message: 'No active conversations exceeding one hour.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Loop through conversations and close them
    for (const conversation of conversations) {
      // Update conversation status
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'COMPLETED' },
      });

      // Notify user and assistant
      await sendTelegramMessageToUser(conversation.userId.toString(), 'Your conversation has been closed due to inactivity.');
      await sendTelegramMessageToAssistant(conversation.assistantId.toString(), 'The conversation has been closed after 1 hour of activity.');
    }

    return new Response(JSON.stringify({ message: 'Conversations updated.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error closing conversations:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

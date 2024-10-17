import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    
    const complaints = await prisma.complaint.findMany({
      where: { status: 'PENDING' }, 
      select: {
        id: true,
        userId: true,
        assistantId: true,
      },
    });

    
    const serializedComplaints = await Promise.all(
      complaints.map(async (complaint) => {
        const [user, assistant] = await Promise.all([
          prisma.user.findUnique({
            where: { telegramId: complaint.userId },
            select: { username: true },
          }),
          prisma.assistant.findUnique({
            where: { telegramId: complaint.assistantId },
            select: { username: true },
          }),
        ]);

        return {
          id: complaint.id.toString(),
          userId: complaint.userId.toString(),
          userNickname: user?.username || 'Неизвестно',
          assistantId: complaint.assistantId.toString(),
          assistantNickname: assistant?.username || 'Неизвестно',
        };
      })
    );

    
    return NextResponse.json(serializedComplaints);
  } catch (error) {
    console.error('Ошибка при получении жалоб:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const complaintId = url.searchParams.get('id');

    if (!complaintId) {
      return NextResponse.json({ error: 'ID жалобы не указан' }, { status: 400 });
    }

    
    const complaint = await prisma.complaint.findUnique({
      where: { id: BigInt(complaintId) },
      select: {
        id: true,
        text: true,
        photoUrls: true,
        userId: true,
        assistantId: true,
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: 'Жалоба не найдена' }, { status: 404 });
    }

    
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

    
    const conversation = await prisma.conversation.findFirst({
      where: { requestId: BigInt(complaintId) },
      select: { messages: true }, 
    });

    
    return NextResponse.json({
      id: complaint.id.toString(),
      text: complaint.text,
      photoUrls: complaint.photoUrls,
      userId: complaint.userId.toString(),
      userNickname: user?.username || 'Неизвестно',
      assistantId: complaint.assistantId.toString(),
      assistantNickname: assistant?.username || 'Неизвестно',
      conversationLogs: conversation ? conversation.messages : [],
    });
  } catch (error) {
    console.error('Ошибка при получении деталей жалобы:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

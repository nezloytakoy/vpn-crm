import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const revalidate = 1;
const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1) Получаем все жалобы со статусом PENDING, включая поле text
    const complaints = await prisma.complaint.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        userId: true,
        assistantId: true,
        text: true,           // <-- нужно, чтобы отфильтровать пустую строку
      },
    });

    // 2) Фильтруем те, у которых text не пустая строка
    // (при необходимости, исключите null тоже: text != null && text != '')
    const filteredComplaints = complaints.filter(
      (c) => c.text !== '' && c.text !== null
    );

    // 3) Преобразуем к нужному формату (достаём userNickname, assistantNickname)
    const serializedComplaints = await Promise.all(
      filteredComplaints.map(async (complaint) => {
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
          // Если хотим вернуть text, тоже можем включить:
          // text: complaint.text,
        };
      })
    );

    // 4) Возвращаем JSON
    return NextResponse.json(serializedComplaints);

  } catch (error) {
    console.error('Ошибка при получении жалоб:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Получаем все жалобы (арбитражи) из базы данных
    const complaints = await prisma.arbitration.findMany({
      select: {
        id: true,
        reason: true,  // Жалоба (причина арбитража)
        userId: true,
        userNickname: true, // Может быть null
        assistantId: true,
        assistantNickname: true, // Может быть null
      },
    });

    // Преобразуем BigInt в строки для сериализации
    const serializedComplaints = complaints.map(complaint => ({
      id: complaint.id.toString(),
      reason: complaint.reason,
      userId: complaint.userId.toString(),
      userNickname: complaint.userNickname || 'Неизвестно', // Обрабатываем null
      assistantId: complaint.assistantId.toString(),
      assistantNickname: complaint.assistantNickname || 'Неизвестно', // Обрабатываем null
    }));

    // Возвращаем данные в формате JSON
    return NextResponse.json(serializedComplaints);
  } catch (error) {
    console.error('Ошибка при получении жалоб:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
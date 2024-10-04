import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { telegramId, inviteToken } = await request.json();

    if (!telegramId || !inviteToken) {
      return new Response(JSON.stringify({ message: 'Отсутствует telegramId или inviteToken' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

   
    const invitation = await prisma.invitation.findUnique({
      where: {
        token: inviteToken,
      },
    });

    if (!invitation || invitation.used) {
      return new Response(JSON.stringify({ message: 'Недействительная или уже использованная ссылка' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  
    await prisma.assistant.create({
      data: {
        telegramId,
        role: invitation.role,
      },
    });

   
    await prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        used: true,
      },
    });

    return new Response(JSON.stringify({ message: 'Роль ассистента успешно назначена' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка обработки ссылки:', error);
    return new Response(JSON.stringify({ message: 'Ошибка на сервере' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

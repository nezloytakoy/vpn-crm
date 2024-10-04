import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const token = Math.random().toString(36).slice(2, 11);

    const newLink = `https://t.me/vpn_srm_supportbot?start=invite_${token}`;

   
    const invitation = await prisma.invitation.create({
      data: {
        link: newLink,
        token: token,
        role: 'assistant',
      },
    });

    return new Response(JSON.stringify({ link: invitation.link }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка генерации ссылки:', error);
    return new Response(JSON.stringify({ message: 'Ошибка на сервере' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

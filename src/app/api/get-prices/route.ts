import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const revalidate = 1;

export async function GET() {
  try {
    // Извлекаем все тарифы
    const subscriptions = await prisma.subscription.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price1m: true,
        price3m: true,
        price6m: true,
      },
    });

    // Преобразуем BigInt -> string
    const serialized = subscriptions.map((sub) => ({
      ...sub,
      id: sub.id.toString(), // <-- важный момент
    }));

    return new Response(JSON.stringify({ subscriptions: serialized }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

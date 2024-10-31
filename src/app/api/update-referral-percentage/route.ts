import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
      const { referralPercentage } = await req.json();
  
      if (typeof referralPercentage !== 'number') {
        return NextResponse.json({ error: 'referralPercentage должен быть числом' }, { status: 400 });
      }
  
      await prisma.user.updateMany({
        data: {
          referralPercentage,
        },
      });
  
      return NextResponse.json({ message: 'Процент успешно обновлен' }, { status: 200 });
    } catch (error) {
      console.error('Ошибка при обновлении процента:', error);
      return NextResponse.json({ error: 'Ошибка при обновлении процента' }, { status: 500 });
    }
  }
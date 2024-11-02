import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

function convertBigIntToString(obj: any) {
    return JSON.parse(
      JSON.stringify(obj, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
  }
  
  export async function POST(request: NextRequest) {
    try {
      const { userId, referralPercentage } = await request.json();
  
      if (!userId || referralPercentage === undefined) {
        return NextResponse.json({ error: 'Отсутствуют необходимые параметры' }, { status: 400 });
      }
  
      // Обновляем значение referralPercentage для указанного пользователя
      const updatedUser = await prisma.user.update({
        where: { telegramId: BigInt(userId) },
        data: { referralPercentage },
      });
  
      // Преобразуем все BigInt поля в строки перед отправкой
      const responseUser = convertBigIntToString(updatedUser);
  
      return NextResponse.json({ message: 'Процент реферала обновлен', updatedUser: responseUser });
    } catch (error) {
      console.error('Ошибка при обновлении процента реферала:', error);
      return NextResponse.json({ error: 'Ошибка при обновлении процента реферала' }, { status: 500 });
    }
  }
  

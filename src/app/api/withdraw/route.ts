import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
      const { userId, userNickname, amount } = await req.json();
  
      if (!userId || !amount) {
        return NextResponse.json({ success: false, message: 'Missing required fields.' }, { status: 400 });
      }
  
      const newWithdrawalRequest = await prisma.withdrawalRequest.create({
        data: {
          userId: BigInt(userId), // Преобразуем строку в BigInt для хранения
          userNickname: userNickname || null,
          amount: parseFloat(amount),
          status: 'Требует рассмотрения', 
        },
      });
  
      // Преобразуем BigInt поля в строки для корректной сериализации
      const sanitizedRequest = {
        ...newWithdrawalRequest,
        userId: newWithdrawalRequest.userId.toString(), // Преобразуем BigInt в строку
      };
  
      return NextResponse.json({ success: true, data: sanitizedRequest }, { status: 201 });
    } catch (error) {
      console.error('Ошибка при создании запроса на вывод:', error);
      return NextResponse.json({ success: false, message: 'Error creating withdrawal request.' }, { status: 500 });
    }
  }
  

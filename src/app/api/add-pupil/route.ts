// pages/api/add-pupil.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
    try {
      console.log('Запрос на добавление ученика получен');
      
      const { assistantId, pupilId } = await req.json();
      console.log('Получен assistantId:', assistantId);
      console.log('Получен pupilId:', pupilId);
  
      
      if (!assistantId || !pupilId) {
        console.log('Не хватает assistantId или pupilId');
        return NextResponse.json({ message: 'Отсутствует Assistant ID или Pupil ID' }, { status: 400 });
      }
  
      
      const assistantIdBigInt = BigInt(assistantId);
      const pupilIdBigInt = BigInt(pupilId);
      console.log('Преобразованный assistantId в BigInt:', assistantIdBigInt);
      console.log('Преобразованный pupilId в BigInt:', pupilIdBigInt);
  
      
      const pupil = await prisma.assistant.findUnique({
        where: { telegramId: pupilIdBigInt },
      });
  
      if (!pupil) {
        console.log('Ученик не найден');
        return NextResponse.json({ message: 'Ученик не найден' }, { status: 404 });
      }
  
      
      await prisma.assistant.update({
        where: { telegramId: pupilIdBigInt },
        data: {
          mentorId: assistantIdBigInt,  
        },
      });
      console.log('Наставник успешно назначен для ученика');
  
      return NextResponse.json({ message: 'Наставник успешно назначен' }, { status: 200 });
    } catch (error: unknown) {
      console.error('Ошибка при добавлении ученика:', error);
  
      let errorMessage = 'Неизвестная ошибка';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
  
      return NextResponse.json({ message: `Ошибка при добавлении ученика: ${errorMessage}` }, { status: 500 });
    }
  }
  
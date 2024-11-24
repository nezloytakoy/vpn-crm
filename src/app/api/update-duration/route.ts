import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        let { seconds } = await req.json(); // Извлекаем секунды из запроса

        // Проверяем корректность переданных данных
        if (typeof seconds !== 'number' || seconds < 0) {
            return NextResponse.json({ message: 'Некорректные данные. Ожидалось положительное число секунд.' }, { status: 400 });
        }

        // Обновляем запись в базе данных с указанным количеством секунд
        const updatedDuration = await prisma.requestDuration.update({
            where: { id: 1 },
            data: { minutes: seconds }, // Храним секунды в поле minutes
        });

        return NextResponse.json({ message: 'Количество секунд успешно обновлено', updatedDuration }, { status: 200 });
    } catch (error) {
        console.error('Ошибка при обновлении количества секунд:', error);
        return NextResponse.json({ message: 'Ошибка на сервере' }, { status: 500 });
    } finally {
        await prisma.$disconnect(); // Закрываем соединение с базой данных
    }
}

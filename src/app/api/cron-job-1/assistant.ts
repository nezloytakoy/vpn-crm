  
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export async function findAvailableAssistant(ignoredAssistants: bigint[]) {
    console.log(`=== Поиск доступного ассистента ===`);
    console.log(
        `Игнорируемые ассистенты: ${ignoredAssistants.map((id) => id.toString())}`
    );

    try {
        // Получаем всех ассистентов, которые соответствуют минимальным условиям
        const potentialAssistants = await prisma.assistant.findMany({
            where: {
                isWorking: true,
            },
            orderBy: {
                lastActiveAt: 'desc',
            },
        });

        console.log(`Найдено ассистентов для проверки: ${potentialAssistants.length}`);

        // Проходим по каждому ассистенту и проверяем, почему он подходит или не подходит
        for (const assistant of potentialAssistants) {
            console.log(`--- Проверяем ассистента ID: ${assistant.telegramId.toString()} ---`);

            // Логируем данные ассистента с обработкой BigInt
            console.log(
                `Данные ассистента: ${JSON.stringify(
                    assistant,
                    (key, value) => (typeof value === 'bigint' ? value.toString() : value)
                )}`
            );

            if (assistant.isBusy) {
                console.log(
                    `❌ Ассистент ID: ${assistant.telegramId.toString()} отклонен: ассистент занят (isBusy: true)`
                );
                continue;
            }

            if (assistant.isBlocked) {
                console.log(
                    `❌ Ассистент ID: ${assistant.telegramId.toString()} отклонен: ассистент заблокирован (isBlocked: true)`
                );
                continue;
            }

            if (ignoredAssistants.includes(assistant.telegramId)) {
                console.log(
                    `❌ Ассистент ID: ${assistant.telegramId.toString()} отклонен: находится в списке игнорируемых`
                );
                continue;
            }

            console.log(`✅ Ассистент ID: ${assistant.telegramId.toString()} принят`);
            return assistant;
        }

        console.log(`Нет доступных ассистентов, подходящих под критерии`);
        return null;
    } catch (error) {
        console.error(`❌ Ошибка при поиске доступного ассистента:`, error);
        throw error;
    }
}

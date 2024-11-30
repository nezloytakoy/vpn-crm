  
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

// Вспомогательные функции
export async function findAvailableAssistant(ignoredAssistants: bigint[]) {
    console.log(
      `Поиск доступного ассистента, игнорируя: ${ignoredAssistants.map((id) => id.toString())}`
    ); // Преобразование массива BigInt в строки
    const availableAssistant = await prisma.assistant.findFirst({
      where: {
        isWorking: true,
        isBusy: false,
        isBlocked: false,
        telegramId: {
          notIn: ignoredAssistants,
        },
      },
      orderBy: {
        lastActiveAt: 'desc',
      },
    });
    console.log(`Найден ассистент: ${availableAssistant?.telegramId?.toString()}`); // Добавлено .toString()
    return availableAssistant;
  }
  
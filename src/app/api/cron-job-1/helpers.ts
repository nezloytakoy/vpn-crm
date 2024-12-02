import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
  
export async function sendTelegramMessageWithButtons(chatId: string, text: string, buttons: TelegramButton[]) {
    const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: {
          inline_keyboard: buttons.map((button) => [{ text: button.text, callback_data: button.callback_data }]),
        },
      }),
    });
  }
  
  type TelegramButton = {
    text: string;
    callback_data: string;
  };
  
  async function findNewAssistant(requestId: bigint, ignoredAssistants: bigint[]) {
  
    const availableAssistants = await prisma.assistant.findMany({
      where: {
        isWorking: true,
        telegramId: {
          notIn: ignoredAssistants,
        },
      },
    });
  
    const assistantsWithPenalty = await Promise.all(
      availableAssistants.map(async (assistant) => {
        const penaltyPoints = await getAssistantPenaltyPoints(assistant.telegramId);
        return { ...assistant, penaltyPoints };
      })
    );
  
    assistantsWithPenalty.sort((a, b) => {
      if (a.penaltyPoints === b.penaltyPoints) {
        return (b.lastActiveAt?.getTime() || 0) - (a.lastActiveAt?.getTime() || 0);
      }
      return a.penaltyPoints - b.penaltyPoints;
    });
  
    const selectedAssistant = assistantsWithPenalty[0];
  
    if (!selectedAssistant) {
      await prisma.assistantRequest.update({
        where: { id: requestId },
        data: { ignoredAssistants: [] },
      });
      return findNewAssistant(requestId, []);
    }
  
    return selectedAssistant;
  }
  
  async function getAssistantPenaltyPoints(assistantId: bigint) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
  
    const actions = await prisma.requestAction.findMany({
      where: {
        assistantId: assistantId,
        createdAt: {
          gte: yesterday,
        },
      },
    });
  
    let penaltyPoints = 0;
    for (const action of actions) {
      if (action.action === 'REJECTED') {
        penaltyPoints += 1;
      } else if (action.action === 'IGNORED') {
        penaltyPoints += 3;
      }
    }
  
    return penaltyPoints;
  }

  export async function handleIgnoredRequest(requestId: string, assistantTelegramId: bigint) {
    try {
      const assistantRequest = await prisma.assistantRequest.findUnique({
        where: { id: BigInt(requestId) },
        include: { conversation: true },
      });
  
      const ignoredAssistants = assistantRequest?.ignoredAssistants || [];
      ignoredAssistants.push(assistantTelegramId);
  
      if (assistantRequest?.conversation) {
        await prisma.conversation.update({
          where: { id: assistantRequest.conversation.id },
          data: { status: 'ABORTED' },
        });
      }
  
      await prisma.requestAction.create({
        data: {
          requestId: BigInt(requestId),
          assistantId: assistantTelegramId,
          action: 'IGNORED',
        },
      });
  
      await prisma.assistantRequest.update({
        where: { id: BigInt(requestId) },
        data: {
          status: 'PENDING',
          isActive: true,
          assistantId: null,
          ignoredAssistants,
        },
      });
  
      const newAssistant = await findNewAssistant(BigInt(requestId), ignoredAssistants);
  
      if (newAssistant) {
        await prisma.assistantRequest.update({
          where: { id: BigInt(requestId) },
          data: {
            assistantId: newAssistant.telegramId,
          },
        });
  
        await sendTelegramMessageWithButtons(
          newAssistant.telegramId.toString(),
          'Новый запрос от пользователя',
          [
            { text: 'Принять', callback_data: `accept_${requestId}` },
            { text: 'Отклонить', callback_data: `reject_${requestId}` },
          ]
        );
      } else {
        console.error('Нет доступных ассистентов.');
      }
  
    } catch (error) {
      console.error('Ошибка при обработке игнорированного запроса:', error);
    }
  }
  
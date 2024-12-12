import { PrismaClient } from '@prisma/client';
import { sendTelegramMessageWithButtons } from './telegram'

const prisma = new PrismaClient();


export async function handleRejectRequest(requestId: string, assistantTelegramId: bigint) {
    try {
      
      const edges = await prisma.edges.findFirst();
      const maxRejects = edges ? edges.maxRejects : 7; 
  
      
      const rejectCount = await prisma.requestAction.count({
        where: {
          assistantId: assistantTelegramId,
          action: 'REJECTED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), 
          },
        },
      });
  
      
      if (rejectCount >= maxRejects) {
        await prisma.assistant.update({
          where: { telegramId: assistantTelegramId },
          data: {
            isBlocked: true,
            unblockDate: new Date(Date.now() + 24 * 60 * 60 * 1000), 
          },
        });
  
        console.error('Ассистент заблокирован из-за превышения лимита отказов.');
        return;
      }
  
      
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
          action: 'REJECTED',
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
      console.error('Ошибка при отклонении запроса:', error);
    }
  }
  
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
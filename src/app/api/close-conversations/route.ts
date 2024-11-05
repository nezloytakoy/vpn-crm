import { PrismaClient } from '@prisma/client';
import { sendTelegramMessageToUser, sendTelegramMessageToAssistant } from './telegramHelpers';
import { awardAssistantBonus, awardMentorBonus, handleRejectRequest} from './helpers'

const prisma = new PrismaClient();

export async function POST() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    
    const usersWithAIChat = await prisma.user.findMany({
      where: {
        isActiveAIChat: true,
        lastAIChatOpenedAt: {
          lt: oneHourAgo,
        },
      },
    });

    for (const user of usersWithAIChat) {
      
      await prisma.user.update({
        where: { telegramId: user.telegramId },
        data: { isActiveAIChat: false },
      });

      await sendTelegramMessageToUser(
        user.telegramId.toString(),
        'Диалог с ИИ окончен.'
      );

      console.log(`Диалог с ИИ для пользователя ${user.telegramId} завершен.`);
    }

    
    const conversations = await prisma.conversation.findMany({
      where: {
        status: 'IN_PROGRESS',
        createdAt: { lt: oneHourAgo },
      },
      include: { user: true, assistant: true },
    });

    if (conversations.length === 0 && usersWithAIChat.length === 0) {
      return new Response(JSON.stringify({ message: 'Нет активных диалогов, превышающих 1 час.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    
    for (const conversation of conversations) {
      if (conversation.lastMessageFrom === 'ASSISTANT') {
        const activeRequest = await prisma.assistantRequest.findFirst({
          where: {
            id: conversation.requestId,
            isActive: true,
          },
          include: { assistant: true },
        });

        if (activeRequest) {
          await prisma.assistantRequest.update({
            where: { id: activeRequest.id },
            data: { status: 'COMPLETED', isActive: false },
          });

          if (activeRequest.assistant) {
            await prisma.assistant.update({
              where: { telegramId: activeRequest.assistant.telegramId },
              data: { isBusy: false },
            });
          } else {
            console.error('Ошибка: ассистент не найден для запроса');
          }

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { status: 'COMPLETED' },
          });

          const assistantId = activeRequest.assistantId;

          if (assistantId) {
            const totalCompletedConversations = await prisma.conversation.count({
              where: {
                assistantId: assistantId,
                status: 'COMPLETED',
              },
            });

            const rewards = await prisma.rewards.findFirst();

            const periodRequestCount = rewards?.rewardRequestCount ?? 10;
            const assistantReward = rewards?.assistantReward ?? 5;
            const isPermanentBonus = rewards?.isPermanentBonus ?? false;
            const referralPeriodRequestCount = rewards?.referralRequestCount ?? 20;
            const isPermanentReferral = rewards?.isPermanentReferral ?? false;
            const mentorReward = rewards?.mentorReward ?? 10;

            const assistantData = await prisma.assistant.findUnique({
              where: { telegramId: assistantId },
              select: { mentorId: true },
            });

            const mentorId = assistantData?.mentorId;

            if (rewards?.isRegularBonusEnabled) {
              if (!isPermanentBonus) {
                if (totalCompletedConversations === periodRequestCount) {
                  await awardAssistantBonus(assistantId, assistantReward, periodRequestCount);
                }
              } else {
                if (totalCompletedConversations % periodRequestCount === 0) {
                  await awardAssistantBonus(assistantId, assistantReward, periodRequestCount);
                }
              }
            }

            if (!isPermanentReferral) {
              if (totalCompletedConversations === referralPeriodRequestCount) {
                if (mentorId) {
                  await awardMentorBonus(mentorId, mentorReward, referralPeriodRequestCount);
                }
              }
            } else {
              if (totalCompletedConversations % referralPeriodRequestCount === 0) {
                if (mentorId) {
                  await awardMentorBonus(mentorId, mentorReward, referralPeriodRequestCount);
                }
              }
            }
          } else {
            console.error('Ошибка: assistantId is null');
            continue;
          }

          const coinsToAdd = 1;
          const reason = 'Автоматическое завершение диалога';

          if (activeRequest.assistant) {
            const updatedAssistant = await prisma.assistant.update({
              where: { telegramId: activeRequest.assistant.telegramId },
              data: { coins: { increment: coinsToAdd } },
            });

            await prisma.assistantCoinTransaction.create({
              data: {
                assistantId: activeRequest.assistant.telegramId,
                amount: coinsToAdd,
                reason: reason,
              },
            });

            await sendTelegramMessageToAssistant(
              updatedAssistant.telegramId.toString(),
              `Вам начислен ${coinsToAdd} коин за завершение диалога.`
            );
          } else {
            console.error('Ошибка: ассистент не найден при начислении коинов');
          }

          await sendTelegramMessageToUser(
            conversation.userId.toString(),
            'Диалог завершен.'
          );
        } else {
          console.error('Ошибка: активный запрос не найден');
        }
      } else {
        await sendTelegramMessageToUser(
          conversation.userId.toString(),
          'Связь с ассистентом утеряна, вы будете переключены на другого ассистента.'
        );
        await sendTelegramMessageToAssistant(
          conversation.assistantId.toString(),
          'Вы оставили вопрос пользователя без ответа. Койн не будет засчитан.'
        );

        await handleRejectRequest(conversation.requestId.toString(), conversation.assistantId);
      }
    }

    return new Response(JSON.stringify({ message: 'Диалоги обновлены.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка при закрытии диалогов:', error);
    return new Response(JSON.stringify({ error: 'Ошибка на сервере' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

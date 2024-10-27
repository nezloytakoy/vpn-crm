import { Bot, webhookCallback, Context } from 'grammy';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';


const token = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_SUPPORT_BOT_TOKEN not found.');

const bot = new Bot(token);
const prisma = new PrismaClient();


type TelegramButton = {
  text: string;
  callback_data: string;
};


async function sendTelegramMessageWithButtons(chatId: string, text: string, buttons: TelegramButton[]) {
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


async function sendTelegramMessageToUser(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_USER_BOT_TOKEN;
  if (!botToken) {
    console.error('Ошибка: TELEGRAM_USER_BOT_TOKEN не установлен');
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка отправки сообщения: ${response.statusText}`);
    }

    console.log(`Сообщение успешно отправлено пользователю с ID: ${chatId}`);

    const userTelegramId = BigInt(chatId); 


    const activeConversation = await prisma.conversation.findFirst({
      where: {
        userId: userTelegramId,
        status: 'IN_PROGRESS',
      },
    });

    if (activeConversation) {
      const currentTime = new Date();


      if (activeConversation.lastMessageFrom === 'USER' && activeConversation.lastUserMessageAt) {
        const lastUserMessageTime = new Date(activeConversation.lastUserMessageAt).getTime();
        const responseTime = currentTime.getTime() - lastUserMessageTime; 
   
        const responseTimesArray: Prisma.JsonArray = Array.isArray(activeConversation.assistantResponseTimes)
          ? activeConversation.assistantResponseTimes as Prisma.JsonArray
          : [];

   
        responseTimesArray.push(responseTime);


        const newAssistantMessage = {
          sender: 'ASSISTANT',
          message: text,
          timestamp: currentTime.toISOString(),
        };

   
        const updatedMessages = [
          ...(activeConversation.messages as Array<{ sender: string; message: string; timestamp: string }>),
          newAssistantMessage,
        ];


        await prisma.conversation.update({
          where: { id: activeConversation.id },
          data: {
            lastMessageFrom: 'ASSISTANT',       
            assistantResponseTimes: responseTimesArray,
            messages: updatedMessages,          
          },
        });
      } else {
     
        const newAssistantMessage = {
          sender: 'ASSISTANT',
          message: text,
          timestamp: currentTime.toISOString(),
        };


        const updatedMessages = [
          ...(activeConversation.messages as Array<{ sender: string; message: string; timestamp: string }>),
          newAssistantMessage,
        ];


        await prisma.conversation.update({
          where: { id: activeConversation.id },
          data: {
            lastMessageFrom: 'ASSISTANT',
            messages: updatedMessages,  
          },
        });
      }
    } else {
      console.error('Ошибка: активный разговор не найден для пользователя');
    }
  } catch (error) {
    console.error('Ошибка при отправке сообщения пользователю:', error);
  }
}




type TranslationKey = keyof typeof translations["en"];

const getTranslation = (lang: "en" | "ru", key: TranslationKey) => {
  return translations[lang][key] || translations["en"][key];
};

const translations = {
  en: {
    end_dialog_error: "Error: could not get your Telegram ID.",
    no_active_requests: "⚠️ You have no active requests.",
    dialog_closed: "The dialog with the user has been closed.",
    assistant_finished_dialog: "The assistant has finished the dialog.",
    start_invalid_link: "❌ The link is invalid or has already been used.",
    assistant_congrats: "🎉 Congratulations, you are now an assistant!",
    start_message: "👋 This is the support bot! Use a valid invite link to access the functionality.",
    menu_message: "📋 Main menu:",
    start_work: "🚀 Start working!",
    my_coins: "💰 My coins",
    my_activity: "📊 My activity",
    already_working: "⚠️ You are already working!",
    work_started: "🚀 Work started! To end, use the /end_work command.",
    end_work: "🚪 Work finished!",
    no_working_status: "⚠️ You are not working at the moment!",
    accept_request: "✅ You have accepted the request. Please wait for the user's question.",
    reject_request: "❌ You have rejected the request.",
    send_message_error: "Please send a text message.",
    no_user_requests: "⚠️ You have no active user requests.",
    error_processing_message: "An error occurred while processing your message. Please try again later.",
    active_dialog_exists: "⚠️ You have an active dialog. Please finish it before ending work.", 
  },
  ru: {
    end_dialog_error: "Ошибка: не удалось получить ваш идентификатор Telegram.",
    no_active_requests: "⚠️ У вас нет активных запросов.",
    dialog_closed: "Диалог с пользователем завершен.",
    assistant_finished_dialog: "Ассистент завершил диалог.",
    start_invalid_link: "❌ Ссылка недействительна или уже была использована.",
    assistant_congrats: "🎉 Поздравляем, вы стали ассистентом!",
    start_message: "👋 Это бот для саппортов! Используйте действительную пригласительную ссылку для доступа к функционалу.",
    menu_message: "📋 Главное меню:",
    start_work: "🚀 Начать работу!",
    my_coins: "💰 Мои коины",
    my_activity: "📊 Моя активность",
    already_working: "⚠️ Вы уже работаете!",
    work_started: "🚀 Работа начата! Чтобы завершить работу, используйте команду /end_work.",
    end_work: "🚪 Работа завершена!",
    no_working_status: "⚠️ Вы не работаете в данный момент!",
    accept_request: "✅ Вы приняли запрос. Ожидайте вопрос пользователя.",
    reject_request: "❌ Вы отклонили запрос.",
    send_message_error: "Пожалуйста, отправьте текстовое сообщение.",
    no_user_requests: "⚠️ У вас нет активных запросов пользователей.",
    error_processing_message: "Произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз позже.",
    active_dialog_exists: "⚠️ У вас есть активный диалог. Пожалуйста, завершите его перед тем, как закончить работу.", 
  },
};


const detectUserLanguage = (ctx: Context) => {
  const userLang = ctx.from?.language_code;
  return userLang === 'ru' ? 'ru' : 'en';
};


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


async function findNewAssistant(requestId: bigint, ignoredAssistants: bigint[]) {

  const availableAssistants = await prisma.assistant.findMany({
    where: {
      isWorking: true,
      isBusy: false,
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


async function checkAssistantBlockStatus(ctx: Context) {
  if (!ctx.from?.id) return;
  
  const telegramId = BigInt(ctx.from.id);

  
  const assistant = await prisma.assistant.findUnique({
    where: { telegramId },
    select: { isBlocked: true, unblockDate: true },
  });

  if (assistant?.isBlocked && assistant.unblockDate) {
    const currentTime = new Date();
    const remainingTime = Math.ceil((assistant.unblockDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60));

    if (remainingTime > 0) {
      
      await ctx.reply(`Вы заблокированы администратором, до разблокировки осталось ${remainingTime} часов.`);
      return true;
    } else {
      
      await prisma.assistant.update({
        where: { telegramId },
        data: { isBlocked: false, unblockDate: null },
      });
      await ctx.reply("Время блокировки вышло, вы можете продолжать пользоваться ботом.");
    }
  }
  return false;
}


bot.use(async (ctx, next) => {
  const isBlocked = await checkAssistantBlockStatus(ctx);
  if (!isBlocked) {
    await next(); 
  }
});



bot.command('end_work', async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(detectUserLanguage(ctx), 'end_dialog_error'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const lang = detectUserLanguage(ctx);

    
    const activeConversation = await prisma.conversation.findFirst({
      where: {
        assistantId: telegramId,
        status: 'IN_PROGRESS', 
      },
    });

    if (activeConversation) {
      
      await ctx.reply(getTranslation(lang, 'active_dialog_exists'));
      return;
    }

    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: telegramId },
    });

    if (!assistant?.isWorking) {
      await ctx.reply(getTranslation(lang, 'no_working_status'));
      return;
    }

    
    await prisma.assistant.update({
      where: { telegramId: telegramId },
      data: { isWorking: false, isBusy: false },
    });

    
    const activeSession = await prisma.assistantSession.findFirst({
      where: {
        assistantId: telegramId,
        endedAt: null,
      },
      orderBy: {
        startedAt: 'desc', 
      },
    });

    if (activeSession) {
      
      await prisma.assistantSession.update({
        where: { id: activeSession.id },
        data: { endedAt: new Date() },
      });
    } else {
      
      console.warn(`Не найдена активная сессия для ассистента ${telegramId}`);
    }

    await ctx.reply(getTranslation(lang, 'end_work'));
  } catch (error) {
    console.error('Ошибка при завершении работы:', error);
    await ctx.reply(getTranslation(detectUserLanguage(ctx), 'end_dialog_error'));
  }
});




bot.command('start', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  const args = ctx.match?.split(' ') ?? [];

  if (args.length > 0 && args[0].startsWith('invite_')) {
    const inviteToken = args[0].replace('invite_', '');

    try {
      const invitation = await prisma.invitation.findUnique({ where: { token: inviteToken } });

      if (!invitation || invitation.used) {
        await ctx.reply(getTranslation(lang, 'start_invalid_link'));
        return;
      }

      if (ctx.from?.id) {
        const telegramId = BigInt(ctx.from.id);
        const username = ctx.from.username || null;

        
        const userProfilePhotos = await ctx.api.getUserProfilePhotos(ctx.from.id);

        let avatarFileId: string | null = null;

        if (userProfilePhotos.total_count > 0) {
          
          const photos = userProfilePhotos.photos[0];
          
          const largestPhoto = photos[photos.length - 1];
          
          avatarFileId = largestPhoto.file_id;
        } else {
          console.log('У ассистента нет аватарки.');
        }

        
        const lastAssistant = await prisma.assistant.findFirst({
          orderBy: { orderNumber: 'desc' },
          select: { orderNumber: true },
        });

        const nextOrderNumber = lastAssistant?.orderNumber ? lastAssistant.orderNumber + 1 : 1;

        
        await prisma.assistant.create({
          data: {
            telegramId: telegramId,
            username: username,
            role: invitation.role,
            orderNumber: nextOrderNumber,
            avatarFileId: avatarFileId, 
          },
        });

        
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { used: true },
        });

        
        await ctx.reply(getTranslation(lang, 'assistant_congrats'));

        
        await prisma.assistant.update({
          where: { telegramId: telegramId },
          data: { lastActiveAt: new Date() },
        });
      } else {
        await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      }
    } catch (error) {
      console.error('Error assigning assistant role:', error);
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
    }
  } else {
    await ctx.reply(getTranslation(lang, 'start_message'));
  }
});



bot.command('menu', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  try {

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      return;
    }

    const telegramId = BigInt(ctx.from.id);

  
    const assistant = await prisma.assistant.findUnique({
      where: { telegramId: telegramId },
    });

    if (!assistant) {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      return;
    }

  
    await prisma.assistant.update({
      where: { telegramId: telegramId },
      data: { lastActiveAt: new Date() },
    });

    
    await ctx.reply(getTranslation(lang, 'menu_message'), {
      reply_markup: {
        inline_keyboard: [
          [{ text: getTranslation(lang, 'start_work'), callback_data: 'start_work' }],
          [{ text: getTranslation(lang, 'my_coins'), callback_data: 'my_coins' }],
          [{ text: getTranslation(lang, 'my_activity'), callback_data: 'my_activity' }],
        ],
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error('Error showing menu:', errorMessage);
  }
});

bot.on('callback_query:data', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  if (ctx.from?.id) {
    const telegramId = BigInt(ctx.from.id); 
    const data = ctx.callbackQuery?.data;

    if (data.startsWith('accept_') || data.startsWith('reject_')) {
      const [action, requestId] = data.split('_');

      if (action === 'accept') {
        await handleAcceptRequest(requestId, telegramId, ctx);
      } else if (action === 'reject') {
        await handleRejectRequest(requestId, telegramId, ctx);
      }

      return; 
    }

    if (data === 'start_work') {
      const assistant = await prisma.assistant.findUnique({ where: { telegramId: telegramId } });
    
      if (assistant?.isWorking) {
        await ctx.reply(getTranslation(lang, 'already_working'));
        return;
      }
    
      
      await prisma.assistant.update({
        where: { telegramId: telegramId },
        data: { isWorking: true, isBusy: false },
      });
    
      
      await prisma.assistantSession.create({
        data: {
          assistantId: telegramId,
          
        },
      });
    
      await ctx.reply(getTranslation(lang, 'work_started'));
      return;
    } else if (data === 'my_coins') {
      
      const assistant = await prisma.assistant.findUnique({
        where: { telegramId: telegramId },
      });

      if (assistant) {
        const coinsMessage = `${getTranslation(lang, 'my_coins')}: ${assistant.coins}`;

        
        await ctx.reply(coinsMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Запросить вывод', callback_data: 'request_withdrawal' }],
            ],
          },
        });
      } else {
        await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      }
    } else if (data === 'my_activity') {
      
      const stats = await getAssistantActivity(telegramId);

      const activityMessage = `
        📊 Моя активность:
        - Всего диалогов: ${stats.totalConversations}
        - Диалогов за последние сутки: ${stats.conversationsLast24Hours}
        - Пропусков за последние сутки: ${stats.ignoredRequests}
        - Отказов за последние сутки: ${stats.rejectedRequests}
        - Жалоб за последние сутки: ${stats.complaintsLast24Hours}
      `;

      
      await ctx.reply(activityMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Лимиты', callback_data: 'view_limits' }],
          ],
        },
      });
    } else if (data === 'request_withdrawal') {
      
      const assistant = await prisma.assistant.findUnique({
        where: { telegramId: telegramId },
      });

      if (assistant) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        
        const pendingComplaints = await prisma.complaint.count({
          where: {
            assistantId: assistant.telegramId,
            status: 'PENDING',
          },
        });

        if (pendingComplaints > 0) {
          await ctx.reply('Пользователь написал на вас жалобу, вы не можете сделать вывод, пока она не будет рассмотрена.');
          return;
        }

        
        const rejectedActions = await prisma.requestAction.count({
          where: {
            assistantId: assistant.telegramId,
            action: 'REJECTED',
            createdAt: {
              gte: yesterday,
            },
          },
        });

        const ignoredActions = await prisma.requestAction.count({
          where: {
            assistantId: assistant.telegramId,
            action: 'IGNORED',
            createdAt: {
              gte: yesterday,
            },
          },
        });

        
        if (rejectedActions > 10 || ignoredActions > 3) {
          await ctx.reply('Ваш баланс заморожен на 24 часа за низкую активность.');
          return;
        }

        const withdrawalAmount = assistant.coins; 

        
        await ctx.reply('Запрос на вывод отправлен.');

        
        await prisma.withdrawalRequest.create({
          data: {
            userId: assistant.telegramId,
            userNickname: ctx.from?.username || null,
            userRole: 'assistant', 
            amount: withdrawalAmount,
          },
        });

        await ctx.reply('Ваш запрос на вывод успешно создан.');
      } else {
        await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      }
    } else if (data === 'view_limits') {
      
      await ctx.reply(
        `Если пропуски запросов за сутки будет больше 3 или отказов больше 10, то ваша активность снизится и вы получите заморозку до 24 часов. 
        Вывод коинов будет недоступен за это время. Получение жалобы также приостанавливает вывод коинов до того как ситуация не будет разрешена.`
      );
    }
  } else {
    await ctx.reply(getTranslation(lang, 'end_dialog_error'));
  }
});




async function getAssistantActivity(assistantId: bigint) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  
  const totalConversations = await prisma.conversation.count({
    where: { assistantId: assistantId },
  });

  
  const conversationsLast24Hours = await prisma.conversation.count({
    where: {
      assistantId: assistantId,
      createdAt: {
        gte: yesterday,
      },
    },
  });

  
  const ignoredRequests = await prisma.requestAction.count({
    where: {
      assistantId: assistantId,
      action: 'IGNORED',
      createdAt: {
        gte: yesterday,
      },
    },
  });

  
  const rejectedRequests = await prisma.requestAction.count({
    where: {
      assistantId: assistantId,
      action: 'REJECTED',
      createdAt: {
        gte: yesterday,
      },
    },
  });

  
  const complaintsLast24Hours = await prisma.complaint.count({
    where: {
      assistantId: assistantId,
      createdAt: {
        gte: yesterday,
      },
    },
  });

  return {
    totalConversations,
    conversationsLast24Hours,
    ignoredRequests,
    rejectedRequests,
    complaintsLast24Hours,
  };
}


async function handleAcceptRequest(requestId: string, assistantTelegramId: bigint, ctx: Context) {
  try {
    const assistantRequest = await prisma.assistantRequest.update({
      where: { id: BigInt(requestId) },
      data: { status: 'IN_PROGRESS', isActive: true },
      include: { user: true },
    });

    
    await prisma.assistant.update({
      where: { telegramId: assistantTelegramId },
      data: { isBusy: true },
    });

    
    const existingConversation = await prisma.conversation.findUnique({
      where: { requestId: assistantRequest.id },
    });

    if (existingConversation) {
      
      console.error(`Разговор для запроса с ID ${assistantRequest.id} уже существует.`);
      await ctx.reply('Этот запрос уже имеет активный разговор.');
    } else {
      
      await prisma.conversation.create({
        data: {
          userId: assistantRequest.userId, 
          assistantId: assistantTelegramId, 
          requestId: assistantRequest.id, 
          messages: [], 
          status: 'IN_PROGRESS', 
          lastMessageFrom: 'USER', 
        },
      });

      await ctx.reply('✅ Вы приняли запрос. Ожидайте вопрос пользователя.');

      await sendTelegramMessageToUser(
        assistantRequest.user.telegramId.toString(),
        'Ассистент присоединился к чату. Сформулируйте свой вопрос.'
      );
    }
  } catch (error) {
    console.error('Ошибка при принятии запроса:', error);
    await ctx.reply('❌ Произошла ошибка при принятии запроса.');
  }
}


async function handleRejectRequest(requestId: string, assistantTelegramId: bigint, ctx: Context) {
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

      await ctx.reply('❌ Вы отклонили запрос. Новый ассистент уведомлен.');
    } else {
      await ctx.reply('❌ Вы отклонили запрос, но доступных ассистентов больше нет.');
    }

    
    await prisma.assistant.update({
      where: { telegramId: assistantTelegramId },
      data: { isBusy: false },
    });
  } catch (error) {
    console.error('Ошибка при отклонении запроса:', error);
    await ctx.reply('❌ Произошла ошибка при отклонении запроса.');
  }
}





bot.on('message', async (ctx) => {
  try {
    const lang = detectUserLanguage(ctx);

    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(lang, 'end_dialog_error'));
      return;
    }

    const assistantTelegramId = BigInt(ctx.from.id);
    const assistantMessage = ctx.message?.text;

    if (!assistantMessage) {
      await ctx.reply(getTranslation(lang, 'send_message_error'));
      return;
    }

    
    const [activeRequest] = await Promise.all([
      prisma.assistantRequest.findFirst({
        where: {
          assistant: { telegramId: assistantTelegramId },
          isActive: true,
        },
        include: { user: true },
      }),
    ]);

    if (activeRequest) {
      
      await sendTelegramMessageToUser(
        activeRequest.user.telegramId.toString(),
        assistantMessage
      );
    } else {
      
      await ctx.reply(getTranslation(lang, 'no_user_requests'));
    }
  } catch (error) {
    console.error('Ошибка при обработке сообщения от ассистента:', error);
    await ctx.reply(getTranslation(detectUserLanguage(ctx), 'error_processing_message'));
  }
});

export const POST = webhookCallback(bot, 'std/http');

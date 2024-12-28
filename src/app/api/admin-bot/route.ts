import { Bot, webhookCallback } from 'grammy';
import { PrismaClient } from '@prisma/client';
import { getTranslation, detectUserLanguage } from './localization';
import { showModeratorMenu, moderatorState } from './moderatorLogic';
import { updateModeratorInfo, handleInvitation, processModeratorInvitation } from './moderatorHandlers';

const userBot = new Bot(process.env.TELEGRAM_USER_BOT_TOKEN!);
const supportBot = new Bot(process.env.TELEGRAM_SUPPORT_BOT_TOKEN!);
const adminBot = new Bot(process.env.TELEGRAM_ADMIN_BOT_TOKEN!);

const prisma = new PrismaClient();

// Обновление lastActiveAt при каждом взаимодействии с ботом
adminBot.use(async (ctx, next) => {
  if (ctx.from?.id) {
    await updateModeratorInfo(ctx.from.id, ctx.from.username || "");
  }
  await next();
});

adminBot.command('menu', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  if (ctx.from?.id) {
    const moderator = await prisma.moderator.findFirst({
      where: { id: BigInt(ctx.from.id) },
    });

    if (moderator) {
      await showModeratorMenu(ctx, lang);
    } else {
      await ctx.reply(getTranslation(lang, 'command_error'));
    }
  } else {
    await ctx.reply(getTranslation(lang, 'command_error'));
  }
});

adminBot.command('start', async (ctx) => {
  const lang = detectUserLanguage(ctx);

  try {
    if (!ctx.from?.id) {
      await ctx.reply(getTranslation(lang, 'command_error'));
      return;
    }

    if (!ctx.from.username) {
      await ctx.reply(getTranslation(lang, 'no_username_error'));
      return;
    }

    if (!ctx.message?.text) {
      await ctx.reply(getTranslation(lang, 'command_error'));
      return;
    }

    const args = ctx.message.text.split(' ');
    if (args.length > 1 && args[1].startsWith('invite_')) {
      const inviteToken = args[1].replace('invite_', '');

      // handleInvitation(...) и processModeratorInvitation(...) 
      // — ваши существующие функции
      const { invitation, moderatorId } = await handleInvitation(ctx.from.id, inviteToken);

      if (!invitation) {
        await ctx.reply(getTranslation(lang, 'invalid_link'));
        return;
      }

      // --- Прежде чем вызвать processModeratorInvitation, 
      // --- мы можем сохранить аватарку в базу Moderator

      // 1) Получаем фото профиля
      const userProfilePhotos = await ctx.api.getUserProfilePhotos(ctx.from.id, {
        offset: 0,
        limit: 1,
      });

      let avatarUrl: string | null = null;
      if (userProfilePhotos.total_count > 0) {
        const photos = userProfilePhotos.photos[0];
        const largestPhoto = photos[photos.length - 1];

        // 2) Через getFile получаем file_path
        const fileObj = await ctx.api.getFile(largestPhoto.file_id);

        // 3) Формируем полный URL для скачивания, используя TELEGRAM_ADMIN_BOT_TOKEN
        //    (Убедитесь, что именно этим токеном adminBot создан)
        const fullUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_ADMIN_BOT_TOKEN}/${fileObj.file_path}`;
        avatarUrl = fullUrl;
      }

      // 4) Сохраняем avatarUrl в таблицу Moderator
      //    Предполагается, что "moderatorId" — это первичный ключ в таблице Moderator.
      //    Или, если "moderatorId" — это BigInt, адаптируйте под вашу схему.
      if (moderatorId && avatarUrl) {
        await prisma.moderator.update({
          where: { id: BigInt(moderatorId) },
          data: {
            avatarUrl,
          },
        });
      }

      // Далее выполняем вашу существующую логику 
      // processModeratorInvitation(...)
      await processModeratorInvitation(invitation, moderatorId, ctx.from.username, lang, showModeratorMenu, ctx);

    } else {
      // Если /start без invite-токена
      await ctx.reply(getTranslation(lang, 'moderator_bot'));
    }
  } catch (error) {
    console.error('Ошибка в команде /start:', error);
    const lang = detectUserLanguage(ctx);
    await ctx.reply(getTranslation(lang, 'error_processing_message'));
  }
});

adminBot.callbackQuery('message_user', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  await ctx.answerCallbackQuery();
  moderatorState[ctx.from.id] = { state: 'awaiting_user_id' };
  await ctx.reply(getTranslation(lang, 'user_id_prompt'));
});

adminBot.callbackQuery('message_assistant', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  await ctx.answerCallbackQuery();
  moderatorState[ctx.from.id] = { state: 'awaiting_assistant_id' };
  await ctx.reply(getTranslation(lang, 'assistant_id_prompt'));
});

adminBot.on('message', async (ctx) => {
  const lang = detectUserLanguage(ctx);
  const modId = ctx.from?.id;
  if (!modId) {
    await ctx.reply(getTranslation(lang, 'no_user_id'));
    return;
  }

  const messageText = ctx.message?.text;
  if (!messageText) {
    await ctx.reply(getTranslation(lang, 'no_text_message'));
    return;
  }

  const moderatorId = BigInt(modId);

  const currentState = moderatorState[modId]?.state;

  if (!currentState) {
    await ctx.reply(getTranslation(lang, 'no_current_arbitrations'));
    return;
  }

  if (currentState === 'awaiting_user_id' || currentState === 'awaiting_assistant_id') {
    const id = messageText;

    if (!/^\d{9,10}$/.test(id)) {
      await ctx.reply(getTranslation(lang, 'id_invalid'));
      return;
    }

    moderatorState[modId].targetId = id;

    if (currentState === 'awaiting_user_id') {
      moderatorState[modId].state = 'awaiting_message_user';
    } else {
      moderatorState[modId].state = 'awaiting_message_assistant';
    }

    await ctx.reply(getTranslation(lang, 'message_prompt'));
  } else if (currentState === 'awaiting_message_user' || currentState === 'awaiting_message_assistant') {
    const targetId = moderatorState[modId]?.targetId;

    if (targetId) {
      const targetMessage = getTranslation(lang, 'moderator_message_prefix').replace('%message%', messageText);
      try {
        if (currentState === 'awaiting_message_user') {
          await userBot.api.sendMessage(Number(targetId), targetMessage);
          await prisma.moderator.update({
            where: { id: moderatorId },
            data: { userMessagesCount: { increment: 1 } },
          });
        } else {
          await supportBot.api.sendMessage(Number(targetId), targetMessage);
          await prisma.moderator.update({
            where: { id: moderatorId },
            data: { assistantMessagesCount: { increment: 1 } },
          });
        }

        await ctx.reply(getTranslation(lang, 'message_sent'));
      } catch (error) {
        console.log('on message: error sending message', error);
        await ctx.reply(getTranslation(lang, 'message_send_error'));
      }
    }

    delete moderatorState[modId];
  }
});

export const POST = webhookCallback(adminBot, 'std/http');

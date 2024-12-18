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
    if (ctx.from?.id) {
      if (!ctx.from.username) {
        await ctx.reply(getTranslation(lang, 'no_username_error'));
        return;
      }

      if (ctx.message?.text) {
        const args = ctx.message.text.split(' ');
        if (args.length > 1) {
          const inviteToken = args[1].replace('invite_', '');
          const { invitation, moderatorId } = await handleInvitation(ctx.from.id, inviteToken);

          if (invitation) {
            await processModeratorInvitation(invitation, moderatorId, ctx.from.username, lang, showModeratorMenu, ctx);
          } else {
            await ctx.reply(getTranslation(lang, 'invalid_link'));
          }
        } else {
          await ctx.reply(getTranslation(lang, 'moderator_bot'));
        }
      } else {
        await ctx.reply(getTranslation(lang, 'command_error'));
      }
    } else {
      await ctx.reply(getTranslation(lang, 'command_error'));
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

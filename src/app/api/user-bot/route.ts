import { Bot, webhookCallback } from 'grammy';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const token = process.env.TELEGRAM_USER_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_USER_BOT_TOKEN не найден.');
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY не найден.');

const bot = new Bot(token);

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const userConversations = new Map<bigint, ChatMessage[]>();


async function sendMessageToAssistant(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_SUPPORT_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}


bot.command('end_dialog', async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply('Не удалось получить ваш идентификатор пользователя.');
      return;
    }

    const telegramId = BigInt(ctx.from.id);


    const activeRequest = await prisma.assistantRequest.findFirst({
      where: {
        user: { telegramId: telegramId },
        isActive: true,
      },
      include: { assistant: true },
    });

    if (!activeRequest) {
      await ctx.reply('У вас нет активного диалога с ассистентом.');
      return;
    }


    await prisma.assistantRequest.update({
      where: { id: activeRequest.id },
      data: { status: 'COMPLETED', isActive: false },
    });

    await prisma.assistant.update({
      where: { telegramId: activeRequest.assistant.telegramId },
      data: { isBusy: false },
    });

    await ctx.reply('Диалог с ассистентом завершен. Спасибо за использование нашего сервиса!');


    await sendMessageToAssistant(activeRequest.assistant.telegramId.toString(), 'Пользователь завершил диалог.');
  } catch (error) {
    console.error('Ошибка при завершении диалога:', error);
    await ctx.reply('Произошла ошибка при завершении диалога. Пожалуйста, попробуйте еще раз позже.');
  }
});

bot.command('start', async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply('Не удалось получить ваш идентификатор пользователя.');
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const username = ctx.from.username || null;

    await prisma.user.upsert({
      where: { telegramId },
      update: { username },
      create: { telegramId, username },
    });

    await ctx.reply('👋 Это бот для пользователей! Для продолжения нажмите на кнопку ниже и войдите в Telegram Web App.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚪 Войти в Web App', web_app: { url: 'https://crm-vpn.vercel.app/user-profile' } }],
        ],
      },
    });
  } catch (error) {
    console.error('Ошибка при обработке команды /start:', error);
    await ctx.reply('Произошла ошибка при обработке вашей команды. Пожалуйста, попробуйте еще раз позже.');
  }
});

bot.on('message', async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply('Не удалось получить ваш идентификатор пользователя.');
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const userMessage = ctx.message?.text;

    if (!userMessage) {
      await ctx.reply('Пожалуйста, отправьте текстовое сообщение.');
      return;
    }

   
    const activeRequest = await prisma.assistantRequest.findFirst({
      where: {
        user: { telegramId: telegramId }, 
        isActive: true,
      },
      include: { assistant: true },
    });

    if (activeRequest) {
    
      await sendMessageToAssistant(activeRequest.assistant.telegramId.toString(), userMessage);

    } else {
   
      const messages: ChatMessage[] = userConversations.get(telegramId) || [
        { role: 'system', content: 'You are a helpful assistant.' },
      ];

      messages.push({ role: 'user', content: userMessage });

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
      });

      const firstChoice = response.choices[0];
      if (firstChoice && firstChoice.message && firstChoice.message.content) {
        const aiMessage = firstChoice.message.content.trim();

        messages.push({ role: 'assistant', content: aiMessage });

        userConversations.set(telegramId, messages);

        await ctx.reply(aiMessage);

        await prisma.user.update({
          where: { telegramId },
          data: {
            aiRequests: { increment: 1 },
            totalRequests: { increment: 1 },
          },
        });
      } else {
        await ctx.reply('Извините, не удалось получить ответ от ИИ.');
      }
    }
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
    await ctx.reply('Произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз позже.');
  }
});

export const POST = webhookCallback(bot, 'std/http');

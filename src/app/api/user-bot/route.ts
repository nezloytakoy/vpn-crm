import { Bot, webhookCallback } from 'grammy';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const token = process.env.TELEGRAM_USER_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_USER_BOT_TOKEN не найден.');
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY не найден.');

const bot = new Bot(token);

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const userConversations = new Map<bigint, ChatMessage[]>(); // Используем bigint как ключ

bot.command('start', async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply('Не удалось получить ваш идентификатор пользователя.');
      return;
    }

    const telegramId = BigInt(ctx.from.id);  // Преобразуем в BigInt
    const username = ctx.from.username || null;

    await prisma.user.upsert({
      where: { id: telegramId }, // Используем id, который равен telegramId
      update: { username },
      create: {
        id: telegramId,  // telegramId используется как id
        telegramId: telegramId, // Telegram ID также нужно указать
        username,
      },
    });


    await ctx.reply('👋 Это бот для пользователей! Для продолжения нажмите на кнопку ниже и войдите в Telegram Web App.', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚪 Войти в Web App',
              web_app: { url: 'https://crm-vpn.vercel.app/user-profile' },
            },
          ],
        ],
      },
    });
  } catch (error) {
    console.error('Ошибка при обработке команды /start:', error);
    await ctx.reply('Произошла ошибка при обработке вашей команды. Пожалуйста, попробуйте еще раз позже.');
  }
});

bot.command('start_ai', async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply('Не удалось получить ваш идентификатор пользователя.');
      return;
    }

    const telegramId = BigInt(ctx.from.id);  // Преобразуем в BigInt

    let user = await prisma.user.findUnique({
      where: { id: telegramId }, // Используем id, который равен telegramId
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: telegramId,  // id и telegramId теперь одно и то же значение
          telegramId: telegramId,  // Обязательно указываем telegramId
          username: ctx.from.username || null,  // Имя пользователя
          isActiveAIChat: true,  // Устанавливаем активный чат с ИИ
        },
      });


      await ctx.reply('Диалог с ИИ начат. Вы можете задавать свои вопросы.');
      return;
    }

    if (user.isActiveAIChat) {
      await ctx.reply('Вы уже находитесь в активном диалоге с ИИ.');
      return;
    }

    await prisma.user.update({
      where: { id: telegramId }, // Используем id
      data: { isActiveAIChat: true },
    });

    await ctx.reply('Диалог с ИИ начат. Вы можете задавать свои вопросы.');
  } catch (error) {
    console.error('Ошибка при обработке команды /start_ai:', error);
    await ctx.reply('Произошла ошибка при начале диалога с ИИ. Пожалуйста, попробуйте еще раз позже.');
  }
});

bot.command('end_ai', async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply('Не удалось получить ваш идентификатор пользователя.');
      return;
    }

    const telegramId = BigInt(ctx.from.id);  // Преобразуем в BigInt

    const user = await prisma.user.findUnique({
      where: { id: telegramId }, // Используем id
    });

    if (!user) {
      await ctx.reply('Пожалуйста, воспользуйтесь командой /start, чтобы начать.');
      return;
    }

    if (!user.isActiveAIChat) {
      await ctx.reply('Вы не находитесь в активном диалоге с ИИ.');
    } else {
      await prisma.user.update({
        where: { id: telegramId }, // Используем id
        data: { isActiveAIChat: false },
      });

      userConversations.delete(telegramId);

      await ctx.reply('Диалог с ИИ завершен. Спасибо за использование нашего сервиса!');
    }
  } catch (error) {
    console.error('Ошибка при обработке команды /end_ai:', error);
    await ctx.reply('Произошла ошибка при завершении диалога с ИИ. Пожалуйста, попробуйте еще раз позже.');
  }
});

bot.on('message', async (ctx) => {
  try {
    if (!ctx.from?.id) {
      await ctx.reply('Не удалось получить ваш идентификатор пользователя.');
      return;
    }

    const telegramId = BigInt(ctx.from.id);  // Преобразуем в BigInt

    const user = await prisma.user.findUnique({
      where: { id: telegramId }, // Используем id
    });

    if (!user || !user.isActiveAIChat) {
      await ctx.reply('Я вас не понимаю. Воспользуйтесь web-приложением /start');
      return;
    }

    const userMessage = ctx.message.text;

    if (!userMessage) {
      await ctx.reply('Пожалуйста, отправьте текстовое сообщение.');
      return;
    }

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
        where: { id: telegramId }, // Используем id
        data: {
          aiRequests: { increment: 1 },
          totalRequests: { increment: 1 },
        },
      });
    } else {
      await ctx.reply('Извините, не удалось получить ответ от ИИ.');
    }
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
    await ctx.reply('Произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз позже.');
  }
});

export const POST = webhookCallback(bot, 'std/http');

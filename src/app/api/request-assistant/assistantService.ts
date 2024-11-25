// assistantService.ts

import { PrismaClient } from '@prisma/client';
import {
  getTranslation,
  detectLanguage,
} from './translations';
import {
  sendTelegramMessageToUser,
  sendLogToTelegram,
} from './helpers';

const prisma = new PrismaClient();

export async function handleAssistantRequest(userIdBigInt: bigint) {
  try {
    const lang = detectLanguage();

    await sendLogToTelegram(`Checking user with ID: ${userIdBigInt.toString()}`);

    const userExists = await prisma.user.findUnique({
      where: { telegramId: userIdBigInt },
    });

    if (!userExists) {
      await sendLogToTelegram(`User with ID ${userIdBigInt.toString()} not found`);
      return {
        error: getTranslation(lang, 'userNotFound'),
        status: 404,
      };
    }

    const existingActiveRequest = await prisma.assistantRequest.findFirst({
      where: { userId: userIdBigInt, isActive: true },
    });

    if (existingActiveRequest) {
      await sendLogToTelegram(`User ${userIdBigInt.toString()} already has an active request`);
      await sendTelegramMessageToUser(
        userIdBigInt.toString(),
        getTranslation(lang, 'existingActiveRequest')
      );
      return {
        message: getTranslation(lang, 'existingActiveRequest'),
        status: 200,
      };
    }

    // Check remaining assistant requests (existing logic)
    const now = new Date();

    const totalRemainingAssistantRequestsResult = await prisma.userTariff.aggregate({
      _sum: {
        remainingAssistantRequests: true,
      },
      where: {
        userId: userIdBigInt,
        expirationDate: {
          gte: now,
        },
      },
    });

    const totalRemainingAssistantRequests =
      totalRemainingAssistantRequestsResult._sum.remainingAssistantRequests || 0;

    if (totalRemainingAssistantRequests <= 0) {
      await sendLogToTelegram(`Not enough requests for user ${userIdBigInt.toString()}`);
      return {
        error: getTranslation(lang, 'notEnoughRequests'),
        status: 400,
      };
    }

    const userTariff = await prisma.userTariff.findFirst({
      where: {
        userId: userIdBigInt,
        remainingAssistantRequests: {
          gt: 0,
        },
        expirationDate: {
          gte: now,
        },
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });

    if (!userTariff) {
      await sendLogToTelegram(`Not enough requests for user ${userIdBigInt.toString()}`);
      return {
        error: getTranslation(lang, 'notEnoughRequests'),
        status: 400,
      };
    }

    // Decrement remaining requests
    await prisma.userTariff.update({
      where: {
        id: userTariff.id,
      },
      data: {
        remainingAssistantRequests: {
          decrement: 1,
        },
      },
    });

    await sendLogToTelegram(
      `Decremented requests in tariff ID ${userTariff.id.toString()} for user ${userIdBigInt.toString()} by 1`
    );

    // Create a new AssistantRequest without assigning an assistant yet
    const assistantRequest = await prisma.assistantRequest.create({
      data: {
        userId: userIdBigInt,
        assistantId: null,
        message: '',
        status: 'PENDING',
        isActive: true,
        ignoredAssistants: [],
        subject: null, // Subject is null initially
      },
    });

    // Set the user's state to indicate they're expected to provide the subject
    await prisma.user.update({
      where: { telegramId: userIdBigInt },
      data: { isWaitingForSubject: true },
    });

    // Prompt the user to enter the subject
    await sendTelegramMessageToUser(
      userIdBigInt.toString(),
      getTranslation(lang, 'enterSubject')
    );

    await sendLogToTelegram(`Prompted user ${userIdBigInt.toString()} to enter subject`);

    return {
      message: 'Request initiated. Waiting for subject.',
      status: 200,
    };
  } catch (error) {
    console.error('Error:', error);
    await sendLogToTelegram(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    return {
      error: getTranslation(detectLanguage(), 'serverError'),
      status: 500,
    };
  }
}

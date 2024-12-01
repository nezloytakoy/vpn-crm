import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function addIgnoreAction(assistantId: bigint, requestId: bigint) {
    console.log(
        `addIgnoreAction: Ассистент ID: ${assistantId.toString()} игнорировал запрос ID: ${requestId.toString()}`
    );
    await prisma.requestAction.create({
        data: {
            assistantId: assistantId,
            requestId: requestId,
            action: 'IGNORED',
        },
    });
}

export async function countIgnoredActionsInLast24Hours(assistantId: bigint) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    console.log(`Подсчет игнорирований с ${oneDayAgo.toISOString()}`);

    const ignoredCount = await prisma.requestAction.count({
        where: {
            assistantId: assistantId,
            action: 'IGNORED',
            createdAt: {
                gte: oneDayAgo,
            },
        },
    });

    console.log(
        `Ассистент ID: ${assistantId.toString()} игнорировал ${ignoredCount} запросов за последние 24 часа`
    );
    return ignoredCount;
}
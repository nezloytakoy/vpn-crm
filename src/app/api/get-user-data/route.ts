import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

export const revalidate = 1;
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    console.log('Маршрут /api/get-user-data был вызван');

    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get('userId');

    if (!userIdParam) {
        console.error('userId не предоставлен');
        return NextResponse.json({ error: 'userId не предоставлен' }, { status: 400 });
    }

    let userId: bigint;
    try {
        userId = BigInt(userIdParam);
    } catch (error) {
        console.error('Некорректный userId:', userIdParam, error);
        return NextResponse.json({ error: 'Некорректный userId' }, { status: 400 });
    }

    try {
        const now = new Date();
        const oneDayAgo = subDays(now, 1);
        const oneWeekAgo = subDays(now, 7);
        const oneMonthAgo = subDays(now, 30);

        // Запрашиваем все нужные данные параллельно
        const [
            requestsToday,
            requestsThisWeek,
            requestsThisMonth,
            totalRequests,
            totalCoins,
            aiRequestCount,
            assistantRequestCount, // если хотите
            userRequests,
            userComplaints,
            userReferrals,
            userInfo,
        ] = await Promise.all([
            prisma.assistantRequest.count({
                where: { userId, createdAt: { gte: oneDayAgo } },
            }),
            prisma.assistantRequest.count({
                where: { userId, createdAt: { gte: oneWeekAgo } },
            }),
            prisma.assistantRequest.count({
                where: { userId, createdAt: { gte: oneMonthAgo } },
            }),
            prisma.assistantRequest.count({
                where: { userId },
            }),
            prisma.user.findUnique({
                where: { telegramId: userId },
                select: { coins: true },
            }),
            prisma.user.findUnique({
                where: { telegramId: userId },
                select: { usedAIRequests: true },
            }),
            prisma.user.findUnique({
                where: { telegramId: userId },
                select: { assistantRequests: true },
            }),
            prisma.assistantRequest.findMany({
                where: { userId },
                select: {
                    id: true,
                    status: true,
                    assistantId: true,
                    conversation: {
                        select: { messages: true },
                    },
                },
            }),

            // === Изменяем здесь: возвращаем только PENDING ===
            prisma.complaint.findMany({
                where: { userId, status: 'PENDING' }, // <-- условие status
                select: {
                    id: true,
                    status: true,
                    decision: true,
                    text: true,
                    assistantId: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),

            prisma.referral.findMany({
                where: { userId: userId },
                select: {
                    referredUser: {
                        select: {
                            telegramId: true,
                            username: true,
                            hasUpdatedSubscription: true,
                            referralCount: true,
                        },
                    },
                },
            }),
            prisma.user.findUnique({
                where: { telegramId: userId },
                select: { username: true },
            }),
        ]);

        console.log('Всего запросов:', totalRequests);
        console.log('assistantRequestCount:', assistantRequestCount);

        // Формируем complaints
        const formattedComplaints = await Promise.all(
            userComplaints.map(async (complaint) => {
                const relatedRequest = await prisma.assistantRequest.findUnique({
                    where: { id: complaint.id },
                    select: {
                        conversation: {
                            select: { messages: true },
                        },
                    },
                });

                console.log('Сообщения, связанные с жалобой', complaint.id, relatedRequest?.conversation?.messages);

                return {
                    complaintId: complaint.id.toString(),
                    // Если нужно показать, что это "Рассматривается" — можно выводить строку, или берём complaint.status
                    status: complaint.status === 'PENDING' ? 'Рассматривается' : complaint.decision,
                    assistantId: complaint.assistantId ? complaint.assistantId.toString() : '-',
                    messages: relatedRequest?.conversation?.messages || [],
                };
            }),
        );

        // Формируем userRequests
        const formattedUserRequests = userRequests.map((request) => ({
            requestId: request.id.toString(),
            status: request.status,
            assistantId: request.assistantId ? request.assistantId.toString() : '-',
            messages: request.conversation?.messages || [],
        }));

        // Формируем referrals
        const formattedReferrals = userReferrals.map((referral) => ({
            telegramId: referral.referredUser?.telegramId.toString() || '',
            username: referral.referredUser?.username || 'Отсутствует',
            hasUpdatedSubscription: referral.referredUser?.hasUpdatedSubscription || false,
            referralCount: referral.referredUser?.referralCount || 0,
        }));

        // Возвращаем собранный объект
        return NextResponse.json({
            userId: userId.toString(),
            username: userInfo?.username || 'N/A',
            requestsToday,
            requestsThisWeek,
            requestsThisMonth,
            totalCoins: totalCoins?.coins || 0,
            aiRequestCount: aiRequestCount?.usedAIRequests || 0,
            assistantRequestCount: totalRequests, // или assistantRequestCount?.assistantRequests
            userRequests: formattedUserRequests,
            complaints: formattedComplaints, // только PENDING
            referrals: formattedReferrals,
        });
    } catch (error) {
        console.log(error);
        console.error('Ошибка при получении данных пользователя:', error);
        return NextResponse.json(
            { error: 'Произошла ошибка при обработке запроса' },
            { status: 500 },
        );
    }
}

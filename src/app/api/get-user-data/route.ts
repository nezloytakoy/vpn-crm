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
        console.log(error)
        console.error('Некорректный userId:', userIdParam);
        return NextResponse.json({ error: 'Некорректный userId' }, { status: 400 });
    }

    try {
        const now = new Date();
        const oneDayAgo = subDays(now, 1);
        const oneWeekAgo = subDays(now, 7);
        const oneMonthAgo = subDays(now, 30);

        const [
            requestsToday,
            requestsThisWeek,
            requestsThisMonth,
            totalRequests, 
            totalCoins,
            aiRequestCount,
            assistantRequestCount,
            userRequests,
            userComplaints,
            userReferrals,
            userInfo
        ] = await Promise.all([
            prisma.assistantRequest.count({
                where: { userId, createdAt: { gte: oneDayAgo } }
            }),
            prisma.assistantRequest.count({
                where: { userId, createdAt: { gte: oneWeekAgo } }
            }),
            prisma.assistantRequest.count({
                where: { userId, createdAt: { gte: oneMonthAgo } }
            }),
            prisma.assistantRequest.count({ 
                where: { userId }
            }),
            prisma.user.findUnique({
                where: { telegramId: userId },
                select: { coins: true }
            }),
            prisma.user.findUnique({
                where: { telegramId: userId },
                select: { usedAIRequests: true }
            }),
            prisma.user.findUnique({
                where: { telegramId: userId },
                select: { assistantRequests: true }
            }),
            prisma.assistantRequest.findMany({
                where: { userId },
                select: {
                    id: true,
                    status: true,
                    assistantId: true,
                    conversation: {
                        select: { messages: true }
                    }
                }
            }),
            prisma.complaint.findMany({
                where: { userId },
                select: {
                    id: true,
                    status: true,
                    decision: true,
                    text: true,
                    assistantId: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.referral.findMany({
                where: { userId: userId },
                select: {
                    referredUser: {
                        select: {
                            telegramId: true,
                            username: true,
                            hasUpdatedSubscription: true,
                            referralCount: true
                        }
                    }
                }
            }),
            prisma.user.findUnique({
                where: { telegramId: userId },
                select: { username: true }
            })
        ]);

        console.log(totalRequests)
        console.log(assistantRequestCount)

        const formattedComplaints = await Promise.all(
            userComplaints.map(async (complaint) => {
                const relatedRequest = await prisma.assistantRequest.findUnique({
                    where: { id: complaint.id },
                    select: {
                        conversation: {
                            select: { messages: true }
                        }
                    }
                });
                
                console.log(relatedRequest?.conversation?.messages)
        
                return {
                    complaintId: complaint.id.toString(),
                    status: complaint.status === 'PENDING' ? 'Рассматривается' : complaint.decision,
                    assistantId: complaint.assistantId ? complaint.assistantId.toString() : '-',
                    messages: relatedRequest?.conversation?.messages || []
                };
            })
        );


        const formattedUserRequests = userRequests.map((request) => ({
            requestId: request.id.toString(),
            status: request.status,
            assistantId: request.assistantId ? request.assistantId.toString() : '-',
            messages: request.conversation?.messages || []
        }));

        const formattedReferrals = userReferrals.map((referral) => ({
            telegramId: referral.referredUser?.telegramId.toString() || '',
            username: referral.referredUser?.username || 'Отсутствует',
            hasUpdatedSubscription: referral.referredUser?.hasUpdatedSubscription || false,
            referralCount: referral.referredUser?.referralCount || 0
        }));

        return NextResponse.json({
            userId: userId.toString(),
            username: userInfo?.username || 'N/A',
            requestsToday,
            requestsThisWeek,
            requestsThisMonth,
            totalCoins: totalCoins?.coins || 0,
            aiRequestCount: aiRequestCount?.usedAIRequests || 0,
            assistantRequestCount: totalRequests,
            userRequests: formattedUserRequests,
            complaints: formattedComplaints,
            referrals: formattedReferrals
        });
    } catch (error) {
        console.log(error)
        console.error('Ошибка при получении данных пользователя:', error);
        return NextResponse.json({ error: 'Произошла ошибка при обработке запроса' }, { status: 500 });
    }
}

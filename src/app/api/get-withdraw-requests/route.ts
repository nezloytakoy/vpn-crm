import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const withdrawRequests = await prisma.withdrawalRequest.findMany({
            where: {
                status: 'Требует рассмотрения', 
            },
            select: {
                id: true,
                userId: true,
                userNickname: true,
                userRole: true,
                status: true,
                amount: true,
            }
        });

        const serializedWithdraws = withdrawRequests.map(withdraw => ({
            id: withdraw.id.toString(),
            userId: withdraw.userId.toString(),
            userNickname: withdraw.userNickname,
            userRole: withdraw.userRole,
            status: withdraw.status,
            amount: withdraw.amount.toString(),
        }));

        return NextResponse.json(serializedWithdraws);

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: 'Ошибка получения данных' }, { status: 500 });
    }
}

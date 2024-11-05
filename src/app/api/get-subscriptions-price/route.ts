import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

export const revalidate = 1;

const prisma = new PrismaClient();

export async function GET() {
    try {
        const prices = await prisma.subscription.findMany({
            select: {
                id: true,
                price: true,
            }
        });

        const serializedPrices = prices.map(price => ({
            id: Number(price.id),
            price: price.price,
        }));

        return NextResponse.json({ serializedPrices });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Не удалось получить цены подписок" }, { status: 500 });
    }
}

import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const subscriptions = await prisma.subscription.findMany({
            select: {
                id: true,
                name: true,
                price: true,
                aiRequestCount: true,
                assistantRequestCount: true,
            },
        });

        const serializedSubscriptions = subscriptions.map((subscription) => ({
            id: subscription.id.toString(),
            name: subscription.name,
            price: subscription.price.toString(),
            aiRequestCount: subscription.aiRequestCount?.toString() || "0",
            assistantRequestCount: subscription.assistantRequestCount?.toString() || "0",
        }));

        return NextResponse.json(serializedSubscriptions);
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return NextResponse.json(
            { error: "Не удалось получить данные" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, price, aiRequestCount } = body;

        if (!name || price === undefined || aiRequestCount === undefined) {
            return NextResponse.json(
                { error: "Название, цена и количество AI запросов обязательны." },
                { status: 400 }
            );
        }

        const newSubscription = await prisma.subscription.create({
            data: {
                name,
                description: description || "", 
                price: parseFloat(price), 
                aiRequestCount: parseInt(aiRequestCount, 10), 
            },
        });

        
        const serializedSubscription = {
            ...newSubscription,
            id: newSubscription.id.toString(),
            price: newSubscription.price.toString(),
        };

        return NextResponse.json(serializedSubscription);
    } catch (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json(
            { error: "Не удалось создать подписку" },
            { status: 500 }
        );
    }
}

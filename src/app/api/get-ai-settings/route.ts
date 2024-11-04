import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET() {
    try {

        const aiSettings = await prisma.openAi.findFirst();

        if (!aiSettings) {
            return NextResponse.json({ error: "Не удалось найти запись" }, { status: 400 })
        }

        const response = {
            maxTokens: aiSettings.maxTokensPerRequest,
            prompt: aiSettings.prompt
        }

        return NextResponse.json({ response })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Ошибка получения настроек ИИ" }, { status: 500 })
    }
}
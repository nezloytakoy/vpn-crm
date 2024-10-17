// import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// const prisma = new PrismaClient()

export async function GET(request: NextRequest) {

    const url = new URL(request.url)

    const assistantId = url.searchParams.get('assistantId')

    if (!assistantId) {
        return NextResponse.json({ error: "Не передан айди ассистента" }, { status: 400 })
    }

    try {

        // const assistant = await prisma.assistant.findUnique({
        //     where: { telegramId: BigInt(assistantId) }
        //     // получить у ассистента: порядковый номер, юзернейм, айди, количество запросов за все время, месяц, неделю, сутки, количество отказов, количество жалоб, количество проигнорированных запросов, среднее время ответа в минутах, количество выходов на линию, средняя продолжительность работы
        // })

        //данные про каждый запрос с логами

        //история транзакций по койнам

        // подопечные ассистента

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Ошибка при получении ассистента" }, { status: 500 })
    }
}
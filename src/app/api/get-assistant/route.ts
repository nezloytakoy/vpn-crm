// import { PrismaClient } from "@prisma/client";
// import { NextRequest, NextResponse } from "next/server";

// const prisma = new PrismaClient()

// export async function GET(request: NextRequest) {

//     const url = new URL(request.url)

//     const assistantId = url.searchParams.get('assistantId')

//     if (!assistantId) {
//         return NextResponse.json({ error: "Не передан айди ассистента" }, { status: 400 })
//     }

//     try {

//         const assistant = await prisma.assistant.findUnique({
//             where: { telegramId: BigInt(assistantId) },
//             select: {
//                 orderNumber: true,
//                 username: true,
//                 telegramId: true,



                
// model Assistant {
//     telegramId      BigInt             @id @unique
//     username               String?
//     role            String             @default("assistant")
//     isWorking       Boolean            @default(false)
//     isBusy          Boolean            @default(false)
//     startedAt       DateTime?
//     joinedAt        DateTime           @default(now())
//     coins           Int                @default(0) // Field for storing coins
//     lastActiveAt    DateTime?          // Field for storing last active time
//     orderNumber     Int?               // Порядковый номер
//     createdAt       DateTime           @default(now())
//     updatedAt       DateTime           @updatedAt
//     requests        AssistantRequest[]
//     arbitrations    Arbitration[]      // Field for the reverse relation
//     conversations   Conversation[]     // Reverse relation to Conversation
//     requestActions  RequestAction[]    // Добавлено поле для обратного отношения к RequestAction
//   }

//             }
//             // получить у ассистента: порядковый номер, юзернейм, айди, количество запросов за все время, месяц, неделю, сутки, количество отказов, количество жалоб, количество проигнорированных запросов, среднее время ответа в минутах, количество выходов на линию, средняя продолжительность работы
//         })

//         //данные про каждый запрос с логами

//         //история транзакций по койнам

//         // подопечные ассистента

//     } catch (error) {
//         console.log(error)
//         return NextResponse.json({ error: "Ошибка при получении ассистента" }, { status: 500 })
//     }
// }
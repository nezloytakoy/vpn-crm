import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export async function GET() {
    try {

        const minutes = await prisma.requestDuration.findFirst();

        if (!minutes) {
            return NextResponse.json({ error: "Не удалось получить запись" }, { status: 400 })
        };

        const response = {
            minutes: minutes.minutes
        };

        return NextResponse.json({ response })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Не удалось получить длительность" }, { status: 500 })
    }
}
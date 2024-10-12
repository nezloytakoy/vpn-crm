import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const tariffsData = prisma.tariff.findMany({
            select: {
                id: true,
                name: true,
                price: true
            }
        })

        const serializedTariffs = (await tariffsData).map(tarrif => ({
            id: tarrif.id.toString(),
            name: tarrif.name,
            price: tarrif.price.toString()
        }))

        return NextResponse.json(serializedTariffs);
    } catch (error) {
        console.log(error)
        return NextResponse.json({error: "Не удалось получить данные"}, {status: 500})
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, price } = body;

        const newTariff = await prisma.tariff.create({
            data: {
                name,
                description,
                price
            }
        });

        return NextResponse.json(newTariff);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Не удалось создать тариф' }, { status: 500 });
    }
}
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const moderators = await prisma.moderator.findMany({
            select: {
                id: true,
                username: true,
                lastActiveAt: true,
                userMessagesCount: true,
                assistantMessagesCount: true,
                reviewedComplaintsCount: true,
            },
        });

        
        const formattedModerators = moderators.map((moderator) => ({
            ...moderator,
            id: moderator.id.toString(), 
        }));

        return NextResponse.json(formattedModerators);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}

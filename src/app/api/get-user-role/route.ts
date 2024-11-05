import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { id } = await request.json();
        console.log("Полученное айди", id)

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        
        const moderator = await prisma.moderator.findUnique({
            where: { id: BigInt(id) },
            select: { login: true }
        });

        let user;

        if (moderator) {
            
            user = {
                login: moderator.login,
                role: 'Модератор'
            };
        } else {
            
            const admin = await prisma.admin.findUnique({
                where: { id: BigInt(id) },
                select: { email: true }
            });

            if (admin) {
                
                user = {
                    login: admin.email,
                    role: 'Администратор'
                };
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error('Error fetching user role:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

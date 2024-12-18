import { PrismaClient } from '@prisma/client';
import { Context } from 'grammy';
import { getTranslation } from './localization';
import { Invitation } from '@prisma/client';

const prisma = new PrismaClient();

export async function updateModeratorInfo(userId: number, username: string) {
    const moderatorId = BigInt(userId);
    const newUsername = username || "Отсутствует";

    const moderator = await prisma.moderator.findUnique({
        where: { id: moderatorId },
    });

    if (moderator) {
        if (moderator.username !== newUsername) {
            await prisma.moderator.update({
                where: { id: moderatorId },
                data: {
                    lastActiveAt: new Date(),
                    username: newUsername
                },
            });
            console.log(`Username модератора с ID ${moderatorId} обновлен на ${newUsername}`);
        } else {
            await prisma.moderator.update({
                where: { id: moderatorId },
                data: { lastActiveAt: new Date() },
            });
        }
    } else {
        console.log(`Модератор с ID ${moderatorId} не найден`);
    }
}

export async function handleInvitation(
    userId: number,
    inviteToken: string,

) {
    const prisma = new PrismaClient();
    const moderatorId = BigInt(userId);

    const invitation = await prisma.invitation.findFirst({
        where: {
            token: inviteToken,
            used: false,
            role: 'moderator',
        },
    });

    return { invitation, moderatorId };
}

export async function processModeratorInvitation(
    invitation: Invitation | null,
    moderatorId: bigint,
    username: string,
    lang: 'ru' | 'en',
    showModeratorMenu: (ctx: Context, lang: 'ru' | 'en') => Promise<void>,
    ctx: Context
) {
    const prisma = new PrismaClient();

    if (!invitation) {
        // Обрабатываем случай, когда приглашения нет
        // Например, можно вернуть или выдать ошибку
        return;
    }


    if (!invitation.login || !invitation.password) {
        await ctx.reply(getTranslation(lang, 'login_password_missing'));
        return;
    }

    const existingModerator = await prisma.moderator.findUnique({
        where: { id: moderatorId },
    });

    if (existingModerator) {
        await prisma.moderator.update({
            where: { id: moderatorId },
            data: { username },
        });

        await ctx.reply(getTranslation(lang, 'already_moderator'));
        await showModeratorMenu(ctx, lang);
    } else {
        await prisma.moderator.create({
            data: {
                login: invitation.login,
                password: invitation.password,
                id: moderatorId,
                username
            },
        });

        await prisma.invitation.update({
            where: { id: invitation.id },
            data: { used: true },
        });

        await ctx.reply(getTranslation(lang, 'welcome'));
        await showModeratorMenu(ctx, lang);
    }
}

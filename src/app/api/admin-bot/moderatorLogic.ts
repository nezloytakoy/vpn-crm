import { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { getTranslation } from './localization';

export const moderatorState: { [moderatorId: number]: { state: string, targetId?: string } } = {};

export async function showModeratorMenu(ctx: Context, lang: 'ru' | 'en') {
  const keyboard = new InlineKeyboard()
    .text('💬 ' + getTranslation(lang, 'message_user'), 'message_user')
    .row()
    .text('👨‍💻 ' + getTranslation(lang, 'message_assistant'), 'message_assistant');

  await ctx.reply(getTranslation(lang, 'menu'), { reply_markup: keyboard });
}

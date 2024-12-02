import {
  closeOldAIChats,
  closeOldConversations,
  processPendingRequests,
} from './conversationHandlers';

import {checkActiveConversations} from './conversationUtils'

export const revalidate = 1;


export async function GET() {
  console.log('GET-запрос получен, перенаправляем в POST...');
  return await POST();
}

export async function POST() {
  try {
    console.log('--- Начало выполнения POST ---');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    console.log(`Время для сравнения: ${oneHourAgo.toISOString()}`);

    await closeOldAIChats(oneHourAgo);

    await closeOldConversations(oneHourAgo);

    await checkActiveConversations();

    await processPendingRequests();

    console.log('--- Завершение выполнения POST ---');
    return new Response(JSON.stringify({ message: 'Диалоги обновлены и запросы обработаны.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ошибка при обработке:', error);
    return new Response(JSON.stringify({ error: 'Ошибка на сервере' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
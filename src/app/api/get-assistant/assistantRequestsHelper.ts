import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAssistantRequests(assistantBigInt: bigint) {
  // Шаг 1: Получаем RequestAction для ассистента и создаем карту requestId -> action
  console.log('Получаем RequestAction для ассистента');
  const requestActions = await prisma.requestAction.findMany({
    where: { assistantId: assistantBigInt },
    select: {
      requestId: true,
      action: true,
      createdAt: true,
    },
  });
  console.log('Полученные RequestAction:', requestActions);

  const requestActionMap = new Map<string, string>(); // Map from requestId to action

  requestActions.forEach((ra) => {
    requestActionMap.set(ra.requestId.toString(), ra.action);
  });

  const requestActionRequestIds = Array.from(requestActionMap.keys());
  console.log('Уникальные requestIds из RequestAction:', requestActionRequestIds);

  // Шаг 2: Получаем AssistantRequest по requestIds из RequestAction
  console.log('Получаем AssistantRequest из RequestAction');
  const assistantRequestsFromActions = await prisma.assistantRequest.findMany({
    where: {
      id: { in: requestActionRequestIds.map((id) => BigInt(id)) },
    },
    select: {
      id: true,
      status: true,
      userId: true,
      assistantId: true,
      createdAt: true,
      conversation: {
        select: {
          messages: true,
        },
      },
    },
  });
  console.log('Полученные AssistantRequest из RequestAction:', assistantRequestsFromActions);

  // Шаг 3: Получаем AssistantRequest, где assistantId равен ID ассистента
  console.log('Получаем AssistantRequest для ассистента');
  const assistantRequests = await prisma.assistantRequest.findMany({
    where: { assistantId: assistantBigInt },
    select: {
      id: true,
      status: true,
      userId: true,
      assistantId: true,
      createdAt: true,
      conversation: {
        select: {
          messages: true,
        },
      },
    },
  });
  console.log('Полученные AssistantRequest:', assistantRequests);

  // Шаг 4: Объединяем запросы и обновляем статусы на основе действий ассистента
  const allAssistantRequestsMap = new Map<string, any>();

  // Добавляем assistantRequests сначала
  assistantRequests.forEach((req) => {
    const requestIdStr = req.id.toString();
    allAssistantRequestsMap.set(requestIdStr, req);
  });

  // Затем обновляем или добавляем запросы из assistantRequestsFromActions с учетом действий
  assistantRequestsFromActions.forEach((req) => {
    const requestIdStr = req.id.toString();
    const action = requestActionMap.get(requestIdStr);

    // Проверяем, есть ли запрос уже в карте
    if (allAssistantRequestsMap.has(requestIdStr)) {
      const existingReq = allAssistantRequestsMap.get(requestIdStr);

      // Если статус НЕ 'COMPLETED', обновляем статус на action
      if (existingReq.status !== 'COMPLETED') {
        allAssistantRequestsMap.set(requestIdStr, {
          ...existingReq,
          status: action || existingReq.status,
        });
      }
      // Если статус 'COMPLETED', не меняем его
    } else {
      // Если запрос не в карте, добавляем его
      allAssistantRequestsMap.set(requestIdStr, {
        ...req,
        status: action || req.status,
      });
    }
  });

  const combinedAssistantRequests = Array.from(allAssistantRequestsMap.values());
  console.log('Объединенный список AssistantRequest:', combinedAssistantRequests);

  // Шаг 5: Сортируем объединенный список по id в порядке возрастания
  combinedAssistantRequests.sort((a, b) =>
    Number(BigInt(a.id.toString()) - BigInt(b.id.toString()))
  );

  // Сериализуем данные для отправки в ответе
  const serializedAssistantRequests = combinedAssistantRequests.map((request) => ({
    id: request.id.toString(),
    status: request.status,
    userId: request.userId.toString(),
    assistantId: request.assistantId ? request.assistantId.toString() : null,
    createdAt: request.createdAt.toISOString(),
    messages: request.conversation?.messages || [],
  }));
  console.log('Сериализованный список AssistantRequest для ответа:', serializedAssistantRequests);

  return serializedAssistantRequests;
}

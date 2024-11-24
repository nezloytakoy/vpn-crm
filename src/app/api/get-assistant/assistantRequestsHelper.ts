import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface Message {
    sender: 'USER' | 'ASSISTANT';
    message: string;
    timestamp: string;
}

interface AssistantRequest {
    id: bigint;
    status: string;
    userId: bigint;
    assistantId: bigint | null;
    createdAt: Date;
    conversation: {
        messages: Message[];
    } | null;
}

interface SerializedAssistantRequest {
    id: string;
    status: string;
    userId: string;
    assistantId: string | null;
    createdAt: string;
    messages: Message[];
}

export async function getAssistantRequests(assistantBigInt: bigint): Promise<SerializedAssistantRequest[]> {
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

    const requestActionMap = new Map<string, string>();

    requestActions.forEach((ra) => {
        requestActionMap.set(ra.requestId.toString(), ra.action);
    });

    const requestActionRequestIds = Array.from(requestActionMap.keys());
    console.log('Уникальные requestIds из RequestAction:', requestActionRequestIds);

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

    const allAssistantRequestsMap = new Map<string, AssistantRequest>();

    const parseMessages = (messages: Prisma.JsonValue | null): Message[] => {
        if (!messages || !Array.isArray(messages)) {
            return [];
        }

        return messages
            .map((msg): Message | null => {
                if (
                    typeof msg === 'object' &&
                    msg !== null &&
                    'sender' in msg &&
                    'message' in msg &&
                    'timestamp' in msg &&
                    typeof (msg as { sender: unknown }).sender === 'string' &&
                    typeof (msg as { message: unknown }).message === 'string' &&
                    typeof (msg as { timestamp: unknown }).timestamp === 'string'
                ) {
                    return {
                        sender: (msg as { sender: string }).sender as 'USER' | 'ASSISTANT',
                        message: (msg as { message: string }).message,
                        timestamp: (msg as { timestamp: string }).timestamp,
                    };
                }
                return null;
            })
            .filter((msg): msg is Message => msg !== null);
    };

    assistantRequests.forEach((req) => {
        const requestIdStr = req.id.toString();
        allAssistantRequestsMap.set(requestIdStr, {
            ...req,
            conversation: req.conversation
                ? {
                    messages: parseMessages(req.conversation.messages),
                }
                : null,
        });
    });

    assistantRequestsFromActions.forEach((req) => {
        const requestIdStr = req.id.toString();
        const action = requestActionMap.get(requestIdStr);

        if (allAssistantRequestsMap.has(requestIdStr)) {
            const existingReq = allAssistantRequestsMap.get(requestIdStr);

            if (existingReq && existingReq.status !== 'COMPLETED') {
                allAssistantRequestsMap.set(requestIdStr, {
                    ...existingReq,
                    status: action || existingReq.status,
                });
            }
        } else {
            allAssistantRequestsMap.set(requestIdStr, {
                ...req,
                status: action || req.status,
                conversation: req.conversation
                    ? {
                        messages: parseMessages(req.conversation.messages),
                    }
                    : null,
            });
        }
    });

    const combinedAssistantRequests = Array.from(allAssistantRequestsMap.values());

    combinedAssistantRequests.sort((a, b) =>
        Number(BigInt(a.id.toString()) - BigInt(b.id.toString()))
    );

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

// index.ts

import { getTranslation, detectLanguage } from './translations';
import { handleAssistantRequest } from './assistantService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    const lang = detectLanguage();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: getTranslation(lang, 'userIdRequired') }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userIdBigInt = BigInt(userId);

    const result = await handleAssistantRequest(userIdBigInt);

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: result.message }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: getTranslation(detectLanguage(), 'serverError') }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

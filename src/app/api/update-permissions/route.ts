import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const permissions = await request.json();

    
    for (const { name, allowVoiceToAI, allowVoiceToAssistant, allowVideoToAssistant, allowFilesToAssistant } of permissions) {
      await prisma.subscription.updateMany({
        where: { name },
        data: {
          allowVoiceToAI,
          allowVoiceToAssistant,
          allowVideoToAssistant,
          allowFilesToAssistant,
        },
      });
    }

    return NextResponse.json({ message: 'Permissions updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}

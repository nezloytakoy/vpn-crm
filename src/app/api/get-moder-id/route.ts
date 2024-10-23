import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export const revalidate = 1;

export async function GET() {
  try {
    const cookie = cookies().get('Authorization');

    if (!cookie) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const jwt = cookie.value;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    // Верификация токена JWT
    const { payload } = await jose.jwtVerify(jwt, secret);

    // Извлечение userId из sub (subject)
    const userId = payload.sub;
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { userId },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying JWT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

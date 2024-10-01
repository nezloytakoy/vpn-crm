import { cookies } from "next/headers";
import { NextResponse } from "next/server"
import { NextRequest } from "next/server";
import * as jose from "jose";

export async function middleware(request: NextRequest) {
    // Check for cookie
    const cookie = cookies().get('Authorization');
    if (!cookie) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Validate the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const jwt = cookie.value;

    try {
        const { payload } = await jose.jwtVerify(jwt, secret, {});
        console.log(payload); // Логирование полезной нагрузки
    } catch (err) {
        console.error('JWT verification failed:', err); // Логируем ошибку
        return NextResponse.redirect(new URL("/login", request.url));
    }
}


// See "Matching Paths" below to learn more
export const config = {
    matcher: "/admin/:path*",
}

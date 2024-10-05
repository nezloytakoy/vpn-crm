import { cookies } from "next/headers";
import { NextResponse } from "next/server"
import { NextRequest } from "next/server";
import * as jose from "jose";

export async function middleware(request: NextRequest) {
    
    const cookie = cookies().get('Authorization');
    if (!cookie) {
        return NextResponse.redirect(new URL("/admin-login", request.url));
    }

   
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const jwt = cookie.value;

    try {
        const { payload } = await jose.jwtVerify(jwt, secret, {});
        console.log(payload);
    } catch (err) {
        console.error('JWT verification failed:', err);
        return NextResponse.redirect(new URL("/admin-login", request.url));
    }
}



export const config = {
    matcher: "/admin/:path*",
}

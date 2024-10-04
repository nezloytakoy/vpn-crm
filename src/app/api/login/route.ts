import validatePassword from "@/helpers/validatePassword";
import validateEmail from "@/helpers/validateEmail";
import prisma from "../../../../lib/server/prisma";
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

export async function POST(request: Request) {
 
  const body = await request.json();
  const { email, password } = body;

 
  if (!validateEmail(email)) {
    return new Response(
      JSON.stringify({
        error: "Invalid email format",
      }),
      { status: 400 }
    );
  }

  if (!validatePassword(password)) {
    return new Response(
      JSON.stringify({
        error: "Invalid password format",
      }),
      { status: 400 }
    );
  }

  
  const user = await prisma.admin.findFirst({
    where: {
      email,
    },
  });

  if (!user) {
    return new Response(
      JSON.stringify({
        error: "Invalid email or password",
      }),
      { status: 400 }
    );
  }


  const isCorrectPassword = bcrypt.compareSync(password, user.password);

  if (!isCorrectPassword) {
    return new Response(
      JSON.stringify({
        error: "Invalid email or password",
      }),
      { status: 400 }
    );
  }


  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined");
    return new Response(
      JSON.stringify({
        error: "Server error",
      }),
      { status: 500 }
    );
  }

  
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const alg = "HS256";

  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg })
    .setExpirationTime("72h")
    .setSubject(user.id.toString())
    .sign(secret);


  return new Response(JSON.stringify({ token: jwt }), { status: 200 });
}

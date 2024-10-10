import prisma from "../../../../lib/server/prisma";
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  // Поиск пользователя среди администраторов
  const admin = await prisma.admin.findFirst({
    where: {
      email,
    },
  });

  // Поиск пользователя среди модераторов
  const moderator = await prisma.moderator.findFirst({
    where: {
      login: email,
    },
  });

  // Проверка пароля для администратора или модератора
  const user = admin || moderator;
  let isCorrectPassword = false;

  if (admin) {
    isCorrectPassword = bcrypt.compareSync(password, admin.password);
  } else if (moderator) {
    isCorrectPassword = bcrypt.compareSync(password, moderator.password);
  }

  // Если ни пользователь не найден, ни пароль не совпал
  if (!user || !isCorrectPassword) {
    return new Response(
      JSON.stringify({
        error: "Invalid email or password",
      }),
      { status: 400 }
    );
  }

  // Проверяем наличие JWT секретного ключа
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined");
    return new Response(
      JSON.stringify({
        error: "Server error",
      }),
      { status: 500 }
    );
  }

  // Генерация JWT токена
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const alg = "HS256";

  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg })
    .setExpirationTime("72h")
    .setSubject(user.id.toString()) // Теперь проверка на наличие user гарантирует, что id будет существовать
    .sign(secret);

  return new Response(JSON.stringify({ token: jwt }), { status: 200 });
}

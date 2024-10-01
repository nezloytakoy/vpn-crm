"use server";

import { cookies } from "next/headers";

export default async function loginAction(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${process.env.ROOT_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();

  if (res.ok) {
    // Устанавливаем токен в cookie
    cookies().set("Authorization", json.token, {
      secure: true,
      httpOnly: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000 * 3), // 3 дня
      path: "/",
      sameSite: "strict",
    });

    // Редирект на защищённую страницу
    return null;
  } else {
    return json.error || "Произошла ошибка авторизации";
  }
}

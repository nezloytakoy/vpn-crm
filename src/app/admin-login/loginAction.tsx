"use server";

import { cookies } from "next/headers";

export default async function loginAction(
  email: string,
  password: string,
  isChecked: boolean // <-- добавляем
): Promise<string | null> {
  const res = await fetch(`${process.env.ROOT_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();

  if (res.ok) {
    // Срок жизни токена:
    //  - 7 дней, если isChecked = true,
    //  - 3 часа, если false
    const maxAge = isChecked ? 7 * 24 : 3;
    // Конвертируем в миллисекунды
    const expires = new Date(Date.now() + maxAge * 60 * 60 * 1000);

    // Сохраняем токен в куки
    cookies().set("Authorization", json.token, {
      secure: true,
      httpOnly: true,
      expires: expires,
      path: "/",
      sameSite: "strict",
    });

    return null; // Значит всё ОК
  } else {
    return json.error || "Произошла ошибка авторизации";
  }
}

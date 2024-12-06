"use client";

import { useState } from "react";

export function useUserRole() {
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchUserRole = async (telegramId: string) => {
    try {
      const response = await fetch("/api/get-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ telegramId }),
      });

      if (!response.ok) {
        throw new Error("Не удалось получить роль пользователя");
      }

      const result = await response.json();
      setUserRole(result.role);
    } catch (error) {
      console.error("Ошибка при получении роли пользователя:", error);
    }
  };

  return { userRole, fetchUserRole };
}

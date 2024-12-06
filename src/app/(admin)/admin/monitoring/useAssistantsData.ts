"use client";

import { useState, useEffect, useCallback } from "react";

export interface RegularAssistantData {
    telegramId: string;
    nick: string;
    averageResponseTime: number;
    completed: number;
    denied: number;
    current: number;
    complaints: number;
    status: string;
    message: string;
  }
  

export function useAssistantsData() {
  const [assistantsData, setAssistantsData] = useState<RegularAssistantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssistantsData = useCallback(async () => {
    try {
      const response = await fetch("/api/assistants-data", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка загрузки данных с сервера");
      }

      const data = await response.json();
      setAssistantsData(data);
    } catch (error) {
      console.error("Ошибка при получении данных ассистентов:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Первичная загрузка данных
    fetchAssistantsData();

    // Установка интервала для обновления данных каждые 5 секунд
    const intervalId = setInterval(() => {
      fetchAssistantsData();
    }, 5000);

    // Очистка интервала при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [fetchAssistantsData]);

  return { assistantsData, isLoading };
}

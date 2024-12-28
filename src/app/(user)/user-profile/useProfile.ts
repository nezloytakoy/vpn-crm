"use client";

import { useEffect, useState } from 'react';
import i18n from '../../../i18n';
import { sendLogToTelegram } from './utils';

/** Интерфейс того, что возвращает наш хук */
interface UseProfileResult {
  telegramUsername: string;
  fontSize: string;
  assistantRequests: number | null;
  telegramId: number | null; // <-- Добавим, чтобы компонент мог сам вызвать get-avatar
}

/**
 * Хук возвращает базовые данные из Telegram WebApp
 * и число запросов к ассистенту, без аватарки.
 */
export function useProfile(): UseProfileResult {
  const [telegramUsername, setTelegramUsername] = useState('');
  const [fontSize, setFontSize] = useState('24px');
  const [assistantRequests, setAssistantRequests] = useState<number | null>(null);
  const [telegramId, setTelegramId] = useState<number | null>(null);

  useEffect(() => {
    // 1. Определяем язык из Telegram WebApp (или ставим 'en' по умолчанию)
    const userLang = window?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code || 'en';
    if (userLang === 'ru') {
      i18n.changeLanguage('ru');
    } else {
      i18n.changeLanguage('en');
    }

    // 2. Извлекаем базовые данные из Telegram WebApp
    const username = window?.Telegram?.WebApp?.initDataUnsafe?.user?.username;
    const firstName = window?.Telegram?.WebApp?.initDataUnsafe?.user?.first_name;
    const lastName = window?.Telegram?.WebApp?.initDataUnsafe?.user?.last_name;
    const id = window?.Telegram?.WebApp?.initDataUnsafe?.user?.id; // telegramId

    // Формируем отображаемое имя
    const displayName = username
      ? `@${username}`
      : `${firstName || ''} ${lastName || ''}`.trim();

    setTelegramUsername(displayName || 'Guest');

    // Запоминаем telegramId
    if (id) {
      setTelegramId(id);
    }

    // Автоматически подбираем размер шрифта для имени
    if (displayName.length > 12) {
      setFontSize('19px');
    } else if (displayName.length > 8) {
      setFontSize('21px');
    } else {
      setFontSize('25px');
    }

    // Логи
    sendLogToTelegram(`(useProfile) Detected language: ${userLang}`);
    sendLogToTelegram(`(useProfile) Username: ${displayName}`);

    /**
     * Функция для загрузки числа запросов к ассистенту
     */
    const fetchUserData = async () => {
      if (!id) {
        const errorMsg = '(useProfile) Telegram ID не найден';
        console.error(errorMsg);
        sendLogToTelegram(errorMsg);
        return;
      }

      try {
        // Получаем кол-во запросов к ассистенту
        const requestsResponse = await fetch(`/api/get-requests?telegramId=${id}`);
        if (!requestsResponse.ok) {
          throw new Error(`Ошибка при получении запросов. Статус: ${requestsResponse.status}`);
        }
        const requestsData = await requestsResponse.json();

        console.log('(useProfile) requestsData =>', requestsData);
        sendLogToTelegram(`(useProfile) Got requestsData: ${JSON.stringify(requestsData)}`);

        // Устанавливаем кол-во запросов ассистенту
        if (typeof requestsData.assistantRequests === 'number') {
          setAssistantRequests(requestsData.assistantRequests);
        } else {
          setAssistantRequests(0);
        }
      } catch (error: unknown) {
        const errMsg = `Ошибка при загрузке данных запросов: ${(error as Error).message}`;
        console.error(errMsg);
        sendLogToTelegram(`(useProfile) ${errMsg}`);
      }
    };

    fetchUserData();
  }, []);

  return {
    telegramUsername,
    fontSize,
    assistantRequests,
    telegramId,
  };
}

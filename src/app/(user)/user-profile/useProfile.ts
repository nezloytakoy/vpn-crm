"use client";
import { useEffect, useState } from 'react';
import i18n from '../../../i18n';
import { sendLogToTelegram } from './utils';

/** Интерфейс того, что возвращает наш хук */
interface UseProfileResult {
    telegramUsername: string;
    fontSize: string;
    avatarUrl: string | null;
    assistantRequests: number | null;
}

export function useProfile(): UseProfileResult {


    const [telegramUsername, setTelegramUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [fontSize, setFontSize] = useState('24px');
    const [assistantRequests, setAssistantRequests] = useState<number | null>(null);

    // Ссылка на аватар по умолчанию
    const defaultAvatarUrl =
        'https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg';

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
        const telegramId = window?.Telegram?.WebApp?.initDataUnsafe?.user?.id;

        const displayName = username
            ? `@${username}`
            : `${firstName || ''} ${lastName || ''}`.trim();

        setTelegramUsername(displayName || 'Guest');

        // Автоматически подбираем размер шрифта для имени
        if (displayName.length > 12) {
            setFontSize('19px');
        } else if (displayName.length > 8) {
            setFontSize('21px');
        } else {
            setFontSize('25px');
        }

        sendLogToTelegram(`Detected language: ${userLang}`);
        sendLogToTelegram(`Username: ${displayName}`);

        /**
         * Основная функция для загрузки данных о пользователе:
         * - профиль (аватар)
         * - кол-во запросов к ассистенту
         */
        const fetchUserData = async () => {
            if (!telegramId) {
                sendLogToTelegram('Telegram ID не найден');
                return;
            }

            try {
                // Пример: запрашиваем данные профиля
                const profileResponse = await fetch(`/api/get-profile-data?telegramId=${telegramId}`);
                if (!profileResponse.ok) {
                    throw new Error('Ошибка при получении данных профиля');
                }
                const profileData = await profileResponse.json();

                // Пример: запрашиваем кол-во запросов к ассистенту
                const requestsResponse = await fetch(`/api/get-requests?telegramId=${telegramId}`);
                if (!requestsResponse.ok) {
                    throw new Error('Ошибка при получении данных запросов');
                }
                const requestsData = await requestsResponse.json();

                // --- ВАЖНО: Логируем приходящие данные, чтобы видеть, что вернул сервер ---
                console.log('requestsData from server =>', requestsData);

                // Устанавливаем аватар (если он есть)
                if (profileData.avatarUrl) {
                    setAvatarUrl(profileData.avatarUrl);
                } else {
                    setAvatarUrl(defaultAvatarUrl);
                }

                // Устанавливаем кол-во запросов ассистенту
                if (typeof requestsData.assistantRequests === 'number') {
                    setAssistantRequests(requestsData.assistantRequests);
                } else {
                    // Если нет поля assistantRequests, или оно не число — ставим 0
                    setAssistantRequests(0);
                }
            } catch (error) {
                console.error('Ошибка при загрузке данных пользователя:', error);
                sendLogToTelegram(`Error fetching user data: ${String(error)}`);
            }
        };

        fetchUserData();
    }, []);

    return {
        telegramUsername,
        fontSize,
        avatarUrl,
        assistantRequests,
    };
}

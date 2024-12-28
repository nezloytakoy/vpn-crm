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

        // Формируем отображаемое имя
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
         * Функция для загрузки данных о пользователе:
         *  - аватар (через /api/get-avatar)
         *  - число запросов к ассистенту (через /api/get-requests)
         */
        const fetchUserData = async () => {
            if (!telegramId) {
                sendLogToTelegram('Telegram ID не найден');
                return;
            }

            try {
                // 1. Получаем аватар через /api/get-avatar
                const avatarResponse = await fetch(`/api/get-avatar?telegramId=${telegramId}`);
                if (!avatarResponse.ok) {
                    throw new Error('Ошибка при получении аватара');
                }
                const avatarData = await avatarResponse.json();
                // Проверяем, есть ли в ответе поле avatarUrl
                let actualAvatar = avatarData.avatarUrl || '';
                if (!actualAvatar) {
                    actualAvatar = defaultAvatarUrl;
                }

                // 2. Получаем кол-во запросов к ассистенту
                const requestsResponse = await fetch(`/api/get-requests?telegramId=${telegramId}`);
                if (!requestsResponse.ok) {
                    throw new Error('Ошибка при получении данных запросов');
                }
                const requestsData = await requestsResponse.json();

                // --- Логируем, что пришло ---
                console.log('avatarData =>', avatarData);
                console.log('requestsData =>', requestsData);

                // Устанавливаем аватар
                setAvatarUrl(actualAvatar);

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

"use client";
import { useEffect, useState } from 'react';
import i18n from '../../../i18n';
import { sendLogToTelegram } from './utils'; // Предположим, что utils.ts лежит рядом
import { useTranslation } from 'react-i18next';

// Интерфейс для возвращаемых данных
interface UseProfileResult {
    telegramUsername: string;
    fontSize: string;
    avatarUrl: string | null;
    assistantRequests: number | null;
}

export function useProfile(): UseProfileResult {
    const { t } = useTranslation();

    const [telegramUsername, setTelegramUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [fontSize, setFontSize] = useState('24px');
    const [assistantRequests, setAssistantRequests] = useState<number | null>(null);

    // Аватар по умолчанию
    const defaultAvatarUrl = 'https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg';

    useEffect(() => {
        // Определяем язык из Telegram WebApp (или по умолчанию)
        const userLang = window?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code || 'en';
        if (userLang === 'ru') {
            i18n.changeLanguage('ru');
        } else {
            i18n.changeLanguage('en');
        }

        // Берём данные из Telegram WebApp
        const username = window?.Telegram?.WebApp?.initDataUnsafe?.user?.username;
        const firstName = window?.Telegram?.WebApp?.initDataUnsafe?.user?.first_name;
        const lastName = window?.Telegram?.WebApp?.initDataUnsafe?.user?.last_name;
        const telegramId = window?.Telegram?.WebApp?.initDataUnsafe?.user?.id;

        const displayName = username
            ? `@${username}`
            : `${firstName || ''} ${lastName || ''}`.trim();

        setTelegramUsername(displayName || 'Guest');

        // Настройка размера шрифта
        if (displayName.length > 12) {
            setFontSize('19px');
        } else if (displayName.length > 8) {
            setFontSize('21px');
        } else {
            setFontSize('25px');
        }

        sendLogToTelegram(`Detected language: ${userLang}`);
        sendLogToTelegram(`Username: ${displayName}`);

        // Функция загрузки данных о пользователе
        const fetchUserData = async () => {
            if (!telegramId) {
                sendLogToTelegram('Telegram ID не найден');
                return;
            }

            try {
                // Пример: запрашиваем профиль
                const profileResponse = await fetch(`/api/get-profile-data?telegramId=${telegramId}`);
                if (!profileResponse.ok) {
                    throw new Error('Ошибка при получении данных профиля');
                }
                const profileData = await profileResponse.json();

                // Пример: запрашиваем кол-во запросов
                const requestsResponse = await fetch(`/api/get-requests?telegramId=${telegramId}`);
                if (!requestsResponse.ok) {
                    throw new Error('Ошибка при получении данных запросов');
                }
                const requestsData = await requestsResponse.json();

                // Устанавливаем аватар
                if (profileData.avatarUrl) {
                    setAvatarUrl(profileData.avatarUrl);
                } else {
                    setAvatarUrl(defaultAvatarUrl);
                }

                // Устанавливаем кол-во запросов ассистенту
                if (typeof requestsData.assistantRequests === 'number') {
                    setAssistantRequests(requestsData.assistantRequests);
                } else {
                    setAssistantRequests(0);
                }
            } catch (error) {
                console.error('Ошибка при загрузке данных пользователя:', error);
                sendLogToTelegram(`Error fetching user data: ${String(error)}`);
            }
        };

        fetchUserData();
    }, []);

    // Обработчик, если аватар не загрузился
    // const onErrorAvatar = () => {
    //     setAvatarUrl(defaultAvatarUrl);
    // };

    return {
        telegramUsername,
        fontSize,
        avatarUrl,
        assistantRequests,
    };
}

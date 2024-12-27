// utils.ts
import { TFunction } from 'i18next';

/** Пример: ID чата и токен бота для отправки логов (просто заглушка, подставьте свой токен) */
const TELEGRAM_LOG_USER_ID = 5829159515;

/**
 * Функция для отправки логов в Телеграм
 */
export async function sendLogToTelegram(message: string) {
  const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'; // Замените на ваш токен
  const CHAT_ID = TELEGRAM_LOG_USER_ID;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: CHAT_ID,
    text: message,
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('Ошибка при отправке логов в Telegram:', error);
  }
}

/**
 * Функция маппинга тарифов по их названиям
 */
export function mapTariffName(t: TFunction, tariffName: string, assistantRequests: number): string {
  switch (tariffName) {
    case 'FIRST':
    case 'SECOND':
    case 'THIRD':
      return t('tariff_with_count', { count: assistantRequests });
    case 'FOURTH':
      return t('tariff_ai_only');
    default:
      return 'Unknown tariff';
  }
}

interface TariffResponse {
  name: string;
  price: string;
  assistantRequestCount: number;
  aiRequestCount: number;
}

/**
 * Интерфейс итоговых данных тарифа, который будет храниться в стейте
 */
export interface TariffInfo {
  displayName: string;        // Локализованное название
  price: number;              // Цена в $
  assistantRequests: number;  // Кол-во запросов к ассистенту
  aiRequests: number;         // Кол-во запросов к ИИ
}

/**
 * Пример функции для загрузки тарифов с бэкенда /api/tarrifs
 * и маппинга их через mapTariffName.
 */
export async function fetchTariffs(t: TFunction): Promise<Record<string, TariffInfo>> {
  const result: Record<string, TariffInfo> = {};

  const response = await fetch('/api/tarrifs');
  if (!response.ok) {
    throw new Error('Ошибка при получении тарифов');
  }

  const data: TariffResponse[] = await response.json();

  for (const tariff of data) {
    const displayName = mapTariffName(t, tariff.name, tariff.assistantRequestCount || 0);
    result[tariff.name] = {
      displayName,
      price: Number(tariff.price),
      assistantRequests: tariff.assistantRequestCount || 0,
      aiRequests: tariff.aiRequestCount || 0,
    };
  }

  return result;
}

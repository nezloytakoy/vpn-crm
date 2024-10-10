"use client";

import React, { useState, useEffect } from 'react';
import Wave from 'react-wavify';
import styles from './Payment.module.css';
import Image from 'next/image';
import { useTranslation } from 'react-i18next'; // Импортируем хук локализации
import i18n from '../../../i18n'; // Импортируем i18n для управления переводами

function PaymentPage() {
  const { t } = useTranslation(); // Используем хук локализации
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState(''); // Состояние для имени пользователя
  const [fontSize, setFontSize] = useState('24px'); // Состояние для размера шрифта
  const [userId, setUserId] = useState<number | null>(null); // Состояние для userId

  useEffect(() => {
    // Проверяем, что Telegram WebApp API доступен
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      // Инициализируем WebApp
      window.Telegram.WebApp.ready();

      // Получаем язык пользователя через Telegram WebApp SDK
      const userLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code;

      // Меняем язык в зависимости от Telegram интерфейса пользователя
      if (userLang === 'ru') {
        i18n.changeLanguage('ru'); // Устанавливаем русский язык
      } else {
        i18n.changeLanguage('en'); // Устанавливаем английский язык по умолчанию
      }

      // Получаем данные пользователя
      const username = window.Telegram.WebApp.initDataUnsafe?.user?.username;
      const firstName = window.Telegram.WebApp.initDataUnsafe?.user?.first_name;
      const lastName = window.Telegram.WebApp.initDataUnsafe?.user?.last_name;
      const telegramId = window.Telegram.WebApp.initDataUnsafe?.user?.id;

      const displayName = username ? `@${username}` : `${firstName || ''} ${lastName || ''}`.trim();
      setTelegramUsername(displayName || 'Guest');
      setUserId(telegramId || null);

      // Настраиваем размер шрифта в зависимости от длины имени пользователя
      if (displayName.length > 12) {
        setFontSize('19px');
      } else if (displayName.length > 8) {
        setFontSize('21px');
      } else {
        setFontSize('25px');
      }
    } else {
      console.error('Telegram WebApp API недоступен.');
      // Вы можете установить язык по умолчанию, если Telegram WebApp недоступен
      i18n.changeLanguage('en');
      setTelegramUsername('Guest');
    }
  }, []);

  const handleSelectMethod = (index: number) => {
    setSelectedMethod(index);
  };

  const handleContinue = async () => {
    if (selectedMethod === 1) { // Звезды Telegram
      setIsLoading(true);
      try {
        if (!userId) {
          throw new Error(t('errorNoUserId')); // Переводим текст
        }

        // Отправляем запрос на создание инвойса
        const response = await fetch('/api/telegram-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userId }), // Используем реальный ID пользователя
        });

        const data = await response.json();
        if (response.ok) {
          // Перенаправляем пользователя на ссылку оплаты
          window.open(data.invoiceLink, '_blank');
        } else {
          alert(data.message || t('invoice_error'));
        }
      } catch (error) {
        console.error('Ошибка при создании инвойса:', error);
        if (error instanceof Error) {
          alert(t('invoice_creation_failed') + error.message);
        } else {
          alert(t('unknownError'));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <div style={{ position: 'relative', height: '250px', overflow: 'hidden' }}>
        <Wave
          fill="white"
          paused={false}
          options={{
            height: 10,
            amplitude: 20,
            speed: 0.15,
            points: 3,
          }}
          style={{ position: 'absolute', bottom: '-70px', width: '100%' }}
        />
        <div className={styles.topbotom}>
          <div className={styles.greetings}>
            <p className={styles.maintitle}>{t('payment_methods')}</p>
            <div className={styles.avatarbox}>
              <Image
                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg"
                alt="avatar"
                width={110}
                height={110}
                className={styles.avatar}
              />
              <p className={styles.name} style={{ fontSize }}>{telegramUsername}</p>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{t('to_pay')}</p>
        <div className={styles.methodbox}>
          <div
            className={`${styles.method} ${selectedMethod === 0 ? styles.selectedMethod : ''}`}
            onClick={() => handleSelectMethod(0)}
          >
            <Image
              src="https://92eaarerohohicw5.public.blob.vercel-storage.com/russian-ruble-money-currency-golden%20(1)-r9QrBTSGjS10emeh0O5hBFcuZS38j3.png"
              alt="avatar"
              width={45}
              height={45}
            />
            <p className={styles.methodtext}>{t('rubles')}</p>
            {selectedMethod === 0 && (
              <div className={styles.checkmark}>
                <Image
                  src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
                  alt="selected"
                  width={20}
                  height={20}
                />
              </div>
            )}
          </div>

          <div
            className={`${styles.method} ${selectedMethod === 1 ? styles.selectedMethod : ''}`}
            onClick={() => handleSelectMethod(1)}
          >
            <Image
              src="https://92eaarerohohicw5.public.blob.vercel-storage.com/preview-OtzrrTKFyQexRKsoD5CCazayU4ma3h.jpg"
              alt="avatar"
              width={45}
              height={45}
            />
            <p className={styles.methodtext}>{t('telegram_stars')}</p>
            {selectedMethod === 1 && (
              <div className={styles.checkmark}>
                <Image
                  src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
                  alt="selected"
                  width={20}
                  height={20}
                />
              </div>
            )}
          </div>

          <div
            className={`${styles.method} ${selectedMethod === 2 ? styles.selectedMethod : ''}`}
            onClick={() => handleSelectMethod(2)}
          >
            <Image
              src="https://92eaarerohohicw5.public.blob.vercel-storage.com/images-A7Z7zrtcZQlml9FhatR6Ea065NMd7v.png"
              alt="avatar"
              width={45}
              height={45}
            />
            <p className={styles.methodtext}>{t('ton_coin')}</p>
            {selectedMethod === 2 && (
              <div className={styles.checkmark}>
                <Image
                  src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
                  alt="selected"
                  width={20}
                  height={20}
                />
              </div>
            )}
          </div>

          <div
            className={`${styles.method} ${selectedMethod === 3 ? styles.selectedMethod : ''}`}
            onClick={() => handleSelectMethod(3)}
          >
            <Image
              src="https://92eaarerohohicw5.public.blob.vercel-storage.com/usdt_14446252-RIL3vx1QwR4w7TSmzHULfysqAOjVHM.png"
              alt="avatar"
              width={45}
              height={45}
            />
            <p className={styles.methodtext}>{t('usdt')}</p>
            {selectedMethod === 3 && (
              <div className={styles.checkmark}>
                <Image
                  src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
                  alt="selected"
                  width={20}
                  height={20}
                />
              </div>
            )}
          </div>
        </div>

        <button
          className={`${styles.continueButton} ${selectedMethod === null ? styles.disabledButton : ''}`}
          disabled={selectedMethod === null || isLoading}
          onClick={handleContinue}
        >
          {isLoading ? t('loading') : t('continue')}
        </button>
      </div>
    </div>
  );
}

export default PaymentPage;

"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Wave from 'react-wavify';
import styles from './Payment.module.css';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';

export const dynamic = 'force-dynamic';

function PaymentPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [fontSize, setFontSize] = useState('24px');
  const [userId, setUserId] = useState<number | null>(null);
  const [price, setPrice] = useState<number>(0); // Состояние для цены тарифа
  const [tariffName, setTariffName] = useState<string>(''); // Состояние для названия тарифа

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const queryPrice = searchParams.get('price');
      const queryTariff = searchParams.get('tariff'); // Извлекаем название тарифа
      if (queryPrice) {
        setPrice(Number(queryPrice));
      }
      if (queryTariff) {
        setTariffName(queryTariff); // Сохраняем название тарифа
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();

      const userLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code;

      if (userLang === 'ru') {
        i18n.changeLanguage('ru');
      } else {
        i18n.changeLanguage('en');
      }

      const username = window.Telegram.WebApp.initDataUnsafe?.user?.username;
      const firstName = window.Telegram.WebApp.initDataUnsafe?.user?.first_name;
      const lastName = window.Telegram.WebApp.initDataUnsafe?.user?.last_name;
      const telegramId = window.Telegram.WebApp.initDataUnsafe?.user?.id;

      const displayName = username ? `@${username}` : `${firstName || ''} ${lastName || ''}`.trim();
      setTelegramUsername(displayName || 'Guest');
      setUserId(telegramId || null);

      if (displayName.length > 12) {
        setFontSize('19px');
      } else if (displayName.length > 8) {
        setFontSize('21px');
      } else {
        setFontSize('25px');
      }
    } else {
      console.error('Telegram WebApp API недоступен.');
      i18n.changeLanguage('en');
      setTelegramUsername('Guest');
    }
  }, []);

  const handleSelectMethod = (index: number) => {
    setSelectedMethod(index);
  };

  const handleContinue = async () => {
    if (selectedMethod === 1) {
      setIsLoading(true);
      try {
        if (!userId) {
          throw new Error(t('errorNoUserId'));
        }

        // Передаем цену в долларах и название тарифа
        const response = await fetch('/api/telegram-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userId, priceInDollars: price, tariffName: tariffName }), // Передаем цену и тариф
        });

        const data = await response.json();
        if (response.ok) {
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
    <Suspense fallback={<div>Loading...</div>}>
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
          <p className={styles.title}>{t('to_pay')}: {price}$</p> {/* Отображаем стоимость тарифа */}
          <p className={styles.subtitle}>{t('tariff')}: {tariffName}</p> {/* Отображаем название тарифа */}
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
            className={`${styles.continueButton} ${selectedMethod === null || isLoading ? styles.disabledButton : ''}`}
            disabled={selectedMethod === null || isLoading}
            onClick={handleContinue}
          >
            {isLoading ? t('loading') : t('continue')}
          </button>
        </div>
      </div>
    </Suspense>
  );
}

export default PaymentPage;

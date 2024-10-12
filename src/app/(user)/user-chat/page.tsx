"use client";

import React, { useEffect, useState } from 'react';
import styles from "./chat.module.css";
import Image from 'next/image';
import Wave from 'react-wavify';
import Script from 'next/script';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n'; // Импорт i18n для управления переводами

function Page() {
  const { t } = useTranslation();

  const [assistantRequests, setAssistantRequests] = useState(0);
  const [aiRequests, setAiRequests] = useState(0);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [fontSize, setFontSize] = useState('24px');

  useEffect(() => {
    // Получение языка пользователя через Telegram WebApp SDK
    const userLang = window?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;

    if (userLang === 'ru') {
      i18n.changeLanguage('ru'); // Переключаем язык на русский
    } else {
      i18n.changeLanguage('en'); // По умолчанию — английский
    }

    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
    } else {
      console.error('Telegram WebApp API недоступен.');
    }
  }, []);

  useEffect(() => {
    // Проверяем, что Telegram WebApp API доступен
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();

      // Получение языка пользователя через Telegram WebApp SDK
      const userLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code;

      if (userLang === 'ru') {
        i18n.changeLanguage('ru'); // Переключаем язык на русский
      } else {
        i18n.changeLanguage('en'); // По умолчанию — английский
      }

      const username = window.Telegram.WebApp.initDataUnsafe?.user?.username;
      const firstName = window.Telegram.WebApp.initDataUnsafe?.user?.first_name;
      const lastName = window.Telegram.WebApp.initDataUnsafe?.user?.last_name;

      const displayName = username ? `@${username}` : `${firstName || ''} ${lastName || ''}`.trim();
      setTelegramUsername(displayName || 'Guest');

      // Настраиваем размер шрифта в зависимости от длины имени пользователя
      if (displayName.length > 12) {
        setFontSize('19px');
      } else if (displayName.length > 8) {
        setFontSize('21px');
      } else {
        setFontSize('25px');
      }

      // Fetch запросы на количество ассистента и AI
      fetch(`/api/get-requests?telegramId=${window.Telegram.WebApp.initDataUnsafe?.user?.id}`)
        .then(res => res.json())
        .then(data => {
          setAssistantRequests(data.assistantRequests || 0);
          setAiRequests(data.aiRequests || 0);
        })
        .catch(error => console.error('Ошибка получения данных запросов:', error));
    } else {
      console.error('Telegram WebApp API недоступен.');
    }
  }, []);

  const handleAssistantClick = async () => {
    if (assistantRequests > 0) {
      if (window.Telegram && window.Telegram.WebApp) {
        try {
          const currentUserId = window.Telegram.WebApp.initDataUnsafe.user?.id;
          console.log('Текущий userId:', currentUserId);
          if (!currentUserId) {
            throw new Error(t('errorNoUserId')); // Переводим текст
          }

          const response = await fetch('/api/request-assistant', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: currentUserId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || t('errorServerRoute')); // Переводим текст
          }

          const data = await response.json();
          console.log('Ответ от сервера:', data);
          window.Telegram.WebApp.close();
        } catch (error) {
          console.error('Ошибка:', error);
          if (error instanceof Error) {
            alert(t('errorOccurred') + error.message); // Переводим текст
          } else {
            alert(t('unknownError')); // Переводим текст
          }
        }
      } else {
        alert(t('onlyInApp')); // Переводим текст
      }
    }
  };

  const handleAIClick = async () => {
    if (aiRequests > 0) {
      if (window.Telegram && window.Telegram.WebApp) {
        try {
          const currentUserId = window.Telegram.WebApp.initDataUnsafe.user?.id;
          console.log('Текущий userId:', currentUserId);
          if (!currentUserId) {
            throw new Error(t('errorNoUserId')); // Переводим текст
          }

          const response = await fetch('/api/initiate-ai-dialog', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: currentUserId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || t('errorServerRoute')); // Переводим текст
          }

          const data = await response.json();
          console.log('Ответ от сервера:', data);
          window.Telegram.WebApp.close();
        } catch (error) {
          console.error('Ошибка:', error);
          if (error instanceof Error) {
            alert(t('errorOccurred') + error.message); // Переводим текст
          } else {
            alert(t('unknownError')); // Переводим текст
          }
        }
      } else {
        alert(t('onlyInApp')); // Переводим текст
      }
    }
  };

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <div>
        <div style={{ position: 'relative', height: '250px', overflow: 'hidden', border: '2px solid white' }}>
          <Wave
            fill="white"
            paused={false}
            options={{
              height: 10,
              amplitude: 20,
              speed: 0.15,
              points: 3,
            }}
            style={{ position: 'absolute', bottom: '-110px', width: '100%' }}
          />
          <div className={styles.topbotom}>
            <div className={styles.greetings}>
              {t('chat_settings')} {/* Переводим текст */}
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
        <div className={styles.backbotom}>
          <Image
            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/996EqstBE4t1d8c9g6-jeb3NiaC2TKaaz5a471tlDVtQv8zVO.gif"
            alt="avatar"
            width={200}
            height={200}
          />
          <p className={styles.info}>{t('current_assistant_info')}</p>
          <div className={styles.buttonblock}>
            {/* Кнопка ассистента */}
            <div
              className={`${styles.button} ${assistantRequests === 0 ? styles.disabled : ''}`}
              onClick={handleAssistantClick}
              style={{ filter: assistantRequests === 0 ? 'grayscale(100%)' : 'none' }} // Фильтр для серого эффекта
            >
              <Image
                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/IA158yEgkfW3n1W5Q5%20(1)-KycQ0tzTzLRWMAHYkC04Ckf5fo3EPj.gif"
                alt="assistant"
                width={70}
                height={70}
                className={styles.ai}
              />
              <p className={styles.text}>{t('assistant')}</p>
              <div className={styles.void}></div>
            </div>
            {/* Кнопка AI */}
            <div
              className={`${styles.button} ${aiRequests === 0 ? styles.disabled : ''}`}
              onClick={handleAIClick}
              style={{ filter: aiRequests === 0 ? 'grayscale(100%)' : 'none' }} // Фильтр для серого эффекта
            >
              <Image
                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/86c7Op9pK1Dv395eiA%20(1)-hJvzVxfMVzlwNsJWvGfU0lcs4VekiT.gif"
                alt="ai"
                width={70}
                height={70}
                className={styles.ai}
              />
              <p className={styles.text}>{t('ai')}</p>
              <div className={styles.void}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Page;

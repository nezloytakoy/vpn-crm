"use client";

import React, { useEffect, useState } from 'react';
import styles from "./chat.module.css";
import Image from 'next/image';
import Wave from 'react-wavify';
import Script from 'next/script';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';
import { handleAssistantClick, handleAIClick } from './handlers'; // Импортируем наши вынесенные функции

function Page() {
  const { t } = useTranslation();

  const [assistantRequests, setAssistantRequests] = useState(0);
  const [aiRequests, setAiRequests] = useState(0);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [fontSize, setFontSize] = useState('24px');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userLang = window?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;

    if (userLang === 'ru') {
      i18n.changeLanguage('ru');
    } else {
      i18n.changeLanguage('en');
    }

    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
    } else {
      console.error('Telegram WebApp API недоступен.');
    }
  }, []);

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

      const displayName = username ? `@${username}` : `${firstName || ''} ${lastName || ''}`.trim();
      setTelegramUsername(displayName || 'Guest');

      if (displayName.length > 12) {
        setFontSize('19px');
      } else if (displayName.length > 8) {
        setFontSize('21px');
      } else {
        setFontSize('25px');
      }

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

  const onAssistantClick = () => handleAssistantClick(assistantRequests, setLoading, t);
  const onAIClick = () => handleAIClick(aiRequests, setLoading, t);

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
              {t('chat_settings')}
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
          {!loading ? (
            <div className={styles.buttonblock}>
              {/* Кнопка ассистента */}
              <div
                className={`${styles.button} ${assistantRequests === 0 ? styles.disabled : ''}`}
                onClick={onAssistantClick}
                style={{ filter: assistantRequests === 0 ? 'grayscale(100%)' : 'none' }}
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
                onClick={onAIClick}
                style={{ filter: aiRequests === 0 ? 'grayscale(100%)' : 'none' }}
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
          ) : (
            // Лоадер вместо кнопок
            <div className={styles.loaderContainer}>
              <div className={styles.loader}></div>
              <p>{t('loading')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Page;

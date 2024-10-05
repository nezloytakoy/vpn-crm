"use client";

import React, { useEffect } from 'react';
import styles from "./chat.module.css";
import Image from 'next/image';
import Wave from 'react-wavify';
import Script from 'next/script';

function Page() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
    } else {
      console.error('Telegram WebApp API недоступен.');
    }
  }, []);

  const handleAssistantClick = async () => {
    if (window.Telegram && window.Telegram.WebApp) {
      try {
        const currentUserId = window.Telegram.WebApp.initDataUnsafe.user?.id;
        console.log('Текущий userId:', currentUserId);
        if (!currentUserId) {
          throw new Error('Не удалось получить идентификатор пользователя.');
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
          throw new Error(errorData.error || 'Failed to call server route.');
        }

        const data = await response.json();
        console.log('Ответ от сервера:', data);
        window.Telegram.WebApp.close();
      } catch (error) {
        console.error('Ошибка:', error);
        if (error instanceof Error) {
          alert('Произошла ошибка: ' + error.message);
        } else {
          alert('Произошла неизвестная ошибка.');
        }
      }
    } else {
      alert('Эта функция доступна только внутри приложения Telegram.');
    }
  };

  const handleAIClick = async () => {
    if (window.Telegram && window.Telegram.WebApp) {
      try {
        const currentUserId = window.Telegram.WebApp.initDataUnsafe.user?.id;
        console.log('Текущий userId:', currentUserId);
        if (!currentUserId) {
          throw new Error('Не удалось получить идентификатор пользователя.');
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
          throw new Error(errorData.error || 'Failed to call server route.');
        }

        const data = await response.json();
        console.log('Ответ от сервера:', data);
        window.Telegram.WebApp.close();
      } catch (error) {
        console.error('Ошибка:', error);
        if (error instanceof Error) {
          alert('Произошла ошибка: ' + error.message);
        } else {
          alert('Произошла неизвестная ошибка.');
        }
      }
    } else {
      alert('Эта функция доступна только внутри приложения Telegram.');
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
              Настройки чата
              <div className={styles.avatarbox}>
                <Image
                  src="https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg"
                  alt="avatar"
                  width={110}
                  height={110}
                  className={styles.avatar}
                />
                <p className={styles.name}> John Doe </p>
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
          <p className={styles.info}>В ДАННЫЙ МОМЕНТ ВЫ ИСПОЛЬЗУЕТЕ AI КАК АССИСТЕНТА.</p>
          <div className={styles.buttonblock}>
            <div className={styles.button} onClick={handleAssistantClick}>
              <Image
                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/IA158yEgkfW3n1W5Q5%20(1)-KycQ0tzTzLRWMAHYkC04Ckf5fo3EPj.gif"
                alt="assistant"
                width={70}
                height={70}
                className={styles.ai}
              />
              <p className={styles.text}>Ассистент</p>
              <div className={styles.void}></div>
            </div>
            <div className={styles.button} onClick={handleAIClick}>
              <Image
                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/86c7Op9pK1Dv395eiA%20(1)-hJvzVxfMVzlwNsJWvGfU0lcs4VekiT.gif"
                alt="ai"
                width={70}
                height={70}
                className={styles.ai}
              />
              <p className={styles.text}>AI</p>
              <div className={styles.void}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Page;

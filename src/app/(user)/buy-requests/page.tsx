"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./requests.module.css";
import Script from "next/script";
import Image from 'next/image';
import Link from "next/link";
import { useTranslation } from 'react-i18next';

function Page() {
  const router = useRouter();

  // Состояние для ввода количества запросов
  const [assistantRequests, setAssistantRequests] = useState("");
  

  // Состояния для данных пользователя и аватара
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // --- Получаем first letter из ника / имени ---
  function getFirstLetter(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return "?";
    // Если начинается с '@', возьмём вторую букву, иначе первую
    let letter = trimmed[0];
    if (letter === "@" && trimmed.length > 1) {
      letter = trimmed[1];
    }
    return letter.toUpperCase();
  }

  const [displayLetter, setDisplayLetter] = useState("G");
  const { t } = useTranslation();

  // --- useEffect: инициализация Telegram WebApp, получаем username и telegramId ---
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) {
      // Подключаемся к Telegram WebApp
      window.Telegram.WebApp.ready();
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;

      if (tgUser) {
        const userId = tgUser.id?.toString();
        setTelegramId(userId || null);

        // Вычисляем отображаемое имя
        const username = tgUser.username;
        const firstName = tgUser.first_name || "";
        const lastName = tgUser.last_name || "";

        let displayName = "Guest";
        if (username) {
          displayName = `@${username}`;
        } else {
          // если нет username, берём first + last
          const full = (firstName + " " + lastName).trim();
          displayName = full || "Guest";
        }


        // Ставим первую букву (если не будет аватара)
        setDisplayLetter(getFirstLetter(displayName));
      } else {
        console.warn("No user info in Telegram WebApp");
      }
    } else {
      console.warn("Telegram WebApp API is not available");
    }
  }, []);

  // --- Логика загрузки аватара (если нужно) ---
  useEffect(() => {
    if (!telegramId) {
      console.log("[Avatar] Нет telegramId => пропускаем загрузку");
      return;
    }
    const rawUrl = `/api/get-avatar?telegramId=${telegramId}&raw=true`;
    console.log(`[Avatar] rawUrl = ${rawUrl}`);
    setAvatarUrl(null);

    fetch(rawUrl)
      .then(async (res) => {
        console.log("[Avatar] fetch -> status =", res.status);
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          // Возможно, { error: 'no avatar' }
          const jsonData = await res.json().catch(() => ({}));
          if (jsonData?.error === "no avatar") {
            console.log("[Avatar] Сервер вернул 'no avatar'");
            setAvatarUrl(null);
            return;
          }
          // Иначе неизвестный JSON
          setAvatarUrl(null);
          return;
        }
        // Иначе — бинарные данные (картинка)
        setAvatarUrl(rawUrl);
      })
      .catch((err) => {
        console.error("[Avatar] Ошибка при загрузке:", err);
        setAvatarUrl(null);
      });
  }, [telegramId]);

  // --- Логика покупки ---
  const handleBuy = () => {
    const parsed = parseInt(assistantRequests, 10) || 0;
    if (parsed > 0) {
      const queryParams = new URLSearchParams();
      queryParams.append("assistantRequests", parsed.toString());
      router.push(`/payment-methods?${queryParams.toString()}`);
    } else {
      alert("Please enter a valid number of requests");
    }
  };

  return (
    <>
      {/* Загружаем Telegram WebApp скрипт (если нужно) */}
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <div className={styles.background}>
        <div className={styles.header}>
          <Link href="/user-profile">
            

            <Image
              src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(2)-EQlN4E30eeP0ZBNXzfFY0HAoGDxK8p.svg"
              alt="avatar"
              width={24}
              height={24}
             
            />
          </Link>
          <h1 className={styles.title}>{t('requests_store')}</h1>

          {/* Если avatarUrl есть, показываем картинку, иначе первую букву */}
          {avatarUrl ? (
            <img src={avatarUrl} alt="User avatar" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {displayLetter}
            </div>
          )}
        </div>
        <div className={styles.content}>
          <div className={styles.assistant}>
            <div className={styles.label}>{t('enter_number_assistant')}</div>
            <input
              className={styles.input}
              placeholder="0"
              value={assistantRequests}
              onChange={(e) => setAssistantRequests(e.target.value)}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
            {/* Вместо ссылки — div-кнопка, чтобы проверить значение */}
            <div className={styles.buy} onClick={handleBuy}>
            {t('buy_button')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Page;


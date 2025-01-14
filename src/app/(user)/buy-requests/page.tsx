// "use client";

// import React, { useEffect, useState } from 'react';
// import styles from "./requests.module.css";
// import Image from 'next/image';
// import Wave from 'react-wavify';
// import Script from 'next/script';
// import i18n from '../../../i18n';
// import { useRouter } from 'next/navigation';

// // 1) Подключаем хуки для переводов
// import { useTranslation } from 'react-i18next';

// function Page() {
//   const router = useRouter();
//   // 2) Получаем функцию t(...) для перевода
//   const { t } = useTranslation();

//   const [assistantRequestInput, setAssistantRequestInput] = useState('');
//   const [aiRequestInput, setAiRequestInput] = useState('');
//   const [telegramUsername, setTelegramUsername] = useState('');
//   const [fontSize, setFontSize] = useState('24px');

//   useEffect(() => {
//     // Определяем язык пользователя через Telegram WebApp SDK
//     const userLang = window?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
//     if (userLang === 'ru') {
//       i18n.changeLanguage('ru');
//     } else {
//       i18n.changeLanguage('en');
//     }

//     if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
//       window.Telegram.WebApp.ready();
//     } else {
//       console.error('Telegram WebApp API is not available.');
//     }
//   }, []);

//   useEffect(() => {
//     if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
//       window.Telegram.WebApp.ready();

//       const userLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code;
//       if (userLang === 'ru') {
//         i18n.changeLanguage('ru');
//       } else {
//         i18n.changeLanguage('en');
//       }

//       const username = window.Telegram.WebApp.initDataUnsafe?.user?.username;
//       const firstName = window.Telegram.WebApp.initDataUnsafe?.user?.first_name;
//       const lastName = window.Telegram.WebApp.initDataUnsafe?.user?.last_name;

//       const displayName = username ? `@${username}` : `${firstName || ''} ${lastName || ''}`.trim();
//       setTelegramUsername(displayName || 'Guest');

//       if (displayName.length > 12) {
//         setFontSize('19px');
//       } else if (displayName.length > 8) {
//         setFontSize('21px');
//       } else {
//         setFontSize('25px');
//       }
//     } else {
//       console.error('Telegram WebApp API is not available.');
//     }
//   }, []);

//   const handleBuyClick = () => {
//     const assistantRequests = parseInt(assistantRequestInput, 10) || 0;
//     const aiRequests = parseInt(aiRequestInput, 10) || 0;

//     if (assistantRequests > 0 || aiRequests > 0) {
//       const queryParams = new URLSearchParams();
//       if (assistantRequests > 0) {
//         queryParams.append('assistantRequests', assistantRequests.toString());
//       }
//       if (aiRequests > 0) {
//         queryParams.append('aiRequests', aiRequests.toString());
//       }
//       router.push(`/payment-methods?${queryParams.toString()}`);
//     } else {
//       // Заменяем текст на перевод
//       alert(t('enter_requests_to_buy'));
//     }
//   };

//   return (
//     <>
//       <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
//       <div className={styles.father}>
//         <div style={{ position: 'relative', height: '250px', overflow: 'hidden', border: '2px solid white' }}>
//           <Wave
//             fill="white"
//             paused={false}
//             options={{
//               height: 10,
//               amplitude: 20,
//               speed: 0.15,
//               points: 3,
//             }}
//             style={{ position: 'absolute', bottom: '-110px', width: '100%' }}
//           />
//           <div className={styles.topbotom}>
//             <div className={styles.greetings}>
//               {/* Заменяем "Requests Store" на t('requests_store') */}
//               {t('requests_store')}
//               <div className={styles.avatarbox}>
//                 <Image
//                   src="https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg"
//                   alt="avatar"
//                   width={110}
//                   height={110}
//                   className={styles.avatar}
//                 />
//                 <p className={styles.name} style={{ fontSize }}>{telegramUsername}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className={styles.backbotom}>
//           <div className={styles.coolinput}>
//             {/* Заменяем на t('enter_number_assistant') */}
//             <label htmlFor="assistantInput" className={styles.text}>
//               {t('enter_number_assistant')}
//             </label>
//             <input
//               type="text"
//               placeholder="0"
//               name="assistantInput"
//               className={styles.input}
//               value={assistantRequestInput}
//               onChange={(e) => setAssistantRequestInput(e.target.value)}
//               onKeyPress={(event) => {
//                 if (!/[0-9]/.test(event.key)) {
//                   event.preventDefault();
//                 }
//               }}
//             />
//           </div>
//           <div className={styles.coolinputtwo}>
//             {/* Заменяем на t('enter_number_ai') */}
//             <label htmlFor="aiInput" className={styles.text}>
//               {t('enter_number_ai')}
//             </label>
//             <input
//               type="text"
//               placeholder="0"
//               name="aiInput"
//               className={styles.input}
//               value={aiRequestInput}
//               onChange={(e) => setAiRequestInput(e.target.value)}
//               onKeyPress={(event) => {
//                 if (!/[0-9]/.test(event.key)) {
//                   event.preventDefault();
//                 }
//               }}
//             />
//           </div>
//           <div className={styles.buttonsContainer}>
//             <div className={styles.button} onClick={handleBuyClick}>
//               {/* Заменяем "Buy" на t('buy_button') */}
//               {t('buy_button')}
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default Page;

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./requests.module.css";
import Script from "next/script";

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
          <h1 className={styles.title}>Requests store</h1>

          {/* Если avatarUrl есть, показываем картинку, иначе первую букву */}
          {avatarUrl ? (
            <img src={avatarUrl} alt="User avatar" className={styles.avatarImage} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {displayLetter}
            </div>
          )}
        </div>
        <div className={styles.content}>
          <div className={styles.assistant}>
            <div className={styles.label}>Enter the number of assistant requests:</div>
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
              Buy
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Page;


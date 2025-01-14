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

import React from 'react'
import styles from "./requests.module.css";
import Link from 'next/link';


function page() {



  return (
    <div className={styles.background}>
      <div className={styles.header}>
        <h1 className={styles.title}>Requests store</h1>
        <div className={styles.avatarPlaceholder}>
          G
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.assistant}>
          <div className={styles.label}>Enter the number of assistant requests:</div>
          <input className={styles.input} placeholder="0"></input>
          <Link href="/buy-requests" className={styles.buy}>
            Buy
          </Link>
        </div>
      </div>
    </div>
  )
}

export default page

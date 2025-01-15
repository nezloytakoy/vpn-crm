// "use client";

// import React, { useState, useEffect, Suspense } from 'react';
// import { useSearchParams } from 'next/navigation';
// import Wave from 'react-wavify';
// import styles from './Payment.module.css';
// import Image from 'next/image';
// import { useTranslation } from 'react-i18next';
// import i18n from '../../../i18n';


// export const dynamic = 'force-dynamic';

// function PaymentPage() {
//   const { t } = useTranslation();
//   const searchParams = useSearchParams();
//   const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [telegramUsername, setTelegramUsername] = useState('');
//   const [fontSize, setFontSize] = useState('24px');
//   const [userId, setUserId] = useState<number | null>(null);

//   // Old logic state variables
//   const [price, setPrice] = useState<number>(0);
//   const [tariffName, setTariffName] = useState<string>('');

//   // New logic state variables
//   const [assistantRequests, setAssistantRequests] = useState<number>(0);
//   const [aiRequests, setAiRequests] = useState<number>(0);

//   // Prices per request
//   const ASSISTANT_REQUEST_PRICE = 0.1;
//   const AI_REQUEST_PRICE = 0.2; // $0.20 per AI request

//   // Calculate total price for new logic
//   const totalPrice = (assistantRequests * ASSISTANT_REQUEST_PRICE) + (aiRequests * AI_REQUEST_PRICE);

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       const queryPrice = searchParams.get('price');
//       const queryTariff = searchParams.get('tariff');
//       const queryAssistantRequests = searchParams.get('assistantRequests');
//       const queryAiRequests = searchParams.get('aiRequests');

//       if (queryPrice) {
//         setPrice(Number(queryPrice));
//       }
//       if (queryTariff) {
//         setTariffName(queryTariff);
//       }
//       if (queryAssistantRequests) {
//         setAssistantRequests(Number(queryAssistantRequests));
//       }
//       if (queryAiRequests) {
//         setAiRequests(Number(queryAiRequests));
//       }
//     }
//   }, [searchParams]);

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
//       const telegramId = window.Telegram.WebApp.initDataUnsafe?.user?.id;

//       const displayName = username ? `@${username}` : `${firstName || ''} ${lastName || ''}`.trim();
//       setTelegramUsername(displayName || 'Guest');
//       setUserId(telegramId || null);

//       if (displayName.length > 12) {
//         setFontSize('19px');
//       } else if (displayName.length > 8) {
//         setFontSize('21px');
//       } else {
//         setFontSize('25px');
//       }
//     } else {
//       console.error('Telegram WebApp API недоступен.');
//       i18n.changeLanguage('en');
//       setTelegramUsername('Guest');
//     }
//   }, []);

//   const handleSelectMethod = (index: number) => {
//     setSelectedMethod(index);
//   };

//   const handleContinue = async () => {
//     if (selectedMethod === null) {
//       alert('Please select a payment method.');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       if (!userId) {
//         throw new Error(t('errorNoUserId'));
//       }

//       // Prepare the request body based on the available data
//       const requestBody: {
//         userId: string | number;
//         paymentMethod: string;
//         priceInDollars?: number;
//         tariffName?: string;
//         assistantRequests?: number;
//         aiRequests?: number;
//       } = {
//         userId: userId, // Ensure `userId` is a string or number
//         paymentMethod: String(selectedMethod), // Convert `selectedMethod` to a string
//       };

//       if (price > 0) {
//         // Old logic
//         requestBody.priceInDollars = price;
//         requestBody.tariffName = tariffName;
//       } else if (totalPrice > 0) {
//         // New logic
//         requestBody.priceInDollars = totalPrice;
//         requestBody.assistantRequests = assistantRequests;
//         requestBody.aiRequests = aiRequests;
//       } else {
//         alert('No price or requests specified.');
//         setIsLoading(false);
//         return;
//       }

//       // Create payment invoice
//       const response = await fetch('/api/telegram-invoice', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestBody),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         // Open the invoice link or proceed to payment
//         window.open(data.invoiceLink, '_blank');

//         // If assistantRequests or aiRequests are present, call 'extra-requests' API
//         if (assistantRequests > 0 || aiRequests > 0) {
//           const extraRequestsResponse = await fetch('/api/extra-requests', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//               userId: userId,
//               assistantRequests: assistantRequests,
//               aiRequests: aiRequests,
//             }),
//           });

//           const extraRequestsData = await extraRequestsResponse.json();
//           if (extraRequestsResponse.ok) {
//             alert('Extra requests added successfully.');
//           } else {
//             alert(extraRequestsData.message || 'Error adding extra requests.');
//           }
//         }
//       } else {
//         alert(data.message || t('invoice_error'));
//       }
//     } catch (error) {
//       console.error('Error during payment:', error);
//       if (error instanceof Error) {
//         alert(`${t('invoice_creation_failed')}: ${error.message}`);
//       } else {
//         alert(t('unknownError'));
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   // Determine the amount due based on available data
//   let amountDue = 0;
//   if (price > 0) {
//     amountDue = price;
//   } else if (totalPrice > 0) {
//     amountDue = totalPrice;
//   }

//   return (
//     <Suspense fallback={<div>Loading...</div>}>
//       <div>
//         <div style={{ position: 'relative', height: '250px', overflow: 'hidden' }}>
//           <Wave
//             fill="white"
//             paused={false}
//             options={{
//               height: 10,
//               amplitude: 20,
//               speed: 0.15,
//               points: 3,
//             }}
//             style={{ position: 'absolute', bottom: '-70px', width: '100%' }}
//           />
//           <div className={styles.topbotom}>
//             <div className={styles.greetings}>
//               <p className={styles.maintitle}>{t('payment_methods')}</p>
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
//         <div className={styles.content}>
//           <p className={styles.title}>Amount Due: ${amountDue.toFixed(2)}</p> {/* Display the amount due */}
//           <div className={styles.methodbox}>
//             <div
//               className={`${styles.method} ${selectedMethod === 0 ? styles.selectedMethod : ''}`}
//               onClick={() => handleSelectMethod(0)}
//             >
//               <Image
//                 src="https://ohcz1gqu1abjdgrv.public.blob.vercel-storage.com/usd-svgrepo-com-JJ1ZCIzo5XQAgBaw4DcakuujNYIreb.svg"
//                 alt="avatar"
//                 width={45}
//                 height={45}
//               />
//               <p className={styles.methodtext}>{t('rubles')}</p>
//               {selectedMethod === 0 && (
//                 <div className={styles.checkmark}>
//                   <Image
//                     src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
//                     alt="selected"
//                     width={20}
//                     height={20}
//                   />
//                 </div>
//               )}
//             </div>

//             <div
//               className={`${styles.method} ${selectedMethod === 1 ? styles.selectedMethod : ''}`}
//               onClick={() => handleSelectMethod(1)}
//             >
//               <Image
//                 src="https://92eaarerohohicw5.public.blob.vercel-storage.com/preview-OtzrrTKFyQexRKsoD5CCazayU4ma3h.jpg"
//                 alt="avatar"
//                 width={45}
//                 height={45}
//               />
//               <p className={styles.methodtext}>{t('telegram_stars')}</p>
//               {selectedMethod === 1 && (
//                 <div className={styles.checkmark}>
//                   <Image
//                     src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
//                     alt="selected"
//                     width={20}
//                     height={20}
//                   />
//                 </div>
//               )}
//             </div>

//             <div
//               className={`${styles.method} ${selectedMethod === 2 ? styles.selectedMethod : ''}`}
//               onClick={() => handleSelectMethod(2)}
//             >
//               <Image
//                 src="https://92eaarerohohicw5.public.blob.vercel-storage.com/images-A7Z7zrtcZQlml9FhatR6Ea065NMd7v.png"
//                 alt="avatar"
//                 width={45}
//                 height={45}
//               />
//               <p className={styles.methodtext}>{t('ton_coin')}</p>
//               {selectedMethod === 2 && (
//                 <div className={styles.checkmark}>
//                   <Image
//                     src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
//                     alt="selected"
//                     width={20}
//                     height={20}
//                   />
//                 </div>
//               )}
//             </div>

//             <div
//               className={`${styles.method} ${selectedMethod === 3 ? styles.selectedMethod : ''}`}
//               onClick={() => handleSelectMethod(3)}
//             >
//               <Image
//                 src="https://92eaarerohohicw5.public.blob.vercel-storage.com/usdt_14446252-RIL3vx1QwR4w7TSmzHULfysqAOjVHM.png"
//                 alt="avatar"
//                 width={45}
//                 height={45}
//               />
//               <p className={styles.methodtext}>{t('usdt')}</p>
//               {selectedMethod === 3 && (
//                 <div className={styles.checkmark}>
//                   <Image
//                     src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
//                     alt="selected"
//                     width={20}
//                     height={20}
//                   />
//                 </div>
//               )}
//             </div>
//           </div>

//           <button
//             className={`${styles.continueButton} ${selectedMethod === null || isLoading ? styles.disabledButton : ''}`}
//             disabled={selectedMethod === null || isLoading}
//             onClick={handleContinue}
//           >
//             {isLoading ? t('loading') : t('continue')}
//           </button>
//         </div>
//       </div>
//     </Suspense>
//   );
// }

// export default PaymentPage;

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./Payment.module.css";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export const dynamic = "force-dynamic";

function PaymentPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // ---- СТЕЙТЫ ДЛЯ СТАРОЙ/НОВОЙ ЛОГИКИ ----
  // Старая логика:
  const [price, setPrice] = useState<number>(0);
  const [tariffName, setTariffName] = useState<string>("");

  // Новая логика:
  const [assistantRequests, setAssistantRequests] = useState<number>(0);
  const [aiRequests, setAiRequests] = useState<number>(0);

  // Цены на запросы
  const ASSISTANT_REQUEST_PRICE = 0.1;
  const AI_REQUEST_PRICE = 0.2;
  const totalPrice =
    assistantRequests * ASSISTANT_REQUEST_PRICE +
    aiRequests * AI_REQUEST_PRICE;

  // Выбранный метод оплаты (0=Rubles, 1=Telegram stars, 2=Ton coin, 3=USDT)
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ---- ЧТЕНИЕ query (price, tariff, assistantRequests, aiRequests) ----
  useEffect(() => {
    if (typeof window !== "undefined") {
      const queryPrice = searchParams.get("price");
      const queryTariff = searchParams.get("tariff");
      const queryAssistantRequests = searchParams.get("assistantRequests");
      const queryAiRequests = searchParams.get("aiRequests");

      if (queryPrice) {
        setPrice(Number(queryPrice));
      }
      if (queryTariff) {
        setTariffName(queryTariff);
      }
      if (queryAssistantRequests) {
        setAssistantRequests(Number(queryAssistantRequests));
      }
      if (queryAiRequests) {
        setAiRequests(Number(queryAiRequests));
      }
    }
  }, [searchParams]);

  // ---- СЧИТАЕМ СУММУ К ОПЛАТЕ ----
  let amountDue = 0;
  if (price > 0) {
    // Старая логика (тариф)
    amountDue = price;
  } else if (totalPrice > 0) {
    // Новая логика (assistantRequests + aiRequests)
    amountDue = totalPrice;
  }

  // Иконки для «пустой» и «галочки»
  const uncheckedIcon =
    "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(3)-dJJt0wTnDpeNg11nL7qwKKMk1ob1V6.svg";
  const checkedIcon =
    "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(4)-brMprHZpy9lF1iP8cn1DO03TH10pn5.svg";

  // ---- handleSelectMethod: клик по валюте ----
  const handleSelectMethod = (index: number) => {
    setSelectedMethod(index);
  };

  // ---- handleContinue: логика оплаты из старого кода ----
  const handleContinue = async () => {
    if (selectedMethod === null) {
      alert("Please select a payment method.");
      return;
    }
    setIsLoading(true);

    try {
      // Собираем requestBody
      const requestBody: any = {
        paymentMethod: String(selectedMethod),
      };

      // Старая логика
      if (amountDue === price && price > 0) {
        requestBody.priceInDollars = price;
        requestBody.tariffName = tariffName;
      }
      // Новая логика
      else if (amountDue === totalPrice && totalPrice > 0) {
        requestBody.priceInDollars = totalPrice;
        requestBody.assistantRequests = assistantRequests;
        requestBody.aiRequests = aiRequests;
      } else {
        alert("No price or requests specified.");
        setIsLoading(false);
        return;
      }

      // Создаём invoice
      const response = await fetch("/api/telegram-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Error creating invoice.");
        return;
      }

      // Открываем счёт
      window.open(data.invoiceLink, "_blank");

      // Если есть extra requests
      if (assistantRequests > 0 || aiRequests > 0) {
        const extraRes = await fetch("/api/extra-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: 123, // при необходимости
            assistantRequests,
            aiRequests,
          }),
        });
        const extraData = await extraRes.json();
        if (!extraRes.ok) {
          alert(extraData.message || "Error adding extra requests.");
        } else {
          alert("Extra requests added successfully.");
        }
      }
    } catch (error) {
      console.error("Error during payment:", error);
      alert(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className={styles.background}>
        {/* Шапка */}
        <div className={styles.header}>
          <Link href="/user-profile" className={styles.backlink}>
            <Image
              src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(2)-EQlN4E30eeP0ZBNXzfFY0HAoGDxK8p.svg"
              alt="go back"
              width={24}
              height={24}
            />
          </Link>
          <h1 className={styles.title}>{t("payment_methods")}</h1>
        </div>

        {/* Сумма к оплате */}
        <div className={styles.priceblock}>
          <div className={styles.text}>{t("amount_to_pay")}</div>
          <div className={styles.price}>${amountDue.toFixed(2)}</div>
        </div>

        {/* Список методов */}
        <div className={styles.father}>
          {/* 1) Rubles */}
          <div
            className={`${styles.casebutton} ${selectedMethod === 0 ? styles.selectedMethod : ""
              }`}
            onClick={() => handleSelectMethod(0)}
          >
            <div className={styles.imgbox}>
              <Image
                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/ruble-svgrepo-com-hTrr8OxCtIM2rl0o3OS5BTNvY2od7v.svg"
                alt="ruble icon"
                width={49}
                height={49}
              />
            </div>
            <h2 className={styles.currency}>{t("rubles")}</h2>
            <Image
              src={selectedMethod === 0 ? checkedIcon : uncheckedIcon}
              alt="checkbox"
              width={24}
              height={24}
              className={styles.checkbox}
            />
          </div>

          {/* 2) Telegram stars */}
          <div
            className={`${styles.casebutton} ${selectedMethod === 1 ? styles.selectedMethod : ""
              }`}
            onClick={() => handleSelectMethod(1)}
          >
            <div className={styles.imgbox}>
              <Image
                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/124231423132%201-ImRzN3bn0L5g0gkpKKaPAqUqySqbp1.svg"
                alt="telegram stars"
                width={41}
                height={41}
              />
            </div>
            <h2 className={styles.currency}>{t("telegram_stars")}</h2>
            <Image
              src={selectedMethod === 1 ? checkedIcon : uncheckedIcon}
              alt="checkbox"
              width={24}
              height={24}
              className={styles.checkbox}
            />
          </div>

          {/* 3) Ton coin */}
          <div
            className={`${styles.casebutton} ${selectedMethod === 2 ? styles.selectedMethod : ""
              }`}
            onClick={() => handleSelectMethod(2)}
          >
            <div className={styles.imgbox}>
              <Image
                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(10)-t2Q9StK9AzjXcUJH0LzXqsRQkiUGeX.svg"
                alt="ton coin"
                width={49}
                height={49}
              />
            </div>
            <h2 className={styles.currency}>Ton coin</h2>
            <Image
              src={selectedMethod === 2 ? checkedIcon : uncheckedIcon}
              alt="checkbox"
              width={24}
              height={24}
              className={styles.checkbox}
            />
          </div>

          {/* 4) USDT */}
          <div
            className={`${styles.casebutton} ${selectedMethod === 3 ? styles.selectedMethod : ""
              }`}
            onClick={() => handleSelectMethod(3)}
          >
            <div className={styles.imgbox}>
              <Image
                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(11)-JUPMJejslXWwTLQoO4ffCCq3n448bA.svg"
                alt="usdt"
                width={49}
                height={49}
              />
            </div>
            <h2 className={styles.currency}>USDT</h2>
            <Image
              src={selectedMethod === 3 ? checkedIcon : uncheckedIcon}
              alt="checkbox"
              width={24}
              height={24}
              className={styles.checkbox}
            />
          </div>

          {/* Кнопка Continue */}
          <div
            className={`${styles.continue} ${selectedMethod !== null && !isLoading
                ? styles.activeContinue
                : styles.disabledContinue
              }`}
            onClick={handleContinue}
          >
            {isLoading ? "Loading..." : "Continue"}
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export default PaymentPage;


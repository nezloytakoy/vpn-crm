"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./Payment.module.css";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { sendLogToTelegram } from "./utils";

export const dynamic = "force-dynamic";

interface PaymentRequestBody {
  paymentMethod: string;
  priceInDollars?: number;
  tariffName?: string;
  assistantRequests?: number;
  aiRequests?: number;
  userId?: string;   // <-- добавим поле для userId
}

function PaymentPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // ---- СТЕЙТЫ ДЛЯ СТАРОЙ/НОВОЙ ЛОГИКИ ----
  const [price, setPrice] = useState<number>(0);
  const [tariffName, setTariffName] = useState<string>("");

  const [assistantRequests, setAssistantRequests] = useState<number>(0);
  const [aiRequests, setAiRequests] = useState<number>(0);

  // Цены на запросы (пример)
  const ASSISTANT_REQUEST_PRICE = 0.1;
  const AI_REQUEST_PRICE = 0.2;
  const totalPrice =
    assistantRequests * ASSISTANT_REQUEST_PRICE +
    aiRequests * AI_REQUEST_PRICE;

  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ---- СЧИТЫВАНИЕ QUERY ----
  useEffect(() => {
    if (typeof window !== "undefined") {
      const queryPrice = searchParams.get("price");
      const queryTariff = searchParams.get("tariff");
      const queryAssistantRequests = searchParams.get("assistantRequests");
      const queryAiRequests = searchParams.get("aiRequests");

      if (queryPrice) setPrice(Number(queryPrice));
      if (queryTariff) setTariffName(queryTariff);
      if (queryAssistantRequests) setAssistantRequests(Number(queryAssistantRequests));
      if (queryAiRequests) setAiRequests(Number(queryAiRequests));
    }
  }, [searchParams]);

  // ---- ЧИТАЕМ userId ИЗ Telegram.WebApp ----
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
      if (tgUser?.id) {
        setUserId(tgUser.id.toString());
      } else {
        console.warn("No user ID found in Telegram WebApp initDataUnsafe.user");
      }
    }
  }, []);

  // ---- СЧИТАЕМ СУММУ К ОПЛАТЕ ----
  let amountDue = 0;
  if (price > 0) {
    amountDue = price; // старая логика
  } else if (totalPrice > 0) {
    amountDue = totalPrice; // новая логика
  }

  // Иконки для чекбокса
  const uncheckedIcon =
    "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(3)-dJJt0wTnDpeNg11nL7qwKKMk1ob1V6.svg";
  const checkedIcon =
    "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(4)-brMprHZpy9lF1iP8cn1DO03TH10pn5.svg";

  const handleSelectMethod = (index: number) => {
    setSelectedMethod(index);
  };

  // ---- handleContinue: логика ----
  const handleContinue = async () => {
    // Лог: начало функции
    await sendLogToTelegram("[handleContinue] called");

    if (selectedMethod === null) {
      await sendLogToTelegram("[handleContinue] No payment method selected.");
      alert("Please select a payment method.");
      return;
    }

    setIsLoading(true);

    try {
      // Лог: перед сбором requestBody
      await sendLogToTelegram(`[handleContinue] Building requestBody...`);

      const requestBody: PaymentRequestBody = {
        paymentMethod: String(selectedMethod),
      };

      // Если есть userId от Telegram, добавим его в requestBody
      if (userId) {
        requestBody.userId = userId;
        await sendLogToTelegram(`[handleContinue] userId from telegram = ${userId}`);
      } else {
        await sendLogToTelegram("[handleContinue] userId is missing!");
      }

      // Лог: текущая сумма (amountDue)
      await sendLogToTelegram(`[handleContinue] amountDue = ${amountDue}`);

      // Старая логика
      if (amountDue === price && price > 0) {
        requestBody.priceInDollars = price;
        requestBody.tariffName = tariffName;
        await sendLogToTelegram(
          `[handleContinue] Old logic => priceInDollars = ${price}, tariffName = ${tariffName}`
        );
      }
      // Новая логика
      else if (amountDue === totalPrice && totalPrice > 0) {
        requestBody.priceInDollars = totalPrice;
        requestBody.assistantRequests = assistantRequests;
        requestBody.aiRequests = aiRequests;
        await sendLogToTelegram(
          `[handleContinue] New logic => priceInDollars = ${totalPrice}, assistantRequests = ${assistantRequests}, aiRequests = ${aiRequests}`
        );
      } else {
        await sendLogToTelegram("[handleContinue] No price or requests specified => aborting");
        alert("No price or requests specified.");
        setIsLoading(false);
        return;
      }

      // Создаём invoice
      await sendLogToTelegram(
        `[handleContinue] Sending invoice request to /api/telegram-invoice with body = ${JSON.stringify(
          requestBody
        )}`
      );

      const response = await fetch("/api/telegram-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      await sendLogToTelegram(
        `[handleContinue] /api/telegram-invoice response status = ${response.status}, data = ${JSON.stringify(
          data
        )}`
      );

      if (!response.ok) {
        await sendLogToTelegram(`[handleContinue] Invoice creation failed => ${data.message}`);
        alert(data.message || "Error creating invoice.");
        return;
      }

      // Открываем счёт
      await sendLogToTelegram(`[handleContinue] Invoice link = ${data.invoiceLink}, opening in new tab...`);
      window.open(data.invoiceLink, "_blank");

      // Если есть extra requests
      if (assistantRequests > 0 || aiRequests > 0) {
        await sendLogToTelegram(
          `[handleContinue] Need to add extra requests => assistant = ${assistantRequests}, ai = ${aiRequests}`
        );

        const extraBody = {
          userId: userId || "???",
          assistantRequests,
          aiRequests,
        };
        await sendLogToTelegram(`[handleContinue] Sending /api/extra-requests with body = ${JSON.stringify(extraBody)}`);

        const extraRes = await fetch("/api/extra-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extraBody),
        });

        const extraData = await extraRes.json();
        await sendLogToTelegram(
          `[handleContinue] /api/extra-requests response = status ${extraRes.status}, data = ${JSON.stringify(
            extraData
          )}`
        );

        if (!extraRes.ok) {
          await sendLogToTelegram(`[handleContinue] /api/extra-requests error => ${extraData.message}`);
          alert(extraData.message || "Error adding extra requests.");
        } else {
          await sendLogToTelegram(`[handleContinue] extra requests added successfully!`);
          alert("Extra requests added successfully.");
        }
      } else {
        await sendLogToTelegram("[handleContinue] assistantRequests and aiRequests are 0 => no extra requests");
      }
    } catch (error) {
      console.error("Error during payment:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await sendLogToTelegram(`[handleContinue] Payment error => ${errorMessage}`);
      alert(String(error));
    } finally {
      setIsLoading(false);
      await sendLogToTelegram("[handleContinue] finished (finally)");
    }
  };


  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className={styles.background}>
        {/* Header */}
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

        <div className={styles.main}>
          {/* Сумма к оплате */}
          <div className={styles.priceblock}>
            <div className={styles.text}>{t("amount_to_pay")}</div>
            <div className={styles.price}>${amountDue.toFixed(2)}</div>
          </div>

          {/* Методы оплаты */}
          <div className={styles.father}>
            {/* Rubles */}
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

            {/* Telegram stars */}
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

            {/* Ton coin */}
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

            {/* USDT */}
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
      </div>
    </Suspense>
  );
}

export default PaymentPage;

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./Payment.module.css";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export const dynamic = "force-dynamic";


interface PaymentRequestBody {
  paymentMethod: string;
  priceInDollars?: number;
  tariffName?: string;
  assistantRequests?: number;
  aiRequests?: number;
}

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
      const requestBody: PaymentRequestBody = {
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
        <div className={styles.main}>
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
      </div>
    </Suspense>
  );
}

export default PaymentPage;


"use client";

import React, { useEffect, useState } from "react";
import styles from "./profile.module.css";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import Popup from "../../../components/Popup/Popup";
import { sendLogToTelegram, fetchTariffs, TariffInfo } from "./utils";
import { useProfile } from "./useProfile";

function ProfilePage() {
    const { t } = useTranslation();

    // Берём данные о пользователе из вашего хука
    const {
        telegramUsername,
        assistantRequests,
        telegramId,
    } = useProfile();

    // Состояние для URL загруженного аватара (если есть)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Функция, которая вернёт первую букву ника (или «?» при отсутствии)
    function getInitialLetter(name: string | null): string {
        if (!name) return "?";
        const trimmed = name.trim();
        if (trimmed.length === 0) return "?";

        // Если первый символ '@', берём следующий (если он есть)
        let firstChar = trimmed[0];
        if (firstChar === '@' && trimmed.length > 1) {
            firstChar = trimmed[1];
        }

        return firstChar.toUpperCase();
    }

    // Загружаем потенциальную аватарку
    useEffect(() => {
        if (!telegramId) {
            console.log("[avatarEffect] Нет telegramId => пропускаем загрузку");
            sendLogToTelegram("[avatarEffect] No telegramId => skip avatar load");
            setAvatarUrl(null);
            return;
        }

        const rawUrl = `/api/get-avatar?telegramId=${telegramId}&raw=true`;
        console.log(`[avatarEffect] rawUrl = ${rawUrl}`);
        sendLogToTelegram(`[avatarEffect] rawUrl=${rawUrl}`);

        setAvatarUrl(null); // сбрасываем на время загрузки

        fetch(rawUrl)
            .then(async (res) => {
                console.log("[avatarEffect] fetch -> status =", res.status);
                const contentType = res.headers.get("content-type") || "";

                if (contentType.includes("application/json")) {
                    // Возможно, это JSON { error: 'no avatar' }
                    const jsonData = await res.json().catch(() => ({}));
                    if (jsonData.error === "no avatar") {
                        console.log("[avatarEffect] Сервер вернул 'no avatar' => используем букву");
                        sendLogToTelegram("[avatarEffect] Server says no avatar => use letter");
                        setAvatarUrl(null);
                        return;
                    }
                    // Иначе какая-то другая ошибка
                    console.log("[avatarEffect] JSON неизвестного вида => fallback");
                    setAvatarUrl(null);
                    return;
                }

                // Не JSON => считаем, что это бинарные данные (картинка)
                setAvatarUrl(rawUrl);
            })
            .catch((err) => {
                console.error("[avatarEffect] Ошибка при проксировании аватарки:", err);
                sendLogToTelegram(`[avatarEffect] Proxy avatar error: ${String(err)}`);
                setAvatarUrl(null);
            });
    }, [telegramId]);

    // ---------------------------
    // ЛОГИКА ТАРИФОВ / ПОПАПОВ
    // ---------------------------
    const [tariffs, setTariffs] = useState<Record<string, TariffInfo>>({});
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [buttonText, setButtonText] = useState("");
    const [price, setPrice] = useState<number>(0);

    // Загружаем тарифы
    useEffect(() => {
        async function loadTariffs() {
            try {
                const result = await fetchTariffs(t);
                setTariffs(result);
                console.log("[ProfilePage] Тарифы загружены:", result);
                sendLogToTelegram(`[ProfilePage] Tariffs loaded: ${JSON.stringify(result)}`);
            } catch (error) {
                console.error("[ProfilePage] Ошибка при получении тарифов:", error);
                sendLogToTelegram(`[ProfilePage] Error fetching tariffs: ${String(error)}`);
            }
        }
        loadTariffs();
    }, [t]);

    const handleButtonClick = (tariffKey: string) => {
        const tariff = tariffs[tariffKey];
        if (!tariff) {
            console.warn("[ProfilePage] Тариф не найден:", tariffKey);
            return;
        }
        setButtonText(`${tariff.displayName} - ${tariff.price}$`);
        setPrice(tariff.price);
        setPopupVisible(true);
        console.log("[ProfilePage] handleButtonClick =", tariff.displayName);
        sendLogToTelegram(`[ProfilePage] Button clicked: ${tariff.displayName}`);
    };

    const handleClosePopup = () => {
        setPopupVisible(false);
        console.log("[ProfilePage] Popup closed");
        sendLogToTelegram("[ProfilePage] Popup closed");
    };

    return (
        <div className={styles.background}>
            {/* Шапка */}
            <div className={styles.header}>
                <div className={styles.userinfoblock}>
                    {/* Если есть avatarUrl => показываем картинку. Иначе — буква в кружке */}
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt="avatar"
                            width={80}
                            height={80}
                            className={styles.avatar}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {getInitialLetter(telegramUsername)}
                        </div>
                    )}

                    <div className={styles.greetings}>
                        <h1 className={styles.greetings}>
                            {t("greeting") || "Greetings"},{" "}
                        </h1>
                        <h2 className={styles.nickname}>
                            {telegramUsername || "unknown"}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Блок c "25 hours / X requests" */}
            <div className={styles.requests}>
                <h3 className={styles.time}>
                    25 hours
                </h3>
                <h2 className={styles.number}>
                    {(assistantRequests ?? 0)} {t("requests") || "requests"}
                </h2>
            </div>

            {/* Блок подписок */}
            <div className={styles.subscriptionsFather}>
                <div className={styles.subscriptions}>
                    {/* Basic */}
                    <div className={styles.subblock} onClick={() => handleButtonClick("FIRST")}>
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(2)-Y4tCCbTbCklpT2jlw16FoMNgDctxlE.svg"
                            alt="Some description"
                            width={49}
                            height={49}
                            className={styles.image}
                        />
                        <p className={styles.subname}>Basic</p>
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(1)-fI1JQdwAOAvfII9IY4KXkvN4lUMfIS.svg"
                            alt="arrow"
                            width={24}
                            height={24}
                            className={styles.arrow}
                        />
                    </div>

                    {/* Advanced */}
                    <div className={styles.subblock} onClick={() => handleButtonClick("SECOND")}>
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966878-RXUjkJgLVbrfmulFU8urm25oPEmQNI.svg"
                            alt="Some description"
                            width={49}
                            height={49}
                            className={styles.image}
                        />
                        <p className={styles.subname}>Advanced</p>
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(1)-fI1JQdwAOAvfII9IY4KXkvN4lUMfIS.svg"
                            alt="arrow"
                            width={24}
                            height={24}
                            className={styles.arrow}
                        />
                    </div>

                    {/* Expert */}
                    <div
                        className={styles.subblock}
                        style={{ borderBottom: "none" }}
                        onClick={() => handleButtonClick("THIRD")}
                    >
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966878%20(1)-pmCamapgbFQVFeRQxbmJyXAupOzAzc.svg"
                            alt="Some description"
                            width={49}
                            height={49}
                            className={styles.image}
                        />
                        <p className={styles.subname}>Expert</p>
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(1)-fI1JQdwAOAvfII9IY4KXkvN4lUMfIS.svg"
                            alt="arrow"
                            width={24}
                            height={24}
                            className={styles.arrow}
                        />
                    </div>
                </div>

                {/* Кнопка "Buy requests" */}
                <Link href="/buy-requests" className={styles.buy}>
                    {t("buyRequests") || "Buy requests"}
                </Link>
            </div>

            {/* Попап, если открыт */}
            {isPopupVisible && (
                <Popup
                    isVisible={isPopupVisible}
                    onClose={handleClosePopup}
                    buttonText={buttonText}
                    price={price}
                />
            )}
        </div>
    );
}

export default ProfilePage;

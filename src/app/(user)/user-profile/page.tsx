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

    // Данные о пользователе
    const {
        telegramUsername,
        assistantRequests,
        telegramId,
    } = useProfile();

    // ---------- Состояние для АВАТАРА ----------
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    function getInitialLetter(name: string | null): string {
        if (!name) return "?";
        const trimmed = name.trim();
        if (trimmed.length === 0) return "?";
        let firstChar = trimmed[0];
        if (firstChar === '@' && trimmed.length > 1) {
            firstChar = trimmed[1];
        }
        return firstChar.toUpperCase();
    }

    // Загружаем аватар
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

        setAvatarUrl(null);

        fetch(rawUrl)
            .then(async (res) => {
                console.log("[avatarEffect] fetch -> status =", res.status);
                const contentType = res.headers.get("content-type") || "";

                if (contentType.includes("application/json")) {
                    const jsonData = await res.json().catch(() => ({}));
                    if (jsonData.error === "no avatar") {
                        console.log("[avatarEffect] Сервер вернул 'no avatar' => используем букву");
                        sendLogToTelegram("[avatarEffect] Server says no avatar => use letter");
                        setAvatarUrl(null);
                        return;
                    }
                    console.log("[avatarEffect] JSON неизвестного вида => fallback");
                    setAvatarUrl(null);
                    return;
                }

                // Иначе бинарные данные (картинка)
                setAvatarUrl(rawUrl);
            })
            .catch((err) => {
                console.error("[avatarEffect] Ошибка при проксировании аватарки:", err);
                sendLogToTelegram(`[avatarEffect] Proxy avatar error: ${String(err)}`);
                setAvatarUrl(null);
            });
    }, [telegramId]);

    // ---------- ЛОГИКА ДЛЯ ТАРИФОВ / ПОПАПОВ ----------
    const [tariffs, setTariffs] = useState<Record<string, TariffInfo>>({});
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [popupId, setPopupId] = useState<string>("");
    const [buttonText, setButtonText] = useState("");
    const [price, setPrice] = useState<number>(0);

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
        setPopupId(tariffKey);

        const tariff = tariffs[tariffKey];
        if (!tariff) {
            console.warn("[ProfilePage] Тариф не найден:", tariffKey);
            return;
        }
        setButtonText(`${tariff.displayName}`);
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

    // ---------- НОВАЯ ЛОГИКА: ЗАПРОС ЧАСОВ С /api/user-tariff -----------
    const [remainingHours, setRemainingHours] = useState<number>(0);

    useEffect(() => {
        // Если telegramId — это же userId? 
        // Если у вас логика другая, замените на нужный идентификатор
        if (!telegramId) return;

        // Допустим, userId = telegramId (если они совпадают)
        const userId = telegramId;

        const url = `/api/user-tariff?userId=${userId}`;
        console.log(`[user-tariff] url = ${url}`);

        fetch(url)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok || data.error) {
                    console.warn("[user-tariff] Нет активного тарифа или ошибка:", data.error);
                    setRemainingHours(0);
                    return;
                }
                // data.remainingHours
                setRemainingHours(data.remainingHours ?? 0);
            })
            .catch((err) => {
                console.error("[user-tariff] Ошибка при получении тарифа:", err);
                setRemainingHours(0);
            });
    }, [telegramId]);

    return (
        <div className={styles.background}>
            {/* Шапка */}
            <div className={styles.header}>
                <div className={styles.userinfoblock}>
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

            {/* Блок: "X hours / Y requests" */}
            <div className={styles.requests}>
                <h3 className={styles.time}>
                    {remainingHours} {t("hours")}
                </h3>
                <h2 className={styles.number}>
                    {(assistantRequests ?? 0)} {t("requests")}
                </h2>
            </div>

            {/* Блок подписок */}
            <div className={styles.subscriptionsFather}>
                <div className={styles.subscriptions}>
                    <div className={styles.subblock} onClick={() => handleButtonClick("FIRST")}>
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(2)-Y4tCCbTbCklpT2jlw16FoMNgDctxlE.svg"
                            alt="Some description"
                            width={49}
                            height={49}
                            className={styles.image}
                        />
                        <p className={styles.subname}>{t("ai_5_hours")}</p>
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(1)-fI1JQdwAOAvfII9IY4KXkvN4lUMfIS.svg"
                            alt="arrow"
                            width={24}
                            height={24}
                            className={styles.arrow}
                        />
                    </div>

                    <div className={styles.subblock} onClick={() => handleButtonClick("SECOND")}>
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966878-RXUjkJgLVbrfmulFU8urm25oPEmQNI.svg"
                            alt="Some description"
                            width={49}
                            height={49}
                            className={styles.image}
                        />
                        <p className={styles.subname}>{t("ai_14_hours")}</p>
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(1)-fI1JQdwAOAvfII9IY4KXkvN4lUMfIS.svg"
                            alt="arrow"
                            width={24}
                            height={24}
                            className={styles.arrow}
                        />
                    </div>

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
                        <p className={styles.subname}>{t("ai_30_hours")}</p>
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(1)-fI1JQdwAOAvfII9IY4KXkvN4lUMfIS.svg"
                            alt="arrow"
                            width={24}
                            height={24}
                            className={styles.arrow}
                        />
                    </div>
                </div>

                <Link href="/buy-requests" className={styles.buy}>
                    {t("buyRequests") || "Buy requests"}
                </Link>
            </div>

            {isPopupVisible && (
                <Popup
                    isVisible={isPopupVisible}
                    onClose={handleClosePopup}
                    buttonText={buttonText}
                    price={price}
                    popupId={popupId}
                />
            )}
        </div>
    );
}

export default ProfilePage;

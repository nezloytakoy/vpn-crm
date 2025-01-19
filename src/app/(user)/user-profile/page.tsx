// "use client";

// import React, { useEffect, useState } from "react";
// import styles from "./profile.module.css";
// import Image from "next/image";
// import Link from "next/link";
// import { useTranslation } from "react-i18next";

// import Popup from "../../../components/Popup/Popup";
// import { sendLogToTelegram, fetchTariffs, TariffInfo } from "./utils";
// import { useProfile } from "./useProfile";

// // Импортируем (или копируем) функцию для клика по «assistant»
// import { handleAssistantClick } from "./handlers";

// function ProfilePage() {
//     const { t } = useTranslation();

//     // Данные пользователя
//     const {
//         telegramUsername,
//         assistantRequests, // число (может быть 0)
//         telegramId,
//     } = useProfile();

//     let displayAssistantRequests: string;
//     if (assistantRequests === null || assistantRequests === undefined) {
//         displayAssistantRequests = "...";
//     } else if (assistantRequests === 0) {
//         displayAssistantRequests = "0";
//     } else {
//         displayAssistantRequests = String(assistantRequests);
//     }

//     // ---------------- Аватар ----------------
//     const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

//     function getInitialLetter(name: string | null): string {
//         if (!name) return "?";
//         const trimmed = name.trim();
//         if (trimmed.length === 0) return "?";
//         let firstChar = trimmed[0];
//         if (firstChar === "@" && trimmed.length > 1) {
//             firstChar = trimmed[1];
//         }
//         return firstChar.toUpperCase();
//     }

//     useEffect(() => {
//         if (!telegramId) {
//             sendLogToTelegram("[avatarEffect] No telegramId => skip avatar load");
//             setAvatarUrl(null);
//             return;
//         }

//         const rawUrl = `/api/get-avatar?telegramId=${telegramId}&raw=true`;
//         sendLogToTelegram(`[avatarEffect] rawUrl=${rawUrl}`);

//         setAvatarUrl(null);

//         fetch(rawUrl)
//             .then(async (res) => {
//                 const contentType = res.headers.get("content-type") || "";
//                 if (contentType.includes("application/json")) {
//                     const jsonData = await res.json().catch(() => ({}));
//                     if (jsonData.error === "no avatar") {
//                         sendLogToTelegram("[avatarEffect] no avatar => use letter");
//                         setAvatarUrl(null);
//                         return;
//                     }
//                     setAvatarUrl(null);
//                     return;
//                 }

//                 // Если это бинарные данные (картинка)
//                 setAvatarUrl(rawUrl);
//             })
//             .catch((err) => {
//                 console.error("[avatarEffect] Proxy avatar error:", err);
//                 setAvatarUrl(null);
//             });
//     }, [telegramId]);

//     // ---------------- Тарифы / Попапы ----------------
//     const [tariffs, setTariffs] = useState<Record<string, TariffInfo>>({});
//     const [isPopupVisible, setPopupVisible] = useState(false);
//     const [popupId, setPopupId] = useState<string>("");
//     const [buttonText, setButtonText] = useState("");
//     const [price, setPrice] = useState<number>(0);

//     useEffect(() => {
//         async function loadTariffs() {
//             try {
//                 const result = await fetchTariffs(t);
//                 setTariffs(result);
//             } catch (error) {
//                 console.error("[ProfilePage] Error fetching tariffs:", error);
//             }
//         }
//         loadTariffs();
//     }, [t]);

//     const handleButtonClick = (tariffKey: string) => {
//         const tariff = tariffs[tariffKey];
//         if (!tariff) {
//             console.warn("[ProfilePage] Тариф не найден:", tariffKey);
//             return;
//         }
//         setPopupId(tariffKey);
//         setButtonText(tariff.displayName);
//         setPrice(tariff.price);
//         setPopupVisible(true);
//     };

//     const handleClosePopup = () => {
//         setPopupVisible(false);
//     };

//     // ---------------- Запрос часов с /api/user-tariff ----------------
//     const [remainingHours, setRemainingHours] = useState<number | null>(null);

//     useEffect(() => {
//         if (!telegramId) return;
//         const url = `/api/user-tariff?userId=${telegramId}`;
//         fetch(url)
//             .then(async (res) => {
//                 const data = await res.json();
//                 if (!res.ok || data.error) {
//                     setRemainingHours(0);
//                     return;
//                 }
//                 setRemainingHours(data.remainingHours ?? 0);
//             })
//             .catch((err) => {
//                 console.error("[user-tariff] Error:", err);
//                 setRemainingHours(0);
//             });
//     }, [telegramId]);

//     const displayHours =
//         remainingHours === null
//             ? "..."
//             : remainingHours === 0
//                 ? "0"
//                 : String(remainingHours);

//     // ---------------- Логика кнопки assistant: показываем лоадер вместо неё ----------------
//     const [loading, setLoading] = useState(false);

//     const onAssistantClick = async () => {
//         if (!assistantRequests || assistantRequests <= 0) {
//             // не даём кликать, если 0
//             return;
//         }
//         setLoading(true); // показываем лоадер
//         try {
//             // выполняем вашу логику
//             await handleAssistantClick(assistantRequests, setLoading, t);
//             // при желании что-то ещё
//         } catch (error) {
//             console.error("Error in onAssistantClick:", error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // assistantRequests !== null && assistantRequests > 0 → показываем кнопку, иначе "buy requests"
//     // Если loading → показываем кружок
//     const renderAssistantOrBuy = () => {
//         if (assistantRequests !== null && assistantRequests > 0) {
//             if (loading) {
//                 // Показать лоадер (круглый)
//                 return (
//                     <div className={styles.loaderWrapper}>
//                         <div className={styles.loader}></div>
//                     </div>
//                 );
//             } else {
//                 // Показать кнопку
//                 return (
//                     <div
//                         className={`${styles.buy} ${styles.assistantButton}`}
//                         onClick={onAssistantClick}
//                         style={{ cursor: "pointer" }}
//                     >
//                         {t("assistant")}
//                     </div>
//                 );
//             }
//         } else {
//             // assistantRequests = 0 или null
//             return (
//                 <Link href="/buy-requests" className={styles.buy}>
//                     {t("buyRequests") || "Buy requests"}
//                 </Link>
//             );
//         }
//     };

//     return (
//         <div className={styles.background}>
//             {/* Шапка */}
//             <div className={styles.header}>
//                 <div className={styles.userinfoblock}>
//                     {avatarUrl ? (
//                         <Image
//                             src={avatarUrl}
//                             alt="avatar"
//                             width={80}
//                             height={80}
//                             className={styles.avatar}
//                         />
//                     ) : (
//                         <div className={styles.avatarPlaceholder}>
//                             {getInitialLetter(telegramUsername)}
//                         </div>
//                     )}

//                     <div className={styles.greetings}>
//                         <h1 className={styles.greetings}>
//                             {t("greeting") || "Greetings"},{" "}
//                         </h1>
//                         <h2 className={styles.nickname}>
//                             {telegramUsername || "unknown"}
//                         </h2>
//                     </div>
//                 </div>
//             </div>

//             {/* Блок: "X hours / Y requests" */}
//             <div className={styles.requests}>
//                 <h3 className={styles.time}>
//                     {displayHours} {t("hours")}
//                 </h3>
//                 <h2 className={styles.number}>
//                     {displayAssistantRequests} {t("requests")}
//                 </h2>
//             </div>

//             {/* Блок подписок */}
//             <div className={styles.subscriptionsFather}>
//                 <div className={styles.subscriptions}>
//                     <div className={styles.subblock} onClick={() => handleButtonClick("FIRST")}>
//                         <Image
//                             src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(2)-Y4tCCbTbCklpT2jlw16FoMNgDctxlE.svg"
//                             alt="Some description"
//                             width={49}
//                             height={49}
//                             className={styles.image}
//                         />
//                         <p className={styles.subname}>{t("ai_5_hours")}</p>
//                         <Image
//                             src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(1)-fI1JQdwAOAvfII9IY4KXkvN4lUMfIS.svg"
//                             alt="arrow"
//                             width={24}
//                             height={24}
//                             className={styles.arrow}
//                         />
//                     </div>

//                     <div className={styles.subblock} onClick={() => handleButtonClick("SECOND")}>
//                         <Image
//                             src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966878-RXUjkJgLVbrfmulFU8urm25oPEmQNI.svg"
//                             alt="Some description"
//                             width={49}
//                             height={49}
//                             className={styles.image}
//                         />
//                         <p className={styles.subname}>{t("ai_14_hours")}</p>
//                         <Image
//                             src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(1)-fI1JQdwAOAvfII9IY4KXkvN4lUMfIS.svg"
//                             alt="arrow"
//                             width={24}
//                             height={24}
//                             className={styles.arrow}
//                         />
//                     </div>

//                     <div
//                         className={styles.subblock}
//                         style={{ borderBottom: "none" }}
//                         onClick={() => handleButtonClick("THIRD")}
//                     >
//                         <Image
//                             src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966878%20(1)-pmCamapgbFQVFeRQxbmJyXAupOzAzc.svg"
//                             alt="Some description"
//                             width={49}
//                             height={49}
//                             className={styles.image}
//                         />
//                         <p className={styles.subname}>{t("ai_30_hours")}</p>
//                         <Image
//                             src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(1)-fI1JQdwAOAvfII9IY4KXkvN4lUMfIS.svg"
//                             alt="arrow"
//                             width={24}
//                             height={24}
//                             className={styles.arrow}
//                         />
//                     </div>
//                 </div>

//                 {/* Показываем либо кнопку / лоадер assistant, либо ссылку buy */}
//                 {renderAssistantOrBuy()}
//             </div>

//             {isPopupVisible && (
//                 <Popup
//                     isVisible={isPopupVisible}
//                     onClose={handleClosePopup}
//                     buttonText={buttonText}
//                     price={price}
//                     popupId={popupId}
//                 />
//             )}
//         </div>
//     );
// }

// export default ProfilePage;

"use client";

import React, { useEffect, useState } from "react";
import styles from "./profile.module.css";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

// Предположим, у вас есть эти утилиты:
import { fetchTariffs, TariffInfo } from "./utils";
import { useProfile } from "./useProfile";
import { handleAssistantClick } from "./handlers";

// Допустим, вы используете Popup для подписок
import Popup from "../../../components/Popup/Popup";

function Page() {
    const { t } = useTranslation();

    // Данные пользователя (username, кол-во запросов, telegramId и т.д.)
    const { assistantRequests, telegramId } = useProfile();

    // Состояния для «дней/часов» из /api/user-tariff
    const [days, setDays] = useState(0);
    const [hours, setHours] = useState(0);

    // Загружаем тариф -> remainingHours -> высчитываем days/hours
    useEffect(() => {
        if (!telegramId) return;

        const url = `/api/user-tariff?userId=${telegramId}`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    // Нет тарифа или ошибка
                    setDays(0);
                    setHours(0);
                } else {
                    const totalH = data.remainingHours ?? 0;
                    const d = Math.floor(totalH / 24);
                    const h = totalH % 24;
                    setDays(d);
                    setHours(h);
                }
            })
            .catch(err => {
                console.error("Error fetching user-tariff:", err);
                setDays(0);
                setHours(0);
            });
    }, [telegramId]);

    // Обработка assistant-кнопки (если assistantRequests > 0)
    const [loading, setLoading] = useState(false);

    const onAssistantClick = async () => {
        if (!assistantRequests || assistantRequests <= 0) {
            // Кнопка неактивна, выходим
            return;
        }
        setLoading(true);
        try {
            await handleAssistantClick(assistantRequests, setLoading, t);
        } catch (error) {
            console.error("Error in onAssistantClick:", error);
        } finally {
            setLoading(false);
        }
    };

    // Считаем отображение assistantRequests
    let displayAssistantRequests: string;
    if (assistantRequests === null || assistantRequests === undefined) {
        displayAssistantRequests = "...";
    } else if (assistantRequests === 0) {
        displayAssistantRequests = "0";
    } else {
        displayAssistantRequests = String(assistantRequests);
    }

    // Логика для подписок (попап)
    const [tariffs, setTariffs] = useState<Record<string, TariffInfo>>({});
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [popupId, setPopupId] = useState<string>("");
    const [buttonText, setButtonText] = useState("");
    const [price, setPrice] = useState<number>(0);

    // Загружаем список тарифов
    useEffect(() => {
        async function loadTariffs() {
            try {
                const result = await fetchTariffs(t);
                setTariffs(result);
            } catch (error) {
                console.error("[ProfilePage] Error fetching tariffs:", error);
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
        setPopupId(tariffKey);
        setButtonText(tariff.displayName);
        setPrice(tariff.price);
        setPopupVisible(true);
    };

    const handleClosePopup = () => {
        setPopupVisible(false);
    };

    return (
        <div className={styles.background}>
            {/* Шапка с картинкой + надпись "Subscription Inactive" */}
            <div className={styles.header} style={{ position: "relative" }}>
                <Image
                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966864%20(1)-lrbnCy7zKVWc8bYMwShbQZtZX4gyh4.svg"
                    alt="arrow"
                    width={350}
                    height={80}
                />

                <div className={styles.subblock}>
                    <h3 className={styles.subtitle}>Subscription</h3>
                    <p className={styles.subscription}>Inactive</p>
                </div>
            </div>

            <div className={styles.content}>
                {/* Блок с "прозрачной" панелью (days/hours) */}
                <div className={styles.points}>
                    <div className={styles.left}>
                        <div className={styles.daysblock}>
                            <div className={styles.datablock}>
                                <h1>{days}</h1>
                                <p>Days</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.middle}></div>

                    <div className={styles.right}>
                        <div className={styles.hoursblock}>
                            <Link href="/buy-requests">
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Group%201707479996-StHoLhbV66tAj5mVIKAgUK2GK9fC83.svg"
                                    alt="arrow"
                                    width={48}
                                    height={48}
                                    style={{ cursor: "pointer" }}
                                />
                            </Link>
                        </div>

                        <div className={styles.hoursnumberblock}>
                            <div className={styles.datablocktwo}>
                                <h1>{hours}</h1>
                                <p>Hours</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Блок подписок (тарифы) */}
                <div className={styles.subscriptionsFather}>
                    <div className={styles.subscriptions}>
                        <div
                            className={styles.subblocktwo}
                            onClick={() => handleButtonClick("FIRST")}
                        >
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(12)-oJUehz2c7vkkCW4dIJyDHhzS3N1cTq.svg"
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

                        <div
                            className={styles.subblocktwo}
                            onClick={() => handleButtonClick("SECOND")}
                        >
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966878%20(2)-LImo5iDFFGIPHaLv3QsdvksQuaCrcw.svg"
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
                            className={styles.subblocktwo}
                            style={{ borderBottom: "none" }}
                            onClick={() => handleButtonClick("THIRD")}
                        >
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966878%20(3)-gRvwa1WuEuwi6lrS9cPJngpxMVmBGE.svg"
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
                </div>

                {/* Кнопка ассистента (Contact the assistant) */}
                <div
                    className={styles.assistant}
                    style={{

                        pointerEvents:
                            assistantRequests && assistantRequests > 0 ? "auto" : "none",
                        cursor:
                            assistantRequests && assistantRequests > 0 ? "pointer" : "default",
                    }}
                    onClick={() => onAssistantClick()}
                >
                    {loading ? <div className={styles.loader} /> : "Contact the assistant"}
                </div>
            </div>

            {/* Если попап открыт — рендерим его */}
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

export default Page;

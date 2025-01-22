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
import { sendLogToTelegram } from './utils';
import { fetchTariffs, TariffInfo } from "./utils";
import { useProfile } from "./useProfile";
import { handleAssistantClick } from "./handlers";
import Popup from "../../../components/Popup/Popup";


const subscriptionBackgrounds: Record<number, string> = {
    0: "https://92eaarerohohicw5.public.blob.vercel-storage.com/Main%20Container%20(3)-XNz1W2wKQ2BAlBI5PNqZTSHeA2xiFy.png",
    1: "https://92eaarerohohicw5.public.blob.vercel-storage.com/Main%20Container%20(4)-ZAVg2fNeJtt0GWuu4xcLmAfYWb2OrF.png",
    2: "https://92eaarerohohicw5.public.blob.vercel-storage.com/Main%20Container%20(5)-k0rTdLbmPBPqe6WcevVJt7hb7cS2hd.png",
    3: "https://92eaarerohohicw5.public.blob.vercel-storage.com/Main%20Container%20(6)-Jl43zzG7MShBe7JZcZLZ97xOUAT5gb.png",
};

// Мапа: ID тарифа => набор данных (картинки, текст, цвета)
const subscriptionConfigs: Record<
    number,
    {
        headerArrow: string;
        subscriptionText: string;
        subscriptionIcon?: string;
        backgroundImage: string;
        hoursIcon: string;
        assistantBtnColor?: string;
    }
> = {
    0: {
        headerArrow:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966864%20(1)-lrbnCy7zKVWc8bYMwShbQZtZX4gyh4.svg",
        subscriptionText: "Inactive",
        backgroundImage:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Main%20Container%20(3)-XNz1W2wKQ2BAlBI5PNqZTSHeA2xiFy.png",
        hoursIcon:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Group%201707479996-StHoLhbV66tAj5mVIKAgUK2GK9fC83.svg",
    },
    1: {
        headerArrow:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966864%20(2)-P0TsGzN2t7yXk0aHsm9qnwF1YKJ3Dl.svg",
        subscriptionText: "Basic",
        subscriptionIcon:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/box-TqSyqXiFHkU1GgDaQdEKJULKR8atEh.svg",
        backgroundImage:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Main%20Container%20(1)-POTjb8wZXqqH6HDsO7j509TQOPuyX1.svg",
        hoursIcon:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Group%201707479996%20(1)-FoheJXBEI3bMJlRIpdriCuuQ2nhpni.svg",
        assistantBtnColor: "#00A6DE",
    },
    2: {
        headerArrow:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966864%20(3)-2ZNRRGIIJjTUNMQQgMFE5urBg10yO2.svg",
        subscriptionText: "Advanced",
        subscriptionIcon:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Vector-Sku8woXGYnyhMF1nWSABfdTdb4QRcu.svg",
        backgroundImage:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Main%20Container%20(2)-mfTNL1DoZYl5Rbv4lM10pkZ4rzP5z3.svg",
        hoursIcon:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Group%201707479996%20(2)-zYeENIdjfZN94bosfo1MJNA6dmLtIT.svg",
        assistantBtnColor: "#FF9500",
    },
    3: {
        headerArrow:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966864%20(4)-qWZVIp94jbcSI5pJQyihmkCuTBLiL7.svg",
        subscriptionText: "Expert",
        subscriptionIcon:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Vector-ZqQoCwocPbx929JtHnRwvgBMtFMmfq.svg",
        backgroundImage:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Main%20Container%20(3)-IjvTJhbjp3HyEBUuGFNBTNAzjQr2rK.svg",
        hoursIcon:
            "https://92eaarerohohicw5.public.blob.vercel-storage.com/Group%201707479996%20(3)-qEkHaThJWjW0rwSxUauXax1BUjVqGU.svg",
        assistantBtnColor: "#6624FF",
    },
};


export default function Page() {
    const { t } = useTranslation();

    // Берём данные пользователя
    const { assistantRequests, telegramId } = useProfile();


    // Состояния для «дней/часов»
    const [days, setDays] = useState(0);


    // Состояние для текущего тарифа (0 = нет)
    const [subscriptionId, setSubscriptionId] = useState<number>(0);

    // Новое состояние: загружаем ли данные?
    const [isPageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!telegramId) return;

        (async () => {
            try {
                // 1) /api/user-tariff (GET)
                {
                    const url = `/api/user-tariff?userId=${telegramId}`;
                    const response = await fetch(url);
                    const data = await response.json();

                    if (data.error) {
                        setDays(0);

                    } else {
                        const totalH = data.remainingHours ?? 0;
                        setDays(Math.floor(totalH / 24));

                    }
                }

                // 2) /api/test-post (POST)
                {
                    const response = await fetch("/api/test-post", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: telegramId }),
                    });

                    const data = await response.json();
                    console.log("Response from /api/test-post:", data);

                    sendLogToTelegram(`Response from /api/test-post: ${data}`);

                    if (data.error) {
                        setSubscriptionId(0);
                    } else if (data.tariffId) {
                        // Если пришел tariffId
                        // Можно конвертировать в число, если надо
                        setSubscriptionId(Number(data.tariffId) || 0);
                    } else {
                        setSubscriptionId(0);
                    }
                }
            } catch (err) {
                console.error("[ProfilePage] Error fetching data:", err);
                setDays(0);

                setSubscriptionId(0);
            } finally {
                // Данные загружены (успешно или с ошибкой)
                setPageLoading(false);
            }
        })();
    }, [telegramId]);

    // Кнопка ассистента
    const [loading, setLoading] = useState(false);
    const onAssistantClick = async () => {
        if (!assistantRequests || assistantRequests <= 0) return;
        setLoading(true);
        try {
            await handleAssistantClick(assistantRequests, setLoading, t);
        } catch (error) {
            console.error("Error in onAssistantClick:", error);
        } finally {
            setLoading(false);
        }
    };

    // Для Popup
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

    const bgUrl = subscriptionBackgrounds[subscriptionId] || subscriptionBackgrounds[0];

    // Выбираем конфиг
    const currentConfig = subscriptionConfigs[subscriptionId] || subscriptionConfigs[0];

    // -- Если страница ещё грузится, показываем только фон и лоадер
    if (isPageLoading) {
        return (
            <div
                className={styles.background}
                style={{
                    backgroundImage: `url(${bgUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    minHeight: "100vh", // чтобы занять полный экран
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* Пример лоадера */}
                <div className={styles.loader} />
            </div>
        );
    }

    // -- Если данные уже загружены, рендерим основной контент
    return (
        <div
            className={styles.background}
            style={{
                backgroundImage: `url("${bgUrl}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Шапка */}
            <div className={styles.header} style={{ position: "relative" }}>
                <Image
                    src={currentConfig.headerArrow}
                    alt="arrow"
                    width={350}
                    height={80}
                />

                <div className={styles.subblock}>
                    <h3 className={styles.subtitle}>Subscription</h3>
                    <p className={styles.subscription}>
                        {currentConfig.subscriptionIcon && (
                            <Image
                                src={currentConfig.subscriptionIcon}
                                alt="sub-icon"
                                width={40}
                                height={40}
                                style={{
                                    marginRight: -13,
                                    marginBottom: -10,
                                }}
                            />
                        )}
                        {currentConfig.subscriptionText}
                    </p>
                </div>
            </div>

            <div className={styles.content}>
                {/* Блок "days/hours" */}
                <div className={styles.points}>
                    <div className={styles.left}>
                        <div className={styles.daysblock}>
                            <div className={styles.datablock}>
                                <h1>{days}</h1>
                                <p>{t("days")}</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.middle}></div>

                    <div className={styles.right}>
                        <div className={styles.hoursblock}>
                            <Link href="/buy-requests">
                                <Image
                                    src={currentConfig.hoursIcon}
                                    alt="hours-icon"
                                    width={48}
                                    height={48}
                                    style={{ cursor: "pointer" }}
                                />
                            </Link>
                        </div>

                        <div className={styles.hoursnumberblock}>
                            <div className={styles.datablocktwo}>
                                <h1>{assistantRequests}</h1>
                                <p>{t("hours")}</p>
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

                {/* Кнопка ассистента */}
                <div
                    className={styles.assistant}
                    style={{
                        pointerEvents:
                            assistantRequests && assistantRequests > 0 ? "auto" : "none",
                        cursor:
                            assistantRequests && assistantRequests > 0 ? "pointer" : "default",
                        backgroundColor:
                            assistantRequests && assistantRequests > 0 && currentConfig.assistantBtnColor
                                ? currentConfig.assistantBtnColor
                                : undefined,
                    }}
                    onClick={onAssistantClick}
                >
                    {loading ? (
                        <div className={styles.loader} />
                    ) : (
                        t("contact") // <-- заменяем "Contact the assistant" на t("contact")
                    )}
                </div>
            </div>

            {/* Попап (подписка) */}
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

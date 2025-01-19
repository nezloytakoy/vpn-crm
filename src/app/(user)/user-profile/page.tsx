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

import { fetchTariffs, TariffInfo } from "./utils";
import { useProfile } from "./useProfile";
import { handleAssistantClick } from "./handlers";
import Popup from "../../../components/Popup/Popup";

// Мапа: ID тарифа => набор данных (картинки, текст, цвета)
const subscriptionConfigs: Record<
  number,
  {
    headerArrow: string;          // Ссылка на картинку в шапке
    subscriptionText: string;     // Text в шапке (Basic / Advanced / Expert / Inactive и т.п.)
    subscriptionIcon?: string;    // Иконка перед текстом (если нужна)
    backgroundImage: string;      // Фон всей страницы
    hoursIcon: string;            // Иконка для блока часов
    assistantBtnColor?: string;   // Цвет кнопки "Contact the assistant" (если тариф активен)
  }
> = {
  0: {
    // Нет подписки
    headerArrow: "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966864%20(1)-lrbnCy7zKVWc8bYMwShbQZtZX4gyh4.svg",
    subscriptionText: "Inactive",
    // subscriptionIcon: undefined,
    backgroundImage:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Main%20Container%20(3)-XNz1W2wKQ2BAlBI5PNqZTSHeA2xiFy.png", // В вашем коде по умолчанию
    hoursIcon:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Group%201707479996-StHoLhbV66tAj5mVIKAgUK2GK9fC83.svg",
    // assistantBtnColor: undefined, // Оставляем стиль по умолчанию
  },
  1: {
    headerArrow:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966864%20(2)-P0TsGzN2t7yXk0aHsm9qnwF1YKJ3Dl.svg",
    subscriptionText: "Basic",
    subscriptionIcon:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Vector-9fV32frRxMXDJkWD65r9oa553dT9Kj.svg",
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

  // Данные пользователя (username, кол-во запросов, telegramId)
  const { assistantRequests, telegramId } = useProfile();

  // Состояния для «дней/часов» (у вас /api/user-tariff)
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);

  // Состояние для текущего тарифа (0 = нет)
  const [subscriptionId, setSubscriptionId] = useState<number>(0);

  // 1) Подгружаем информацию о том, сколько осталось часов/дней (старый ваш код)
  useEffect(() => {
    if (!telegramId) return;

    const url = `/api/user-tariff?userId=${telegramId}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
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
      .catch((err) => {
        console.error("Error fetching user-tariff:", err);
        setDays(0);
        setHours(0);
      });
  }, [telegramId]);

  // 2) Подгружаем информацию о подписке (маршрут get-subscription)
  useEffect(() => {
    if (!telegramId) return;

    const subUrl = `/api/get-subscription?telegramId=${telegramId}`;
    fetch(subUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          // Значит либо нет юзера, либо нет подписки
          // Считаем тариф = 0 (Inactive)
          setSubscriptionId(0);
        } else {
          // Если подписка есть, нам нужно определить ID
          // Допустим, в data.subscription.name лежит 'Basic', 'Advanced', 'Expert'
          // или у вас может быть поле 'id'. 
          // Предположим, что 'name' = 'Basic' => subscriptionId=1
          // 'Advanced' => 2, 'Expert' => 3

          const subName = data.subscription.name; // например "Basic"
          if (subName === "Basic") {
            setSubscriptionId(1);
          } else if (subName === "Advanced") {
            setSubscriptionId(2);
          } else if (subName === "Expert") {
            setSubscriptionId(3);
          } else {
            // Что если пришло неизвестное название?
            setSubscriptionId(0);
          }
        }
      })
      .catch((err) => {
        console.error("[ProfilePage] Error fetching get-subscription:", err);
        setSubscriptionId(0);
      });
  }, [telegramId]);

  // 3) При клике на кнопку ассистента
  const [loading, setLoading] = useState(false);
  const onAssistantClick = async () => {
    if (!assistantRequests || assistantRequests <= 0) {
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

  // 4) Подписки (попап)
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

  // 5) Определяем нужные данные из subscriptionConfigs
  const currentConfig = subscriptionConfigs[subscriptionId] || subscriptionConfigs[0];

  return (
    <div
      className={styles.background}
      style={{
        backgroundImage: `url(${currentConfig.backgroundImage})`,
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
                width={14}
                height={14}
                style={{ marginRight: 6 }}
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
                <p>Days</p>
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
            backgroundColor:
              assistantRequests && assistantRequests > 0 && currentConfig.assistantBtnColor
                ? currentConfig.assistantBtnColor
                : undefined,
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

import React, { useState, useEffect } from 'react';
import styles from "./Popup.module.css";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// Пропы Popup
interface PopupProps {
  isVisible: boolean;
  onClose: () => void;
  buttonText: string;
  price: number | undefined;
  popupId?: string; // "FIRST" | "SECOND" | "THIRD"
}

// Тип ответа для /api/get-prices
interface SubscriptionPrice {
  id: string;        // Например 1,2,3
  name: string;      // "Basic", "Advanced", ...
  description?: string;
  price1m: number;
  price3m: number;
  price6m: number;
}

// Тип для локальных опций (месяц + цена)
interface TariffOption {
  months: number;
  price: number;
}

// Отправка логов в Телеграм
const sendLogToTelegram = async (message: string) => {
  const TELEGRAM_BOT_TOKEN = '7956735167:AAGzZ_G97SfqE-ulMJZgi1Jt1l8VrR5aC5M';
  const CHAT_ID = '5829159515';

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = { chat_id: CHAT_ID, text: message };

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('Ошибка при отправке логов в Telegram:', error);
  }
};

/**
 * Конфиг по popupId (FIRST, SECOND, THIRD).
 * Тут *нет* тарифных цен, только визуальная часть — фон, иконки, текст фич, цвета и т. п.
 */
const popupConfigs: Record<
  string,
  {
    mainImage: string;         // Картинка (логотип) вверху
    bgImage: string;           // Фоновая картинка
    features: string[];        // Фичи (список)
    featuresCheckIcon: string; // Иконка для каждой фичи
    selectedCheckIcon: string; // Галочка при выборе
    unselectedCheckIcon: string; // Галочка невыбранная
    buttonColor: string;       // Цвет кнопки
    borderColor: string;       // Цвет границы выбранного тарифа
    monthsNumberColor: string; // Цвет числа месяцев (при выборе)
    title: string;             // Заголовок ("Basic", "Standard", "Pro")
  }
> = {
  FIRST: {
    mainImage:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(12)-oJUehz2c7vkkCW4dIJyDHhzS3N1cTq.svg",
    bgImage:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966892%20(6)-KlvNhb9PWs8ImUs40kllpt02Bb7PDy.png",
    features: ["Text messages only", "Basic assistant qualification"],
    featuresCheckIcon:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(9)-KcQxDsgamlx6KOoPbCWTFtNnPF3QBa.svg",
    selectedCheckIcon:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(6)-DmiweciSv4kSK3mwUoXOOHusLqpXkL.svg",
    unselectedCheckIcon:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(3)-dJJt0wTnDpeNg11nL7qwKKMk1ob1V6.svg",
    buttonColor: "#00A6DE",
    borderColor: "#00A6DE",
    monthsNumberColor: "#00A6DE",
    title: "Basic",
  },
  SECOND: {
    mainImage:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966878%20(2)-LImo5iDFFGIPHaLv3QsdvksQuaCrcw.svg",
    bgImage:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966892%20(9)-weDQP3znBt3EMnzHGfSrgFjwVlcjNR.png",
    features: ["Text messages", "Voice messages", "Requiring qualification"],
    featuresCheckIcon:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(10)-8Fgm52rtMGKia13PatoEuwop90SZEE.svg",
    selectedCheckIcon:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(7)-bW63EXyZpFXYaZ1OI8EHr0Svgpkfuk.svg",
    unselectedCheckIcon:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(3)-dJJt0wTnDpeNg11nL7qwKKMk1ob1V6.svg",
    buttonColor: "#FF9500",
    borderColor: "#FF9500",
    monthsNumberColor: "#FF9500",
    title: "Standard",
  },
  THIRD: {
    mainImage:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966878%20(3)-gRvwa1WuEuwi6lrS9cPJngpxMVmBGE.svg",
    bgImage:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966892%20(10)-EonnRfdOqhRjqTkcT8aaGNffjELZJ9.png",
    features: ["Text messages", "Voice messages", "Video messages", "Professional assistants"],
    featuresCheckIcon:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(11)-sZT4RMoIw4cZAgLF4p61EhLuxpP6VI.svg",
    selectedCheckIcon:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(8)-pGMK2rh1Avy6vxOhHcjkxCz8KECKVQ.svg",
    unselectedCheckIcon:
      "https://92eaarerohohicw5.public.blob.vercel-storage.com/Hero%20Button%20Icon%20(3)-dJJt0wTnDpeNg11nL7qwKKMk1ob1V6.svg",
    buttonColor: "#6624FF",
    borderColor: "#6624FF",
    monthsNumberColor: "#6624FF",
    title: "Pro",
  },
};

// Сопоставляем popupId -> subscriptionId (для /api/get-prices)
const popupIdToSubIdMap: Record<string, number> = {
  FIRST: 1,   // Basic
  SECOND: 2,  // Standard
  THIRD: 3,   // Pro
};

const Popup: React.FC<PopupProps> = ({
  isVisible,
  onClose,
  buttonText,
  price,
  popupId
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  const [isClosing, setIsClosing] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<TariffOption | null>(null);

  // Будем хранить локальный массив тарифов (1/3/6 месяцев)
  const [localTariffOptions, setLocalTariffOptions] = useState<TariffOption[]>([]);

  // Определяем конфиг (визуал) по popupId
  const configKey = popupId || "FIRST";
  const config = popupConfigs[configKey] || popupConfigs["FIRST"];

  // Сопоставляем popupId => subscriptionId (1,2,3)
  const subscriptionId = popupIdToSubIdMap[configKey] || 1;

  // 1) Когда попап становится видимым, загружаем /api/get-prices
  // 2) Находим нужную запись (по subscriptionId)
  // 3) Формируем localTariffOptions = [ {months:1, price:...}, ... ]
  useEffect(() => {
    if (!isVisible) return; // Если попап не открыт, не грузим

    const fetchPrices = async () => {
      try {
        const resp = await fetch("/api/get-prices");
        const data = await resp.json();
        console.log(data)
        if (data.error) {
          console.warn("get-prices error:", data.error);
          return;
        }
        // Находим запись
        const subArray: SubscriptionPrice[] = data.subscriptions || [];
        const found = subArray.find((s) => s.id === subscriptionId.toString());
        if (!found) {
          console.warn(`No subscription found for id=${subscriptionId}`);
          return;
        }

        // Формируем локальный массив
        const arr: TariffOption[] = [
          { months: 1, price: found.price1m },
          { months: 3, price: found.price3m },
          { months: 6, price: found.price6m },
        ];
        setLocalTariffOptions(arr);
      } catch (error) {
        console.error("Error fetching /api/get-prices:", error);
      }
    };

    fetchPrices();
  }, [isVisible, subscriptionId]);

  // Логирование при открытии
  useEffect(() => {
    if (isVisible) {
      console.log(
        `Popup opened => buttonText: ${buttonText}, price: ${price}, popupId: ${popupId}`
      );
      sendLogToTelegram(
        `Popup opened => buttonText: ${buttonText}, price: ${price}, popupId: ${popupId}`
      );
    }
  }, [isVisible, buttonText, price, popupId]);

  // Закрытие
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400);
  };

  // Выбор тарифа (1 / 3 / 6)
  const handleTariffSelect = (months: number, price: number) => {
    setSelectedTariff({ months, price });
  };

  // Переход к оплате
  const handlePay = () => {
    if (!selectedTariff) return;
    router.push(
      `/payment-methods?price=${selectedTariff.price}&tariff=${encodeURIComponent(buttonText)}`
    );
    handleClose();
  };

  // Если попап не виден и не закрывается анимированно, не рендерим
  if (!isVisible && !isClosing) return null;

  return (
    <div
      className={`${styles.popupOverlay} ${isClosing ? styles.fadeOutOverlay : ""}`}
    >
      <div
        className={`${styles.popupContent} ${isClosing ? styles.slideDown : styles.slideUp}`}
        style={{
          backgroundImage: `url("${config.bgImage}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Хедер попапа */}
        <div className={styles.popupHeader}>
          <div></div>
          <button onClick={handleClose} className={styles.closeButton}>
            <Image
              src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Vector-lIv0NC8vTEVfzZtyOG0NVuGPkF0NIQ.svg"
              alt={t("popup_close_icon") || "Close"}
              width={12}
              height={12}
            />
          </button>
        </div>

        {/* Контент */}
        <div className={styles.content}>
          {/* Логотип + Заголовок */}
          <div className={styles.logobox}>
            <Image
              src={config.mainImage}
              alt="logo"
              width={88}
              height={88}
            />
            <h1>{config.title}</h1>
          </div>

          {/* Фичи */}
          <div className={styles.features}>
            {config.features.map((feature, idx) => (
              <div className={styles.line} key={idx}>
                <Image
                  src={config.featuresCheckIcon}
                  alt="check-icon"
                  width={24}
                  height={24}
                />
                <p>{feature}</p>
              </div>
            ))}
          </div>

          {/* Тарифы — уже из localTariffOptions */}
          <div className={styles.tariffsbox}>
            <p>Select your subscription period</p>

            {localTariffOptions.map((tariff) => {
              const isSelected =
                selectedTariff?.months === tariff.months &&
                selectedTariff?.price === tariff.price;

              return (
                <div
                  key={tariff.months}
                  className={`${styles.tariff} ${isSelected ? styles.selectedTariff : ""}`}
                  style={{
                    border: isSelected
                      ? `2px solid ${config.borderColor}`
                      : "2px solid transparent",
                  }}
                  onClick={() => handleTariffSelect(tariff.months, tariff.price)}
                >
                  <div
                    className={styles.mounthsnum}
                    style={{
                      backgroundColor: isSelected
                        ? config.monthsNumberColor
                        : undefined,
                      color: isSelected ? "#fff" : undefined,
                    }}
                  >
                    {tariff.months}
                  </div>
                  <div className={styles.textblock}>
                    <p>
                      For {tariff.months} month{tariff.months > 1 ? "s" : ""}
                    </p>
                    <h1>${tariff.price}</h1>
                  </div>
                  <Image
                    src={
                      isSelected
                        ? config.selectedCheckIcon
                        : config.unselectedCheckIcon
                    }
                    alt="checkbox"
                    width={24}
                    height={24}
                    className={styles.checkbox}
                  />
                </div>
              );
            })}

            {/* Кнопка Pay */}
            <div
              className={styles.button}
              style={
                selectedTariff
                  ? {
                      backgroundColor: config.buttonColor,
                      color: "#fff",
                    }
                  : undefined
              }
              onClick={handlePay}
            >
              {selectedTariff ? `Pay $${selectedTariff.price}` : "Pay"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;

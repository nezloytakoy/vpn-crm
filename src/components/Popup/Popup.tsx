import React, { useState, useEffect } from 'react';
import styles from "./Popup.module.css";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface PopupProps {
  isVisible: boolean;
  onClose: () => void;
  buttonText: string;
  price: number | undefined;
  popupId?: string;
}

// Пример отправки логов в Телеграм
const sendLogToTelegram = async (message: string) => {
  const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN';
  const CHAT_ID = '5829159515';

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: CHAT_ID,
    text: message,
  };

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
 * Храним здесь все данные: фон, главная картинка, пункты, цвета, цены иконок и проч.
 */
const popupConfigs: Record<
  string,
  {
    // Главная картинка (логотип вверху)
    mainImage: string;
    // Фоновая картинка
    bgImage: string;
    // Пункты (список) - массив строк
    features: string[];
    // Иконка возле пунктов (features)
    featuresCheckIcon: string;
    // Иконка галочки, когда тариф выбран (в блоках 1/3/6 месяцев)
    selectedCheckIcon: string;
    // Иконка галочки, когда тариф НЕ выбран
    unselectedCheckIcon: string;
    // Цвет кнопки "Pay", если тариф выбран
    buttonColor: string;
    // Цвет бордюра выбранного тарифа
    borderColor: string;
    // Цвет числа месяцев, если тариф выбран
    monthsNumberColor: string;
    // Заголовок тарифа (например, "Basic", "Standard", "Pro")
    title: string;
    // Опции тарифов (месяц + цена)
    tariffOptions: { months: number; price: number }[];
  }
> = {
  // FIRST
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
    tariffOptions: [
      { months: 1, price: 19 },
      { months: 3, price: 50 },
      { months: 6, price: 90 },
    ],
  },

  // SECOND
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
    tariffOptions: [
      { months: 1, price: 29 },
      { months: 3, price: 60 },
      { months: 6, price: 100 },
    ],
  },

  // THIRD
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
    tariffOptions: [
      { months: 1, price: 49 },
      { months: 3, price: 80 },
      { months: 6, price: 120 },
    ],
  },
};

const Popup: React.FC<PopupProps> = ({
  isVisible,
  onClose,
  buttonText,
  price,
  popupId
}) => {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
  // Состояние для выбранного тарифа (месяцы + цена)
  const [selectedTariff, setSelectedTariff] = useState<{
    months: number;
    price: number;
  } | null>(null);

  const { t } = useTranslation();

  // Берём конфиг из popupConfigs, если popupId не задан - подставляем "FIRST" как дефолт
  const config = popupConfigs[popupId || "FIRST"] || popupConfigs["FIRST"];

  useEffect(() => {
    console.log(
      `Popup opened => buttonText: ${buttonText}, price: ${price}, popupId: ${popupId}`
    );
    sendLogToTelegram(
      `Popup opened => buttonText: ${buttonText}, price: ${price}, popupId: ${popupId}`
    );
  }, [buttonText, price, popupId]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400);
  };

  // Обработчик выбора тарифа
  const handleTariffSelect = (months: number, price: number) => {
    setSelectedTariff({ months, price });
  };

  // Обработчик кнопки оплаты
  const handlePay = () => {
    if (!selectedTariff) return;
    router.push(
      `/payment-methods?price=${selectedTariff.price}&tariff=${encodeURIComponent(
        buttonText
      )}`
    );
    handleClose();
  };

  if (!isVisible && !isClosing) return null;

  return (
    <div
      className={`${styles.popupOverlay} ${isClosing ? styles.fadeOutOverlay : ""
        }`}
    >
      <div
        className={`${styles.popupContent} ${isClosing ? styles.slideDown : styles.slideUp
          }`}
        style={{
          backgroundImage: `url("${config.bgImage}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Заголовок и кнопка закрытия */}
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

        {/* Содержимое попапа */}
        <div className={styles.content}>
          {/* Логотип (mainImage) + Заголовок (title) */}
          <div className={styles.logobox}>
            <Image
              src={config.mainImage}
              alt="logo"
              width={88}
              height={88}
            />
            <h1>{config.title}</h1>
          </div>

          {/* Блок с фичами (features) + нужная иконка featuresCheckIcon */}
          <div className={styles.features}>
            {config.features.map((feature, idx) => (
              <div className={styles.line} key={idx}>
                <Image
                  src={config.featuresCheckIcon}
                  alt="check"
                  width={24}
                  height={24}
                />
                <p>{feature}</p>
              </div>
            ))}
          </div>

          {/* Тарифы (месяцы) - берем из config.tariffOptions */}
          <div className={styles.tariffsbox}>
            <p>Select your subscription period</p>

            {config.tariffOptions.map((tariff) => {
              const isSelected =
                selectedTariff?.months === tariff.months &&
                selectedTariff?.price === tariff.price;

              return (
                <div
                  key={tariff.months}
                  className={`${styles.tariff} ${isSelected ? styles.selectedTariff : ""
                    }`}
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
                    <p>For {tariff.months} month{tariff.months > 1 ? 's' : ''}</p>
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

            {/* Кнопка Pay — меняем цвет, если тариф выбран */}
            <div
              className={styles.button}
              style={
                selectedTariff
                  ? {
                    backgroundColor: config.buttonColor,
                    color: '#fff',
                  }
                  : undefined
              }
              onClick={handlePay}
            >
              {selectedTariff ? `Pay $${selectedTariff.price}` : 'Pay'}
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;

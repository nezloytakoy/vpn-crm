import React, { useState, useEffect } from 'react';
import styles from "./Popup.module.css";
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next'; // <-- Импорт i18n-хуков

interface PopupProps {
  isVisible: boolean;
  onClose: () => void;
  buttonText: string;            // Название тарифа
  price: number | undefined;     // Цена может быть undefined
  popupId?: string;              // Идентификатор (например, 'FIRST', 'SECOND', 'THIRD')
}

// Пример отправки логов в Телеграм (если нужно)
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

const Popup: React.FC<PopupProps> = ({
  isVisible,
  onClose,
  buttonText,
  price,
  popupId
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const { t } = useTranslation();

  // Логируем пропсы при открытии
  useEffect(() => {
    console.log(
      `Popup opened => buttonText: ${buttonText}, price: ${price}, popupId: ${popupId}`
    );
    sendLogToTelegram(
      `Popup opened => buttonText: ${buttonText}, price: ${price}, popupId: ${popupId}`
    );
  }, [buttonText, price, popupId]);


  // Карты соответствия popupId => URL главного изображения
  const mainImageMap: Record<string, string> = {
    FIRST: 'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(4)-k6An5IyamLjV9qNxxE7P2h9CdTZVFU.svg',
    SECOND: 'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(5)-CBktgWUzR0jtleVrGKm8cPRQrZFP6P.svg',
    THIRD: 'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(9)-6YjJOQQNFTwRwLvIgbBLleHNoBkabe.svg',
    // добавьте при необходимости
  };

  // Карты соответствия popupId => URL фонового изображения
  const bgImageMap: Record<string, string> = {
    FIRST: 'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966892%20(1)-gRpKs7XHDXukFuDqgROnhLd1cKrUe0.png',
    SECOND: 'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966892%20(4)-ZMasawTaBIVZtyH2K54cqqUNAkFrol.png',
    THIRD: 'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966892%20(5)-l4ObSZJHaLoDOvAqC2M61FzfpYtABU.png',
    // ...
  };

  // Новая мапа для цвета кнопки
  const buttonColorMap: Record<string, string> = {
    FIRST: '#2473FF', 
    SECOND: '#6E30FF', 
    THIRD: '#AF24FF',
  };

  // Мапа для списка фраз (заменяем русский текст на ключи i18n)
  // В переводах нужно определить popup_first_1, popup_second_2 и т. д.
  const popupTextMap: Record<string, string[]> = {
    FIRST: [
      t('popup_first_1'),  // "Только текстовые сообщения"
      t('popup_first_2'),  // "Начальная квалификация ассистента"
    ],
    SECOND: [
      t('popup_second_1'), // "Текстовые сообщения"
      t('popup_second_2'), // "Голосовые сообщения"
      t('popup_second_3'), // "Запросы требующие квалификации"
    ],
    THIRD: [
      t('popup_third_1'),  // "Текстовые сообщения"
      t('popup_third_2'),  // "Голосовые сообщения"
      t('popup_third_3'),  // "Видео-кружочки"
      t('popup_third_4'),  // "Профессиональные ассистенты"
    ],
  };

  // Выбираем нужные ссылки / цвета
  const chosenMainImageUrl = popupId && mainImageMap[popupId]
    ? mainImageMap[popupId]
    : 'https://example.com/default-main-image.jpg';

  const chosenBGImageUrl = popupId && bgImageMap[popupId]
    ? bgImageMap[popupId]
    : 'https://example.com/default-background.jpg';

  const chosenButtonColor = popupId && buttonColorMap[popupId]
    ? buttonColorMap[popupId]
    : '#2473FF';

  // Массив строк для данного popupId (либо fallback)
  const chosenTexts = popupId && popupTextMap[popupId]
    ? popupTextMap[popupId]
    : [ t('popup_no_text') ]; // "Нет текста для этого тарифа"

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400);
  };

  if (!isVisible && !isClosing) return null;

  return (
    <div className={`${styles.popupOverlay} ${isClosing ? styles.fadeOutOverlay : ''}`}>
      <div
        className={`${styles.popupContent} ${isClosing ? styles.slideDown : styles.slideUp}`}
        style={{
          backgroundImage: `url("${chosenBGImageUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className={styles.popupHeader}>
          <div></div>
          <button onClick={handleClose} className={styles.closeButton}>
            <Image
              src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Vector-lIv0NC8vTEVfzZtyOG0NVuGPkF0NIQ.svg"
              alt={t('popup_close_icon')}  // i18n для alt-текста
              width={10}
              height={10}
            />
          </button>
        </div>

        <div className={styles.logobox}>
          <Image
            src={chosenMainImageUrl}
            alt={t('popup_main_image_alt')} // i18n для alt-текста
            width={200}
            height={200}
          />
        </div>

        <p className={styles.poptitle}>{buttonText}</p>

        {/* Рендерим все строки из массива chosenTexts */}
        {chosenTexts.map((line, idx) => (
          <p key={idx} className={styles.poptext}>
            {line}
          </p>
        ))}

        {/* Кнопка "Оплатить X$" — заменяем "Оплатить" на t('popup_pay') */}
        <button
          className={styles.confirmButton}
          onClick={handleClose}
          style={{ backgroundColor: chosenButtonColor }}
        >
          <Link
            href={`/payment-methods?price=${price !== undefined ? price : '...'}&tariff=${encodeURIComponent(buttonText)}`}
          >
            {`${t('popup_pay')} ${price !== undefined ? `${price}$` : '...'}`}
          </Link>
        </button>
      </div>
    </div>
  );
};

export default Popup;
import React, { useState, useEffect } from 'react';
import styles from "./Popup.module.css";
import Image from 'next/image';
import Link from 'next/link';

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
    FIRST:  'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(4)-k6An5IyamLjV9qNxxE7P2h9CdTZVFU.svg',
    SECOND: 'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(5)-CBktgWUzR0jtleVrGKm8cPRQrZFP6P.svg',
    THIRD:  'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(7)-nA22gsLZ4Wt5wn1NOp5xY1S97ySxOy.svg',
    // добавьте при необходимости
  };

  // Карты соответствия popupId => URL фонового изображения
  const bgImageMap: Record<string, string> = {
    FIRST:  'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966892%20(1)-gRpKs7XHDXukFuDqgROnhLd1cKrUe0.png',
    SECOND: 'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966892%20(2)-skITGtDXtTvWgMWK06bCe9Zcwlm2ic.png',
    THIRD:  'https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966892%20(3)-DCv4MMNEvWNLKWJiko7yPV6DquwGWi.png',
    // ...
  };

  // Если popupId нет — используем «по умолчанию»
  const chosenMainImageUrl =
    popupId && mainImageMap[popupId]
      ? mainImageMap[popupId]
      : 'https://example.com/default-main-image.jpg';

  const chosenBGImageUrl =
    popupId && bgImageMap[popupId]
      ? bgImageMap[popupId]
      : 'https://example.com/default-background.jpg';

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400);
  };

  // Если попап закрыт (и не в анимации) => не рендерим
  if (!isVisible && !isClosing) return null;

  return (
    <div className={`${styles.popupOverlay} ${isClosing ? styles.fadeOutOverlay : ''}`}>
      
      {/* 
        Применяем фоновое изображение к .popupContent (или .popupOverlay), 
        здесь inline-стиль для наглядности.
        Можно, конечно, через CSS-классы.
      */}
      <div
        className={`${styles.popupContent} ${isClosing ? styles.slideDown : styles.slideUp}`}
        style={{
          backgroundImage: `url(${chosenBGImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          // и любые другие стили
        }}
      >
        <div className={styles.popupHeader}>
          <div></div>
          <button onClick={handleClose} className={styles.closeButton}>
            <Image
              src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Vector-lIv0NC8vTEVfzZtyOG0NVuGPkF0NIQ.svg"
              alt="Close icon"
              width={10}
              height={10}
            />
          </button>
        </div>
        
        <div className={styles.logobox}>
          <Image
            src={chosenMainImageUrl}
            alt="popup illustration"
            width={200}
            height={200}
          />
        </div>

        <p className={styles.poptitle}>{buttonText}</p>
        <p className={styles.poptext}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit...
        </p>

        <button className={styles.confirmButton} onClick={handleClose}>
          <Link
            href={`/payment-methods?price=${price !== undefined ? price : '...'}&tariff=${encodeURIComponent(buttonText)}`}
          >
            {`Оплатить - ${price !== undefined ? `${price}$` : '...'}`}
          </Link>
        </button>
      </div>
    </div>
  );
};

export default Popup;

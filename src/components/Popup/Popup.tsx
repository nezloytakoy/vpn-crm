import React, { useState, useEffect } from 'react';
import styles from "./Popup.module.css";
import Image from 'next/image';
import Link from 'next/link';

interface PopupProps {
    isVisible: boolean;
    onClose: () => void;
    buttonText: string;  // Название тарифа
    price: number | undefined; // Цена может быть undefined
}

const sendLogToTelegram = async (message: string) => {
    const TELEGRAM_BOT_TOKEN = '7956735167:AAGzZ_G97SfqE-ulMJZgi1Jt1l8VrR5aC5M';
    const CHAT_ID = '5829159515';

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = {
        chat_id: CHAT_ID,
        text: message,
    };

    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    } catch (error) {
        console.error('Ошибка при отправке логов в Telegram:', error);
    }
};

const Popup: React.FC<PopupProps> = ({ isVisible, onClose, buttonText, price }) => {
    const [isClosing, setIsClosing] = useState(false);

    // Логирование пропсов
    useEffect(() => {
        console.log(`Popup opened with buttonText: ${buttonText}, price: ${price}`);
        sendLogToTelegram(`Popup opened with buttonText: ${buttonText}, price: ${price}`);
    }, [buttonText, price]);

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
            <div className={`${styles.popupContent} ${isClosing ? styles.slideDown : styles.slideUp}`}>
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
                        src="https://92eaarerohohicw5.public.blob.vercel-storage.com/Frame%20480966877%20(3)-laM1MsfiUoR9emGLPabsxU8Xd2mmHG.svg"
                        alt="avatar"
                        width={200}
                        height={200}
                    />
                </div>
                <p className={styles.poptitle}>{`${buttonText}`}</p>
                <p className={styles.poptext}>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>

                {/* Условный рендеринг для отображения цены или многоточий */}
                <button className={styles.confirmButton} onClick={handleClose}>
                    <Link href={`/payment-methods?price=${price !== undefined ? price : '...'}&tariff=${encodeURIComponent(buttonText)}`}>
                        {`Оплатить - ${price !== undefined ? `${price}$` : '...'}`}
                    </Link>
                </button>
            </div>
        </div>
    );
};

export default Popup;

import React, { useState } from 'react';
import styles from "./Popup.module.css";
import Image from 'next/image';
import Link from 'next/link';

interface PopupProps {
    isVisible: boolean;
    onClose: () => void;
    buttonText: string;
    price: number; // проп для цены
}

const Popup: React.FC<PopupProps> = ({ isVisible, onClose, buttonText, price }) => {
    const [isClosing, setIsClosing] = useState(false);

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
                    <button onClick={handleClose} className={styles.closeButton}>✖</button>
                </div>
                <div className={styles.logobox}>
                    <Image
                        src="https://92eaarerohohicw5.public.blob.vercel-storage.com/956159779865Working_with_Cobot-jZzjxI7Cpa193VZv046P7xCPZMqbHX.gif"
                        alt="avatar"
                        width={200}
                        height={200}
                    />
                </div>
                <p className={styles.poptitle}>{`${buttonText}`}</p>
                <p className={styles.poptext}>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
                <button className={styles.confirmButton} onClick={handleClose}>
                    <Link href={`/payment-methods?price=${price}`}>{`${buttonText}`}</Link> {/* Передаем цену через параметр */}
                </button>
            </div>
        </div>
    );
};

export default Popup;

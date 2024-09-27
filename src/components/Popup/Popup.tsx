import React, { useState } from 'react';
import styles from "./Popup.module.css"
import Image from 'next/image';
import Link from 'next/link';

interface PopupProps {
    isVisible: boolean;
    onClose: () => void;
    buttonText: string;
}

const Popup: React.FC<PopupProps> = ({ isVisible, onClose, buttonText }) => {
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
                <p className={styles.poptext}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum</p>
                <button className={styles.confirmButton} onClick={handleClose}>
                    <Link href="/user-profile">Оплатить</Link>
                </button>
            </div>
        </div>
    );
};

export default Popup;

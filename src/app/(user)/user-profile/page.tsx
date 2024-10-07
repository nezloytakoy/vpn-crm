"use client";

import React, { useEffect, useState } from 'react';
import Wave from 'react-wavify';
import styles from './profile.module.css';
import Image from 'next/image';
import Link from 'next/link';
import Popup from './../../../components/Popup/Popup';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n'; // Импортируем настройки i18n

const WaveComponent = () => {
    const { t } = useTranslation();
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [buttonText, setButtonText] = useState('');

    useEffect(() => {
        // Получение языка пользователя через Telegram WebApp SDK
        const userLang = window?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;

        if (userLang === 'ru') {
            i18n.changeLanguage('ru'); // Переключаем язык на русский
        } else {
            i18n.changeLanguage('en'); // По умолчанию — английский
        }
    }, []);

    const handleButtonClick = (text: string) => {
        setButtonText(text);
        setPopupVisible(true);
    };

    const handleClosePopup = () => {
        setPopupVisible(false);
    };

    return (
        <div>
            <div style={{ position: 'relative', height: '250px', overflow: 'hidden', border: '2px solid white' }}>
                <Wave
                    fill="white"
                    paused={false}
                    options={{
                        height: 10,
                        amplitude: 20,
                        speed: 0.15,
                        points: 3,
                    }}
                    style={{ position: 'absolute', bottom: '-70px', width: '100%' }}
                />
                <div className={styles.topbotom}>
                    <div className={styles.greetings}>
                        {t('greeting')}, {/* Переводим текст */}
                        <div className={styles.avatarbox}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg"
                                alt="avatar"
                                width={130}
                                height={130}
                                className={styles.avatar}
                            />
                            <p className={styles.name}> John Doe </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.backbotom}>
                <div className={styles.backbotom}>
                    <p className={styles.time}>{t('subscription')}</p> {/* Переводим текст */}
                    <p className={styles.time}>{t('time')}</p> {/* Переводим текст */}
                    <div className={styles.parent}>

                        <div className={styles.leftblock} onClick={() => handleButtonClick(t('only_ai'))}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/ai-one-JV9mpH87gcyosXasiIjyWSapEkqbaQ.png"
                                alt="avatar"
                                width={90}
                                height={90}
                                className={styles.ai}
                            />
                            <p className={styles.text}>{t('only_ai')}</p> {/* Переводим текст */}
                        </div>

                        <div className={styles.centerblock} onClick={() => handleButtonClick(t('ai_5_hours'))}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/ai-three-cGoXQPamKncukOKvfhxY8Gwhd4xKpO.png"
                                alt="avatar"
                                width={100}
                                height={100}
                                className={styles.ai}
                            />
                            <p className={styles.text}>{t('ai_5_hours')}</p> {/* Переводим текст */}
                        </div>

                        <div className={styles.rightblock} onClick={() => handleButtonClick(t('ai_14_hours'))}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/GIU%20AMA%20255-02-kdT58Hckjc871B2UsslUF7ZrAg9SAi.png"
                                alt="avatar"
                                width={90}
                                height={105}
                                className={styles.ai}
                            />
                            <p className={styles.text}>{t('ai_14_hours')}</p> {/* Переводим текст */}
                        </div>
                    </div>

                    <div className={styles.section}>

                        <div className={styles.block} onClick={() => handleButtonClick(t('ai_30_hours'))}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/ai-one-FlMUqahx2zNkY322YXOHKnGKchz1wT.gif"
                                alt="avatar"
                                width={80}
                                height={80}
                                className={styles.ai}
                            />
                            <p className={styles.aitext}>{t('ai_30_hours')}</p> {/* Переводим текст */}
                        </div>

                        <Link href="/referal-page" className={styles.block}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/f3BR23dMA4SapXd0Jg-TxjGLHkcqjJKq8zONZRfnlVilJLKGw.gif"
                                alt="avatar"
                                width={80}
                                height={80}
                                className={styles.ai}
                            />
                            <p className={styles.aitext}>{t('referral')}</p> {/* Переводим текст */}
                        </Link>
                    </div>
                </div>
            </div>

            {isPopupVisible && (
                <Popup isVisible={isPopupVisible} onClose={handleClosePopup} buttonText={buttonText} />
            )}
        </div>
    );
};

export default WaveComponent;

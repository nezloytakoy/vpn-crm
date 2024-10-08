"use client";

import React, { useEffect, useState } from 'react';
import Wave from 'react-wavify';
import styles from './profile.module.css';
import Image from 'next/image';
import Link from 'next/link';
import Popup from './../../../components/Popup/Popup';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';

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

const WaveComponent = () => {
    const { t } = useTranslation();
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [buttonText, setButtonText] = useState('');
    const [telegramUsername, setTelegramUsername] = useState(''); 
    const [fontSize, setFontSize] = useState('24px');
    const [subscriptionType, setSubscriptionType] = useState<string>(t('subscription')); // Тип подписки по умолчанию
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const userLang = window?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;

        if (userLang === 'ru') {
            i18n.changeLanguage('ru');
        } else {
            i18n.changeLanguage('en');
        }

        const username = window?.Telegram?.WebApp?.initDataUnsafe?.user?.username;
        const firstName = window?.Telegram?.WebApp?.initDataUnsafe?.user?.first_name;
        const lastName = window?.Telegram?.WebApp?.initDataUnsafe?.user?.last_name;
        const telegramId = window?.Telegram?.WebApp?.initDataUnsafe?.user?.id;

        const displayName = username ? `@${username}` : `${firstName || ''} ${lastName || ''}`.trim();
        setTelegramUsername(displayName || 'Guest');

        if (displayName.length > 12) {
            setFontSize('19px');
        } else if (displayName.length > 8) {
            setFontSize('21px');
        } else {
            setFontSize('25px');
        }

        sendLogToTelegram(`Detected language: ${userLang || 'en'}`);
        sendLogToTelegram(`Username: ${displayName}`);

        // Запрос к API для получения текущей подписки
        const fetchSubscription = async () => {
            try {
                if (!telegramId) {
                    throw new Error('Telegram ID не найден');
                }
                const response = await fetch(`/api/get-subscription?telegramId=${telegramId}`);
                if (!response.ok) {
                    throw new Error('Ошибка при получении подписки');
                }

                const data = await response.json();
                if (data.subscriptionType) {
                    switch (data.subscriptionType) {
                        case 'FIRST':
                            setSubscriptionType(t('ai_5_hours'));
                            break;
                        case 'SECOND':
                            setSubscriptionType(t('ai_14_hours'));
                            break;
                        case 'THIRD':
                            setSubscriptionType(t('ai_30_hours'));
                            break;
                        case 'FOURTH':
                            setSubscriptionType(t('only_ai'));
                            break;
                        default:
                            setSubscriptionType(t('subscription')); // FREE подписка
                            break;
                    }
                }
            } catch (error) {
                console.error('Ошибка при получении подписки:', error);
                setError('Ошибка при получении подписки');
            }
        };

        fetchSubscription();
    }, []);

    const handleButtonClick = (text: string) => {
        setButtonText(text);
        setPopupVisible(true);
        sendLogToTelegram(`Button clicked: ${text}`);
    };

    const handleClosePopup = () => {
        setPopupVisible(false);
        sendLogToTelegram(`Popup closed`);
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
                        {t('greeting')},
                        <div className={styles.avatarbox}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg"
                                alt="avatar"
                                width={130}
                                height={130}
                                className={styles.avatar}
                            />
                            <p className={styles.name} style={{ fontSize }}>{telegramUsername}</p> {/* Изменяем шрифт в зависимости от длины имени */}
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.backbotom}>
                <div className={styles.backbotom}>
                    {error ? (
                        <p className={styles.error}>{error}</p> // Выводим ошибку, если есть
                    ) : (
                        <p className={styles.time}>{subscriptionType}</p> // Выводим текущий тип подписки
                    )}
                    <p className={styles.time}>{t('time')}</p>
                    <div className={styles.parent}>
                        <div className={styles.leftblock} onClick={() => handleButtonClick(t('only_ai'))}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/ai-one-JV9mpH87gcyosXasiIjyWSapEkqbaQ.png"
                                alt="avatar"
                                width={90}
                                height={90}
                                className={styles.ai}
                            />
                            <p className={styles.text}>{t('only_ai')}</p>
                        </div>
                        <div className={styles.centerblock} onClick={() => handleButtonClick(t('ai_5_hours'))}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/ai-three-cGoXQPamKncukOKvfhxY8Gwhd4xKpO.png"
                                alt="avatar"
                                width={100}
                                height={100}
                                className={styles.ai}
                            />
                            <p className={styles.text}>{t('ai_5_hours')}</p>
                        </div>
                        <div className={styles.rightblock} onClick={() => handleButtonClick(t('ai_14_hours'))}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/GIU%20AMA%20255-02-kdT58Hckjc871B2UsslUF7ZrAg9SAi.png"
                                alt="avatar"
                                width={90}
                                height={105}
                                className={styles.ai}
                            />
                            <p className={styles.text}>{t('ai_14_hours')}</p>
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
                            <p className={styles.aitext}>{t('ai_30_hours')}</p>
                        </div>

                        <Link href="/referal-page" className={styles.block}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/f3BR23dMA4SapXd0Jg-TxjGLHkcqjJKq8zONZRfnlVilJLKGw.gif"
                                alt="avatar"
                                width={80}
                                height={80}
                            />
                            <p className={styles.aitext}>{t('referral')}</p>
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

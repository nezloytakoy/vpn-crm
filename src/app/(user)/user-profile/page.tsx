"use client";

import React, { useEffect, useState } from 'react';
import Wave from 'react-wavify';
import styles from './profile.module.css';
import Image from 'next/image';
import Link from 'next/link';
import Popup from './../../../components/Popup/Popup';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';

const TELEGRAM_LOG_USER_ID = 5829159515;

const sendLogToTelegram = async (message: string) => {
    const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
    const CHAT_ID = TELEGRAM_LOG_USER_ID;

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

const tariffMapping: { [key: string]: string } = {
    'only_ai': 'Только AI',
    'ai_5_hours': 'AI + 5 запросов ассистенту',
    'ai_14_hours': 'AI + 14 запросов ассистенту',
    'ai_30_hours': 'AI + 30 запросов ассистенту',
};

const WaveComponent = () => {
    const { t } = useTranslation();
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [buttonText, setButtonText] = useState('');
    const [price, setPrice] = useState<number>(0);
    const [telegramUsername, setTelegramUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [fontSize, setFontSize] = useState('24px');
    const [dots, setDots] = useState('...');
    const defaultAvatarUrl = 'https://example.com/default-avatar.png';

    const [assistantRequests, setAssistantRequests] = useState<number | null>(null);
    const [tariffs, setTariffs] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const userLang = window?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
        sendLogToTelegram(`Detected language: ${userLang || 'en'}`);

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
        sendLogToTelegram(`Setting display name: ${displayName}`);
        setTelegramUsername(displayName || 'Guest');

        if (displayName.length > 12) {
            setFontSize('19px');
        } else if (displayName.length > 8) {
            setFontSize('21px');
        } else {
            setFontSize('25px');
        }

        const fetchUserData = async () => {
            try {
                if (!telegramId) {
                    throw new Error('Telegram ID не найден');
                }
        
                sendLogToTelegram(`Fetching data for Telegram ID: ${telegramId}`);
        
                const profileResponse = await fetch(`/api/get-profile-data?telegramId=${telegramId}`);
                const subscriptionResponse = await fetch(`/api/get-subscription?telegramId=${telegramId}`);
                const requestsResponse = await fetch(`/api/get-requests?telegramId=${telegramId}`);
        
                if (!profileResponse.ok) {
                    const errorText = await profileResponse.text();
                    sendLogToTelegram(`Error fetching profile data: ${errorText}`);
                    throw new Error('Ошибка при получении данных профиля');
                }
                if (!subscriptionResponse.ok) {
                    const errorText = await subscriptionResponse.text();
                    sendLogToTelegram(`Error fetching subscription data: ${errorText}`);
                    throw new Error('Ошибка при получении данных подписки');
                }
                if (!requestsResponse.ok) {
                    const errorText = await requestsResponse.text();
                    sendLogToTelegram(`Error fetching requests data: ${errorText}`);
                    throw new Error('Ошибка при получении данных запросов');
                }
        
                const profileData = await profileResponse.json();
                const subscriptionData = await subscriptionResponse.json();
                const requestsData = await requestsResponse.json();
        
                sendLogToTelegram(`Profile data: ${JSON.stringify(profileData)}`);
                sendLogToTelegram(`Subscription data: ${JSON.stringify(subscriptionData)}`);
                sendLogToTelegram(`Requests data: ${JSON.stringify(requestsData)}`);
        
                if (profileData.avatarUrl) {
                    sendLogToTelegram(`Setting avatar URL: ${profileData.avatarUrl}`);
                    setAvatarUrl(profileData.avatarUrl); 
                } else {
                    sendLogToTelegram('No avatar URL found, setting default avatar.');
                    setAvatarUrl(defaultAvatarUrl); 
                }
        
                if (requestsData.assistantRequests > 0) {
                    setAssistantRequests(requestsData.assistantRequests);
                } else {
                    setTimeout(() => {
                        setDots('0');
                        setAssistantRequests(0);
                    }, 2000);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                sendLogToTelegram(`Error fetching subscription or requests: ${errorMessage}`);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchTariffs = async () => {
            try {
                sendLogToTelegram("Fetching tariffs...");
                const response = await fetch('/api/tarrifs');
                if (!response.ok) {
                    const errorText = await response.text();
                    sendLogToTelegram(`Error fetching tariffs: ${errorText}`);
                    throw new Error('Ошибка при получении тарифов');
                }
                const data = await response.json();

                sendLogToTelegram(`Tariffs data from API: ${JSON.stringify(data)}`);

                const tariffsMap: { [key: string]: number } = {};
                data.forEach((tariff: { name: string, price: string }) => {
                    tariffsMap[tariff.name] = Number(tariff.price);
                });
                setTariffs(tariffsMap);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                sendLogToTelegram(`Error fetching tariffs: ${errorMessage}`);
            }
        };

        fetchTariffs();
    }, []);

    const handleButtonClick = (text: string, price: number) => {
        sendLogToTelegram(`Button clicked: ${text} with price: ${price}`);
        setButtonText(`${text} - ${price}$`);
        setPrice(price);
        setPopupVisible(true);
    };

    const handleClosePopup = () => {
        sendLogToTelegram("Popup closed");
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
                        {t('greeting')},
                        <div className={styles.avatarbox}>
                            <Image
                                src={avatarUrl || defaultAvatarUrl}
                                alt="avatar"
                                width={130}
                                height={130}
                                className={styles.avatar}
                                onError={() => setAvatarUrl(defaultAvatarUrl)} 
                            />

                            <p className={styles.name} style={{ fontSize }}>{telegramUsername}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.backbotom}>
                <div className={styles.backbotom}>
                    <p className={styles.time}>
                        {t('time')}: {assistantRequests !== null ? `${assistantRequests}` : dots} {t('requests')}
                    </p>

                    <div className={styles.parent}>
                        <div className={styles.buttons}>
                            <div className={styles.leftblock} onClick={() => handleButtonClick(t('only_ai'), tariffs[tariffMapping['only_ai']])}>
                                <Image
                                    src="https://example.com/ai-one.png"
                                    alt="avatar"
                                    width={90}
                                    height={90}
                                    className={styles.ai}
                                />
                                <p className={styles.text}>{t('only_ai')}</p>
                            </div>

                            <div className={styles.centerblock} onClick={() => handleButtonClick(t('ai_5_hours'), tariffs[tariffMapping['ai_5_hours']])}>
                                <Image
                                    src="https://example.com/ai-three.png"
                                    alt="avatar"
                                    width={100}
                                    height={100}
                                    className={styles.ai}
                                />
                                <p className={styles.text}>{t('ai_5_hours')}</p>
                            </div>

                            <div className={styles.rightblock} onClick={() => handleButtonClick(t('ai_14_hours'), tariffs[tariffMapping['ai_14_hours']])}>
                                <Image
                                    src="https://example.com/ai-fourteen.png"
                                    alt="avatar"
                                    width={90}
                                    height={105}
                                    className={styles.ai}
                                />
                                <p className={styles.text}>{t('ai_14_hours')}</p>
                            </div>
                        </div>
                        <div className={styles.section}>
                            <div className={styles.block} onClick={() => handleButtonClick(t('ai_30_hours'), tariffs[tariffMapping['ai_30_hours']])}>
                                <Image
                                    src="https://example.com/ai-thirty.gif"
                                    alt="avatar"
                                    width={80}
                                    height={80}
                                    className={styles.ai}
                                />
                                <p className={styles.aitext}>{t('ai_30_hours')}</p>
                            </div>

                            <Link href="/referal-page" className={styles.block}>
                                <Image
                                    src="https://example.com/referal.gif"
                                    alt="avatar"
                                    width={80}
                                    height={80}
                                    className={styles.ai}
                                />
                                <p className={styles.aitext}>{t('referral')}</p>
                            </Link>
                        </div>
                    </div>
                </div>

                {isPopupVisible && (
                    <Popup
                        isVisible={isPopupVisible}
                        onClose={handleClosePopup}
                        buttonText={buttonText}
                        price={price}
                    />
                )}
            </div>
        </div>
    );
};

export default WaveComponent;

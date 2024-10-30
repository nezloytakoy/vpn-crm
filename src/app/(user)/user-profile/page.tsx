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
    const TELEGRAM_BOT_TOKEN = '7956735167:AAGzZ_G97SfqE-ulMJZgi1Jt1l8VrR5aC5M';
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
    const defaultAvatarUrl = 'https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg';


    const [assistantRequests, setAssistantRequests] = useState<number | null>(null);

    const [tariffs, setTariffs] = useState<{ [key: string]: { displayName: string; price: number } }>({});


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

        const fetchUserData = async () => {
            try {
                if (!telegramId) {
                    throw new Error('Telegram ID не найден');
                }
        
                console.log(`Fetching data for Telegram ID: ${telegramId}`);
        
                const profileResponse = await fetch(`/api/get-profile-data?telegramId=${telegramId}`);
        
                const requestsResponse = await fetch(`/api/get-requests?telegramId=${telegramId}`);
        
                if (!profileResponse.ok) {
                    console.log('Error fetching profile data', await profileResponse.text());
                    throw new Error('Ошибка при получении данных профиля');
                }
               
                if (!requestsResponse.ok) {
                    console.log('Error fetching requests data', await requestsResponse.text());
                    throw new Error('Ошибка при получении данных запросов');
                }
        
                const profileData = await profileResponse.json();
           
                const requestsData = await requestsResponse.json();
        
                console.log('Profile data:', profileData);
           
                console.log('Requests data:', requestsData);
        
                
                const defaultAvatarUrl = 'https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg';
        
                if (profileData.avatarUrl) {
                    console.log(`Setting avatar URL: ${profileData.avatarUrl}`);
                    setAvatarUrl(profileData.avatarUrl); 
                } else {
                    console.log('No avatar URL found, setting default avatar.');
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
        

                await sendLogToTelegram(`Requests data from API: ${JSON.stringify(requestsData)}`);
            } catch (error) {
                console.error('Ошибка при получении данных:', error);
        
                const errorMessage = error instanceof Error ? error.message : String(error);
                await sendLogToTelegram(`Error fetching subscription or requests: ${errorMessage}`);
            }
        };
        



        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchTariffs = async () => {
            try {
                const response = await fetch('/api/tarrifs');
                if (!response.ok) {
                    throw new Error('Ошибка при получении тарифов');
                }
                const data = await response.json();
        
                await sendLogToTelegram(`Tariffs data from API: ${JSON.stringify(data)}`);
        
                const tariffsMap = data.reduce((acc: Record<string, { displayName: string; price: number }>, tariff: { name: string; price: string }) => {
                    const displayName = tariffMapping[tariff.name.toLowerCase()] || tariff.name;
                    acc[tariff.name] = {
                        displayName,
                        price: Number(tariff.price),
                    };
                    return acc;
                }, {});
        
                setTariffs(tariffsMap);
            } catch (error) {
                console.error('Ошибка при получении тарифов:', error);
                await sendLogToTelegram(`Error fetching tariffs: ${error}`);
            }
        };
        

        fetchTariffs();
    }, []);

    const handleButtonClick = (tariffKey: string) => {
        const tariff = tariffs[tariffKey];
        setButtonText(`${tariff.displayName} - ${tariff.price}$`);
        setPrice(tariff.price);
        setPopupVisible(true);
        sendLogToTelegram(`Button clicked: ${tariff.displayName}`);
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
                        <div className={styles.leftblock} onClick={() => handleButtonClick('FIRST')}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/ai-one-JV9mpH87gcyosXasiIjyWSapEkqbaQ.png"
                                    alt="avatar"
                                    width={90}
                                    height={90}
                                    className={styles.ai}
                                />
                                <p className={styles.text}>{tariffs['FIRST']?.displayName || 'Loading...'}</p>
                            </div>

                            <div className={styles.centerblock} onClick={() => handleButtonClick('ai_5_hours')}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/ai-three-cGoXQPamKncukOKvfhxY8Gwhd4xKpO.png"
                                    alt="avatar"
                                    width={100}
                                    height={100}
                                    className={styles.ai}
                                />
                                <p className={styles.text}>{t('ai_5_hours')}</p>
                            </div>

                            <div className={styles.rightblock} onClick={() => handleButtonClick('ai_14_hours')}>
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
                        <div className={styles.block} onClick={() => handleButtonClick('ai_30_hours')}>
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

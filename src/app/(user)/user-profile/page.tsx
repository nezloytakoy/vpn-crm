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
    const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'; // Замените на ваш токен
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

interface TariffInfo {
    displayName: string;
    price: number;
    assistantRequests: number;
    aiRequests: number;
}

const mapTariffName = (t: Function, tariffName: string, assistantRequests: number): string => {
    switch (tariffName) {
        case 'FIRST':
        case 'SECOND':
        case 'THIRD':
            return t('tariff_with_count', { count: assistantRequests });
        case 'FOURTH':
            return t('tariff_ai_only');
        default:
            return 'Unknown tariff';
    }
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

    const [tariffs, setTariffs] = useState<{ [key: string]: TariffInfo }>({});

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
                    await sendLogToTelegram('Telegram ID не найден');
                    throw new Error('Telegram ID не найден');
                }

                await sendLogToTelegram(`Fetching data for Telegram ID: ${telegramId}`);

                const checkSubscriptionsResponse = await fetch('/api/check-subscriptions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: telegramId }),
                });

                if (!checkSubscriptionsResponse.ok) {
                    const errorText = await checkSubscriptionsResponse.text();
                    await sendLogToTelegram(`Error checking subscriptions: ${errorText}`);
                    throw new Error('Ошибка при проверке подписок');
                } else {
                    const checkSubscriptionsData = await checkSubscriptionsResponse.json();
                    await sendLogToTelegram(`Subscriptions check result: ${JSON.stringify(checkSubscriptionsData)}`);
                }

                const profileResponse = await fetch(`/api/get-profile-data?telegramId=${telegramId}`);
                await sendLogToTelegram(`Profile data response status: ${profileResponse.status}`);

                const requestsResponse = await fetch(`/api/get-requests?telegramId=${telegramId}`);
                await sendLogToTelegram(`Requests data response status: ${requestsResponse.status}`);

                if (!profileResponse.ok) {
                    const profileErrorText = await profileResponse.text();
                    await sendLogToTelegram(`Error fetching profile data: ${profileErrorText}`);
                    throw new Error('Ошибка при получении данных профиля');
                }

                if (!requestsResponse.ok) {
                    const requestsErrorText = await requestsResponse.text();
                    await sendLogToTelegram(`Error fetching requests data: ${requestsErrorText}`);
                    throw new Error('Ошибка при получении данных запросов');
                }

                const profileData = await profileResponse.json();
                const requestsData = await requestsResponse.json();

                await sendLogToTelegram(`Profile data received: ${JSON.stringify(profileData)}`);
                await sendLogToTelegram(`Requests data received: ${JSON.stringify(requestsData)}`);

                if (profileData.avatarUrl) {
                    await sendLogToTelegram(`Setting avatar URL: ${profileData.avatarUrl}`);
                    setAvatarUrl(profileData.avatarUrl);
                } else {
                    await sendLogToTelegram('No avatar URL found, setting default avatar.');
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

                await sendLogToTelegram(`Requests data processed for user: ${JSON.stringify(requestsData)}`);
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

                const tariffsMap = data.reduce((acc: Record<string, TariffInfo>, tariff: { name: string; price: string; assistantRequestCount: number; aiRequestCount: number }) => {
                    const displayName = mapTariffName(t, tariff.name, tariff.assistantRequestCount || 0);

                    acc[tariff.name] = {
                        displayName,
                        price: Number(tariff.price),
                        assistantRequests: tariff.assistantRequestCount || 0,
                        aiRequests: tariff.aiRequestCount || 0,
                    };
                    return acc;
                }, {});

                setTariffs(tariffsMap);
                console.log(tariffsMap)
            } catch (error) {
                console.error('Ошибка при получении тарифов:', error);
                await sendLogToTelegram(`Error fetching tariffs: ${error}`);
            }
        };

        fetchTariffs();
    }, [t]);

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
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/0AJW56153T8k4vML6v-otMACZR9mNqWDNzMOiWQRDDmR8PWFN.gif"
                                    alt="avatar"
                                    width={90}
                                    height={90}
                                    className={styles.ai}
                                />
                                <p className={styles.text}>{tariffs['FIRST']?.displayName || 'Loading...'}</p>
                            </div>

                            <div className={styles.centerblock} onClick={() => handleButtonClick('SECOND')}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/jE6SDe7l2dN1nP5r7s-leizKIGomi1dMjfHE1qavcrvcr53xa.gif"
                                    alt="avatar"
                                    width={100}
                                    height={100}
                                    className={styles.ai}
                                />
                                <p className={styles.text}>{tariffs['SECOND']?.displayName || 'Loading...'}</p>
                            </div>

                            <div className={styles.rightblock} onClick={() => handleButtonClick('THIRD')}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/3Gp4U52HVs6Vc0Oa4L-VvFqf9YswsVh5d3QhBUu0Eqh6HJYKn.gif"
                                    alt="avatar"
                                    width={90}
                                    height={105}
                                    className={styles.ai}
                                />
                                <p className={styles.text}>{tariffs['THIRD']?.displayName || 'Loading...'}</p>
                            </div>
                        </div>
                        <div className={styles.section}>
                            <div className={styles.block} onClick={() => handleButtonClick('FOURTH')}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/7QPk28f67h3q7dV2ZB-E8BhSgh2E2HG4MlAl14ISqgBCaMyUZ.gif"
                                    alt="avatar"
                                    width={100}
                                    height={100}
                                    className={styles.aionly}
                                />
                                <p className={styles.aitext}>{tariffs['FOURTH']?.displayName || 'Loading...'}</p>
                            </div>

                            <Link href="/referal-page" className={styles.block}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/a140h5GWxHkA11HZi8-EPAX13JKlAygeA9jQ5MrqHdpb7mztu.gif"
                                    alt="avatar"
                                    width={75}
                                    height={75}
                                    className={styles.referals}
                                />
                                <p className={styles.aitext}>{t('referral')}</p>
                            </Link>
                        </div>
                        <div className={styles.section}>
                            <Link href="/buy-requests" className={styles.block}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/HvK33q26JBPQOB64aE-1DkCZcXkMRjdKNJSDnN0Qp1othEWEG.gif"
                                    alt="avatar"
                                    width={80}
                                    height={80}
                                    className={styles.ainew}
                                />
                                <p className={styles.aitext}>Купить запросы</p>
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

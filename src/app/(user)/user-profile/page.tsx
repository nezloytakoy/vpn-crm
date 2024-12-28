"use client";

import React, { useEffect, useState } from 'react';
import Wave from 'react-wavify';
import styles from './profile.module.css';
import Image from 'next/image';
import Link from 'next/link';
import Popup from '../../../components/Popup/Popup';
import { useTranslation } from 'react-i18next';
import { sendLogToTelegram, fetchTariffs, TariffInfo } from './utils';
import { useProfile } from './useProfile'; // <-- Наш хук (без get-avatar)

const WaveComponent = () => {
    const { t } = useTranslation();

    // Достаём базовые данные из кастомного хука useProfile
    const {
        telegramUsername,
        fontSize,
        assistantRequests,
        telegramId
    } = useProfile();

    // Состояние для тарифов
    const [tariffs, setTariffs] = useState<Record<string, TariffInfo>>({});
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [buttonText, setButtonText] = useState('');
    const [price, setPrice] = useState<number>(0);

    // Состояние для аватарки (если хотим отдельно загрузить /api/get-avatar)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Ссылка на аватар по умолчанию
    const defaultAvatarUrl =
        'https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg';

    // При монтировании загружаем тарифы (функция fetchTariffs из utils.ts)
    useEffect(() => {
        async function loadTariffs() {
            try {
                const result = await fetchTariffs(t);
                setTariffs(result);
            } catch (error) {
                console.error('Ошибка при получении тарифов:', error);
                sendLogToTelegram(`Error fetching tariffs: ${String(error)}`);
            }
        }
        loadTariffs();
    }, [t]);

    // При монтировании (или при получении telegramId) загружаем аватарку
    useEffect(() => {
        if (!telegramId) return;

        // Вариант 1: Просто получить JSON {avatarUrl}
        // fetch(`/api/get-avatar?telegramId=${telegramId}`)
        //   .then(res => res.json())
        //   .then(data => {
        //     setAvatarUrl(data.avatarUrl || defaultAvatarUrl);
        //   })
        //   .catch(err => {
        //     console.error('Ошибка при получении avatarUrl:', err);
        //     setAvatarUrl(defaultAvatarUrl);
        //   });

        // Вариант 2: Проксируем картинку (raw=true). 
        // В таком случае src будет "/api/get-avatar?telegramId=...&raw=true",
        // и Image сам подтянет картинку. Но мы всё-таки хотим задать avatarUrl стейтом:
        const rawUrl = `/api/get-avatar?telegramId=${telegramId}&raw=true`;
        setAvatarUrl(rawUrl);

    }, [telegramId]);

    // Обработка нажатия на определённый тариф (кнопка)
    const handleButtonClick = (tariffKey: string) => {
        const tariff = tariffs[tariffKey];
        setButtonText(`${tariff.displayName} - ${tariff.price}$`);
        setPrice(tariff.price);
        setPopupVisible(true);
        sendLogToTelegram(`Button clicked: ${tariff.displayName}`);
    };

    // Закрытие попапа
    const handleClosePopup = () => {
        setPopupVisible(false);
        sendLogToTelegram('Popup closed');
    };

    return (
        <div>
            {/* Верхняя часть с волной и аватаркой */}
            <div
                style={{
                    position: 'relative',
                    height: '250px',
                    overflow: 'hidden',
                    border: '2px solid white',
                }}
            >
                <Wave
                    fill="white"
                    paused={false}
                    options={{
                        height: 10,
                        amplitude: 20,
                        speed: 0.15,
                        points: 3,
                    }}
                    style={{ position: 'absolute', bottom: '-100px', width: '100%' }}
                />
                <div className={styles.topbotom}>
                    <div className={styles.greetings}>
                        {t('greeting')},{" "}
                        <div className={styles.avatarbox}>
                            <Image
                                // Если avatarUrl == null => показываем заглушку
                                src={avatarUrl || defaultAvatarUrl}
                                alt="avatar"
                                width={130}
                                height={130}
                                className={styles.avatar}
                            />
                            <p className={styles.name} style={{ fontSize }}>
                                {telegramUsername}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.backbotom}>
                {/* Отображаем кол-во запросов (если null => "...", иначе число) */}
                <p className={styles.time}>
                    {t('time')}: {assistantRequests === null ? '...' : assistantRequests} {t('requests')}
                </p>

                <div className={styles.parent}>
                    {/* Первая строка тарифов */}
                    <div className={styles.buttons}>
                        <div className={styles.leftblock} onClick={() => handleButtonClick('FIRST')}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/0AJW56153T8k4vML6v-otMACZR9mNqWDNzMOiWQRDDmR8PWFN.gif"
                                alt="tariff"
                                width={90}
                                height={90}
                                className={styles.ai}
                            />
                            <p className={styles.text}>
                                {tariffs['FIRST']?.displayName || 'Loading...'}
                            </p>
                        </div>

                        <div className={styles.centerblock} onClick={() => handleButtonClick('SECOND')}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/jE6SDe7l2dN1nP5r7s-leizKIGomi1dMjfHE1qavcrvcr53xa.gif"
                                alt="tariff"
                                width={100}
                                height={100}
                                className={styles.ai}
                            />
                            <p className={styles.text}>
                                {tariffs['SECOND']?.displayName || 'Loading...'}
                            </p>
                        </div>

                        <div className={styles.rightblock} onClick={() => handleButtonClick('THIRD')}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/3Gp4U52HVs6Vc0Oa4L-VvFqf9YswsVh5d3QhBUu0Eqh6HJYKn.gif"
                                alt="tariff"
                                width={90}
                                height={105}
                                className={styles.ai}
                            />
                            <p className={styles.text}>
                                {tariffs['THIRD']?.displayName || 'Loading...'}
                            </p>
                        </div>
                    </div>

                    {/* Вторая строка: четвёртый тариф + реферальная ссылка */}
                    <div className={styles.section}>
                        <div className={styles.block} onClick={() => handleButtonClick('FOURTH')}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/7QPk28f67h3q7dV2ZB-E8BhSgh2E2HG4MlAl14ISqgBCaMyUZ.gif"
                                alt="tariff"
                                width={100}
                                height={100}
                                className={styles.aionly}
                            />
                            <p className={styles.aitext}>
                                {tariffs['FOURTH']?.displayName || 'Loading...'}
                            </p>
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

                    {/* Третья строка: кнопка "Купить запросы" (пример) */}
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
    );
};

export default WaveComponent;

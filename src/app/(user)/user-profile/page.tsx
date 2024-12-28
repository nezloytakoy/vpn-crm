"use client";

import React, { useEffect, useState } from 'react';
import Wave from 'react-wavify';
import styles from './profile.module.css';
import Image from 'next/image';
import Link from 'next/link';
import Popup from '../../../components/Popup/Popup';
import { useTranslation } from 'react-i18next';
import { sendLogToTelegram, fetchTariffs, TariffInfo } from './utils';
import { useProfile } from './useProfile';

function getRandomColor(): string {
    // Можно расширить список цветов
    const colors = [
        '#F87171', // красный
        '#FBBF24', // жёлтый
        '#34D399', // зелёный
        '#60A5FA', // синий
        '#A78BFA', // фиолетовый
        '#F472B6', // розовый
        '#FB7185', // малиновый
        '#F9A8D4', // пастельно-розовый
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Функция, которая возвращает первую букву из имени
 * (если имя начинается на '@', пропускает его).
 * Если имя пустое, вернёт '?'.
 */
function getDisplayLetter(name: string): string {
    if (!name) return '?';
    // Если имя начинается с '@', берём вторую букву. Если нет второй — '?'
    const char = name.charAt(0) === '@'
        ? (name.charAt(1) || '?')
        : name.charAt(0);
    return char.toUpperCase();
}

const WaveComponent = () => {
    const { t } = useTranslation();

    // Достаём данные из хука (без аватарки)
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

    // Состояние для аватарки (если пользователь всё же имеет её)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Ссылка на аватар по умолчанию (больше не используем, 
    // так как теперь показываем кружок с буквой)
    // const defaultAvatarUrl = '...';

    // Случайный цвет для буквы, генерируем один раз при монтировании.
    const [letterBgColor] = useState<string>(getRandomColor);

    // При монтировании грузим тарифы
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

    // При появлении telegramId грузим аватарку
    useEffect(() => {
        if (!telegramId) return;

        // Пример: получаем ссылку из /api/get-avatar (JSON), либо raw
        // Вариант (JSON):
        /* 
        fetch(`/api/get-avatar?telegramId=${telegramId}`)
          .then(res => res.json())
          .then(data => {
            if (data.avatarUrl) {
              setAvatarUrl(data.avatarUrl);
            }
          })
          .catch(err => {
            console.error('Ошибка при получении avatarUrl:', err);
          });
        */

        // Вариант (raw=true) — прокси
        const rawUrl = `/api/get-avatar?telegramId=${telegramId}&raw=true`;
        setAvatarUrl(rawUrl);
    }, [telegramId]);

    const handleButtonClick = (tariffKey: string) => {
        const tariff = tariffs[tariffKey];
        setButtonText(`${tariff.displayName} - ${tariff.price}$`);
        setPrice(tariff.price);
        setPopupVisible(true);
        sendLogToTelegram(`Button clicked: ${tariff.displayName}`);
    };

    const handleClosePopup = () => {
        setPopupVisible(false);
        sendLogToTelegram('Popup closed');
    };

    // Функция, которая рендерит либо картинку, либо кружок с буквой
    const renderAvatar = () => {
        if (avatarUrl) {
            // У пользователя есть аватарка => показываем картинку
            return (
                <Image
                    src={avatarUrl}
                    alt="avatar"
                    width={130}
                    height={130}
                    className={styles.avatar}
                />
            );
        } else {
            // Нет аватарки => показываем кружок
            const letter = getDisplayLetter(telegramUsername);
            return (
                <div
                    className={styles.letterCircle}
                    style={{
                        backgroundColor: letterBgColor,
                        width: '130px',
                        height: '130px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span style={{ color: '#fff', fontSize: '48px', fontWeight: 'bold' }}>
                        {letter}
                    </span>
                </div>
            );
        }
    };

    return (
        <div>
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
                            {renderAvatar()}
                            <p className={styles.name} style={{ fontSize }}>
                                {telegramUsername}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.backbotom}>
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

                    {/* Третья строка: кнопка "Купить запросы" */}
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

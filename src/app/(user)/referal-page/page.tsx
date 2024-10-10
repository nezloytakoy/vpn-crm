"use client";

import React, { useEffect, useState } from 'react';
import Wave from 'react-wavify';
import styles from './referal.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';

interface PopupProps {
    isVisible: boolean;
    onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ isVisible, onClose }) => {
    const { t } = useTranslation();
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
                        src="https://92eaarerohohicw5.public.blob.vercel-storage.com/784312486488Credit_Card-avyq19EwaUxOPBuU53pZPUTnoK8QhB.gif"
                        alt="avatar"
                        width={150}
                        height={150}
                    />
                </div>
                <p>{t('withdraw_request')}</p>
                <button className={styles.confirmButton} onClick={handleClose}>
                    <Link href="/user-profile">{t('return_profile')}</Link>
                </button>
            </div>
        </div>
    );
};

function Page() {
    const { t } = useTranslation();
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [telegramUsername, setTelegramUsername] = useState('');
    const [fontSize, setFontSize] = useState('24px');
    const [referralLink, setReferralLink] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();

            const userLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code;

            if (userLang === 'ru') {
                i18n.changeLanguage('ru');
            } else {
                i18n.changeLanguage('en');
            }

            const username = window.Telegram.WebApp.initDataUnsafe?.user?.username;
            const firstName = window.Telegram.WebApp.initDataUnsafe?.user?.first_name;
            const lastName = window.Telegram.WebApp.initDataUnsafe?.user?.last_name;

            const displayName = username ? `@${username}` : `${firstName || ''} ${lastName || ''}`.trim();
            setTelegramUsername(displayName || 'Guest');

            if (displayName.length > 12) {
                setFontSize('19px');
            } else if (displayName.length > 8) {
                setFontSize('21px');
            } else {
                setFontSize('25px');
            }
        } else {
            console.error('Telegram WebApp API недоступен.');
            i18n.changeLanguage('en');
            setTelegramUsername('Guest');
        }
    }, []);

    const showPopup = () => {
        setPopupVisible(true);
    };

    const hidePopup = () => {
        setPopupVisible(false);
    };


    const generateReferralLink = async () => {
        if (window.Telegram && window.Telegram.WebApp) {
            try {
                setIsGenerating(true);

                const currentUserId = window.Telegram.WebApp.initDataUnsafe.user?.id;
                if (!currentUserId) {
                    throw new Error('Не удалось получить идентификатор пользователя.');
                }

                const response = await fetch('/api/generate-referral-link', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: currentUserId }),
                });

                const data = await response.json();

                if (response.ok) {
                    setReferralLink(data.referralLink);
                } else {
                    alert(data.error || 'Ошибка при генерации реферальной ссылки.');
                }
            } catch (error) {
                console.error('Ошибка при генерации реферальной ссылки:', error);
                alert('Произошла ошибка при генерации реферальной ссылки.');
            } finally {
                setIsGenerating(false);
            }
        } else {
            alert('Telegram WebApp API недоступен.');
        }
    };

    return (
        <div>
            <div style={{ position: 'relative', height: '250px', overflow: 'hidden' }}>
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
                        {t('referrals')}
                        <div className={styles.avatarbox}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg"
                                alt="avatar"
                                width={110}
                                height={110}
                                className={styles.avatar}
                            />
                            <p className={styles.name} style={{ fontSize }}>{telegramUsername}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.backbotom}>
                <div className={styles.infobox}>
                    <div className={styles.first}>
                        {/* Ваши блоки с информацией */}
                    </div>
                    <div className={styles.buttonsContainer}>
                        <div
                            className={`${styles.button} ${referralLink ? styles.generatedButton : ''}`}
                            onClick={!isGenerating ? generateReferralLink : undefined}
                            style={{
                                backgroundColor: referralLink ? 'green' : undefined,
                                opacity: isGenerating ? 0.6 : 1,
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {isGenerating
                                ? t('generating')
                                : referralLink
                                    ? t('link_generated')
                                    : t('generate_link')}
                        </div>
                        <div className={styles.button} onClick={showPopup}>{t('withdraw')}</div>
                    </div>
                    {referralLink && (
                        <div className={styles.referralLinkContainer}>
                            <p>{t('your_referral_link')}:</p>
                            <input
                                type="text"
                                value={referralLink}
                                readOnly
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                className={styles.referralLinkInput}
                            />
                            <button
                                className={styles.copyButton}
                                onClick={() => {
                                    navigator.clipboard.writeText(referralLink);
                                    alert(t('link_copied'));
                                }}
                            >
                                {t('copy_link')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Popup isVisible={isPopupVisible} onClose={hidePopup} />
        </div>
    );
}

export default Page;

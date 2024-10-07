"use client"

import React, { useState } from 'react';
import styles from './Payment.module.css';
import Image from 'next/image';
import Wave from 'react-wavify';

function PaymentPage() {

    const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectMethod = (index: number) => {
        setSelectedMethod(index);
    };

    const handleContinue = async () => {
        if (selectedMethod === 1) { // Звезды Telegram
            setIsLoading(true);
            try {
                // Отправляем запрос на создание инвойса
                const response = await fetch('/api/telegram-invoice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: 'USER_ID' }), // Замените на реальный ID пользователя
                });
                
                const data = await response.json();
                if (response.ok) {
                    // Перенаправляем пользователя на ссылку оплаты
                    window.open(data.invoiceLink, '_blank');
                } else {
                    alert(data.message || 'Ошибка создания инвойса');
                }
            } catch (error) {
                console.error('Ошибка при создании инвойса:', error);
                alert('Не удалось создать инвойс. Попробуйте снова позже.');
            } finally {
                setIsLoading(false);
            }
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
                        <p className={styles.maintitle}>Способы оплаты</p> 
                        <div className={styles.avatarbox}>
                            <Image
                                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg"
                                alt="avatar"
                                width={110}
                                height={110}
                                className={styles.avatar}
                            />
                            <p className={styles.name}> John Doe </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.content}>
                <p className={styles.title}>К оплате: 5$</p>
                <div className={styles.methodbox}>
                    <div
                        className={`${styles.method} ${selectedMethod === 0 ? styles.selectedMethod : ''}`}
                        onClick={() => handleSelectMethod(0)}
                    >
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/russian-ruble-money-currency-golden%20(1)-r9QrBTSGjS10emeh0O5hBFcuZS38j3.png"
                            alt="avatar"
                            width={45}
                            height={45}
                        />
                        <p className={styles.methodtext}>Рубли</p>
                        {selectedMethod === 0 && (
                            <div className={styles.checkmark}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
                                    alt="selected"
                                    width={20}
                                    height={20}
                                />
                            </div>
                        )}
                    </div>

                    <div
                        className={`${styles.method} ${selectedMethod === 1 ? styles.selectedMethod : ''}`}
                        onClick={() => handleSelectMethod(1)}
                    >
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/preview-OtzrrTKFyQexRKsoD5CCazayU4ma3h.jpg"
                            alt="avatar"
                            width={45}
                            height={45}
                        />
                        <p className={styles.methodtext}>Звезды telegram</p>
                        {selectedMethod === 1 && (
                            <div className={styles.checkmark}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
                                    alt="selected"
                                    width={20}
                                    height={20}
                                />
                            </div>
                        )}
                    </div>

                    <div
                        className={`${styles.method} ${selectedMethod === 2 ? styles.selectedMethod : ''}`}
                        onClick={() => handleSelectMethod(2)}
                    >
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/images-A7Z7zrtcZQlml9FhatR6Ea065NMd7v.png"
                            alt="avatar"
                            width={45}
                            height={45}
                        />
                        <p className={styles.methodtext}>TON coin</p>
                        {selectedMethod === 2 && (
                            <div className={styles.checkmark}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
                                    alt="selected"
                                    width={20}
                                    height={20}
                                />
                            </div>
                        )}
                    </div>

                    <div
                        className={`${styles.method} ${selectedMethod === 3 ? styles.selectedMethod : ''}`}
                        onClick={() => handleSelectMethod(3)}
                    >
                        <Image
                            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/usdt_14446252-RIL3vx1QwR4w7TSmzHULfysqAOjVHM.png"
                            alt="avatar"
                            width={45}
                            height={45}
                        />
                        <p className={styles.methodtext}>USDT</p>
                        {selectedMethod === 3 && (
                            <div className={styles.checkmark}>
                                <Image
                                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/mark_10099716-3Bssu05yOXrxWvP8EuPh79h34neYiO.png"
                                    alt="selected"
                                    width={20}
                                    height={20}
                                />
                            </div>
                        )}
                    </div>
                </div>
                
                <button 
                    className={`${styles.continueButton} ${selectedMethod === null ? styles.disabledButton : ''}`}
                    disabled={selectedMethod === null || isLoading}
                    onClick={handleContinue}
                >
                    {isLoading ? 'Загрузка...' : 'Продолжить'}
                </button>
            </div>
        </div>
    );
}

export default PaymentPage;

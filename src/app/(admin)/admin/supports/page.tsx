
"use client"

import React, { useState } from 'react';
import styles from './Users.module.css';

function Page() {
    const [isToggled, setIsToggled] = useState(false); // Состояние для переключателя

    const handleToggleChange = () => {
        setIsToggled(!isToggled); // Меняем состояние при клике на переключатель
    };

    return (
        <div className={styles.main}>
            <div className={styles.columnblock}>
                <div className={styles.messageblock}>
                    <h1 className={styles.title}>Уведомления всем ассистентам</h1>
                    <div className={styles.messagebox}>
                        <h1 className={styles.undertitle}>Форма для сообщения</h1>
                        <textarea className={styles.input} placeholder="Сообщение" />
                    </div>
                </div>
            </div>
            <div className={styles.columnblock}>
                <div className={styles.messageblock}>
                    <h1 className={styles.notitle}></h1>
                    <div className={styles.messageboxtwo}>
                        <h1 className={styles.gifttitle}>Подарочные койны</h1>
                        <div className={styles.togglebox}>
                            <label className={styles.switch}>
                                <input type="checkbox" checked={isToggled} onChange={handleToggleChange} />
                                <span className={styles.slider}></span>
                            </label>
                            <span className={styles.label}>Включить эту опцию</span>
                        </div>
                        <h1 className={styles.undertitle}>Введите количество</h1>
                        <div className={`${styles.inputContainer} ${isToggled ? styles.active : ''}`}>
                            <input type="text" className={styles.inputField} placeholder="10000" />
                            <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Койнов</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Page;

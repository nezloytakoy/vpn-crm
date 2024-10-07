"use client";

import React, { useState } from 'react';
import styles from './Ai.module.css';

function Page() {
    const [rejectionCount, setRejectionCount] = useState('7');

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRejectionCount(event.target.value);
    };

    const handleSubmit = () => {
        alert(`Вы установили максимальное количество отказов: ${rejectionCount}`);

    };

    return (
        <div className={styles.main}>
            <div className={styles.settings}>
                <div className={styles.columnblock}>
                    <div className={styles.columnblock}>
                        <div className={styles.messageboxthree}>
                            <h1 className={styles.title}>Дополнительный промт к запросу</h1>
                            <h1 className={styles.undertitle}>Форма для промта</h1>
                            <textarea className={styles.input} placeholder="Текст дополнительного промта" />
                            <button className={styles.submitButton}>Отправить</button>
                        </div>
                    </div>

                </div>
                <div className={styles.messagebox}>
                    <h1 className={styles.gifttitle}>Максимальное количество токенов на запрос</h1>
                    <h1 className={styles.undertitletwo}>Введите количество</h1>

                    <div className={styles.inputContainertwo}>
                        <input
                            type="text"
                            className={styles.inputFieldtwo}
                            placeholder="7"
                            value={rejectionCount}
                            onChange={handleInputChange}
                        />
                        <span className={styles.label}>Токенов</span>
                    </div>

                    <button className={styles.submitButtontwo} onClick={handleSubmit}>
                        Подтвердить
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Page;

"use client"

import React, { useState } from 'react';
import styles from './Users.module.css'

function page() {

    const [isToggled, setIsToggled] = useState(false);

    const handleToggleChange = () => {
        setIsToggled(!isToggled);
    };


    return (
        <div className={styles.main}>
            <div className={styles.columnblock}>
                <div className={styles.messageboxthree}>
                    <h1 className={styles.title}>Уведомления всем ассистентам</h1>
                    <div className={styles.togglebox}>
                        <label className={styles.switch}>
                            <input type="checkbox" checked={isToggled} onChange={handleToggleChange} />
                            <span className={styles.slider}></span>
                        </label>
                        <span className={styles.label}>Включить эту опцию</span>
                    </div>
                    <h1 className={styles.undertitle}>Форма для сообщения</h1>
                    <textarea className={styles.input} placeholder="Сообщение" />
                    <button className={styles.submitButton}>Отправить</button>
                </div>
            </div>
            <div className={styles.columnblock}>

                <div className={styles.messageboxthree}>
                    <h1 className={styles.title}>Уведомления всем ассистентам</h1>
                    <h1 className={styles.undertitle}>Форма для сообщения</h1>
                    <textarea className={styles.input} placeholder="Сообщение" />
                    <button className={styles.submitButton}>Отправить</button>
                </div>
            </div>
        </div>
    )
}

export default page
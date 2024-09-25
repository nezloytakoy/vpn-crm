"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './login.module.css';

export default function Page() {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const handleCheckboxChange = () => {
        setIsChecked(!isChecked);
    };

    return (
        <div className={styles.main}>
            <Image
                src="https://92eaarerohohicw5.public.blob.vercel-storage.com/login-pic-iD9fZtkPEorHEZZTna7hGKgg9K1hlu.gif"
                alt="Login Picture"
                width={500}
                height={500}
                className={styles.mainpic}
            />
            <div className={styles.box}>
                <div className={styles.login}>
                    Введите свой логин
                    <input className={styles.input} type="text" />
                </div>
                <div className={styles.loginBox}>
                    <div className={styles.password}>
                        <p className={styles.title}>Введите свой пароль</p>
                        <div className={styles.inputBox}>
                            <input
                                className={styles.passInput}
                                type={passwordVisible ? "text" : "password"}
                            />
                            <span
                                onClick={togglePasswordVisibility}
                                className={styles.passwordBox}
                            >
                                {passwordVisible ? (
                                    <Image
                                        src="https://92eaarerohohicw5.public.blob.vercel-storage.com/eye-opened-BcUG0ydRkZjONQyIwJMxp3CQ6i4ofN.svg"
                                        alt="Hide Password"
                                        width={35}
                                        height={35}
                                        className={styles.img}
                                    />
                                ) : (
                                    <Image
                                        src="https://92eaarerohohicw5.public.blob.vercel-storage.com/eye-closed-fqZZYtRDq8hx138SDkpeN2KYa3HKkm.svg"
                                        alt="Show Password"
                                        width={35}
                                        height={35}
                                        lassName={styles.img}
                                    />
                                )}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.remember}>
                    <div className={styles.funcbox}>
                        Remember me
                        <div className={styles.customCheckboxContainer} onClick={handleCheckboxChange}>
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={handleCheckboxChange}
                                className={styles.customCheckboxHidden}
                            />
                            <span className={`${styles.customCheckbox} ${isChecked ? styles.checked : ''}`}></span>
                        </div>
                    </div>
                </div>
                <div className={styles.button}>
                    Войти
                </div>
            </div>
        </div>
    );
}

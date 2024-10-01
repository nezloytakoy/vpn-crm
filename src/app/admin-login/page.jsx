"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Импорт из next/navigation
import loginAction from './loginAction'; // Импорт серверного действия
import styles from './login.module.css';

export default function Page() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter(); // Используем useRouter из next/navigation

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  const handleLogin = async () => {
    // Очистка ошибки перед новой попыткой
    setError('');

    try {
      // Вызываем серверное действие для авторизации
      const result = await loginAction(email, password);
      if (!result) {
        // Если авторизация успешна, редиректим на защищённую страницу
        router.push('/admin/monitoring');
      } else {
        // Обработка ошибок, если данные неверны
        setError(result);
      }
    } catch (err) {
      setError('Ошибка при авторизации. Попробуйте снова.');
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.parentbox}>
        <div className={styles.box}>
          <div className={styles.login}>
            Введите свой логин
            <input
              className={styles.input}
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Устанавливаем email
            />
          </div>
          <div className={styles.loginBox}>
            <div className={styles.password}>
              <p className={styles.title}>Введите свой пароль</p>
              <div className={styles.inputBox}>
                <input
                  className={styles.passInput}
                  type={passwordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} // Устанавливаем пароль
                />
                <span onClick={togglePasswordVisibility} className={styles.passwordBox}>
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
                      className={styles.img}
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
          {error && <p className={styles.error}>{error}</p>} {/* Отображение ошибок */}
          <div className={styles.button} onClick={handleLogin}>
            Войти
          </div>
        </div>
      </div>
      <div className={styles.picbox}></div>
    </div>
  );
}

"use client";

import { FaTachometerAlt, FaExclamationCircle, FaCoins, FaUserShield, FaHandsHelping, FaGavel } from 'react-icons/fa';
import React, { useState, useEffect } from 'react';
import styles from './AdminHeader.module.css';
import { FaSignOutAlt, FaCog } from 'react-icons/fa';
import Link from 'next/link';

function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [login, setLogin] = useState('...');
    const [role, setRole] = useState('...');

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isMenuOpen && !(event.target as HTMLElement).closest(`.${styles.admin}`)) {
                setIsMenuOpen(false);
            }
        };

        const getData = async () => {
            try {
                // Запрос для получения moderatorId
                const moderResponse = await fetch('/api/get-moder-id', {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!moderResponse.ok) {
                    throw new Error('Не удалось получить moderatorId');
                }

                const moderResult = await moderResponse.json();
                const moderatorId = moderResult.userId;

                // Запрос для получения логина и роли по moderatorId
                const loginRoleResponse = await fetch('/api/get-login-role', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: moderatorId }),
                });

                if (!loginRoleResponse.ok) {
                    throw new Error('Не удалось получить данные пользователя');
                }

                const loginRoleResult = await loginRoleResponse.json();
                setLogin(loginRoleResult.login);
                setRole(loginRoleResult.role);
            } catch (error) {
                console.error('Ошибка при получении данных:', error);
            }
        };

        getData();

        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    return (
        <div className={isOpen ? styles.containerOpen : styles.container}>
            <div className={styles.header}>
                <div className={styles.box}>
                    <div className={styles.button} onClick={toggleSidebar}>
                        {isOpen ? (
                            <span className={styles.arrowLeft}></span>
                        ) : (
                            <span className={styles.burgerMenu}></span>
                        )}
                        <span>Меню</span>
                    </div>

                    <div className={styles.admin} onClick={toggleMenu}>
                        <div className={styles.name}>{login}</div>
                        <div className={styles.position}>{role}</div>

                        <div className={`${styles.popupMenu} ${isMenuOpen ? styles.showMenu : ''}`}>
                            <ul>
                                <Link href="/admin-login" className={styles.navLink} onClick={handleLinkClick}>
                                    <li>
                                        <FaSignOutAlt className={styles.menuIcon} /> Выйти из аккаунта
                                    </li>
                                </Link>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <nav className={styles.nav}>
                    <ul>
                        <Link href="/admin/monitoring" className={styles.navLink} onClick={handleLinkClick}>
                            <li>
                                <FaTachometerAlt className={styles.icon} />
                                <div className={styles.point}>Мониторинг</div>
                            </li>
                        </Link>
                        <Link href="/admin/complaints" className={styles.navLink} onClick={handleLinkClick}>
                            <li>
                                <FaExclamationCircle className={styles.icon} />
                                <div className={styles.point}>Жалобы</div>
                            </li>
                        </Link>
                        <Link href="/admin/coins" className={styles.navLink} onClick={handleLinkClick}>
                            <li>
                                <FaCoins className={styles.icon} />
                                <div className={styles.point}>Коины</div>
                            </li>
                        </Link>
                        <Link href="/admin/users" className={styles.navLink} onClick={handleLinkClick}>
                            <li>
                                <FaUserShield className={styles.icon} />
                                <div className={styles.point}>Пользователь</div>
                            </li>
                        </Link>
                        <Link href="/admin/supports" className={styles.navLink} onClick={handleLinkClick}>
                            <li>
                                <FaHandsHelping className={styles.icon} />
                                <div className={styles.point}>Ассистент</div>
                            </li>
                        </Link>
                        <Link href="/admin/moderators" className={styles.navLink} onClick={handleLinkClick}>
                            <li>
                                <FaGavel className={styles.icon} />
                                <div className={styles.point}>Модератор</div>
                            </li>
                        </Link>
                    </ul>
                </nav>
            </div>
            <Link href="/admin/ai" className={styles.navLink} onClick={handleLinkClick}>
                <div className={styles.blueSquare}>
                    <FaCog className={styles.gearIcon} />
                    AI
                </div>
            </Link>
        </div>
    );
}

export default AdminSidebar;

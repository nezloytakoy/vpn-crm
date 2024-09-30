"use client";

import { FaTachometerAlt, FaExclamationCircle, FaCoins, FaUserShield, FaHandsHelping, FaGavel } from 'react-icons/fa';
import React, { useState, useEffect } from 'react';
import styles from './AdminHeader.module.css';
import { FaSignOutAlt, FaCog } from 'react-icons/fa';
import Link from 'next/link';

function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleLinkClick = () => {
        setIsOpen(false);  // Закрыть меню после клика на ссылку
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
                        <div className={styles.name}>JohnDoe@gmail.com</div>
                        <div className={styles.position}>Администратор</div>

                        <div className={`${styles.popupMenu} ${isMenuOpen ? styles.showMenu : ''}`}>
                            <ul>
                                <li>
                                    <FaSignOutAlt className={styles.menuIcon} /> Sign Out
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <nav className={styles.nav}>
                    <ul>
                        <Link href="/monitoring" className={styles.navLink} onClick={handleLinkClick}>
                            <li>
                                <FaTachometerAlt className={styles.icon} />
                                <div className={styles.point}>Мониторинг</div>
                            </li>
                        </Link>
                        <Link href="/complaints" className={styles.navLink} onClick={handleLinkClick}>
                            <li>
                                <FaExclamationCircle className={styles.icon} />
                                <div className={styles.point}>Жалобы</div>
                            </li>
                        </Link>
                        <li>
                            <FaCoins className={styles.icon} />
                            <div className={styles.point}>Коины</div>
                        </li>
                        <li>
                            <FaUserShield className={styles.icon} />
                            <div className={styles.point}>Пользователь</div>
                        </li>
                        <li>
                            <FaHandsHelping className={styles.icon} />
                            <div className={styles.point}>Ассистент</div>
                        </li>
                        <li>
                            <FaGavel className={styles.icon} />
                            <div className={styles.point}>Модератор</div>
                        </li>
                    </ul>
                </nav>
            </div>

            <div className={styles.blueSquare}>
                <FaCog className={styles.gearIcon} />
                AI
            </div>
        </div>
    );
}

export default AdminSidebar;

"use client";

import { FaTachometerAlt, FaExclamationCircle, FaCoins, FaUserShield, FaHandsHelping, FaGavel } from 'react-icons/fa';
import React, { useState, useEffect } from 'react';
import styles from './AdminHeader.module.css';
import { FaSignOutAlt, FaCog } from 'react-icons/fa';

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
                        <li>
                            <FaTachometerAlt className={styles.icon} />
                            <div className={styles.point}>Мониторинг</div>
                        </li>
                        <li>
                            <FaExclamationCircle className={styles.icon} />
                            <div className={styles.point}>Жалобы</div>
                        </li>
                        <li>
                            <FaCoins className={styles.icon} />
                            <div className={styles.point}>Коины</div>
                        </li>
                        <li>
                            <FaUserShield className={styles.icon} />
                            <div className={styles.point}>Правила пользователя</div>
                        </li>
                        <li>
                            <FaHandsHelping className={styles.icon} />
                            <div className={styles.point}>Правила ассистента</div>
                        </li>
                        <li>
                            <FaGavel className={styles.icon} />
                            <div className={styles.point}>Правила модератора</div>
                        </li>
                    </ul>
                </nav>
            </div>

            <div className={styles.blueSquare}>
                <FaCog className={styles.gearIcon} />
            </div>
        </div>
    );
}

export default AdminSidebar;

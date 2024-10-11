'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './Users.module.css';
import Table from '@/components/Table/Table';
import { Column, CellProps } from 'react-table';

interface UserData {
    nickname: string;
    referrals: number;
    subscription: string;
    requests: number;
    renewed: boolean;
}

export default function Page() {
    const [data, setData] = useState<UserData[]>([]);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showSortMenu, setShowSortMenu] = useState<boolean>(false);
    const [showSettings, setShowSettings] = useState(true);
    const [showTablebox, setShowTablebox] = useState(true);

    // Функция для получения данных о пользователях
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/get-users');
                if (!response.ok) {
                    throw new Error('Не удалось получить данные');
                }
                const userData: UserData[] = await response.json();
                setData(userData);
            } catch (error) {
                console.error('Ошибка при получении данных', error);
            }
        };

        fetchUsers();
    }, []);

    const columnsData: Column<UserData>[] = useMemo(() => [
        {
            Header: 'Ник пользователя',
            accessor: 'nickname',
            id: 'nickname',
        },
        {
            Header: 'Количество рефералов',
            accessor: 'referrals',
            id: 'referrals',
        },
        {
            Header: 'Подписка',
            accessor: 'subscription',
            id: 'subscription',
        },
        {
            Header: 'Количество запросов',
            accessor: 'requests',
            id: 'requests',
        },
        {
            Header: 'Обновлено',
            accessor: 'renewed',
            id: 'renewed',
            Cell: ({ value }: CellProps<UserData, boolean>) => (
                <span>{value ? 'Да' : 'Нет'}</span>
            ),
        },
    ], []);

    // Функция для сортировки данных
    const sortedData = useMemo(() => {
        if (!sortColumn) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortColumn as keyof UserData];
            const bValue = b[sortColumn as keyof UserData];

            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, sortColumn, sortDirection]);

    const handleSortColumn = (columnId: string) => {
        if (sortColumn === columnId) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnId);
            setSortDirection('asc');
        }
        setShowSortMenu(false);
    };

    return (
        <div className={styles.main}>
            <button className={styles.toggleButton} onClick={() => setShowSettings(!showSettings)}>
                {showSettings ? 'Скрыть настройки' : 'Показать настройки'}
                <svg
                    className={`${styles.arrowIcon} ${showSettings ? styles.up : styles.down}`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 15l-7-7h14l-7 7z" />
                </svg>
            </button>

            <button className={styles.toggleButton} onClick={() => setShowTablebox(!showTablebox)}>
                {showTablebox ? 'Скрыть таблицу' : 'Показать таблицу'}
                <svg
                    className={`${styles.arrowIcon} ${showTablebox ? styles.up : styles.down}`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 15l-7-7h14l-7 7z" />
                </svg>
            </button>

            <div className={styles.tablebox}>
                <div className={styles.tableWrapper}>
                    <div className={styles.header}>
                        <h3>Запросы пользователей <span>({data.length})</span></h3>
                        <div className={styles.sortButtonContainer}>
                            <button className={styles.sortButton} onClick={() => setShowSortMenu(!showSortMenu)}>
                                Сортировать
                            </button>
                            {showSortMenu && (
                                <div className={styles.sortMenu}>
                                    {columnsData.map((column) => (
                                        <button
                                            key={column.id}
                                            className={styles.sortMenuItem}
                                            onClick={() => handleSortColumn(column.id ?? String(column.accessor))}
                                        >
                                            {typeof column.Header === 'string' ? column.Header : 'Колонка'}
                                            {sortColumn === column.id && (
                                                <span className={styles.sortDirection}>
                                                    {sortDirection === 'asc' ? ' 🔼' : ' 🔽'}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <Table columns={columnsData} data={sortedData} />
                </div>
            </div>
        </div>
    );
}

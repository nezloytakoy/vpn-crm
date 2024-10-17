'use client';

import React, { useEffect, useState } from 'react';
import { Column } from 'react-table';
import Table from '@/components/Table/Table';
import styles from './Coins.module.css';

interface WithdrawsData {
  id: string;
  userId: string;
  userNickname: string;
  userRole: string;
  amount: string;
  status: string;
}

export default function Page() {
  const [data, setData] = useState<WithdrawsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные о выводах при монтировании компонента
  useEffect(() => {
    const fetchWithdraws = async () => {
      try {
        const response = await fetch('/api/get-withdraw-requests');

        if (!response.ok) {
          throw new Error('Ошибка получения данных');
        }

        const withdrawsData: WithdrawsData[] = await response.json();
        setData(withdrawsData);
      } catch (error) {
        setError('Не удалось загрузить данные.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchWithdraws();
  }, []);

  const columns: Column<WithdrawsData>[] = [
    {
      Header: 'ID',
      accessor: 'id',
    },
    {
      Header: 'Никнейм пользователя',
      accessor: 'userNickname',
    },
    {
      Header: 'Роль',
      accessor: 'userRole',
      Cell: ({ value }: { value: string }) => (value === 'user' ? 'Пользователь' : 'Ассистент'), // Изменяем отображение роли
    },
    {
      Header: 'Сумма',
      accessor: 'amount',
    },
    {
      Header: 'Статус',
      accessor: 'status',
    },
  ];

  if (loading) {
    return (
      <div className={styles.loaderWrapper}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={styles.main}>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Запросы на вывод <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} />
        </div>
      </div>
    </div>
  );
}

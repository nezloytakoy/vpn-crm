'use client';

import React from 'react';
import { Column } from 'react-table';
import Table from '@/components/Table/Table';
import styles from './Coins.module.css';

interface CoinDistributionData {
  assistant: string;
  quantity: number;
  date: string;
  username: string;
  id: string;
}

// Пример данных для таблицы
const data: CoinDistributionData[] = [
  {
    assistant: 'Ассистент N1',
    quantity: 24,
    date: '21/12/24',
    username: '@username',
    id: '2332323232',
  },
  {
    assistant: 'Ассистент N2',
    quantity: 12,
    date: '22/12/24',
    username: '@username',
    id: '2332323232',
  },
  {
    assistant: 'Ассистент N3',
    quantity: 44,
    date: '23/12/24',
    username: '@username',
    id: '2332323232',
  },
];

// Определение колонок
const columns: Array<Column<CoinDistributionData>> = [
  {
    Header: 'Ассистент',
    accessor: 'assistant',
  },
  {
    Header: 'Количество',
    accessor: 'quantity',
  },
  {
    Header: 'Дата',
    accessor: 'date',
  },
  {
    Header: '', // Пустой заголовок для юзернейма
    accessor: 'username',
  },
  {
    Header: '', // Пустой заголовок для ID
    accessor: 'id',
  },
];

export default function Page() {
  return (
    <div className={styles.main}>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Запросы на распределение коинов <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} />
        </div>
      </div>
    </div>
  );
}

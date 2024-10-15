"use client"

import React, { useMemo } from 'react';
import { Column } from 'react-table';
import { FaEnvelope } from 'react-icons/fa';
import Table from '@/components/Table/Table';
import styles from './Monitoring.module.css';

interface AssistantData {
  nick: string;
  averageResponseTime: number;
  completed: number;
  denied: number;
  current: number;
  complaints: number;
  status: string;
  message: string;
}

const Monitoring: React.FC = () => {
  // Wrap sampleData in useMemo
  const sampleData: AssistantData[] = useMemo(
    () => [
      {
        nick: '@assistant1',
        averageResponseTime: 5,
        completed: 100,
        denied: 10,
        current: 2,
        complaints: 1,
        status: 'Работает',
        message: 'Готов к работе',
      },
      {
        nick: '@assistant2',
        averageResponseTime: 6,
        completed: 90,
        denied: 8,
        current: 1,
        complaints: 2,
        status: 'Оффлайн',
        message: 'Не доступен',
      },
      {
        nick: '@assistant3',
        averageResponseTime: 7,
        completed: 80,
        denied: 5,
        current: 3,
        complaints: 0,
        status: 'Не работает',
        message: 'Ошибка в системе',
      },
    ],
    []
  );

  const columns: Column<AssistantData>[] = useMemo(
    () => [
      {
        Header: '',
        accessor: 'nick',
        Cell: ({ value }) => <strong>{value}</strong>,
      },
      {
        Header: 'Время ответа',
        accessor: 'averageResponseTime',
      },
      {
        Header: 'Завершенные',
        accessor: 'completed',
      },
      {
        Header: 'Отказы',
        accessor: 'denied',
      },
      {
        Header: 'Текущие жалобы',
        accessor: 'current',
      },
      {
        Header: 'Жалобы',
        accessor: 'complaints',
      },
      {
        Header: '',
        accessor: 'status',
        Cell: ({ value }) => (
          <button
            className={
              value === 'Работает'
                ? styles.statusWorking
                : value === 'Оффлайн'
                  ? styles.statusOffline
                  : value === 'Не работает'
                    ? styles.statusNotWorking
                    : ''
            }
          >
            {value}
          </button>
        ),
      },
      {
        Header: '',
        accessor: 'message',
        Cell: ({ value }) => (
          <button
            className={styles.messageButton}
            onClick={() => {
              alert(value);
            }}
          >
            <FaEnvelope />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className={styles.main}>
      <div className={styles.tableWrapper}>
        <div className={styles.header}>
          <h3>
            Ассистенты <span>({sampleData.length})</span>
          </h3>
        </div>
        <Table columns={columns} data={sampleData} />
      </div>
    </div>
  );
};

export default Monitoring;

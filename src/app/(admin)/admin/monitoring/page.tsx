"use client";

import React, { useMemo, useEffect, useState } from 'react';
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
  const [assistantsData, setAssistantsData] = useState<AssistantData[]>([]);

  // Получаем данные с сервера
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/assistants-data'); // Предполагаем, что вы настроили API на /api/assistants
        const data = await response.json();
        setAssistantsData(data);
      } catch (error) {
        console.error('Ошибка при получении данных ассистентов:', error);
      }
    };

    fetchData();
  }, []);

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
            Ассистенты <span>({assistantsData.length})</span>
          </h3>
        </div>
        <Table columns={columns} data={assistantsData} />
      </div>
    </div>
  );
};

export default Monitoring;

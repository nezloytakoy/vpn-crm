"use client";

import React, { useEffect, useState } from 'react';
import { Column } from 'react-table';
import styles from './Complaints.module.css';
import Table from '@/components/Table/Table';

interface Complaint {
  id: string;
  reason: string;
  userId: string;
  userNickname: string;
  assistantId: string;
  assistantNickname: string;
}

interface ComplaintData {
  complaint: string;
  user: string;
  userId: string;
  assistant: string;
  assistantId: string;
}

function App() {
  const [data, setData] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Функция для получения данных из API
    const fetchComplaints = async () => {
      try {
        const response = await fetch('/api/get-complaints'); // Запрос к API
        if (!response.ok) {
          throw new Error('Ошибка получения жалоб');
        }

        const complaintsData: Complaint[] = await response.json(); // Указываем тип для данных

        // Форматируем данные для таблицы
        const formattedData: ComplaintData[] = complaintsData.map((complaint) => ({
          complaint: complaint.reason,
          user: `@${complaint.userNickname}`, // Ник пользователя с собачкой
          userId: complaint.userId, // Отображаем просто ID пользователя
          assistant: `@${complaint.assistantNickname}`, // Ник ассистента с собачкой
          assistantId: complaint.assistantId, // Отображаем просто ID ассистента
        }));

        setData(formattedData); // Обновляем состояние данными
        setLoading(false); // Отключаем загрузку после получения данных
      } catch (error) {
        console.error('Ошибка при получении данных:', error);
        setError('Не удалось загрузить жалобы. Пожалуйста, попробуйте снова позже.');
      }
    };

    fetchComplaints();
  }, []);

  const columns = React.useMemo<Column<ComplaintData>[]>(
    () => [
      {
        Header: 'Жалоба',
        accessor: 'complaint',
      },
      {
        Header: 'Пользователь',
        accessor: 'user',
        Cell: ({ row }) => (
          <a
            href={`https://t.me/${row.original.user}`} // Ссылка на профиль пользователя в Telegram
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link} // Добавляем стили
          >
            {row.original.user}
          </a>
        ),
      },
      {
        Header: 'ID Пользователя',
        accessor: 'userId', // ID отображается как обычный текст
      },
      {
        Header: 'Роль',
        accessor: 'assistant',
        Cell: ({ row }) => (
          <a
            href={`https://t.me/${row.original.assistant}`} // Ссылка на профиль ассистента в Telegram
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link} // Добавляем стили
          >
            {row.original.assistant}
          </a>
        ),
      },
      {
        Header: 'ID Ассистента',
        accessor: 'assistantId', // ID отображается как обычный текст
      },
    ],
    []
  );

  if (loading) {
    return <div>Загрузка данных...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.main}>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Жалобы на ассистентов <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} />
        </div>
      </div>
    </div>
  );
}

export default App;

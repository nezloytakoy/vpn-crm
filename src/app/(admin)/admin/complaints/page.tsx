"use client";

import React, { useEffect, useState } from 'react';
import { Column } from 'react-table';
import styles from './Complaints.module.css';
import Table from '@/components/Table/Table';

interface Complaint {
  id: bigint; 
  reason: string;
  userId: bigint;
  userNickname: string | null;
  assistantId: bigint;
  assistantNickname: string | null;
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
          user: complaint.userNickname
            ? `@${complaint.userNickname}` // Добавляем "@" перед ником пользователя
            : `ID: ${complaint.userId.toString()}`, 
          userId: complaint.userNickname 
            ? `https://t.me/${complaint.userNickname}` 
            : complaint.userId.toString(),
          assistant: complaint.assistantNickname
            ? `@${complaint.assistantNickname}` // Добавляем "@" перед ником ассистента
            : `ID: ${complaint.assistantId.toString()}`,
          assistantId: complaint.assistantNickname 
            ? `https://t.me/${complaint.assistantNickname}` 
            : complaint.assistantId.toString(),
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
            href={row.original.userId}
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
        accessor: 'userId',
      },
      {
        Header: 'Ассистент',
        accessor: 'assistant',
        Cell: ({ row }) => (
          <a
            href={row.original.assistantId}
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
        accessor: 'assistantId',
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

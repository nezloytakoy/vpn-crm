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
  const [isPopupOpen, setIsPopupOpen] = useState(false); // Состояние для открытия попапа
  const [popupMessage, setPopupMessage] = useState(''); // Состояние для ввода текста в попапе

  // Получаем данные с сервера
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/assistants-data');
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
        Header: 'Время ответа(секунды)',
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
        Header: 'Открытые жалобы',
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
        Cell: () => (
          <button
            className={styles.messageButton}
            onClick={() => setIsPopupOpen(true)} // Открытие попапа
          >
            <FaEnvelope />
          </button>
        ),
      },
    ],
    []
  );

  const handleSendMessage = () => {
    // Здесь можно добавить логику отправки сообщения
    console.log('Отправлено сообщение:', popupMessage);
    setIsPopupOpen(false); // Закрытие попапа после отправки
    setPopupMessage(''); // Очистка поля ввода
  };

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

      {/* Попап для отправки сообщения */}
      {isPopupOpen && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup}>
            <h3>Отправить сообщение</h3>
            <textarea
              value={popupMessage}
              onChange={(e) => setPopupMessage(e.target.value)}
              placeholder="Введите ваше сообщение"
              className={styles.textarea}
            />
            <button className={styles.sendButton} onClick={handleSendMessage}>
              Отправить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;

"use client";

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Column } from 'react-table';
import { FaEnvelope } from 'react-icons/fa';
import Table from '@/components/Table/Table';
import styles from './Monitoring.module.css';

export const fetchCache = 'force-no-store';

interface AssistantData {
  nick: string;
  averageResponseTime: number;
  completed: number;
  denied: number;
  current: number;
  complaints: number;
  status: string;
  message: string;
  telegramId: string; // Добавлено поле telegramId для идентификации ассистента
}

const Monitoring: React.FC = () => {
  const [assistantsData, setAssistantsData] = useState<AssistantData[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false); // Состояние для открытия попапа
  const [popupMessage, setPopupMessage] = useState(''); // Состояние для ввода текста в попапе
  const [currentAssistantTelegramId, setCurrentAssistantTelegramId] = useState<string | null>(null); // Хранение telegramId текущего ассистента
  const popupRef = useRef<HTMLDivElement>(null); // Ссылка на элемент попапа

  // Получаем данные с сервера
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/assistants-data', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate', // Запрещаем кеширование
            Pragma: 'no-cache',
            Expires: '0',
          },
        });
        const data = await response.json();
        setAssistantsData(data);
      } catch (error) {
        console.error('Ошибка при получении данных ассистентов:', error);
      }
    };

    fetchData();
  }, []);

  // Закрытие попапа при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsPopupOpen(false); // Закрываем попап, если клик был вне его
      }
    };

    if (isPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopupOpen]);

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
        accessor: 'telegramId', // Мы будем использовать telegramId для отправки сообщения
        Cell: ({ value }) => (
          <button
            className={styles.messageButton}
            onClick={() => {
              setCurrentAssistantTelegramId(value); // Сохраняем telegramId ассистента
              setIsPopupOpen(true); // Открываем попап
            }}
          >
            <FaEnvelope />
          </button>
        ),
      },
    ],
    []
  );

  const handleSendMessage = async () => {
    try {
      if (!currentAssistantTelegramId) {
        console.error('Ошибка: telegramId ассистента не установлен');
        return;
      }

      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: popupMessage,
          chatId: currentAssistantTelegramId, // Отправляем сообщение выбранному ассистенту
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при отправке сообщения');
      }

      console.log('Отправлено сообщение:', popupMessage);
      setIsPopupOpen(false); // Закрытие попапа после отправки
      setPopupMessage(''); // Очистка поля ввода
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
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
          <div className={styles.popup} ref={popupRef}>
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

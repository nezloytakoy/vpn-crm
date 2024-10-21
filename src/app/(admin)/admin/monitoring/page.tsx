"use client";

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Column } from 'react-table';
import { FaEnvelope } from 'react-icons/fa';
import Table from '@/components/Table/Table';
import { useRouter } from 'next/navigation'; 
import styles from './Monitoring.module.css';

export const fetchCache = 'force-no-store';

interface AssistantData {
  telegramId: string;
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
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [currentAssistantTelegramId, setCurrentAssistantTelegramId] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const router = useRouter(); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/assistants-data', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка загрузки данных с сервера');
        }

        const data = await response.json();
        console.log('Полученные данные ассистентов:', data);
        setAssistantsData(data);
      } catch (error) {
        console.error('Ошибка при получении данных ассистентов:', error);
      }
    };

    fetchData();
  }, []);

  const handleRowClick = (telegramId: string) => {
    
    router.push(`/admin/monitoring/${telegramId}`);
  };

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
          chatId: currentAssistantTelegramId,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при отправке сообщения');
      }

      console.log('Отправлено сообщение:', popupMessage);
      setIsPopupOpen(false);
      setPopupMessage('');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsPopupOpen(false);
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
        Header: 'Имя',
        accessor: 'nick',
        Cell: ({ row }) => (
          <span onClick={() => handleRowClick(row.original.telegramId)} style={{ cursor: 'pointer' }}>
            <strong className={styles.nick}>{row.original.nick}</strong>
          </span>
        ),
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
        accessor: 'telegramId',
        Cell: ({ value }) => (
          <button
            className={styles.messageButton}
            onClick={() => {
              console.log('Клик по сообщению, telegramId:', value);
              if (!value) {
                console.error('Ошибка: telegramId ассистента не установлен');
                return;
              }
              setCurrentAssistantTelegramId(value);
              setIsPopupOpen(true);
            }}
          >
            <FaEnvelope />
          </button>
        ),
      },
    ],
    [handleRowClick] 
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

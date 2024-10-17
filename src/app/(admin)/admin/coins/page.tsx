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
  orderNumber?: string | null;
}

interface SelectedWithdraw {
  id: string;
  userId: string;
  userNickname: string;
  userRole: string;
  amount: string;
  orderNumber?: string | null;
}

export default function Page() {
  const [data, setData] = useState<WithdrawsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWithdraw, setSelectedWithdraw] = useState<SelectedWithdraw | null>(null);
  const [amount, setAmount] = useState<string>(''); 
  const [isRejecting, setIsRejecting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  
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

  
  const handleRowClick = async (withdrawId: string) => {
    try {
      const response = await fetch(`/api/get-withdraw-details?id=${withdrawId}`);
      if (!response.ok) {
        throw new Error('Ошибка получения данных запроса');
      }
      const withdrawDetails = await response.json();
      setSelectedWithdraw(withdrawDetails);
      setAmount(withdrawDetails.amount); 
    } catch (error) {
      console.error('Ошибка при загрузке данных запроса:', error);
    }
  };

  
  const handleConfirm = async () => {
    if (!selectedWithdraw || !amount) return;

    try {
      setIsConfirming(true); 
      const response = await fetch(`/api/confirm-withdraw-request?id=${selectedWithdraw.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }), 
      });

      if (!response.ok) {
        throw new Error('Ошибка при подтверждении запроса');
      }

      
      setTimeout(() => {
        
        setSelectedWithdraw(null);
        setData(
          data.map((item) =>
            item.id === selectedWithdraw.id ? { ...item, status: 'Подтверждено' } : item
          )
        );
        setIsConfirming(false); 
      }, 5000);
    } catch (error) {
      console.error('Ошибка при подтверждении:', error);
      setIsConfirming(false); 
    }
  };

  
  const handleReject = async () => {
    if (!selectedWithdraw) return;

    try {
      setIsRejecting(true); 
      const response = await fetch(`/api/reject-withdraw-request?id=${selectedWithdraw.id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Ошибка при отклонении запроса');
      }

      
      setTimeout(() => {
        
        setSelectedWithdraw(null);
        setData(
          data.map((item) =>
            item.id === selectedWithdraw.id ? { ...item, status: 'Отклонено' } : item
          )
        );
        setIsRejecting(false); 
        window.location.reload(); 
      }, 5000);
    } catch (error) {
      console.error('Ошибка при отклонении:', error);
      setIsRejecting(false); 
    }
  };

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
      Cell: ({ value }: { value: string }) =>
        value === 'user' ? 'Пользователь' : 'Ассистент',
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
          <Table
            columns={columns}
            data={data}
            onRowClick={(row) => handleRowClick(row.id)} 
          />
        </div>
      </div>

      
      {selectedWithdraw && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup}>
            <h3>Детали запроса на вывод</h3>

            <div className={styles.detailsRow}>
              <div className={styles.first}>
                <p className={styles.detailTitle}>Пользователь:</p>
                <p className={styles.detailValue}>{selectedWithdraw.userNickname}</p>
              </div>
              <div className={styles.first}>
                <p className={styles.detailTitle}>Роль:</p>
                <p className={styles.detailValue}>{selectedWithdraw.userRole}</p>
              </div>
              <div className={styles.second}>
                <p className={styles.detailTitle}>Telegram ID:</p>
                <p className={styles.detailValue}>{selectedWithdraw.userId}</p>
              </div>
            </div>

            {selectedWithdraw.orderNumber && (
              <p><strong>Номер:</strong> {selectedWithdraw.orderNumber}</p>
            )}

            <label>
              <strong>Сумма для вывода:</strong>
              <input
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={styles.input}
              />
            </label>

            <div className={styles.buttons}>
              <button
                className={styles.rejectButton}
                onClick={handleReject}
                disabled={isRejecting}
              >
                {isRejecting ? <div className={styles.buttonLoader}></div> : 'Отклонить'}
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? <div className={styles.buttonLoader}></div> : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

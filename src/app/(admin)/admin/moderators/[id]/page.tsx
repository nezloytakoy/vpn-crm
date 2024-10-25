"use client";

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Assistent.module.css';
import Link from 'next/link';
import Table from '@/components/Table/Table';
import { Column } from 'react-table';
import Image from 'next/image';

type Message = {
  sender: string;
  message: string;
  timestamp: string;
};
interface RequestData {
  requestId: number;
  action: string;
  log: string;
  userId: number;
  messages: Message[]; 
}


function Page() {
  const pathname = usePathname();
  const moderatorId = pathname.split('/').pop();

  const [showPopup, setShowPopup] = useState(false);
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [step, setStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [data, setData] = useState<RequestData[]>([]);

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch(`/api/get-moderator-complaints?moderatorId=${moderatorId}`);
        const complaints = await response.json();
        const formattedData = complaints.map((complaint: any) => ({
          requestId: complaint.id,
          action: 'Рассмотрена',
          log: 'Скачать',
          userId: complaint.userId,
          messages: complaint.messages,
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Ошибка при загрузке жалоб:', error);
      }
    };
    fetchComplaints();
  }, [moderatorId]);

  function downloadMessages(messages: Message[]) {
    const formattedMessages = messages.map(({ sender, message, timestamp }) => {
        const date = new Date(timestamp);
        const formattedTimestamp = date.toLocaleString("en-GB", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        return `${formattedTimestamp}: ${sender} - ${message}`;
    });

    const blob = new Blob([formattedMessages.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chat_log.txt";
    link.click();
    URL.revokeObjectURL(url);
}



  const handleGenerateLink = () => setStep(1);

  const handleConfirmCredentials = async () => {
    if (!login || !password) {
      setErrorMessage('Введите новый логин и пароль!');
      return;
    }
    try {
      const response = await fetch('/api/changeModeratorCredentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      if (!response.ok) throw new Error('Ошибка при смене логина и пароля');
      setStep(2);
      setErrorMessage('');
    } catch (error) {
      console.error('Ошибка:', error);
      setErrorMessage('Ошибка при смене логина и пароля');
    }
  };

  const columns: Column<RequestData>[] = [
    { Header: 'ID запроса', accessor: 'requestId' },
    { Header: 'Действие', accessor: 'action' },
    {
      Header: 'Лог',
      accessor: 'log',
      Cell: ({ row }) => (
        <span onClick={() => downloadMessages(row.original.messages)} className={styles.downloadLink}>
          Скачать
        </span>
      ),
    },
    { Header: 'ID пользователя', accessor: 'userId' },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.main}>
      <div className={styles.titlebox}>
        <h1 className={styles.title}>Модератор</h1>
        <div className={styles.pointerblock}>
          <p className={styles.pointertext}>
            <Link href="/admin/moderators" className={styles.link}>Модераторы</Link> &nbsp;&nbsp;/&nbsp;&nbsp; Модератор
          </p>
        </div>
      </div>

      <div className={styles.assistantblock}>
        <div className={styles.messageboxfour}>
          <Image src="https://92eaarerohohicw5.public.blob.vercel-storage.com/HLA59jMt2S3n7N2d2O-NF0jQKdkPmFmPomQgf9VIONuWrctwA.gif" alt="Referral" width={350} height={350} />
          <h1 className={styles.invitetitle}>Смена пароля для модератора</h1>
          {step === 0 && (
            <button className={styles.generateButton} onClick={handleGenerateLink}>
              Сменить пароль для модератора
            </button>
          )}
          {step === 1 && (
            <div className={styles.credentialsBox}>
              <h2>Придумайте новый логин и пароль для модератора</h2>
              {errorMessage && <p className={styles.error}>{errorMessage}</p>}
              <input type="text" className={styles.inputField} placeholder="Новый логин" value={login} onChange={(e) => setLogin(e.target.value)} />
              <input type="password" className={styles.inputField} placeholder="Новый пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className={styles.confirmButton} onClick={handleConfirmCredentials}>Подтвердить</button>
            </div>
          )}
          {step === 2 && <p className={styles.successMessage}>Успех!</p>}
        </div>
        <div className={styles.infoblock}>
          <div className={styles.metricsblock}>
            <div className={styles.logoparent}>
              <div className={styles.avatarblock}><p>Нет аватара</p></div>
              <div className={styles.numbers}>
                <div className={styles.metric}><p className={styles.number}>0</p><p className={styles.smalltitle}>Рассмотренные жалобы</p></div>
              </div>
            </div>
            <div className={styles.datablock}>
              <div className={styles.nameblock}><p className={styles.name}>@space_driver</p><p className={styles.undername}>ID: 523491343</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}><h3>Решенные жалобы <span>({data.length})</span></h3></div>
          <Table columns={columns} data={data} />
        </div>
      </div>

      {showPopup && (
        <>
          <div className={styles.overlay} />
          <div className={styles.popup} ref={popupRef}>
            <h2 className={styles.popupTitle}>Вы действительно хотите удалить ассистента?</h2>
            <div className={styles.popupButtons}>
              <button className={styles.confirmButton}>Да</button>
              <button className={styles.cancelButton} onClick={() => setShowPopup(false)}>Нет</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Page;

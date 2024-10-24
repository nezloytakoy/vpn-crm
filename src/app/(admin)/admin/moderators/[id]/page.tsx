"use client";

import React, { useState, useRef, useEffect } from 'react';

import styles from './Assistent.module.css';
import Link from 'next/link';

import Table from '@/components/Table/Table';
import { Column } from 'react-table';

import Image from 'next/image';

interface RequestData {
  requestId: number;
  action: string;
  log: string;
  userId: number;
}



interface AssistantData {
  assistant: {
    orderNumber: number;
    username: string;
    telegramId: string;
    avatarFileId: string | null;
    avatarUrl: string | null;
  };
  allRequests: number;
  requestsThisMonth: number;
  requestsThisWeek: number;
  requestsToday: number;
  ignoredRequests: number;
  rejectedRequests: number;
  complaints: number;
  sessionCount: number;
  averageSessionTime: number;
  averageResponseTime: number;
  transactions: {
    id: number;
    amount: string;
    reason: string;
    time: string;
  }[];
  pupils: {
    telegramId: string;
    username: string;
    lastActiveAt: Date;
    orderNumber: number;
    isWorking: boolean;
    isBusy: boolean;
  }[];
}


interface Pupil {
  telegramId: string;
  username: string;
  lastActiveAt: Date;
  orderNumber: number;
  isWorking: boolean;
  isBusy: boolean;
}



function Page() {


  const [showPopup, setShowPopup] = useState(false);


  const dropdownRef = useRef<HTMLDivElement>(null);
  const pupilDropdownRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);




  const [assistantData, setAssistantData] = useState<AssistantData | null>(null);







  


  const [login, setLogin] = useState<string>(''); 
  const [password, setPassword] = useState<string>(''); 
  const [step, setStep] = useState<number>(0); 
  const [errorMessage, setErrorMessage] = useState<string>(''); 


  
  const handleGenerateLink = () => {
    setStep(1);

    setErrorMessage('');
  };

  
  const handleConfirmCredentials = async () => {
    if (!login || !password) {
      setErrorMessage('Введите новый логин и пароль!');
      return;
    }

    try {
      
      const response = await fetch('/api/changeModeratorCredentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }), 
      });

      if (!response.ok) {
        throw new Error('Ошибка при смене логина и пароля');
      }

      
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
    { Header: 'Лог', accessor: 'log' },
    { Header: 'ID пользователя', accessor: 'userId' }
  ];

  const data: RequestData[] = [
    { requestId: 1, action: 'Создан', log: 'Создание запроса', userId: 1001 },
    { requestId: 2, action: 'Изменен', log: 'Изменение статуса', userId: 1002 },
    { requestId: 3, action: 'Удален', log: 'Удаление записи', userId: 1003 }
  ];


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(`.${styles.iconButton}`)
      ) 

      if (
        pupilDropdownRef.current &&
        !pupilDropdownRef.current.contains(event.target as Node)
      ) 

      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
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
            <Link href="/admin/moderators" className={styles.link}>Модераторы</Link> &nbsp;&nbsp;/&nbsp;&nbsp;
            Модератор
          </p>
        </div>
      </div>


      <div className={styles.assistantblock}>
        <div className={styles.messageboxfour}>
          <Image
            src="https://92eaarerohohicw5.public.blob.vercel-storage.com/HLA59jMt2S3n7N2d2O-NF0jQKdkPmFmPomQgf9VIONuWrctwA.gif"
            alt="Referral"
            width={350}
            height={350}
          />
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
              <input
                type="text"
                className={styles.inputField}
                placeholder="Новый логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
              <input
                type="password"
                className={styles.inputField}
                placeholder="Новый пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className={styles.confirmButton} onClick={handleConfirmCredentials}>
                Подтвердить
              </button>
            </div>
          )}

          
          {step === 2 && (
            <p className={styles.successMessage}>Успех!</p>
          )}
        </div>
        <div className={styles.infoblock}>
          <div className={styles.metricsblock}>
            <div className={styles.logoparent}>
              <div className={styles.avatarblock}>
                {assistantData?.assistant.avatarUrl ? (
                  <Image
                    src={assistantData.assistant.avatarUrl}
                    alt={`Аватар ассистента ${assistantData.assistant.username}`}
                    className={styles.avatarImage}
                    width={100}
                    height={100}
                    objectFit="cover"
                  />
                ) : (
                  <p>Нет аватара</p>
                )}
              </div>
              <div className={styles.numbers}>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.allRequests}</p>
                  <p className={styles.smalltitle}>Рассмотренные жалобы</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.rejectedRequests}</p>
                  <p className={styles.smalltitle}>Жалобы/месяц</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.complaints}</p>
                  <p className={styles.smalltitle}>Жалобы/неделя</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.complaints}</p>
                  <p className={styles.smalltitle}>Жалобы/сутки</p>
                </div>
              </div>
            </div>


            <div className={styles.datablock}>
              <div className={styles.nameblock}>
                <p className={styles.name}>@{assistantData?.assistant.username}</p>
                <p className={styles.undername}>ID: {assistantData?.assistant.telegramId}</p>
              </div>
            </div>
          </div>
        </div>


      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Решенные жалобы <span>({data.length})</span>
            </h3>
          </div>
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

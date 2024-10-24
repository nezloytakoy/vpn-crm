"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './Assistent.module.css';
import Link from 'next/link';
import { FaEllipsisH } from 'react-icons/fa';
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
  const { id: currentAssistantId } = useParams();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPopup, setShowPopup] = useState(false);



  const dropdownRef = useRef<HTMLDivElement>(null);

  const popupRef = useRef<HTMLDivElement>(null);
  const [percentage, setPercentage] = useState<number>(60);


  

  const [assistantData, setAssistantData] = useState<AssistantData | null>(null);


  useEffect(() => {
    const fetchAssistantData = async () => {
      try {
        const response = await fetch(`/api/get-assistant?assistantId=${currentAssistantId}`);
        const data = await response.json();
        if (response.ok) {
          setAssistantData(data);
        } else {
          console.error('Ошибка:', data.error);
        }
      } catch (error) {
        console.error('Ошибка при получении данных:', error);
      } 
    };

    if (currentAssistantId) {
      fetchAssistantData();
    }
  }, [currentAssistantId]);


  const sliderStyle = {
    background: `linear-gradient(to right, #365CF5 0%, #365CF5 ${percentage}%, #e5e5e5 ${percentage}%, #e5e5e5 100%)`,
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
      ) {
        setShowDropdown(false);
      }

     

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
        <h1 className={styles.title}>Пользователь</h1>
        <div className={styles.pointerblock}>
          <p className={styles.pointertext}>
            <Link href="/admin/users" className={styles.link}>Пользователи</Link> &nbsp;&nbsp;/&nbsp;&nbsp;
            Пользователь
          </p>
        </div>
      </div>


      <div className={styles.assistantblock}>
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
                  <p className={styles.smalltitle}>Запросы</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.rejectedRequests}</p>
                  <p className={styles.smalltitle}>Запросы/месяц</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.complaints}</p>
                  <p className={styles.smalltitle}>Запросы/неделя</p>
                </div>
                <div className={styles.metrictwo}>

                  <button
                    className={styles.iconButton}
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-haspopup="true"
                    aria-expanded={showDropdown}
                  >
                    <FaEllipsisH />
                  </button>

                  {showDropdown && (
                    <div className={`${styles.dropdownMenu} ${showDropdown ? styles.fadeIn : styles.fadeOut}`} ref={dropdownRef}>
                      <div className={styles.dropdownItem}>
                        <p className={styles.number}>{assistantData?.requestsThisMonth}</p>
                        <p className={styles.smalltitle}>Запросы/месяц</p>
                      </div>
                      <div className={styles.dropdownItem}>
                        <p className={styles.number}>{assistantData?.requestsThisWeek}</p>
                        <p className={styles.smalltitle}>Запросы/неделя</p>
                      </div>
                      <div className={styles.dropdownItem}>
                        <p className={styles.number}>{assistantData?.requestsToday}</p>
                        <p className={styles.smalltitle}>Запросы/сутки</p>
                      </div>
                      <div className={styles.dropdownItem}>
                        <p className={styles.number}>{assistantData?.averageSessionTime || 0}</p>
                        <p className={styles.smalltitle}>Время ответа(с)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>


            <div className={styles.datablock}>
              <div className={styles.nameblock}>
                <p className={styles.name}>@{assistantData?.assistant.username}</p>
                <p className={styles.undername}>ID: {assistantData?.assistant.telegramId}</p>
              </div>
              <div className={styles.numberstwo}>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.sessionCount}</p>
                  <p className={styles.smalltitle}>Запросы/сутки</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.averageSessionTime || 0}</p>
                  <p className={styles.smalltitle}>Запросы к ИИ</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.ignoredRequests}</p>
                  <p className={styles.smalltitle}>Пропусков запросов</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.assistant.orderNumber}</p>
                  <p className={styles.smalltitle}>Номер(№) ассистента</p>
                </div>
              </div>
            </div>
            <div className={styles.numbersthree}>
              <div className={styles.messageboxthree}>
                <h1 className={styles.gifttitle}>Заблокировать пользователя</h1>
                <h1 className={styles.undertitletwo}>Введите на какое время (в часах)</h1>
                <div className={styles.inputContainertwo}>
                  <input type="text" className={styles.inputFieldtwo} placeholder="7" />
                  <span className={styles.label}>Часов</span>
                </div>
                <div className={styles.buttonblock}>
                  <button className={styles.submitButtontwo}>Подтвердить</button>
                  <button
                    className={styles.submitButtonthree}
                    onClick={() => setShowPopup(true)}
                  >
                    Удалить ассистента
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className={styles.messagebox}>
          <h1 className={styles.gifttitle}>Процент от приглашенных пользователей</h1>
          <div className={styles.percentageHeader}>

            <h1 className={styles.undertitletwo}>Выберите процент</h1>
            <div className={styles.percentageDisplay}>{percentage}%</div>
          </div>
          <div className={styles.percentageSliderContainer}>
            <input
              type="range"
              min="0"
              max="100"
              value={percentage}
              className={styles.percentageSlider}
              onChange={(e) => setPercentage(Number(e.target.value))}
              style={sliderStyle}
            />
          </div>
          <button className={styles.submitButton}>Подтвердить</button>
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Запросы <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} />
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Жалобы <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} />
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Рефералы <span>({data.length})</span>
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

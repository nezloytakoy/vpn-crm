"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './Assistent.module.css';
import Link from 'next/link';
import { FaEllipsisH } from 'react-icons/fa';
import Table from '@/components/Table/Table';
import { Column } from 'react-table';
import confetti from 'canvas-confetti';
import Image from 'next/image';

interface RequestData {
  requestId: number;
  action: string;
  log: string;
  userId: number;
}

interface TransactionData {
  id: number;
  amount: number;
  reason: string;
  time: string;
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
  const [showPupilDropdown, setShowPupilDropdown] = useState(false);
  const [isMessageboxVisible, setIsMessageboxVisible] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pupilDropdownRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);


  const [pupilId, setPupilId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [assistantData, setAssistantData] = useState<AssistantData | null>(null);

  const [isLoadingPupils, setIsLoadingPupils] = useState(true);

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
      } finally {
        setIsLoadingPupils(false); // Устанавливаем состояние, когда загрузка завершена
      }
    };

    if (currentAssistantId) {
      fetchAssistantData();
    }
  }, [currentAssistantId]);





  const handleAddPupil = async () => {
    setIsLoading(true);

    try {
      if (!currentAssistantId) {
        throw new Error('ID ассистента не найден в роуте');
      }

      const response = await fetch('/api/add-pupil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pupilId, assistantId: currentAssistantId }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при добавлении подопечного');
      }


      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 },
      });

      alert('Подопечный успешно добавлен 🎉');
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert('Ошибка: ' + error.message + ' ❌❌❌');
      } else {
        alert('Произошла неизвестная ошибка ❌❌❌');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pupils = assistantData?.pupils as Pupil[];


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

  const transactionColumns: Column<TransactionData>[] = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Количество', accessor: 'amount' },
    { Header: 'Причина', accessor: 'reason' },
    { Header: 'Время', accessor: 'time' }
  ];

  const transactionData: TransactionData[] = [
    { id: 1, amount: 500, reason: 'Оплата услуг', time: '2023-10-20 14:30' },
    { id: 2, amount: 300, reason: 'Возврат средств', time: '2023-10-19 10:15' },
    { id: 3, amount: 200, reason: 'Пополнение счета', time: '2023-10-18 16:45' }
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
        pupilDropdownRef.current &&
        !pupilDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPupilDropdown(false);
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

  const toggleMessagebox = () => {
    setIsMessageboxVisible(!isMessageboxVisible);
  };



  return (
    <div className={styles.main}>

      <div className={styles.titlebox}>
        <h1 className={styles.title}>Ассистент</h1>
        <div className={styles.pointerblock}>
          <p className={styles.pointertext}>
            <Link href="/admin/monitoring" className={styles.link}>Мониторинг</Link> &nbsp;&nbsp;/&nbsp;&nbsp;
            Ассистент
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
                  <p className={styles.smalltitle}>Отказы</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.complaints}</p>
                  <p className={styles.smalltitle}>Жалобы</p>
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
                  <p className={styles.smalltitle}>Рабочие сессии</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>{assistantData?.averageSessionTime || 0}</p>
                  <p className={styles.smalltitle}>Время сессии</p>
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
              <div className={styles.messagebox}>
                <h1 className={styles.gifttitle}>Заблокировать ассистента</h1>
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


        <div className={styles.pupil}>
          <div className={styles.pupiltitleblock}>
            <p className={styles.pupiltitle}>Подопечные</p>
            <button
              className={styles.iconButton}
              onClick={() => setShowPupilDropdown(!showPupilDropdown)}
            >
              <FaEllipsisH />
            </button>
          </div>


          {showPupilDropdown && (
            <div className={`${styles.pupilDropdown} ${showPupilDropdown ? styles.fadeIn : styles.fadeOut}`} ref={pupilDropdownRef}>
              <div onClick={toggleMessagebox} className={styles.pupilDropdownItem}>
                {isMessageboxVisible ? 'Список' : 'Добавить'}
              </div>
            </div>
          )}


          <div className={`${styles.messageboxtwo} ${isMessageboxVisible ? styles.show : styles.hide}`}>
            <h1 className={styles.gifttitle}>Добавить подопечного</h1>
            <h1 className={styles.undertitletwo}>Введите айди подопечного</h1>
            <div className={styles.inputContainerthree}>
              <input
                type="text"
                className={styles.inputFieldtwo}
                placeholder="7"
                value={pupilId}
                onChange={(e) => setPupilId(e.target.value)}
              />
            </div>
            <div className={styles.buttonblock}>
              <button
                className={styles.submitButtonfour}
                onClick={handleAddPupil}
                disabled={isLoading}
              >
                {isLoading ? 'Загрузка...' : 'Подтвердить'}
              </button>
            </div>
          </div>
          <div className={`${styles.pupilsblock} ${isMessageboxVisible ? styles.hidePupils : styles.showPupils}`}>
            {isLoadingPupils ? (
              <p>Данные загружаются...</p>
            ) : pupils?.length > 0 ? (
              pupils.map((pupil) => {
                const lastActiveAt = new Date(pupil.lastActiveAt);
                const now = new Date();
                const minutesAgo = Math.floor((now.getTime() - lastActiveAt.getTime()) / 60000);

                const formatTimeAgo = (minutesAgo: number) => {
                  if (minutesAgo < 10) {
                    return "Сейчас в сети";
                  } else if (minutesAgo < 60) {
                    return `${minutesAgo}м&nbsp;назад`;
                  } else if (minutesAgo < 1440) {
                    const hoursAgo = Math.floor(minutesAgo / 60);
                    return `${hoursAgo}ч&nbsp;назад`;
                  } else if (minutesAgo < 525600) {
                    const daysAgo = Math.floor(minutesAgo / 1440);
                    return `${daysAgo}д&nbsp;назад`;
                  } else {
                    const yearsAgo = Math.floor(minutesAgo / 525600);
                    return `${yearsAgo}г&nbsp;назад`;
                  }
                };

                const circleClass = `${styles.activecircle} ${!pupil.isWorking ? styles.grayCircle :
                  pupil.isWorking && !pupil.isBusy ? styles.redCircle :
                    styles.greenCircle}`;

                return (
                  <div key={pupil.telegramId} className={styles.pupilblock}>
                    <div className={styles.pupillogo}>
                      <div className={circleClass}></div>
                    </div>
                    <div className={styles.pupilnameblock}>
                      <div className={styles.pupilinnername}>
                        <p className={styles.nametext}>{pupil.username}</p>
                        <div className={styles.pupilinfo}>
                          <p className={styles.infotext} dangerouslySetInnerHTML={{ __html: formatTimeAgo(minutesAgo) }} />
                        </div>
                      </div>
                      <div className={styles.pupilunderblock}>
                        <p className={styles.undertext}>{pupil.telegramId}</p>
                        <p className={styles.undertext}>№{pupil.orderNumber}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={styles.nopupils}>Подопечные не найдены.</p> // Теперь выводится только когда загрузка завершена, но подопечных нет
            )}
          </div>


        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              История запросов <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} />
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              История транзакций <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={transactionColumns} data={transactionData} />
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

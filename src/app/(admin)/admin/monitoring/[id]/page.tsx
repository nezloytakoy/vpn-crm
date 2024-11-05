"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './Assistent.module.css';
import Link from 'next/link';
import { FaEllipsisH } from 'react-icons/fa';
import Table from '@/components/Table/Table';
import { Column } from 'react-table';
import confetti from 'canvas-confetti';
import Image from 'next/image';

interface Message {
  sender: 'USER' | 'ASSISTANT';
  message: string;
  timestamp: string;
}

interface AssistantRequest {
  id: string;
  status: string;
  userId: string;
  messages: Message[];
}

interface TransactionData {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
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
  transactions: TransactionData[];
  pupils: Pupil[];
  assistantRequests: AssistantRequest[];
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
  const router = useRouter();
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

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  const [blockHours, setBlockHours] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);


  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        setIsLoadingData(false);
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

  const handleBlockAssistant = async () => {
    setIsBlocking(true);
    try {
      if (!currentAssistantId) {
        throw new Error('ID ассистента не найден в роуте');
      }
      if (!blockHours) {
        throw new Error('Введите количество часов');
      }
      const hours = parseInt(blockHours, 10);
      if (isNaN(hours) || hours <= 0) {
        throw new Error('Количество часов должно быть положительным числом');
      }
      const response = await fetch('/api/block-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assistantId: currentAssistantId, hours }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при блокировке ассистента');
      }

      alert('Ассистент успешно заблокирован');
      setBlockHours('');
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert('Ошибка: ' + error.message);
      } else {
        alert('Произошла неизвестная ошибка');
      }
    } finally {
      setIsBlocking(false);
    }
  };


  const handleDeleteAssistant = async () => {
    setIsDeleting(true);
    try {
      if (!currentAssistantId) {
        throw new Error('ID ассистента не найден в роуте');
      }
      const response = await fetch('/api/delete-assistant', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: currentAssistantId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при удалении ассистента');
      }


      setTimeout(() => {
        router.push('/admin/monitoring');
      }, 3000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setDeleteError(error.message);
        console.log(deleteError)
        alert('Ошибка: ' + error.message);
      } else {
        setDeleteError('Произошла неизвестная ошибка');
        alert('Произошла неизвестная ошибка');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const pupils = assistantData?.pupils as Pupil[];

  const handleDownload = (messages: Message[], filename: string) => {
    const content = messages
      .map(msg => `[${msg.timestamp}] ${msg.sender}: ${msg.message}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.txt`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const requestColumns: Column<AssistantRequest>[] = [
    { Header: 'ID запроса', accessor: 'id' },
    { Header: 'Действие', accessor: 'status' },
    {
      Header: 'Лог',
      accessor: 'messages',
      Cell: ({ row }: { row: { original: AssistantRequest } }) => (
        row.original.messages && row.original.messages.length > 0 ? (
          <button
            onClick={() => handleDownload(row.original.messages, `request_${row.original.id}`)}
            className={styles.downloadButton}
          >
            Скачать
          </button>
        ) : (
          <span>-</span>
        )
      ),
    },
    { Header: 'ID пользователя', accessor: 'userId' },
  ];

  const requestData: AssistantRequest[] = assistantData?.assistantRequests || [];

  const transactionColumns: Column<TransactionData>[] = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Количество', accessor: 'amount' },
    { Header: 'Причина', accessor: 'reason' },
    {
      Header: 'Время',
      accessor: 'createdAt',
      Cell: ({ value }: { value: string }) => {
        const date = new Date(value);
        const formattedDate = date.toLocaleString('ru-RU', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return formattedDate;
      },
    },
  ];

  const transactionData: TransactionData[] = assistantData?.transactions || [];

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

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/get-user-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: currentAssistantId }),
        });

        if (!response.ok) {
          throw new Error('Не удалось получить роль пользователя');
        }

        const result = await response.json();
        setUserRole(result.role);
      } catch (error) {
        console.error('Ошибка при получении роли пользователя:', error);
      }
    };

    if (currentAssistantId) {
      fetchUserRole();
    }
  }, [currentAssistantId]);

  const toggleMessagebox = () => {
    setIsMessageboxVisible(!isMessageboxVisible);
  };

  if (isLoadingData) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

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
                        <p className={styles.number}>{assistantData?.averageResponseTime ? assistantData.averageResponseTime.toFixed(2) : 0}</p>
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
                  <p className={styles.number}>{assistantData?.averageSessionTime ? assistantData.averageSessionTime.toFixed(2) : 0}</p>
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
                  <input
                    type="text"
                    className={styles.inputFieldtwo}
                    placeholder="7"
                    value={blockHours}
                    onChange={(e) => setBlockHours(e.target.value)}
                  />
                  <span className={styles.label}>Часов</span>
                </div>
                <div className={styles.buttonblock}>
                  <button
                    className={styles.submitButtontwo}
                    onClick={handleBlockAssistant}
                    disabled={isBlocking}
                  >
                    {isBlocking ? 'Загрузка...' : 'Подтвердить'}
                  </button>
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
            {isLoadingData ? (
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
              <p className={styles.nopupils}>Подопечные не найдены.</p>
            )}
          </div>
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              История запросов <span>({requestData.length})</span>
            </h3>
          </div>
          <Table columns={requestColumns} data={requestData} />
        </div>
      </div>
      {userRole === 'Администратор' && (
        <div className={styles.tablebox}>
          <div className={styles.tableWrapper}>
            <div className={styles.header}>
              <h3>
                История транзакций <span>({transactionData.length})</span>
              </h3>
            </div>
            <Table columns={transactionColumns} data={transactionData} />
          </div>
        </div>
      )}

      {showPopup && (
        <>
          <div className={styles.overlay} />
          <div className={styles.popup} ref={popupRef}>
            <h2 className={styles.popupTitle}>Вы действительно хотите удалить ассистента?</h2>
            <div className={styles.popupButtons}>
              <button
                className={styles.confirmButton}
                onClick={handleDeleteAssistant}
                disabled={isDeleting}
              >
                {isDeleting ? 'Удаление...' : 'Да'}
              </button>
              <button className={styles.cancelButton} onClick={() => setShowPopup(false)}>Нет</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Page;

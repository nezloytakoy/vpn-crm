"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './Assistent.module.css';
import Link from 'next/link';
import Table from '@/components/Table/Table';
import { Column } from 'react-table';
import Select from 'react-select';
import { usePathname, useRouter } from 'next/navigation'; 
import Image from 'next/image';

interface UserData {
  userId: string;
  username: string;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  totalCoins: number;
  aiRequestCount: number;
  assistantRequestCount: number;
  userRequests: UserRequest[];
  complaints: ComplaintData[];
  referrals: ReferralData[];
  userInfo: UserInfo;
}

interface UserInfo {
  username: string;
  telegramId: string;
  phoneNumber: string | null;
  paymentSystem: string | null;
  avatarUrl: string | null;
}

interface Message {
  sender: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: string;
}

interface UserRequest {
  requestId: number;
  status: string;
  assistantId: string; 
  messages: Message[];
}

interface ComplaintData {
  complaintId: string;
  status: string;
  assistantId: string; 
  messages: Message[];
}

interface ReferralData {
  telegramId: string;
  username: string;
  hasUpdatedSubscription: boolean;
  referralCount: number;
}

function Page() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [showPopup, setShowPopup] = useState(false);
  const [inputValuesAssistant, setInputValuesAssistant] = useState<string[]>(['5', '14', '30', '3']);
  const popupRef = useRef<HTMLDivElement>(null);
  const [percentage, setPercentage] = useState<number>(60);
  const [isToggled] = useState(false);

  const [blockHours, setBlockHours] = useState(''); 
  const [isBlocking, setIsBlocking] = useState(false); 

  const [isDeleting, setIsDeleting] = useState(false); 
  const [deleteError, setDeleteError] = useState<string | null>(null); 



  const router = useRouter(); 
  const pathname = usePathname();
  const userId = pathname.split('/').pop();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/get-user-data?userId=${userId}`);
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
      } finally {
        setIsLoadingData(false); 
      }
    };
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleInputChangeAssistant = (index: number, value: string) => {
    const updatedValues = [...inputValuesAssistant];
    updatedValues[index] = value;
    setInputValuesAssistant(updatedValues);
  };

  const options = [
    { value: 'ai5', label: 'AI + 5 запросов ассистенту' },
    { value: 'ai14', label: 'AI + 14 запросов ассистенту' },
    { value: 'ai30', label: 'AI + 30 запросов ассистенту' },
    { value: 'only-ai', label: 'Только AI' }
  ];

  const sliderStyle = {
    background: `linear-gradient(to right, #365CF5 0%, #365CF5 ${percentage}%, #e5e5e5 ${percentage}%, #e5e5e5 100%)`,
  };

  const handleDownload = (messages: Message[], filename: string) => {
    const content = messages
      .map(msg => `[${msg.timestamp}] ${msg.sender}: ${msg.content}`)
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

  const requestColumns: Column<UserRequest>[] = [
    { Header: 'ID запроса', accessor: 'requestId' },
    { Header: 'Действие', accessor: 'status' },
    {
      Header: 'Лог',
      accessor: 'messages',
      Cell: ({ row }: { row: { original: UserRequest } }) => (
        row.original.assistantId !== '-' ? (
          <button
            onClick={() => handleDownload(row.original.messages, `request_${row.original.requestId}`)}
            className={styles.downloadButton}
          >
            Скачать
          </button>
        ) : (
          <span>-</span>
        )
      ),
    },
    {
      Header: 'ID ассистента',
      accessor: 'assistantId',
      Cell: ({ value }) => value !== '-' ? value : <span>-</span>,
    },
  ];

  const complaintColumns: Column<ComplaintData>[] = [
    { Header: 'ID жалобы', accessor: 'complaintId' },
    { Header: 'Действие', accessor: 'status' },
    {
      Header: 'Лог',
      accessor: 'messages',
      Cell: ({ row }: { row: { original: ComplaintData } }) => (
        row.original.assistantId !== '-' ? (
          <button
            onClick={() => handleDownload(row.original.messages, `complaint_${row.original.complaintId}`)}
            className={styles.downloadButton}
          >
            Скачать
          </button>
        ) : (
          <span>-</span>
        )
      ),
    },
    {
      Header: 'ID ассистента',
      accessor: 'assistantId',
      Cell: ({ value }) => value !== '-' ? value : <span>-</span>,
    },
  ];

  const referralColumns: Column<ReferralData>[] = [
    { Header: 'ID пользователя', accessor: 'telegramId' },
    {
      Header: 'Юзернейм пользователя',
      accessor: 'username',
      Cell: ({ row }: { row: { original: ReferralData } }) => (
        <Link href={`/admin/users/${row.original.telegramId}`} className={styles.usernameLink}>
          {row.original.username}
        </Link>
      ),
    },
    {
      Header: 'Постоянный пользователь',
      accessor: 'hasUpdatedSubscription',
      Cell: ({ value }: { value: boolean }) => (value ? 'Да' : 'Нет'),
    },
    {
      Header: 'Имеет рефералов',
      accessor: 'referralCount',
      Cell: ({ value }: { value: number }) => (value > 0 ? 'Да' : 'Нет'),
    },
  ];

  const handleBlockUser = async () => {
    setIsBlocking(true);
    try {
      if (!userId) {
        throw new Error('ID пользователя не найден');
      }
      if (!blockHours) {
        throw new Error('Введите количество часов');
      }
      const hours = parseInt(blockHours, 10);
      if (isNaN(hours) || hours <= 0) {
        throw new Error('Количество часов должно быть положительным числом');
      }
      const response = await fetch('/api/block-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId, hours }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при блокировке пользователя');
      }

      alert('Пользователь успешно заблокирован');
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

  
  const handleDeleteUser = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    console.log(deleteError)
    try {
      if (!userId) {
        throw new Error('ID пользователя не найден');
      }

      const response = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при удалении пользователя');
      }

      alert('Пользователь успешно удален');

      
      setTimeout(() => {
        router.push('/admin/users');
      }, 3000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setDeleteError(error.message);
        alert('Ошибка: ' + error.message);
      } else {
        setDeleteError('Произошла неизвестная ошибка');
        alert('Произошла неизвестная ошибка');
      }
    } finally {
      setIsDeleting(false);
    }
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
        <h1 className={styles.title}>Пользователь</h1>
        <div className={styles.pointerblock}>
          <p className={styles.pointertext}>
            <Link href="/admin/users" className={styles.link}>Пользователи</Link> &nbsp;&nbsp;/&nbsp;&nbsp;
            Пользователь
          </p>
        </div>
      </div>

      <div className={styles.assistantblock}>
        <div className={styles.containertwo}>
          <div className={styles.infoblock}>
            <div className={styles.metricsblock}>
              <div className={styles.logoparent}>
                <div className={styles.avatarblock}>
                  {userData?.userInfo?.avatarUrl ? (
                    <Image
                      src={userData.userInfo.avatarUrl || '/path/to/default/avatar.png'} 
                      alt="Avatar"
                      width={100} 
                      height={100} 
                      className={styles.avatarImage}
                    />
                  ) : (
                    <p>Нет аватара</p>
                  )}
                </div>
                <div className={styles.numbers}>
                  <div className={styles.metric}>
                    <p className={styles.number}>{userData?.assistantRequestCount || 0}</p>
                    <p className={styles.smalltitle}>Запросы/все время</p>
                  </div>
                  <div className={styles.metric}>
                    <p className={styles.number}>{userData?.requestsThisMonth || 0}</p>
                    <p className={styles.smalltitle}>Запросы/месяц</p>
                  </div>
                  <div className={styles.metric}>
                    <p className={styles.number}>{userData?.requestsThisWeek || 0}</p>
                    <p className={styles.smalltitle}>Запросы/неделя</p>
                  </div>
                </div>
              </div>

              <div className={styles.datablock}>
                <div className={styles.nameblock}>
                  <p className={styles.name}>@{userData?.username || 'N/A'}</p>
                  <p className={styles.undername}>ID: {userData?.userId || 'N/A'}</p>

                  <p className={styles.undername}>Платежная система: звезды telegram</p>
                </div>
                <div className={styles.numberstwo}>
                  <div className={styles.metric}>
                    <p className={styles.number}>{userData?.requestsToday || 0}</p>
                    <p className={styles.smalltitle}>Запросы/сутки</p>
                  </div>
                  <div className={styles.metric}>
                    <p className={styles.number}>{userData?.aiRequestCount || 0}</p>
                    <p className={styles.smalltitle}>Обращений к ИИ</p>
                  </div>
                  <div className={styles.metric}>
                    <p className={styles.number}>{userData?.totalCoins || 0}</p>
                    <p className={styles.smalltitle}>Койнов</p>
                  </div>
                </div>
              </div>
              <div className={styles.numbersthree}>
                <div className={styles.messageboxthree}>
                  <h1 className={styles.gifttitle}>Заблокировать пользователя</h1>
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
                      onClick={handleBlockUser}
                      disabled={isBlocking}
                    >
                      {isBlocking ? 'Загрузка...' : 'Подтвердить'}
                    </button>
                    <button
                      className={styles.submitButtonthree}
                      onClick={() => setShowPopup(true)}
                    >
                      Удалить пользователя
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.containerthree}>
            <div className={styles.messageboxfive}>
              <h1 className={styles.gifttitle}>Текущее количество запросов к ИИ</h1>
              <h1 className={styles.undertitletwo}>Изменить количество</h1>
              <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                <input type="text" className={styles.inputFieldtwo} placeholder="7" />
                <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Отказов</span>
              </div>
              <button className={styles.submitButton}>Подтвердить</button>
            </div>
            <div className={styles.messageboxfive}>
              <h1 className={styles.gifttitle}>Текущее количество запросов к ассистенту</h1>
              <h1 className={styles.undertitletwo}>Изменить количество</h1>
              <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                <input type="text" className={styles.inputFieldtwo} placeholder="7" />
                <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Отказов</span>
              </div>
              <button className={styles.submitButton}>Подтвердить</button>
            </div>
          </div>
          <div className={styles.containerthree}>
            <div className={styles.messageboxseven}>
              <h1 className={styles.titletwo}>Уведомления всем ассистентам</h1>
              <h1 className={styles.undertitle}>Форма для сообщения</h1>
              <textarea className={styles.input} placeholder="Сообщение" />
              <button className={styles.submitButton}>Отправить</button>
            </div>
            <div className={styles.messageboxsix}>
              <h1 className={styles.gifttitle}>Выдать подписку</h1>
              <h1 className={styles.undertitletwo}>Выберите тип</h1>

              <div className={styles.selectWrapper}>
                <Select options={options} />
                <div className={styles.selectArrow}></div>
              </div>

              <button className={styles.submitButton}>Подтвердить</button>
            </div>
          </div>
        </div>

        <div className={styles.containerone}>
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
          <div className={styles.messageboxfour}>
            <h1 className={styles.gifttitle}>Количество запросов к ИИ</h1>
            {inputValuesAssistant.map((value, index) => (
              <div key={index}>
                <h1 className={styles.undertitletwo}>
                  {index === 3 ? 'Только AI' : `Введите количество для категории AI + ${index === 0 ? '5' : index === 1 ? '14' : '30'} запросов ассистенту`}
                </h1>
                <div className={styles.inputContainertwo}>
                  <input
                    type="text"
                    className={styles.inputFieldtwo}
                    placeholder={value}
                    value={value}
                    onChange={(e) => handleInputChangeAssistant(index, e.target.value)}
                  />
                  <span className={styles.label}>Запросов</span>
                </div>
              </div>
            ))}

            <button className={styles.submitButton}>Подтвердить</button>
          </div>
        </div>
      </div>

      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Запросы <span>({userData?.userRequests?.length || 0})</span>
            </h3>
          </div>
          <Table columns={requestColumns} data={userData?.userRequests || []} />
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Жалобы <span>({userData?.complaints.length || 0})</span>
            </h3>
          </div>
          <Table columns={complaintColumns} data={userData?.complaints || []} />
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>Рефералы <span>({userData?.referrals.length || 0})</span></h3>
          </div>
          <Table columns={referralColumns} data={userData?.referrals || []} />
        </div>
      </div>

      {showPopup && (
        <>
          <div className={styles.overlay} />
          <div className={styles.popup} ref={popupRef}>
            <h2 className={styles.popupTitle}>Вы действительно хотите удалить пользователя?</h2>
            <div className={styles.popupButtons}>
              <button
                className={styles.confirmButton}
                onClick={handleDeleteUser}
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

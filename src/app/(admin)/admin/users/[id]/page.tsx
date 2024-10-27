"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './Assistent.module.css';
import Link from 'next/link';
import Table from '@/components/Table/Table';
import { Column } from 'react-table';
import Select from 'react-select';
import { usePathname } from 'next/navigation';
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
  const [showPopup, setShowPopup] = useState(false);
  const [inputValuesAssistant, setInputValuesAssistant] = useState<string[]>(['5', '14', '30', '3']);
  const popupRef = useRef<HTMLDivElement>(null);
  const [percentage, setPercentage] = useState<number>(60);
  const [isToggled] = useState(false);

  const pathname = usePathname();
  const userId = pathname.split('/').pop();

  useEffect(() => {
    console.log('userId из маршрута:', userId);
    const fetchData = async () => {
      try {
        console.log('Начинаем fetch запрос к /api/get-user-data');
        const response = await fetch(`/api/get-user-data?userId=${userId}`);
        console.log('Ответ от fetch запроса получен:', response);
        const data = await response.json();
        console.log('Данные после парсинга JSON:', data);
        setUserData(data);
      } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
      }
    };
    if (userId) {
      fetchData();
    } else {
      console.error('userId не определён');
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
    { Header: 'Юзернейм пользователя', accessor: 'username' },
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




  console.log('Данные для таблицы жалоб:', userData?.complaints);

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

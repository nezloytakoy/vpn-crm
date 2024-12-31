/* eslint-disable react/jsx-key */

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

// New interface for Complaints
interface ComplaintData {
  id: string;
  userId: string;
  username: string | null;
  status: string;
  decision: string | null;
  moderatorId: string | null;
}

interface ComplaintDetails {
  complaintId: string;
  text: string;
  photoUrls: string[];
  userId: string;
  userNickname: string;
  assistantId: string;
  assistantNickname: string;
  conversationLogs: {
    sender: 'USER' | 'ASSISTANT';
    message: string;
    timestamp: string;
  }[];
}

function formatComplexDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return '0с';
  }

  // Посчитаем величины в каждой единице
  // (берём усреднённые значения, а не строгий календарный подсчёт:
  //  1 месяц = 30 дней, 1 неделя = 7 дней, и т. п.)
  const months = Math.floor(totalSeconds / (30 * 24 * 3600));
  const remainderAfterMonths = totalSeconds % (30 * 24 * 3600);

  const weeks = Math.floor(remainderAfterMonths / (7 * 24 * 3600));
  const remainderAfterWeeks = remainderAfterMonths % (7 * 24 * 3600);

  const days = Math.floor(remainderAfterWeeks / (24 * 3600));
  const remainderAfterDays = remainderAfterWeeks % (24 * 3600);

  const hours = Math.floor(remainderAfterDays / 3600);
  const remainderAfterHours = remainderAfterDays % 3600;

  const minutes = Math.floor(remainderAfterHours / 60);
  const seconds = remainderAfterHours % 60;

  // Определяем, какие единицы реально задействованы
  // Составляем их в порядке убывания «приоритета»
  const units = [
    { label: 'мес', value: months },
    { label: 'нед', value: weeks },
    { label: 'дн', value: days },
    { label: 'ч', value: hours },
    { label: 'мин', value: minutes },
    { label: 'с', value: seconds },
  ];

  // Теперь нам надо вывести ровно "три старших" ненулевых единицы
  // Но если «более крупная» единица ноль, пропускаем и смотрим дальше

  // Находим индекс первой ненулевой (если есть)
  const firstNonZeroIndex = units.findIndex((u) => u.value !== 0);
  if (firstNonZeroIndex === -1) {
    // Значит всё было по нулям, вернём "0с"
    return '0с';
  }

  // Возьмём срез из units, начиная с первой ненулевой, на 3 элемента
  // (если там окажется меньше 3 ненулевых, возьмём сколько есть)
  const sliced = units.slice(firstNonZeroIndex, firstNonZeroIndex + 3);

  // Отфильтруем из этого среза те, у кого value=0 (когда, например, вторая по приоритету оказалась 0)
  const finalUnits = sliced.filter((u) => u.value !== 0);

  // Формируем строку типа "2мес 3нед 7дн"
  const result = finalUnits.map((u) => `${u.value}${u.label}`).join(' ');

  return result || '0с';
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
  const [coins, setCoins] = useState(''); // Хранение введённых данных
  const [error, setError] = useState(''); // Хранение ошибок
  const [success, setSuccess] = useState(''); // Сообщение об успехе

  // New state for complaints
  const [complaintsData, setComplaintsData] = useState<ComplaintData[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [showComplaintPopup, setShowComplaintPopup] = useState(false); // показывает попап
  const [isFormVisible, setIsFormVisible] = useState(false);          // показывает форму объяснения
  const [fadeOut, setFadeOut] = useState(false);                      // анимация скрытия
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [explanation, setExplanation] = useState('');                 // введённый текст
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintData | null>(null);
  const [complaintDetails, setComplaintDetails] = useState<ComplaintDetails | null>(null);

  const handleApproveComplaint = () => {
    setAction('approve');
    setFadeOut(true);
    // Ждём окончание анимации 300ms (или сколько у вас в CSS)
    setTimeout(() => {
      setIsFormVisible(true);
      setFadeOut(false);
    }, 300);
  };

  const handleRejectComplaint = () => {
    setAction('reject');
    setFadeOut(true);
    setTimeout(() => {
      setIsFormVisible(true);
      setFadeOut(false);
    }, 300);
  };

  const handleComplaintFormSubmit = async () => {
    if (!selectedComplaint) return;
    setIsSubmitting(true);

    try {
      // Пример: получаем moderatorId (если нужно)
      const modResp = await fetch('/api/get-moder-id');
      if (!modResp.ok) throw new Error('Не удалось получить moderatorId');
      const { userId: moderatorId } = await modResp.json();

      const endpoint = action === 'approve'
        ? `/api/approve-complaint?id=${selectedComplaint.id}`
        : `/api/reject-complaint?id=${selectedComplaint.id}`;

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: selectedComplaint.id,
          explanation,
          moderatorId,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Ошибка при ${action === 'approve' ? 'одобрении' : 'отклонении'} жалобы`);
      }

      // Если всё ок — закрываем попап и сбрасываем стейт
      setShowComplaintPopup(false);
      setIsFormVisible(false);
      setSelectedComplaint(null);
      setComplaintDetails(null);
      setExplanation('');
      setAction(null);

      // Возможно, стоит обновить список жалоб, чтобы изменения отобразились
      // refreshComplaints(); // <-- функция, чтобы заново сходить в /api/... и обновить complaints

    } catch (err) {
      console.error('Ошибка при обработке жалобы:', err);
      alert('Произошла ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };



  // Function to fetch complaints data
  useEffect(() => {
    const fetchComplaintsData = async () => {
      try {
        const response = await fetch(`/api/get-assistant-complaints?assistantId=${currentAssistantId}`);
        const data = await response.json();
        if (response.ok) {
          setComplaintsData(data);
        } else {
          console.error('Ошибка:', data.error);
        }
      } catch (error) {
        console.error('Ошибка при получении жалоб:', error);
      } finally {
        setIsLoadingComplaints(false);
      }
    };

    if (currentAssistantId) {
      fetchComplaintsData();
    }
  }, [currentAssistantId]);

  useEffect(() => {

    if (!assistantData) return;
    if (!currentAssistantId) return;

    const rawUrl = `/api/get-assistant-avatar?assistantId=${currentAssistantId}&raw=true`;
    console.log('[AssistantPage] fetch avatar =>', rawUrl);

    setAvatarUrl(null);

    fetch(rawUrl)
      .then(async (res) => {
        if (res.headers.get('content-type')?.includes('application/json')) {
          const jsonData = await res.json().catch(() => ({}));
          if (jsonData.error === 'no avatar') {
            console.log('[AssistantPage] no avatar => null');
            return;
          }
          return;
        }
        setAvatarUrl(rawUrl);
      })
      .catch(() => {
        setAvatarUrl(null);
      });
  }, [assistantData]);

  const handleSubmit = async () => {
    // Проверка на пустой инпут
    if (!coins.trim()) {
      setError('Пожалуйста, введите количество коинов.');
      setSuccess('');
      return;
    }

    const coinsNumber = parseInt(coins, 10);

    if (isNaN(coinsNumber) || coinsNumber <= 0) {
      setError('Введите корректное число.');
      setSuccess('');
      return;
    }

    setError(''); // Очистка ошибки

    try {
      const response = await fetch('/api/add-coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: currentAssistantId,
          coins: coinsNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при добавлении коинов');
      }

      // Вместо установки сообщения успешного состояния, выводим alert
      alert('Коины успешно подарены!');
      setCoins(''); // Очистка инпута
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Произошла неизвестная ошибка.');
      }
      setSuccess('');
    }
  };
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

  const complaintsColumns: Column<ComplaintData>[] = [
    { Header: 'ID Жалобы', accessor: 'id' },
    { Header: 'ID Пользователя', accessor: 'userId' },
    { Header: 'Username', accessor: 'username' },
  ];

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

  // Определение столбцов для таблицы запросов
  const requestColumns: Column<AssistantRequest>[] = [
    { Header: 'ID запроса', accessor: 'id' },
    { Header: 'Действие', accessor: 'status' },
    {
      Header: 'Лог',
      accessor: 'messages',
      Cell: ({ row }: { row: { original: AssistantRequest } }) => {
        const { messages, status, id } = row.original;
        if (status === 'IGNORED' || status === 'REJECTED') {
          return <span>-</span>;
        }
        return (
          <button
            onClick={() => handleDownload(messages, `request_${id}`)}
            className={styles.downloadButton} // <-- важная строчка!
          >
            Скачать
          </button>
        );
      },
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

  function handleComplaintRowClick(rowData: ComplaintData) {
    console.log('[handleComplaintRowClick] invoked with =', rowData);
    // 1) Сохраняем выбранную жалобу (чтобы знать её id)
    setSelectedComplaint(rowData);

    // 2) Делаем запрос за деталями: /api/get-complaint-details?id=...
    fetch(`/api/get-complaint-details?id=${rowData.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Ошибка при получении деталей жалобы');
        return res.json();
      })
      .then((details: ComplaintDetails) => {
        // 3) Сохраняем детальные данные в стейт
        setComplaintDetails(details);

        // 4) Показываем попап
        setShowComplaintPopup(true);
        setIsFormVisible(false);
        setExplanation('');
        setAction(null);
        setFadeOut(false);
      })
      .catch((err) => {
        console.error('Ошибка при загрузке деталей жалобы:', err);
        alert('Не удалось загрузить детали жалобы');
      });
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
        <div className={styles.fatherblock}>
          <div className={styles.infoblock}>
            <div className={styles.metricsblock}>
              <div className={styles.logoparent}>
                <div className={styles.avatarblock}>
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={`Аватар ассистента ${assistantData?.assistant.username}`}
                      className={styles.avatarImage}
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Image
                      src="https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg"
                      alt="Заглушка аватара"
                      width={100}
                      height={100}
                      className={styles.avatarImage}
                      style={{ objectFit: 'cover' }}
                    />
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
                    <p className={styles.number}>
                      {assistantData?.averageSessionTime
                        ? formatComplexDuration(assistantData.averageSessionTime)
                        : '0с'}
                    </p>
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
                <div className={styles.messageboxthree}>
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
          <div className={styles.messagebox}>
            <h1 className={styles.gifttitle}>Подарить коины</h1>
            <h1 className={styles.undertitletwo}>Введите количество</h1>
            <div className={styles.inputContainertwo}>
              <input
                type="text"
                className={styles.inputFieldtwo}
                value={coins}
                onChange={(e) => setCoins(e.target.value)} // Обновление state при вводе данных
              />
              <span className={styles.label}>Коинов</span>
            </div>

            {error && <p className={styles.error}>{error}</p>} {/* Отображение ошибок */}
            {success && <p className={styles.success}>{success}</p>} {/* Отображение успешного сообщения */}

            <button
              className={`${styles.submitButtonfive}`}
              onClick={handleSubmit} // Вызов функции при нажатии
            >
              Подтвердить
            </button>
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
                  <div>
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
          {/* <-- Изменения! Проверяем, идет ли загрузка данных ассистента */}
          {isLoadingData ? (
            <p>Загрузка запросов...</p>
          ) : requestData.length > 0 ? (
            <Table columns={requestColumns} data={requestData} />
          ) : (
            <p>Запросы не найдены.</p>
          )}
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
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Жалобы на ассистента <span>({complaintsData.length})</span>
            </h3>
          </div>
          {isLoadingComplaints ? (
            <p>Загрузка жалоб...</p>
          ) : complaintsData.length > 0 ? (
            <Table
              columns={complaintsColumns}
              data={complaintsData}
              onRowClick={(rowData) => {
                console.log('[AssistantPage] onRowClick called with rowData =', rowData);
                handleComplaintRowClick(rowData);  // <-- Далее идёт ваша логика
              }}
            />
          ) : (
            <p>Жалобы не найдены.</p>
          )}
        </div>
      </div>

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

      {showComplaintPopup && complaintDetails && (
        <>
          <div className={styles.overlay} />
          <div className={`${styles.popup} ${fadeOut ? styles.fadeOut : ''}`}>
            {!isFormVisible ? (
              <>
                {/* Блок с краткой информацией о жалобе */}
                <p><strong>Сообщение:</strong> {complaintDetails.text}</p>

                {complaintDetails.photoUrls?.length > 0 && (
                  <div>
                    <strong>Скриншоты:</strong>
                    <div className={styles.imagesContainer}>
                      {complaintDetails.photoUrls.map((url: string, index: number) => (
                        <Image
                          key={index}
                          src={`/api/get-image-proxy?url=${encodeURIComponent(url)}`}
                          alt={`Скриншот ${index + 1}`}
                          className={styles.image}
                          width={200}
                          height={120}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.buttonGroup}>
                  <button onClick={handleApproveComplaint} className={styles.approveButton}>
                    Одобрить
                  </button>
                  <button onClick={handleRejectComplaint} className={styles.rejectButton}>
                    Отклонить
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.formContainer}>
                <h3>{action === 'approve' ? 'Одобрение жалобы' : 'Отклонение жалобы'}</h3>
                <textarea
                  placeholder="Введите ваше объяснение"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className={styles.textArea}
                />
                <button
                  onClick={handleComplaintFormSubmit}
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <div className={styles.buttonLoader} /> : 'Отправить'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Page;

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
  message: string; // вместо content
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

interface ComplaintDetails {
  text: string;
  photoUrls: string[];
  // Если у вас в детальном ответе есть и другие поля,
  // например id, status, assistantId и т.п., добавьте их:
  // complaintId: string;
  // assistantId: string;
  // status: string;
  // messages: Message[];
}

interface ReferralData {
  telegramId: string;
  username: string;
  hasUpdatedSubscription: boolean;
  referralCount: number;
}


const updateReferralPercentage = async (telegramId: bigint, newPercentage: number) => {
  try {
    console.log(`Updating referral percentage for telegramId: ${telegramId}, newPercentage: ${newPercentage}`);
    const response = await fetch('/api/update-user-percentage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: telegramId.toString(),
        referralPercentage: newPercentage
      }),
    });

    if (response.ok) {
      console.log('Referral percentage updated successfully');
    } else {
      const data = await response.json();
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Failed to update referral percentage:', error);
  }
};


function Page() {
  // Состояния для жалобы
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintData | null>(null);
  // Детальные данные (текст, скриншоты и т.д.)
  const [complaintDetails, setComplaintDetails] = useState<ComplaintDetails | null>(null);

  const [showComplaintPopup, setShowComplaintPopup] = useState(false); // показывает попап
  const [isFormVisible, setIsFormVisible] = useState(false); // показывает форму объяснения
  const [fadeOut, setFadeOut] = useState(false);             // анимация скрытия
  const [explanation, setExplanation] = useState('');        // текст, который заполняет модератор
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [percentage, setPercentage] = useState<number>(60);
  const [isToggled] = useState(false);
  const [requests, setRequests] = useState<{ aiRequests: number; assistantRequests: number }>({
    aiRequests: 0,
    assistantRequests: 0,
  });

  const [blockHours, setBlockHours] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [message, setMessage] = useState('');

  const [aiRequestInput, setAiRequestInput] = useState<string>('');
  const [assistantRequestInput, setAssistantRequestInput] = useState<string>('');

  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(null);

  const [subscriptionOptions, setSubscriptionOptions] = useState<{ value: number; label: string }[]>([]);

  const [loadingButton, setLoadingButton] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);



  const handleButtonClick = (handler: () => Promise<void>, buttonKey: string) => {
    setLoadingButton(buttonKey);


    setTimeout(async () => {
      await handler();


      setTimeout(() => {
        location.reload();
      }, 3000);
    }, 3000);
  };

  // Функция для клика по строке жалобы
  const handleComplaintRowClick = async (row: ComplaintData) => {
    try {
      // 1. Запоминаем «короткие» данные жалобы
      setSelectedComplaint(row);

      // 2. Делаем запрос детальной информации:
      //    допустим, /api/get-complaint-details?id=complaintId
      const resp = await fetch(`/api/get-complaint-details?id=${row.complaintId}`);
      if (!resp.ok) {
        throw new Error('Ошибка при получении деталей жалобы');
      }
      const full = await resp.json();
      setComplaintDetails(full);

      // 3. Показываем попап
      setShowComplaintPopup(true);
      setIsFormVisible(false);
      setExplanation('');
      setAction(null);
      setFadeOut(false);
    } catch (error) {
      console.error('Ошибка при получении жалобы:', error);
    }
  };


  const handleAssistantRequestSubmit = async () => {
    if (!userId || assistantRequestInput.trim() === '') {
      alert('Введите количество запросов.');
      return;
    }

    try {
      const assistantRequests = parseInt(assistantRequestInput, 10);
      if (isNaN(assistantRequests) || assistantRequests < 0) {
        alert('Пожалуйста, введите корректное положительное число.');
        return;
      }

      const response = await fetch('/api/update-personal-assistant-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, assistantRequests }),
      });

      const result = await response.json();
      if (response.ok) {
        alert('Количество запросов к ассистенту успешно обновлено.');
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка при обновлении количества запросов к ассистенту:', error);
      alert('Произошла ошибка при обновлении количества запросов.');
    }
  };


  const handleAiRequestSubmit = async () => {
    if (!userId || aiRequestInput.trim() === '') {
      alert('Введите количество запросов.');
      return;
    }

    try {
      const aiRequests = parseInt(aiRequestInput, 10);
      if (isNaN(aiRequests) || aiRequests < 0) {
        alert('Пожалуйста, введите корректное положительное число.');
        return;
      }

      const response = await fetch('/api/update-user-ai-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, aiRequests }),
      });

      const result = await response.json();
      if (response.ok) {
        alert('Количество запросов к ИИ успешно обновлено.');
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка при обновлении количества запросов к ИИ:', error);
      alert('Произошла ошибка при обновлении количества запросов.');
    }
  };



  const router = useRouter();
  const pathname = usePathname();
  const userId = pathname.split('/').pop();

  const handleSendNotification = async () => {
    if (message.trim() === '') {
      alert('Пожалуйста, введите сообщение.');
      return;
    }

    try {
      const response = await fetch('/api/send-user-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, message }),
      });

      if (response.ok) {
        alert('Сообщение успешно отправлено');
        setMessage('');
      } else {
        const errorData = await response.json();
        alert(`Ошибка при отправке сообщения: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      alert('Произошла ошибка при отправке сообщения.');
    }
  };



  useEffect(() => {
    // Если userId не задан, ничего не делаем
    if (!userId) return;

    let isMounted = true;

    const fetchAllData = async () => {
      try {
        // 1) Получаем основные данные пользователя
        console.log('[fetchData] about to call => /api/get-user-data?userId=', userId);
        const respUserData = await fetch(`/api/get-user-data?userId=${userId}`);
        const userDataJson = await respUserData.json();
        console.log('[fetchData] JSON =', userDataJson);
        if (isMounted) {
          setUserData(userDataJson);
          setIsLoadingData(false);
        }

        // 2) Если есть userData => подгружаем аватар
        if (userDataJson?.userId) {
          const rawUrl = `/api/get-avatar?telegramId=${userDataJson.userId}&raw=true`;
          console.log('[AvatarEffect] fetch avatar =>', rawUrl);

          const avatarResp = await fetch(rawUrl);
          // Проверяем, не JSON ли там ответ. Если `jsonData.error === 'no avatar'`, то аватарки нет.
          if (
            avatarResp.headers.get('content-type')?.includes('application/json')
          ) {
            const jsonData = await avatarResp.json().catch(() => ({}));
            if (jsonData.error === 'no avatar') {
              // avatarUrl остаётся null => показываем заглушку
              if (isMounted) setAvatarUrl(null);
            }
          } else {
            // Если дошли сюда => контент точно картинка
            if (isMounted) setAvatarUrl(rawUrl);
          }
        }

        // 3) Реферальный процент
        const respPerc = await fetch(`/api/get-user-percentage?userId=${userId}`);
        const dataPerc = await respPerc.json();
        if (isMounted && dataPerc.referralPercentage !== undefined) {
          setPercentage(dataPerc.referralPercentage);
        }

        // 4) Количество запросов (ai/assistant)
        const respRequests = await fetch(`/api/get-personal-requests?userId=${userId}`);
        const dataRequests = await respRequests.json();
        if (isMounted && dataRequests.requests) {
          setRequests(dataRequests.requests);
        }

        // 5) Список доступных подписок
        const respSubs = await fetch('/api/generate-tariff-names', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (respSubs.ok) {
          const subData = await respSubs.json();
          const options = subData.updatedSubscriptions.map(
            (sub: { id: number; name: string }) => ({
              value: sub.id,
              label: sub.name,
            })
          );
          if (isMounted) setSubscriptionOptions(options);
        }

        // 6) Получаем роль пользователя
        const roleResp = await fetch('/api/get-user-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId }),
        });
        if (roleResp.ok) {
          const roleResult = await roleResp.json();
          if (isMounted) setUserRole(roleResult.role);
        }
      } catch (error) {
        console.error('[fetchAllData] Ошибка:', error);
      }
    };

    // Первоначальный вызов
    fetchAllData();

    // Каждые 10 секунд будем заново вызывать fetchAllData
    const intervalId = setInterval(fetchAllData, 10000);

    // По размонтированию компонента отменяем интервал
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [userId]);



  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPercentage(Number(event.target.value));
  };

  const handleSubmit = async () => {
    console.log(`Submitting referral percentage update. UserId: ${userId}, Percentage: ${percentage}`);
    if (userId) {
      try {
        await updateReferralPercentage(BigInt(userId), percentage);
        alert('Процент реферала успешно обновлен.');
      } catch (error) {
        alert('Произошла ошибка при обновлении процента реферала.');
        console.error('Ошибка:', error);
      }


      setTimeout(() => {
        location.reload();
      }, 3000);
    } else {
      console.error('User ID not found');
    }
  };


  const handleDownload = (messages: Message[], filename: string) => {
    const content = messages
      .map(msg => {
        let text = msg.message;

        // Удаляем "Запрос X:" где X — число
        text = text.replace(/Запрос\s+\d+:/g, '');

        // Удаляем блок с минутами:
        // "\n--------------------------------\nДо конца сеанса осталось X минут\n"
        text = text.replace(/\n--------------------------------\nДо конца сеанса осталось \d+ минут\n/g, '');

        return `[${msg.timestamp}] ${msg.sender}: ${text.trim()}`;
      })
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

  const handleApproveComplaint = () => {
    setAction('approve');
    setFadeOut(true);
    // Подождём анимацию 300ms, потом показываем форму
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
      // 1. Узнаём moderatorId (если нужно)
      const modResp = await fetch('/api/get-moder-id');
      if (!modResp.ok) throw new Error('Не удалось получить moderatorId');
      const { userId: moderatorId } = await modResp.json();

      // 2. Шлём запрос
      const resp = await fetch(
        `/api/${action === 'approve' ? 'approve-complaint' : 'reject-complaint'}?id=${selectedComplaint.complaintId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            complaintId: selectedComplaint.complaintId,
            explanation,   // ваше объяснение
            moderatorId,   // кто это сделал
          }),
        }
      );
      if (!resp.ok) {
        throw new Error(`Ошибка при ${action === 'approve' ? 'одобрении' : 'отклонении'} жалобы: ${resp.status}`);
      }

      // успех
      setShowComplaintPopup(false);
      setSelectedComplaint(null);
      setComplaintDetails(null);
      setIsFormVisible(false);
      setExplanation('');
      setAction(null);
    } catch (err) {
      console.error('Ошибка при FormSubmit:', err);
      setIsSubmitting(false);
    }
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

  const handleSubscriptionSubmit = async () => {
    if (!userId || !selectedSubscription) {
      alert('Пожалуйста, выберите подписку и убедитесь, что ID пользователя указан.');
      return;
    }

    try {
      const response = await fetch('/api/give-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, subscriptionId: selectedSubscription }),
      });

      const result = await response.json();
      if (response.ok) {
        alert('Подписка успешно выдана.');
      } else {
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('Ошибка при выдаче подписки:', error);
      alert('Произошла ошибка при выдаче подписки.');
    }
  };

  console.log('Текущий статус userRole:', userRole);


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
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      width={100}
                      height={100}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <Image
                      src="https://92eaarerohohicw5.public.blob.vercel-storage.com/person-ECvEcQk1tVBid2aZBwvSwv4ogL7LmB.svg"
                      alt="Заглушка"
                      width={100}
                      height={100}
                      className={styles.avatarImage}
                    />
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

          {userRole !== 'Модератор' && (
            <div className={styles.containereight}>
              <div className={styles.messageboxfive}>
                <h1 className={styles.gifttitle}>Количество запросов к ИИ</h1>
                <h1 className={styles.undertitletwo}>Изменить количество</h1>
                <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                  <input
                    type="text"
                    className={styles.inputFieldtwo}
                    placeholder={requests.aiRequests !== undefined ? requests.aiRequests.toString() : 'Загрузка...'}
                    value={aiRequestInput}
                    onChange={(e) => setAiRequestInput(e.target.value)}
                  />
                  <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Отказов</span>
                </div>
                <button
                  className={styles.submitButton}
                  onClick={() => handleButtonClick(handleAiRequestSubmit, 'submitAiRequest')}
                  disabled={loadingButton === 'submitPercentage'}
                >
                  {loadingButton === 'submitAiRequest' ? 'Загрузка...' : 'Подтвердить'}
                </button>
              </div>


              <div className={styles.messageboxfive}>
                <h1 className={styles.gifttitle}>Количество запросов к ассистенту</h1>
                <h1 className={styles.undertitletwo}>Изменить количество</h1>
                <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                  <input
                    type="text"
                    className={styles.inputFieldtwo}
                    placeholder={requests.assistantRequests !== undefined ? requests.assistantRequests.toString() : 'Загрузка...'}
                    value={assistantRequestInput}
                    onChange={(e) => setAssistantRequestInput(e.target.value)}
                  />
                  <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Отказов</span>
                </div>
                <button
                  className={styles.submitButton}
                  onClick={() => handleButtonClick(handleAssistantRequestSubmit, 'submitAssistantRequest')}
                  disabled={loadingButton === 'submitAssistantRequest'}
                >
                  {loadingButton === 'submitAssistantRequest' ? 'Загрузка...' : 'Подтвердить'}
                </button>
              </div>

            </div>

          )}
        </div>
        {userRole !== 'Модератор' && (
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
                  onChange={handleSliderChange}
                  style={{
                    background: `linear-gradient(to right, #365CF5 0%, #365CF5 ${percentage}%, #e5e5e5 ${percentage}%, #e5e5e5 100%)`,
                  }}
                />
              </div>
              <button
                className={styles.submitButton}
                onClick={() => handleButtonClick(handleSubmit, 'submitReferralUpdate')}
                disabled={loadingButton === 'submitReferralUpdate'}
              >
                {loadingButton === 'submitReferralUpdate' ? 'Загрузка...' : 'Подтвердить'}
              </button>
            </div>
            {userRole !== 'Модератор' && (
              <div className={styles.containerthree}>
                <div className={styles.messageboxseven}>
                  <h1 className={styles.gifttitle}>Уведомления пользователю</h1>
                  <h1 className={styles.undertitle}>Форма для сообщения</h1>
                  <textarea
                    className={styles.input}
                    placeholder="Сообщение"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button
                    className={styles.submitButton}
                    onClick={() => handleButtonClick(handleSendNotification, 'sendNotification')}
                    disabled={loadingButton === 'sendNotification'}
                  >
                    {loadingButton === 'sendNotification' ? 'Загрузка...' : 'Отправить'}
                  </button>
                </div>
                <div className={styles.messageboxsix}>
                  <h1 className={styles.gifttitle}>Выдать подписку</h1>
                  <h1 className={styles.undertitletwo}>Выберите тип</h1>

                  <div className={styles.selectWrapper}>
                    <Select
                      options={subscriptionOptions}
                      onChange={(option) => setSelectedSubscription(option?.value || null)}
                    />
                    <div className={styles.selectArrow}></div>
                  </div>

                  <button
                    className={styles.submitButton}
                    onClick={() => handleButtonClick(handleSubscriptionSubmit, 'submitSubscription')}
                    disabled={loadingButton === 'submitSubscription'}
                  >
                    {loadingButton === 'submitSubscription' ? 'Загрузка...' : 'Подтвердить'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
          <Table
            columns={complaintColumns}
            data={userData?.complaints || []}
            onRowClick={handleComplaintRowClick}
            isRowClickable={true}
          />
        </div>
      </div>
      {userRole !== 'Модератор' && (
        <div className={styles.tablebox}>
          <div className={styles.tableWrapper}>
            <div className={styles.header}>
              <h3>Рефералы <span>({userData?.referrals.length || 0})</span></h3>
            </div>
            <Table columns={referralColumns} data={userData?.referrals || []} />
          </div>
        </div>
      )}
      {showComplaintPopup && complaintDetails && (
        <>
          <div className={styles.overlay} />
          <div className={`${styles.popup} ${fadeOut ? styles.fadeOut : ''}`}>
            {!isFormVisible ? (
              <>
                {/* Заголовок / текст жалобы */}
                <p><strong>Сообщение:</strong> {complaintDetails.text}</p>

                {/* Фото, если есть */}
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

                {/* Кнопки "Одобрить" / "Отклонить" */}
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
              // Если нажали "Одобрить"/"Отклонить" — показываем форму ввода объяснения
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

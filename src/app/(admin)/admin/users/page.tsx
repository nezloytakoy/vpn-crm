"use client";

import React, { useState, useMemo, useEffect } from 'react';
import styles from './Users.module.css';
import Table from '@/components/Table/Table';
import { Column, CellProps } from 'react-table';
import { useRouter } from 'next/navigation';


interface UserData {
    telegramId: string,
    username: string;
    referralCount: number;
    subscriptionType: string;
    assistantRequests: number;
    hasUpdatedSubscription: boolean;
}


type MyColumn<T extends object, K extends keyof T> = {
    Header: string;
    accessor: K;
    id: string;
    Cell?: (cell: CellProps<T, T[K]>) => React.ReactNode;
};

function Page() {

    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showSettings, setShowSettings] = useState(true);
    const [showTablebox, setShowTablebox] = useState(true);

    const [isToggledNotifications, setIsToggledNotifications] = useState(false);
    const [checkboxesNotifications, setCheckboxesNotifications] = useState<boolean[]>([false, false, false, false]);


    const [inputValuesAssistant, setInputValuesAssistant] = useState<string[]>(['5', '14', '30', '3']);

    const router = useRouter();

    const [message, setMessage] = useState('');

    const [aiRequestValues, setAiRequestValues] = useState<string[]>(['', '', '', '']);


    const handleInputChangeAiRequests = (index: number, value: string) => {
        const updatedValues = [...aiRequestValues];
        updatedValues[index] = value;
        setAiRequestValues(updatedValues);
    };

    const handleRowClick = (userId: string) => {
        router.push(`/admin/users/${userId}`);
    };




    const [percentage, setPercentage] = useState<number>(60);




    const [isToggledVoiceAI, setIsToggledVoiceAI] = useState<boolean>(false);
    const [checkboxesVoiceAI, setCheckboxesVoiceAI] = useState<boolean[]>([false, false, false, false]);


    const [isToggledVoiceAssistant, setIsToggledVoiceAssistant] = useState<boolean>(false);
    const [isToggledVideoAssistant, setIsToggledVideoAssistant] = useState<boolean>(false);
    const [isToggledFileAssistant, setIsToggledFileAssistant] = useState<boolean>(false);

    const defaultAiRequestValues = ['5', '14', '30', '3'];

    const [assistantRequestValues, setAssistantRequestValues] = useState<string[]>(['', '', '', '']);

    const defaultAssistantRequestValues = ['5', '14', '30', '0']; 



    const handleInputChangeAssistantRequests = (index: number, value: string) => {
        const updatedValues = [...assistantRequestValues];
        updatedValues[index] = value;
        setAssistantRequestValues(updatedValues);
    };

    const handleConfirmAssistantRequests = async () => {
        const valuesToSend = assistantRequestValues.map((value, index) =>
            value.trim() !== '' ? Number(value) : Number(defaultAssistantRequestValues[index])
        );

        if (valuesToSend.every((value) => !isNaN(value))) {
            const [first, second, third, fourth] = valuesToSend;

            try {
                const response = await fetch('/api/update-assistant-requests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ first, second, third, fourth }),
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Количество запросов к ассистенту успешно обновлено.');
                    setAssistantRequestValues(['', '', '', '']); 
                } else {
                    alert('Ошибка при обновлении: ' + data.error);
                }
            } catch (error) {
                console.error('Ошибка при обновлении запросов к ассистенту:', error);
                alert('Произошла ошибка при обновлении запросов к ассистенту.');
            }
        } else {
            alert('Пожалуйста, введите корректные числа во все поля.');
        }
    };

    interface AIRequest {
        subscriptionType: string;
        count: number; 
    }

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/get-users');
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error('Ошибка при получении данных пользователей:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchRequestCounts = async () => {
            try {
                const response = await fetch('/api/get-user-requests');
                const data = await response.json();
                if (response.ok) {
                    const counts = data.aiRequests.reduce((acc: Record<string, AIRequest>, item: AIRequest) => {
                        acc[item.subscriptionType] = item;
                        return acc;
                    }, {} as Record<string, AIRequest>);
                    setRequestCounts(counts);
                } else {
                    console.error('Ошибка при получении данных запросов:', data.error);
                }
            } catch (error) {
                console.error('Ошибка при получении данных запросов:', error);
            }
        };

        fetchUsers();
        fetchRequestCounts();
    }, []);

    const subscriptionTypes = ['FIRST', 'SECOND', 'THIRD', 'FOURTH'];

    const getAssistantRequestCount = (subscriptionType: string) => {
        return requestCounts && requestCounts[subscriptionType]
            ? requestCounts[subscriptionType].assistantRequestCount
            : defaultAssistantRequestValues[subscriptionTypes.indexOf(subscriptionType)];
    };

    const getAiRequestCount = (subscriptionType: string) => {
        return requestCounts && requestCounts[subscriptionType]
            ? requestCounts[subscriptionType].aiRequestCount
            : defaultAiRequestValues[subscriptionTypes.indexOf(subscriptionType)];
    };







    const handleToggleChangeNotifications = () => {
        const newToggleState = !isToggledNotifications;
        setIsToggledNotifications(newToggleState);
        setCheckboxesNotifications(newToggleState ? [true, true, true, true] : [false, false, false, false]);
    };

    const handleCheckboxChangeNotifications = (index: number) => {
        const updatedCheckboxes = [...checkboxesNotifications];
        updatedCheckboxes[index] = !updatedCheckboxes[index];
        setCheckboxesNotifications(updatedCheckboxes);
        setIsToggledNotifications(updatedCheckboxes.every((checkbox) => checkbox));
    };


    const handleToggleChangeVoiceAI = () => {
        const newToggleState = !isToggledVoiceAI;
        setIsToggledVoiceAI(newToggleState);
        setCheckboxesVoiceAI(newToggleState ? [true, true, true, true] : [false, false, false, false]);
    };

    const handleCheckboxChangeVoiceAI = (index: number) => {
        const updatedCheckboxes = [...checkboxesVoiceAI];
        updatedCheckboxes[index] = !updatedCheckboxes[index];
        setCheckboxesVoiceAI(updatedCheckboxes);
        setIsToggledVoiceAI(updatedCheckboxes.every((checkbox) => checkbox));
    };


    const handleToggleChangeVoiceAssistant = () => {
        setIsToggledVoiceAssistant(!isToggledVoiceAssistant);
    };

    const handleToggleChangeVideoAssistant = () => {
        setIsToggledVideoAssistant(!isToggledVideoAssistant);
    };

    const handleToggleChangeFileAssistant = () => {
        setIsToggledFileAssistant(!isToggledFileAssistant);
    };




    const handleInputChangeAssistant = (index: number, value: string) => {
        const updatedValues = [...inputValuesAssistant];
        updatedValues[index] = value;
        setInputValuesAssistant(updatedValues);
    };


    const sliderStyle = {
        background: `linear-gradient(to right, #365CF5 0%, #365CF5 ${percentage}%, #e5e5e5 ${percentage}%, #e5e5e5 100%)`,
    };


    const columnsData: MyColumn<UserData, keyof UserData>[] = [
        {
            Header: 'Ник пользователя',
            accessor: 'username',
            id: 'username',
        },
        {
            Header: 'Количество рефералов',
            accessor: 'referralCount',
            id: 'referralCount',
        },
        {
            Header: 'Подписка',
            accessor: 'subscriptionType',
            id: 'subscriptionType',
            Cell: ({ value }: CellProps<UserData, string | number | boolean>) => (
                <span>{getSubscriptionLabel(String(value))}</span>
            ),
        },
        {
            Header: 'Количество запросов',
            accessor: 'assistantRequests',
            id: 'assistantRequests',
        },
        {
            Header: 'Постоянный клиент',
            accessor: 'hasUpdatedSubscription',
            id: 'hasUpdatedSubscription',
            Cell: ({ value }: CellProps<UserData, string | number | boolean>) => (
                <span>{typeof value === 'boolean' ? (value ? 'Да' : 'Нет') : String(value)}</span>
            ),
        },
    ];

    const handleConfirmAiRequests = async () => {
        const valuesToSend = aiRequestValues.map((value, index) =>
            value.trim() !== '' ? Number(value) : Number(defaultAiRequestValues[index])
        );

        if (valuesToSend.every((value) => !isNaN(value))) {
            const [first, second, third, fourth] = valuesToSend;

            try {
                const response = await fetch('/api/update-ai-requests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ first, second, third, fourth }),
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Количество запросов к ИИ успешно обновлено.');
                    setAiRequestValues(['', '', '', '']); 
                } else {
                    alert('Ошибка при обновлении: ' + data.error);
                }
            } catch (error) {
                console.error('Ошибка при обновлении запросов к ИИ:', error);
                alert('Произошла ошибка при обновлении запросов к ИИ.');
            }
        } else {
            alert('Пожалуйста, введите корректные числа во все поля.');
        }
    };



    interface RequestCount {
        aiRequestCount: number;
        assistantRequestCount: number;
    }


    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showSortMenu, setShowSortMenu] = useState<boolean>(false);
    const [requestCounts, setRequestCounts] = useState<Record<string, RequestCount> | null>(null);




    const handleSortButtonClick = () => {
        setShowSortMenu(!showSortMenu);
    };

    const categoryMapping: Record<
        'AI + 5 запросов ассистенту' | 'AI + 14 запросов ассистенту' | 'AI + 30 запросов ассистенту' | 'Только AI',
        string
    > = {
        'AI + 5 запросов ассистенту': 'FIRST',
        'AI + 14 запросов ассистенту': 'SECOND',
        'AI + 30 запросов ассистенту': 'THIRD',
        'Только AI': 'FOURTH',
    };

    const getSubscriptionLabel = (subscriptionType: string) => {
        if (subscriptionType === 'FOURTH') {
            return 'Только AI';
        }
        const assistantCount = getAssistantRequestCount(subscriptionType);
        return `AI + ${assistantCount} запросов ассистенту`;
    };


    const handleSendMessage = async () => {
        const selectedCategories = checkboxesNotifications
            .map((checked, index) => (checked ? Object.keys(categoryMapping)[index] : null))
            .filter((label): label is keyof typeof categoryMapping => label !== null) 
            .map((label) => categoryMapping[label]);

        if (selectedCategories.length === 0) {
            alert('Пожалуйста, выберите хотя бы одну категорию пользователей.');
            return;
        }

        if (!message.trim()) {
            alert('Пожалуйста, введите сообщение.');
            return;
        }

        try {
            const response = await fetch('/api/send-message-to-users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ categories: selectedCategories, message }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Сообщения успешно отправлены.');
                setMessage('');
                setCheckboxesNotifications([false, false, false, false]);
            } else {
                alert('Ошибка при отправке сообщений: ' + data.error);
            }
        } catch (error) {
            console.error('Ошибка при отправке сообщений:', error);
            alert('Произошла ошибка при отправке сообщений.');
        }
    };




    const handleSortColumn = (columnId: string) => {
        if (sortColumn === columnId) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnId);
            setSortDirection('asc');
        }
        setShowSortMenu(false);
    };


    const sortedData = useMemo(() => {
        if (!sortColumn) return users;

        return [...users].sort((a, b) => {
            const aValue = a[sortColumn as keyof UserData];
            const bValue = b[sortColumn as keyof UserData];

            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [users, sortColumn, sortDirection]);


    return (
        <div className={styles.main}>
            <button className={styles.toggleButton} onClick={() => setShowSettings(!showSettings)}>
                {showSettings ? 'Скрыть настройки' : 'Показать настройки'}
                <svg
                    className={`${styles.arrowIcon} ${showSettings ? styles.up : styles.down}`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 15l-7-7h14l-7 7z" />
                </svg>
            </button>
            <div
                className={`${styles.collapsibleContent} ${showSettings ? styles.expanded : styles.collapsed}`}
            >
                <div className={styles.settings}>
                    <div className={styles.columnblock}>
                        <div className={styles.messagebox}>
                            <h1 className={styles.title}>Уведомления всем пользователям</h1>
                            <div className={styles.togglebox}>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={isToggledNotifications}
                                        onChange={handleToggleChangeNotifications}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={styles.label}>Отправить всем категориям пользователей</span>
                            </div>
                            <div className={styles.checkboxContainer}>
                                {checkboxesNotifications.map((checked, index) => {
                                    const subscriptionType = subscriptionTypes[index];
                                    const assistantCount = getAssistantRequestCount(subscriptionType);
                                    return (
                                        <label key={index} className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleCheckboxChangeNotifications(index)}
                                            />
                                            <span className={styles.animatedCheckbox}></span>
                                            <span>
                                                {subscriptionType === 'FOURTH'
                                                    ? 'Только AI'
                                                    : `AI + ${assistantCount} запросов ассистенту`}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            <h1 className={styles.undertitle}>Форма для сообщения</h1>
                            <textarea
                                className={styles.input}
                                placeholder="Сообщение"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <button className={styles.submitButton} onClick={handleSendMessage}>
                                Отправить
                            </button>
                        </div>

                        <div className={styles.messagebox}>
                            <h1 className={styles.gifttitle}>Количество запросов к ассистенту</h1>
                            {assistantRequestValues.map((value, index) => {
                                const subscriptionType = subscriptionTypes[index];
                                const assistantCount = getAssistantRequestCount(subscriptionType);
                                return (
                                    <div key={index}>
                                        <h1 className={styles.undertitletwo}>
                                            {subscriptionType === 'FOURTH'
                                                ? 'Только AI'
                                                : `Введите количество для категории AI + ${assistantCount} запросов ассистенту`}
                                        </h1>
                                        <div className={styles.inputContainertwo}>
                                            <input
                                                type="text"
                                                className={styles.inputFieldtwo}
                                                placeholder={String(assistantCount)}
                                                value={value}
                                                onChange={(e) => handleInputChangeAssistantRequests(index, e.target.value)}
                                            />
                                            <span className={styles.label}>Запросов</span>
                                        </div>
                                    </div>
                                );
                            })}

                            <button className={styles.submitButtontwo} onClick={handleConfirmAssistantRequests}>
                                Подтвердить
                            </button>
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
                        <div className={styles.messagebox}>
                            <h1 className={styles.gifttitle}>Стоимость тарифов</h1>
                            {inputValuesAssistant.map((value, index) => {
                                const subscriptionType = index === 3 ? 'FOURTH' : index === 0 ? 'FIRST' : index === 1 ? 'SECOND' : 'THIRD';
                                const assistantCount = requestCounts ? requestCounts[subscriptionType]?.assistantRequestCount : value;

                                return (
                                    <div key={index}>
                                        <h1 className={styles.undertitletwo}>
                                            {subscriptionType === 'FOURTH'
                                                ? 'Только AI'
                                                : `Стоимость тарифа AI + ${assistantCount} запросов ассистенту`}
                                        </h1>
                                        <div className={styles.inputContainertwo}>
                                            <input
                                                type="text"
                                                className={styles.inputFieldtwo}
                                                placeholder={String(assistantCount)} 
                                                value={value}
                                                onChange={(e) => handleInputChangeAssistant(index, e.target.value)}
                                            />
                                            <span className={styles.label}>$</span>
                                        </div>
                                    </div>
                                );
                            })}

                            <button className={styles.submitButtontwo} onClick={handleConfirmAssistantRequests}>
                                Подтвердить
                            </button>
                        </div>




                    </div>


                    <div className={styles.columnblock}>

                        <div className={styles.messagebox}>
                            <h1 className={styles.gifttitle}>Количество запросов к ИИ</h1>
                            {aiRequestValues.map((value, index) => {
                                const subscriptionType = subscriptionTypes[index];
                                const assistantCount = getAssistantRequestCount(subscriptionType); 
                                const aiCount = getAiRequestCount(subscriptionType); 

                                return (
                                    <div key={index}>
                                        <h1 className={styles.undertitletwo}>
                                            {subscriptionType === 'FOURTH'
                                                ? 'Только AI'
                                                : `Введите количество для категории AI + ${assistantCount} запросов ассистенту`}
                                        </h1>
                                        <div className={styles.inputContainertwo}>
                                            <input
                                                type="text"
                                                className={styles.inputFieldtwo}
                                                placeholder={String(aiCount)}
                                                value={value}
                                                onChange={(e) => handleInputChangeAiRequests(index, e.target.value)}
                                            />
                                            <span className={styles.label}>Запросов</span>
                                        </div>
                                    </div>
                                );
                            })}

                            <button className={styles.submitButtontwo} onClick={handleConfirmAiRequests}>
                                Подтвердить
                            </button>
                        </div>




                        <div className={styles.messagebox}>
                            <h1 className={styles.gifttitle}>Отправка пользователем контента</h1>

                            <div className={styles.togglebox}>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={isToggledVoiceAI}
                                        onChange={handleToggleChangeVoiceAI}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={styles.label}>Разрешить отправку голосовых сообщений ИИ</span>
                            </div>

                            <div className={styles.checkboxContainer}>
                                {checkboxesVoiceAI.map((checked, index) => {
                                    const subscriptionType = subscriptionTypes[index];
                                    const assistantCount = getAssistantRequestCount(subscriptionType);

                                    return (
                                        <label key={index} className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleCheckboxChangeVoiceAI(index)}
                                            />
                                            <span className={styles.animatedCheckbox}></span>
                                            <span>
                                                {subscriptionType === 'FOURTH'
                                                    ? 'Только AI'
                                                    : `AI + ${assistantCount} запросов ассистенту`}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            <div className={styles.togglebox}>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={isToggledVoiceAssistant}
                                        onChange={handleToggleChangeVoiceAssistant}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={styles.label}>Разрешить отправку голосовых сообщений ассистенту</span>
                            </div>

                            <div className={styles.checkboxContainer}>
                                {checkboxesVoiceAI.map((checked, index) => {
                                    const subscriptionType = subscriptionTypes[index];
                                    const assistantCount = getAssistantRequestCount(subscriptionType);

                                    return (
                                        <label key={index} className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleCheckboxChangeVoiceAI(index)}
                                            />
                                            <span className={styles.animatedCheckbox}></span>
                                            <span>
                                                {subscriptionType === 'FOURTH'
                                                    ? 'Только AI'
                                                    : `AI + ${assistantCount} запросов ассистенту`}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            <div className={styles.togglebox}>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={isToggledVideoAssistant}
                                        onChange={handleToggleChangeVideoAssistant}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={styles.label}>Разрешить отправку видео ассистенту</span>
                            </div>

                            <div className={styles.checkboxContainer}>
                                {checkboxesVoiceAI.map((checked, index) => {
                                    const subscriptionType = subscriptionTypes[index];
                                    const assistantCount = getAssistantRequestCount(subscriptionType);

                                    return (
                                        <label key={index} className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleCheckboxChangeVoiceAI(index)}
                                            />
                                            <span className={styles.animatedCheckbox}></span>
                                            <span>
                                                {subscriptionType === 'FOURTH'
                                                    ? 'Только AI'
                                                    : `AI + ${assistantCount} запросов ассистенту`}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            <div className={styles.togglebox}>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={isToggledFileAssistant}
                                        onChange={handleToggleChangeFileAssistant}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={styles.label}>Разрешить отправку файлов ассистенту</span>
                            </div>

                            <div className={styles.checkboxContainer}>
                                {checkboxesVoiceAI.map((checked, index) => {
                                    const subscriptionType = subscriptionTypes[index];
                                    const assistantCount = getAssistantRequestCount(subscriptionType);

                                    return (
                                        <label key={index} className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleCheckboxChangeVoiceAI(index)}
                                            />
                                            <span className={styles.animatedCheckbox}></span>
                                            <span>
                                                {subscriptionType === 'FOURTH'
                                                    ? 'Только AI'
                                                    : `AI + ${assistantCount} запросов ассистенту`}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            <button className={styles.submitButtonthree}>Подтвердить</button>
                        </div>


                    </div>
                </div>
            </div>

            <button className={styles.toggleButton} onClick={() => setShowTablebox(!showTablebox)}>
                {showTablebox ? 'Скрыть таблицу' : 'Показать таблицу'}
                <svg
                    className={`${styles.arrowIcon} ${showTablebox ? styles.up : styles.down}`}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 15l-7-7h14l-7 7z" />
                </svg>
            </button>
            <div
                className={`${styles.collapsibleContent} ${showTablebox ? styles.expanded : styles.collapsed}`}
            >
                <div className={styles.tablebox}>
                    <div className={styles.tableWrapper}>
                        <div className={styles.header}>
                            {isLoading ? (
                                <h3>Загрузка данных...</h3>
                            ) : (
                                <>
                                    <h3>
                                        Пользователи <span>({users.length})</span>
                                    </h3>
                                    <div className={styles.sortButtonContainer}>
                                        <button className={styles.sortButton} onClick={handleSortButtonClick}>
                                            Сортировать
                                        </button>
                                        {showSortMenu && (
                                            <div className={styles.sortMenu}>
                                                {columnsData.map((column) => (
                                                    <button
                                                        key={column.id}
                                                        className={styles.sortMenuItem}
                                                        onClick={() => handleSortColumn(column.accessor)}
                                                    >
                                                        {column.Header}
                                                        {sortColumn === column.accessor && (
                                                            <span className={styles.sortDirection}>
                                                                {sortDirection === 'asc' ? ' 🔼' : ' 🔽'}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {!isLoading && (
                            <Table
                                columns={columnsData as Column<UserData>[]}
                                data={sortedData}
                                onRowClick={(row) => handleRowClick(row.telegramId)}
                            />
                        )}
                    </div>
                </div>


            </div>
        </div>

    );
}

export default Page;

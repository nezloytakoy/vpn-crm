"use client";

import React, { useState, useMemo, useEffect } from 'react';
import styles from './Users.module.css';
import Table from '@/components/Table/Table';
import { Column, CellProps } from 'react-table';
import { useRouter } from 'next/navigation';

interface UserResponse {
    telegramId: string;
    username: string;
    referralCount: number;
    subscriptionType: string;
    assistantRequests: number;
    hasUpdatedSubscription: boolean;
}

interface UserData {
    telegramId: string;
    username: string;
    referralCount: number;
    subscriptionType: string;
    assistantRequests: number;
    hasUpdatedSubscription: boolean;
}

interface PermissionData {
    name: string;
    allowVoiceToAI: boolean;
    allowVoiceToAssistant: boolean;
    allowVideoToAssistant: boolean;
    allowFilesToAssistant: boolean;
}



type MyColumn<T extends object, K extends keyof T> = {
    Header: string;
    accessor: K;
    id: string;
    Cell?: (cell: CellProps<T, T[K]>) => React.ReactNode;
};

function Page() {
    console.log('Page component is being rendered');

    useEffect(() => {
        console.log("Simple useEffect called");
    }, []);

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

    const [permissions, setPermissions] = useState<PermissionData[]>([]);






    const handleInputChangeAiRequests = (index: number, value: string) => {
        const updatedValues = [...aiRequestValues];
        updatedValues[index] = value;
        setAiRequestValues(updatedValues);
    };

    const handleRowClick = (userId: string) => {
        router.push(`/admin/users/${userId}`);
    };




    const [percentage, setPercentage] = useState<number>(60);

    
    const handlePermissionChange = (index: number, field: keyof PermissionData) => {
        setLocalPermissions((prevPermissions) =>
            prevPermissions.map((permission, i) =>
                i === index ? { ...permission, [field]: !permission[field] } : permission
            )
        );
    };

    useEffect(() => {
        setLocalPermissions(permissions);
    }, [permissions]);


    const [localPermissions, setLocalPermissions] = useState<PermissionData[]>([]);

    const [isToggledVoiceAI, setIsToggledVoiceAI] = useState(false);
    const [isToggledVoiceAssistant, setIsToggledVoiceAssistant] = useState(false);
    const [isToggledVideoAssistant, setIsToggledVideoAssistant] = useState(false);
    const [isToggledFileAssistant, setIsToggledFileAssistant] = useState(false);

    const defaultAiRequestValues = ['5', '14', '30', '3'];

    const [assistantRequestValues, setAssistantRequestValues] = useState<string[]>(['', '', '', '']);

    const defaultAssistantRequestValues = ['5', '14', '30', '0'];



    const handleToggleChange = (
        toggleSetter: React.Dispatch<React.SetStateAction<boolean>>,
        checkboxesSetter: React.Dispatch<React.SetStateAction<boolean[]>>
    ) => {
        toggleSetter((prevState) => !prevState);
        checkboxesSetter((prevState) => prevState.map(() => !prevState.every((checked) => checked)));
    };

    const handleCheckboxChange = (
        index: number,
        checkboxesSetter: React.Dispatch<React.SetStateAction<boolean[]>>,
        checkboxes: boolean[]
    ) => {
        const updatedCheckboxes = [...checkboxes];
        updatedCheckboxes[index] = !updatedCheckboxes[index];
        checkboxesSetter(updatedCheckboxes);
    };

    useEffect(() => {
        setLocalPermissions(permissions);
        setIsToggledVoiceAI(permissions.every((perm) => perm.allowVoiceToAI));
        setIsToggledVoiceAssistant(permissions.every((perm) => perm.allowVoiceToAssistant));
        setIsToggledVideoAssistant(permissions.every((perm) => perm.allowVideoToAssistant));
        setIsToggledFileAssistant(permissions.every((perm) => perm.allowFilesToAssistant));
    }, [permissions]);

    useEffect(() => {
        setIsToggledVoiceAI(permissions.some((perm) => perm.allowVoiceToAI));
        setIsToggledVoiceAssistant(permissions.some((perm) => perm.allowVoiceToAssistant));
        setIsToggledVideoAssistant(permissions.some((perm) => perm.allowVideoToAssistant));
        setIsToggledFileAssistant(permissions.some((perm) => perm.allowFilesToAssistant));
    }, [permissions]);

    
    useEffect(() => {
        setIsToggledVoiceAI(localPermissions.every((perm) => perm.allowVoiceToAI));
        setIsToggledVoiceAssistant(localPermissions.every((perm) => perm.allowVoiceToAssistant));
        setIsToggledVideoAssistant(localPermissions.every((perm) => perm.allowVideoToAssistant));
        setIsToggledFileAssistant(localPermissions.every((perm) => perm.allowFilesToAssistant));
    }, [localPermissions]);

    const handleToggleAndCheckboxes = (
        toggleSetter: React.Dispatch<React.SetStateAction<boolean>>,
        permissionKey: keyof PermissionData
    ) => {
        toggleSetter((prevState) => {
            const newState = !prevState;
            setLocalPermissions((prevPermissions) =>
                prevPermissions.map((permission) => ({
                    ...permission,
                    [permissionKey]: newState,
                }))
            );
            return newState;
        });
    };



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


    useEffect(() => {
        console.log('useEffect called');

        const fetchUsers = async () => {
            console.log('fetchUsers called');
            try {
                const response = await fetch('/api/get-users');
                const data: UserResponse[] = await response.json();

                
                const usersWithSubscriptions: UserData[] = data.map((user) => ({
                    telegramId: user.telegramId,
                    username: user.username,
                    referralCount: user.referralCount,
                    subscriptionType: user.subscriptionType,
                    assistantRequests: user.assistantRequests,
                    hasUpdatedSubscription: user.hasUpdatedSubscription,
                }));

                
                setUsers(usersWithSubscriptions);
            } catch (error) {
                console.error('Ошибка при получении данных пользователей:', error);
            } finally {
                setIsLoading(false);
            }
        };

        interface RequestCount {
            aiRequestCount: number;
            assistantRequestCount: number;
        }
        interface AIRequestItem {
            subscriptionType: string;
            aiRequestCount: string;
            assistantRequestCount: string;
        }

        const fetchRequestCounts = async () => {
            console.log('fetchRequestCounts called');
            try {
                const response = await fetch('/api/get-user-requests');
                const data = await response.json();

                console.log("API response data:", data);

                if (response.ok && data.aiRequests) {
                    const counts = data.aiRequests.reduce((acc: Record<string, RequestCount>, item: AIRequestItem) => {
                        acc[item.subscriptionType] = {
                            aiRequestCount: parseInt(item.aiRequestCount) || 0,
                            assistantRequestCount: parseInt(item.assistantRequestCount) || 0,
                        };
                        return acc;
                    }, {} as Record<string, RequestCount>);

                    setRequestCounts(counts);
                    console.log("Request counts successfully set:", counts);
                } else {
                    console.error("Error fetching data:", data.error || 'No aiRequests in response');
                    setRequestCounts({});
                }
            } catch (error) {
                console.error('Error fetching request counts:', error);
                setRequestCounts({});
            }
        };

        
        const fetchPermissions = async () => {
            console.log('fetchPermissions called');
            try {
                const response = await fetch('/api/get-permissions');
                const data = await response.json();

                if (response.ok && data.subscriptions) {
                    setPermissions(data.subscriptions);
                    console.log("Permissions successfully set:", data.subscriptions);
                } else {
                    console.error("Error fetching permissions:", data.error || 'No permissions in response');
                    setPermissions([]);
                }
            } catch (error) {
                console.error('Error fetching permissions:', error);
                setPermissions([]);
            }
        };

        
        fetchUsers();
        fetchRequestCounts();
        fetchPermissions();
    }, []);


    const subscriptionTypes = ['FIRST', 'SECOND', 'THIRD', 'FOURTH'];

    const getAssistantRequestCount = (subscriptionType: string): number | undefined => {
        if (!requestCounts) {
            console.warn("Request counts are not set.");
            return undefined;
        }

        const subscriptionData = requestCounts[subscriptionType];
        const requestCount = subscriptionData ? subscriptionData.assistantRequestCount : undefined;

        if (requestCount === undefined) {
            console.warn(`Assistant request count is undefined for subscription type: ${subscriptionType}`);
        }

        return requestCount;
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
            Cell: ({ value }: CellProps<UserData, string | number | boolean>) => {
                console.log("Rendering username:", value); 
                return <span>{value}</span>;
            },
        },
        {
            Header: 'Количество рефералов',
            accessor: 'referralCount',
            id: 'referralCount',
            Cell: ({ value }: CellProps<UserData, string | number | boolean>) => {
                console.log("Rendering referralCount:", value); 
                return <span>{value}</span>;
            },
        },
        {
            Header: 'Подписка',
            accessor: 'subscriptionType',
            id: 'subscriptionType',
            Cell: ({ value }: CellProps<UserData, string | number | boolean>) => {
                console.log("Rendering subscriptionType:", value); 
                const label = getSubscriptionLabel(String(value));
                console.log("Subscription label:", label); 
                return <span>{label}</span>;
            },
        },
        {
            Header: 'Количество запросов',
            accessor: 'assistantRequests',
            id: 'assistantRequests',
            Cell: ({ value }: CellProps<UserData, string | number | boolean>) => {
                console.log("Rendering assistantRequests:", value); 
                return <span>{value}</span>;
            },
        },
        {
            Header: 'Постоянный клиент',
            accessor: 'hasUpdatedSubscription',
            id: 'hasUpdatedSubscription',
            Cell: ({ value }: CellProps<UserData, string | number | boolean>) => {
                console.log("Rendering hasUpdatedSubscription:", value); 
                const isPermanent = Boolean(value);
                console.log("Is permanent client:", isPermanent); 
                return <span>{isPermanent ? 'Да' : 'Нет'}</span>;
            },
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

    const handleConfirmPermissions = async () => {
        try {
            const response = await fetch('/api/update-permissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(localPermissions), 
            });

            const data = await response.json();

            if (response.ok) {
                alert('Разрешения успешно обновлены.');
                setPermissions(localPermissions); 
            } else {
                alert('Ошибка при обновлении: ' + data.error);
            }
        } catch (error) {
            console.error('Ошибка при обновлении разрешений:', error);
            alert('Произошла ошибка при обновлении разрешений.');
        }
    };

    useEffect(() => {
        const fetchReferralPercentageMode = async () => {
            try {
                const response = await fetch('/api/get-referral-percentage-mode');
                const data = await response.json();

                if (response.ok && data.mode !== undefined) {
                    setPercentage(data.mode * 100); 
                } else {
                    console.error('Ошибка при получении моды процента:', data.error);
                }
            } catch (error) {
                console.error('Ошибка при запросе моды процента от рефералов:', error);
            }
        };

        fetchReferralPercentageMode();
    }, []);



    interface RequestCount {
        aiRequestCount: number;
        assistantRequestCount: number;
    }


    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showSortMenu, setShowSortMenu] = useState<boolean>(false);
    const [requestCounts, setRequestCounts] = useState<Record<string, RequestCount> | null>(null);

    const handleConfirmReferralPercentage = async () => {
        try {
            const response = await fetch('/api/update-referral-percentage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ referralPercentage: percentage / 100 }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Процент от приглашенных пользователей успешно обновлен.');
            } else {
                alert('Ошибка при обновлении процента: ' + data.error);
            }
        } catch (error) {
            console.error('Ошибка при обновлении процента от приглашенных пользователей:', error);
            alert('Произошла ошибка при обновлении процента.');
        }
    };




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

    const getSubscriptionLabel = (subscriptionId: string): string => {
        console.log("Checking subscription ID in getSubscriptionLabel:", subscriptionId);

        if (subscriptionId === 'FREE') {
            console.log("Subscription type 'FREE' detected, returning 'Бесплатная подписка'");
            return 'Подписка отстутствует';
        }

        if (subscriptionId === 'FOURTH') {
            console.log("Subscription type 'FOURTH' detected, returning 'Только AI'");
            return 'Только AI';
        }

        const assistantCount = getAssistantRequestCount(subscriptionId);
        console.log(`Assistant request count for ID ${subscriptionId}:`, assistantCount);

        const label = assistantCount !== undefined
            ? `AI + ${assistantCount} запросов ассистенту`
            : 'Неизвестная подписка';
        console.log("Derived subscription label:", label);
        return label;
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

            if (aValue === undefined) return 1;
            if (bValue === undefined) return -1;

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
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
                            <button className={styles.submitButton} onClick={handleConfirmReferralPercentage}>Подтвердить</button>
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
                                        onChange={() => handleToggleAndCheckboxes(setIsToggledVoiceAI, 'allowVoiceToAI')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={styles.label}>Разрешить отправку голосовых сообщений ИИ</span>
                            </div>

                            <div className={styles.checkboxContainer}>
                                {localPermissions.map((permission, index) => (
                                    <label key={index} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={permission.allowVoiceToAI}
                                            onChange={() => handlePermissionChange(index, 'allowVoiceToAI')}
                                        />
                                        <span className={styles.animatedCheckbox}></span>
                                        <span>{permission.name === 'FOURTH' ? 'Только AI' : `AI + ${getAssistantRequestCount(permission.name)} запросов ассистенту`}</span>
                                    </label>
                                ))}
                            </div>

                            
                            <div className={styles.togglebox}>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={isToggledVoiceAssistant}
                                        onChange={() => handleToggleAndCheckboxes(setIsToggledVoiceAssistant, 'allowVoiceToAssistant')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={styles.label}>Разрешить отправку голосовых сообщений ассистенту</span>
                            </div>

                            <div className={styles.checkboxContainer}>
                                {localPermissions.map((permission, index) => (
                                    <label key={index} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={permission.allowVoiceToAssistant}
                                            onChange={() => handlePermissionChange(index, 'allowVoiceToAssistant')}
                                        />
                                        <span className={styles.animatedCheckbox}></span>
                                        <span>{permission.name === 'FOURTH' ? 'Только AI' : `AI + ${getAssistantRequestCount(permission.name)} запросов ассистенту`}</span>
                                    </label>
                                ))}
                            </div>

                            
                            <div className={styles.togglebox}>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={isToggledVideoAssistant}
                                        onChange={() => handleToggleAndCheckboxes(setIsToggledVideoAssistant, 'allowVideoToAssistant')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={styles.label}>Разрешить отправку видео ассистенту</span>
                            </div>

                            <div className={styles.checkboxContainer}>
                                {localPermissions.map((permission, index) => (
                                    <label key={index} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={permission.allowVideoToAssistant}
                                            onChange={() => handlePermissionChange(index, 'allowVideoToAssistant')}
                                        />
                                        <span className={styles.animatedCheckbox}></span>
                                        <span>{permission.name === 'FOURTH' ? 'Только AI' : `AI + ${getAssistantRequestCount(permission.name)} запросов ассистенту`}</span>
                                    </label>
                                ))}
                            </div>

                            
                            <div className={styles.togglebox}>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={isToggledFileAssistant}
                                        onChange={() => handleToggleAndCheckboxes(setIsToggledFileAssistant, 'allowFilesToAssistant')}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={styles.label}>Разрешить отправку файлов ассистенту</span>
                            </div>

                            <div className={styles.checkboxContainer}>
                                {localPermissions.map((permission, index) => (
                                    <label key={index} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={permission.allowFilesToAssistant}
                                            onChange={() => handlePermissionChange(index, 'allowFilesToAssistant')}
                                        />
                                        <span className={styles.animatedCheckbox}></span>
                                        <span>{permission.name === 'FOURTH' ? 'Только AI' : `AI + ${getAssistantRequestCount(permission.name)} запросов ассистенту`}</span>
                                    </label>
                                ))}
                            </div>

                            <button className={styles.submitButtonthree} onClick={handleConfirmPermissions}>Подтвердить</button>
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

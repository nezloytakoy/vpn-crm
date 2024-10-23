"use client";

import React, { useState, useMemo, useEffect } from 'react';
import styles from './Users.module.css';
import Table from '@/components/Table/Table';
import { Column, CellProps } from 'react-table';
import { useRouter } from 'next/navigation'; 


interface UserData {
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


    const handleRowClick = (userId: string) => {
        router.push(`/admin/users/${userId}`); 
    };




    const [percentage, setPercentage] = useState<number>(60);




    const [isToggledVoiceAI, setIsToggledVoiceAI] = useState<boolean>(false);
    const [checkboxesVoiceAI, setCheckboxesVoiceAI] = useState<boolean[]>([false, false, false, false]);


    const [isToggledVoiceAssistant, setIsToggledVoiceAssistant] = useState<boolean>(false);
    const [isToggledVideoAssistant, setIsToggledVideoAssistant] = useState<boolean>(false);
    const [isToggledFileAssistant, setIsToggledFileAssistant] = useState<boolean>(false);


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

        fetchUsers();
    }, []);






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
                <span>{typeof value === 'boolean' ? (value ? 'Да' : 'Нет') : value}</span>
            ),
        },
    ];





    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showSortMenu, setShowSortMenu] = useState<boolean>(false);


    const handleSortButtonClick = () => {
        setShowSortMenu(!showSortMenu);
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
                                {checkboxesNotifications.map((checked, index) => (
                                    <label key={index} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => handleCheckboxChangeNotifications(index)}
                                        />
                                        <span className={styles.animatedCheckbox}></span>
                                        <span>{index === 3 ? 'Только AI' : `AI + ${index === 0 ? '5' : index === 1 ? '14' : '30'} запросов ассистенту`}</span>
                                    </label>
                                ))}
                            </div>

                            <h1 className={styles.undertitle}>Форма для сообщения</h1>
                            <textarea className={styles.input} placeholder="Сообщение" />
                            <button className={styles.submitButton}>Отправить</button>
                        </div>

                        <div className={styles.messagebox}>
                            <h1 className={styles.gifttitle}>Количество запросов к ассистенту</h1>
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

                            <button className={styles.submitButtontwo}>Подтвердить</button>
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
                            {inputValuesAssistant.map((value, index) => (
                                <div key={index}>
                                    <h1 className={styles.undertitletwo}>
                                        {index === 3 ? 'Только AI' : `Стоимость тарифа AI + ${index === 0 ? '5' : index === 1 ? '14' : '30'} запросов ассистенту`}
                                    </h1>
                                    <div className={styles.inputContainertwo}>
                                        <input
                                            type="text"
                                            className={styles.inputFieldtwo}
                                            placeholder={value}
                                            value={value}
                                            onChange={(e) => handleInputChangeAssistant(index, e.target.value)}
                                        />
                                        <span className={styles.label}>$</span>
                                    </div>
                                </div>
                            ))}

                            <button className={styles.submitButtontwo}>Подтвердить</button>
                        </div>

                    </div>


                    <div className={styles.columnblock}>

                        <div className={styles.messagebox}>
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

                            <button className={styles.submitButtontwo}>Подтвердить</button>
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
                                {checkboxesVoiceAI.map((checked, index) => (
                                    <label key={index} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => handleCheckboxChangeVoiceAI(index)}
                                        />
                                        <span className={styles.animatedCheckbox}></span>
                                        <span>{index === 3 ? 'Только AI' : `AI + ${index === 0 ? '5' : index === 1 ? '14' : '30'} запросов ассистенту`}</span>
                                    </label>
                                ))}
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
                                {checkboxesVoiceAI.map((checked, index) => (
                                    <label key={index} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => handleCheckboxChangeVoiceAI(index)}
                                        />
                                        <span className={styles.animatedCheckbox}></span>
                                        <span>{index === 3 ? 'Только AI' : `AI + ${index === 0 ? '5' : index === 1 ? '14' : '30'} запросов ассистенту`}</span>
                                    </label>
                                ))}
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
                                {checkboxesVoiceAI.map((checked, index) => (
                                    <label key={index} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => handleCheckboxChangeVoiceAI(index)}
                                        />
                                        <span className={styles.animatedCheckbox}></span>
                                        <span>{index === 3 ? 'Только AI' : `AI + ${index === 0 ? '5' : index === 1 ? '14' : '30'} запросов ассистенту`}</span>
                                    </label>
                                ))}
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
                                {checkboxesVoiceAI.map((checked, index) => (
                                    <label key={index} className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => handleCheckboxChangeVoiceAI(index)}
                                        />
                                        <span className={styles.animatedCheckbox}></span>
                                        <span>{index === 3 ? 'Только AI' : `AI + ${index === 0 ? '5' : index === 1 ? '14' : '30'} запросов ассистенту`}</span>
                                    </label>
                                ))}
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
                                onRowClick={(row) => handleRowClick(row.username)} 
                            />
                        )}
                    </div>
                </div>


            </div>
        </div>

    );
}

export default Page;

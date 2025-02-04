'use client';

import React, { useEffect, useState } from 'react';
import { Column } from 'react-table';
import Table from '@/components/Table/Table';
import styles from './Moderators.module.css';
import Image from 'next/image';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface ModeratorData {
    id: string;
    username: string;
    lastActiveAt: string;
    userMessagesCount: number;
    assistantMessagesCount: number;
    reviewedComplaintsCount: number;
}


function formatLastActive(lastActiveAt: string): string {
    const lastActiveDate = parseISO(lastActiveAt);
    const diffInMinutes = (new Date().getTime() - lastActiveDate.getTime()) / (1000 * 60);

    if (diffInMinutes < 60) {
        return "В сети";
    }

    return `Был ${formatDistanceToNow(lastActiveDate, { addSuffix: true, locale: ru })}`;
}

export default function Page() {
    const [data, setData] = useState<ModeratorData[]>([]);
    const [generatedLink, setGeneratedLink] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState<boolean>(false);
    const [login, setLogin] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [step, setStep] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    const router = useRouter();


    const columns: Array<Column<ModeratorData>> = [
        {
            Header: 'Telegram ID',
            accessor: 'id',
        },
        {
            Header: 'Ник пользователя',
            accessor: 'username',
        },
        {
            Header: 'Последнее время активности',
            accessor: (row) => formatLastActive(row.lastActiveAt),
        },
        {
            Header: 'Сообщений ассистентам',
            accessor: 'assistantMessagesCount',
        },
        {
            Header: 'Сообщений пользователям',
            accessor: 'userMessagesCount',
        },
        {
            Header: 'Рассмотренных жалоб',
            accessor: 'reviewedComplaintsCount',
        },
    ];


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/get-moderators');
                const result = await response.json();
                if (Array.isArray(result)) {
                    setData(result);
                } else {
                    console.error('Данные не являются массивом:', result);
                }
            } catch (error) {
                console.error('Ошибка получения данных модераторов:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    const handleRowClick = (id: string) => {
        router.push(`/admin/moderators/${id}`);
    };


    const handleGenerateLink = () => {
        setStep(1);
        setGeneratedLink('');
    };

    const handleConfirmCredentials = async () => {
        if (!login || !password) {
            setErrorMessage('Введите логин и пароль!');
            return;
        }

        try {
            const response = await fetch('/api/generateModeratorLink', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ login, password }),
            });

            // Проверяем статус
            if (!response.ok) {
                const errData = await response.json();
                // «message» может быть "Логин уже используется модератором" и т.д.
                throw new Error(errData.message || 'Ошибка при генерации ссылки');
            }

            const data = await response.json();
            setGeneratedLink(data.link);
            setCopySuccess(false);
            setStep(2);
            setErrorMessage('');
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                // Можно задать что-то дефолтное или проигнорировать
                setErrorMessage('Неизвестная ошибка');
            }
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink)
            .then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            })
            .catch((error) => {
                console.error('Ошибка копирования:', error);
            });
    };

    if (loading) {
        return <div>Загрузка данных...</div>;
    }

    return (
        <div className={styles.parent}>
            <div className={styles.main}>
                <div className={styles.tablebox}>
                    <div className={styles.tableWrapper}>
                        <div className={styles.header}>
                            <h3>
                                Статистика модераторов <span>({data.length})</span>
                            </h3>
                        </div>
                        {data.length > 0 ? (
                            <Table
                                columns={columns}
                                data={data}
                                onRowClick={(row) => handleRowClick(row.id)}
                                isRowClickable={true}
                            />
                        ) : (
                            <div>Нет данных для отображения</div>
                        )}
                    </div>
                </div>
            </div>
            <div className={styles.messageboxfour}>
                <Image
                    src="https://92eaarerohohicw5.public.blob.vercel-storage.com/HLA59jMt2S3n7N2d2O-NF0jQKdkPmFmPomQgf9VIONuWrctwA.gif"
                    alt="Referral"
                    width={350}
                    height={350}
                />
                <h1 className={styles.invitetitle}>Генерация пригласительной ссылки</h1>

                {step === 0 && (
                    <button className={styles.generateButton} onClick={handleGenerateLink}>
                        Сгенерировать ссылку
                    </button>
                )}

                {step === 1 && (
                    <div className={styles.credentialsBox}>
                        <h2>Придумайте логин и пароль для модератора</h2>
                        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
                        <input
                            type="text"
                            className={styles.inputField}
                            placeholder="Логин"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                        />
                        <input
                            type="password"
                            className={styles.inputField}
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button className={styles.confirmButton} onClick={handleConfirmCredentials}>
                            Подтвердить
                        </button>
                    </div>
                )}

                {step === 2 && generatedLink && (
                    <div className={styles.linkContainer}>
                        <input
                            type="text"
                            className={styles.linkInput}
                            value={generatedLink}
                            readOnly
                        />
                        <button className={styles.copyButton} onClick={handleCopyLink}>
                            {copySuccess ? 'Скопировано!' : 'Копировать'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

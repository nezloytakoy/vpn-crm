'use client';

import React, { useState } from 'react';
import { Column } from 'react-table';
import Table from '@/components/Table/Table';
import styles from './Moderators.module.css';
import Image from 'next/image';

interface ModeratorData {
    telegramId: string;
    username: string;
    lastActiveAt: string;
    currentStatus: string;
    messagesToAssistants: number;
    messagesToUsers: number;
    reviewedComplaints: number;
}

const data: ModeratorData[] = [
    {
        telegramId: '2332323232',
        username: '@username1',
        lastActiveAt: '21/12/24 14:00',
        currentStatus: 'Онлайн',
        messagesToUsers: 24,
        messagesToAssistants: 24,
        reviewedComplaints: 5,
    },
    {
        telegramId: '2332323233',
        username: '@username2',
        lastActiveAt: '22/12/24 16:30',
        currentStatus: 'Оффлайн',
        messagesToUsers: 24,
        messagesToAssistants: 12,
        reviewedComplaints: 3,
    },
    {
        telegramId: '2332323234',
        username: '@username3',
        lastActiveAt: '23/12/24 12:15',
        currentStatus: 'Занят',
        messagesToUsers: 24,
        messagesToAssistants: 44,
        reviewedComplaints: 7,
    },
];

// Определение колонок
const columns: Array<Column<ModeratorData>> = [
    {
        Header: 'Telegram ID',
        accessor: 'telegramId',
    },
    {
        Header: 'Ник пользователя',
        accessor: 'username',
    },
    {
        Header: 'Последнее время активности',
        accessor: 'lastActiveAt',
    },
    {
        Header: 'Текущий статус',
        accessor: 'currentStatus',
    },
    {
        Header: 'Сообщений ассистентам',
        accessor: 'messagesToAssistants',
    },
    {
        Header: 'Сообщений пользователям',
        accessor: 'messagesToUsers',
    },
    {
        Header: 'Рассмотренных жалоб',
        accessor: 'reviewedComplaints',
    },
];

export default function Page() {
    const [generatedLink, setGeneratedLink] = useState<string>(''); 
    const [copySuccess, setCopySuccess] = useState<boolean>(false); 
    const [login, setLogin] = useState<string>(''); 
    const [password, setPassword] = useState<string>(''); 
    const [step, setStep] = useState<number>(0); 
    const [errorMessage, setErrorMessage] = useState<string>(''); 

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

            if (!response.ok) {
                throw new Error('Ошибка при генерации ссылки');
            }

            const data = await response.json();
            setGeneratedLink(data.link); 
            setCopySuccess(false);
            setStep(2); 
            setErrorMessage(''); 
        } catch (error) {
            console.error('Ошибка:', error); 
            setErrorMessage('Ошибка генерации ссылки');
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
                        <Table columns={columns} data={data} />
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
                        <h2>Введите логин и пароль</h2>
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

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
    timeInDialogs: number; // Time in minutes
    averageResponseTime: number; // Time in seconds
    reviewedComplaints: number;
}

// Пример данных для таблицы
const data: ModeratorData[] = [
    {
        telegramId: '2332323232',
        username: '@username1',
        lastActiveAt: '21/12/24 14:00',
        currentStatus: 'Онлайн',
        messagesToAssistants: 24,
        timeInDialogs: 120, // 2 hours
        averageResponseTime: 30,
        reviewedComplaints: 5,
    },
    {
        telegramId: '2332323233',
        username: '@username2',
        lastActiveAt: '22/12/24 16:30',
        currentStatus: 'Оффлайн',
        messagesToAssistants: 12,
        timeInDialogs: 45, // 45 minutes
        averageResponseTime: 45,
        reviewedComplaints: 3,
    },
    {
        telegramId: '2332323234',
        username: '@username3',
        lastActiveAt: '23/12/24 12:15',
        currentStatus: 'Занят',
        messagesToAssistants: 44,
        timeInDialogs: 200, // 3 hours 20 minutes
        averageResponseTime: 25,
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
        Header: 'Время в диалогах (мин)',
        accessor: 'timeInDialogs',
    },
    {
        Header: 'Среднее время ответа (сек)',
        accessor: 'averageResponseTime',
    },
    {
        Header: 'Рассмотренных жалоб',
        accessor: 'reviewedComplaints',
    },
];

export default function Page() {

    const [generatedLink, setGeneratedLink] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState<boolean>(false);


    const handleGenerateLink = async () => {
        try {
            const response = await fetch('/api/generateAssistantLink', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Ошибка при генерации ссылки');
            }

            const data = await response.json();
            setGeneratedLink(data.link);
            setCopySuccess(false);
        } catch (error) {
            console.error('Ошибка генерации ссылки:', error);
        }
    };



    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink).then(() => {
            setCopySuccess(true);

            setTimeout(() => setCopySuccess(false), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <div className={styles.parent}>
            <div className={styles.main}>
                <div className={styles.tablebox}>
                    <div className={styles.tableWrapper}>
                        <div className={styles.header}>
                            <h3>
                                Статистика пользователей <span>({data.length})</span>
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
                <button className={styles.generateButton} onClick={handleGenerateLink}>
                    Сгенерировать ссылку
                </button>
                {generatedLink && (
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

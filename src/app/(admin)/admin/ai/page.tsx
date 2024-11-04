"use client";

import React, { useState, useEffect } from 'react';
import styles from './Ai.module.css';

function Page() {
    const [rejectionCount, setRejectionCount] = useState('7');
    const [prompt, setPrompt] = useState('-');
    const [maxTokens, setMaxTokens] = useState(0);
    const [newPrompt, setNewPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false); 

    useEffect(() => {
        const getPackedSettings = async () => {
            try {
                const response = await fetch('/api/get-ai-settings');
                const data = await response.json();
                const { response: aiSettings } = data;

                setPrompt(aiSettings.prompt);
                setMaxTokens(aiSettings.maxTokens);
            } catch (error) {
                console.log(error);
            }
        };

        getPackedSettings();
    }, []);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRejectionCount(event.target.value);
    };


    const showLoaderAndRefresh = (action: () => Promise<void>) => {
        setIsLoading(true);
        setTimeout(async () => {
            await action();
            setIsLoading(false);
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }, 3000);
    };


    const handleSubmit = async () => {
        if (!rejectionCount || isNaN(parseInt(rejectionCount))) {
            alert('Пожалуйста, введите корректное число');
            return;
        }

        showLoaderAndRefresh(async () => {
            try {
                const response = await fetch('/api/update-max-tokens', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: 1, maxTokens: parseInt(rejectionCount) }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update max tokens');
                }

                const data = await response.json();
                alert(`Максимальное количество токенов успешно обновлено: ${data.maxTokens}`);
            } catch (error) {
                alert('Ошибка при обновлении максимального количества токенов');
                console.error('Error:', error);
            }
        });
    };

    const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewPrompt(event.target.value);
    };


    const handlePromptSubmit = async () => {
        if (newPrompt.trim() === '') {
            alert('Поле промта не должно быть пустым');
            return;
        }

        showLoaderAndRefresh(async () => {
            try {
                const response = await fetch('/api/update-prompt', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: 1, prompt: newPrompt }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update prompt');
                }

                const data = await response.json();
                alert(`Промт успешно обновлен: ${data.prompt}`);
            } catch (error) {
                alert('Ошибка при обновлении промта');
                console.error('Error:', error);
            }
        });
    };

    return (
        <div className={styles.main}>
            <div className={styles.settings}>
                <div className={styles.columnblock}>
                    <div className={styles.columnblock}>
                        <div className={styles.messageboxthree}>
                            <h1 className={styles.title}>Дополнительный промт к запросу</h1>
                            <h1 className={styles.undertitle}>Форма для промта</h1>
                            <textarea
                                className={styles.input}
                                placeholder={prompt}
                                value={newPrompt}
                                onChange={handlePromptChange}
                            />
                            <button className={styles.submitButton} onClick={handlePromptSubmit} disabled={isLoading}>
                                {isLoading ? 'Загрузка...' : 'Отправить'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className={styles.messagebox}>
                    <h1 className={styles.gifttitle}>Максимальное количество токенов на запрос</h1>
                    <h1 className={styles.undertitletwo}>Введите количество</h1>

                    <div className={styles.inputContainertwo}>
                        <input
                            type="text"
                            className={styles.inputFieldtwo}
                            placeholder={maxTokens ? maxTokens.toString() : '...'}
                            onChange={handleInputChange}
                        />
                        <span className={styles.label}>Токенов</span>
                    </div>

                    <button className={styles.submitButtontwo} onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Загрузка...' : 'Подтвердить'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Page;

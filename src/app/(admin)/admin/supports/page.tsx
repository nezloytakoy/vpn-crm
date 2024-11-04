"use client"

import React, { useState, useEffect } from 'react';
import styles from './Supports.module.css';
import Image from 'next/image';

function Page() {
    const [mentorReward, setMentorReward] = useState<number | null>(null);
    const [assistantReward, setAssistantReward] = useState<number | null>(null);
    const [referralRequestCount, setReferralRequestCount] = useState<number | null>(null);
  

    const [durationInput, setDurationInput] = useState('');

    
    const [mentorRewardInput, setMentorRewardInput] = useState('');
    const [assistantRewardInput, setAssistantRewardInput] = useState('');
    const [referralRequestCountInput, setReferralRequestCountInput] = useState('');
    const [giftCoinsAmount, setGiftCoinsAmount] = useState('');
    const [giftCoinsRequestCount, setGiftCoinsRequestCount] = useState('');

    
    const [isGiftCoinsEnabled, setIsGiftCoinsEnabled] = useState(false);
    const [isIntervalMode, setIsIntervalMode] = useState(false);

    
    const [modetwo, setModetwo] = useState('single');


    const [isToggled, setIsToggled] = useState(false);
    const [mode, setMode] = useState('single');
    const [maxRejects, setMaxRejects] = useState<number | null>(null);
    const [maxIgnores, setMaxIgnores] = useState<number | null>(null);
    const [rejectInput, setRejectInput] = useState<string>(''); 
    const [ignoreInput, setIgnoreInput] = useState<string>(''); 

    const [giftCoinsAmountInput, setGiftCoinsAmountInput] = useState('');
    const [giftCoinsRequestCountInput, setGiftCoinsRequestCountInput] = useState('');
    const [duration, setDuration] = useState<number | null>(null);

    
    const [isSendNotificationLoading, setIsSendNotificationLoading] = useState(false);
    const [isUpdateRejectsLoading, setIsUpdateRejectsLoading] = useState(false);
    const [isSubmitRewardsLoading, setIsSubmitRewardsLoading] = useState(false);
    const [isUpdateIgnoresLoading, setIsUpdateIgnoresLoading] = useState(false);
    const [isUpdateBonusLoading, setIsUpdateBonusLoading] = useState(false);
    const [isUpdateDurationLoading, setIsUpdateDurationLoading] = useState(false);

    
    const handleGiftCoinsAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGiftCoinsAmountInput(e.target.value);
    };

    const handleGiftCoinsRequestCountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGiftCoinsRequestCountInput(e.target.value);
    };


    const handleUpdateIgnores = async () => {
        if (ignoreInput.trim() === '') {
            alert('Введите количество пропусков.');
            return;
        }

        try {
            const newMaxIgnores = parseInt(ignoreInput, 10);
            if (isNaN(newMaxIgnores) || newMaxIgnores < 0) {
                alert('Пожалуйста, введите корректное положительное число.');
                return;
            }

            
            setIsUpdateIgnoresLoading(true);

            const response = await fetch('/api/update-ignores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newMaxIgnores }),
            });

            const result = await response.json();
            if (response.ok) {
                alert('Значение maxIgnores успешно обновлено.');
                setMaxIgnores(newMaxIgnores); 

                
                setTimeout(() => {
                    
                    setIsUpdateIgnoresLoading(false);

                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }, 3000);
            } else {
                alert(`Ошибка: ${result.error}`);
                setIsUpdateIgnoresLoading(false);
            }
        } catch (error) {
            console.error('Ошибка при обновлении maxIgnores:', error);
            alert('Произошла ошибка при обновлении maxIgnores.');
            setIsUpdateIgnoresLoading(false);
        }
    };



    const handleUpdateRejects = async () => {
        if (rejectInput.trim() === '') {
            alert('Введите количество отказов.');
            return;
        }

        try {
            const newMaxRejects = parseInt(rejectInput, 10);
            if (isNaN(newMaxRejects) || newMaxRejects < 0) {
                alert('Пожалуйста, введите корректное положительное число.');
                return;
            }

            setIsUpdateRejectsLoading(true);

            const response = await fetch('/api/update-rejects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newMaxRejects }),
            });

            const result = await response.json();
            if (response.ok) {
                alert('Значение успешно обновлено.');
                setMaxRejects(newMaxRejects);

                
                setTimeout(() => {
                    setIsUpdateRejectsLoading(false);

                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }, 3000);
            } else {
                alert(`Ошибка: ${result.error}`);
                setIsUpdateRejectsLoading(false);
            }
        } catch (error) {
            console.error('Ошибка при обновлении maxRejects:', error);
            alert('Произошла ошибка при обновлении maxRejects.');
            setIsUpdateRejectsLoading(false);
        }
    };


    const handleUpdateDuration = async () => {
        if (durationInput.trim() === '') {
            alert('Введите количество минут.');
            return;
        }

        try {
            const minutes = parseInt(durationInput, 10);
            if (isNaN(minutes) || minutes < 0) {
                alert('Пожалуйста, введите корректное положительное число.');
                return;
            }

            
            setIsUpdateDurationLoading(true);

            const response = await fetch('/api/update-duration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ minutes }),
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message || 'Количество минут успешно обновлено.');
                setDuration(minutes); 
                setDurationInput(''); 

                
                setTimeout(() => {
                    
                    setIsUpdateDurationLoading(false);

                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }, 3000);
            } else {
                alert(`Ошибка: ${result.message}`);
                setIsUpdateDurationLoading(false);
            }
        } catch (error) {
            console.error('Ошибка при обновлении количества минут:', error);
            alert('Произошла ошибка при обновлении количества минут.');
            setIsUpdateDurationLoading(false);
        }
    };


    useEffect(() => {

        const fetchDuration = async () => {
            try {
                const response = await fetch('/api/get-request-duration', {
                    method: 'GET',
                })

                const data = await response.json()
                console.log(data)

                if (response.ok) {
                    const { response: { minutes } } = data; 
                    setDuration(minutes);
                    console.log(minutes);
                } else {
                    console.log("Ошибка при получении длительности")
                }
            } catch (error) {
                console.log(error)
            }
        }

        fetchDuration()


        const fetchRewards = async () => {
            try {
                const response = await fetch('/api/get-rewards', {
                    method: 'GET',
                });
                const data = await response.json();
                if (response.ok) {
                    console.log('Полученные данные:', data); 

                    
                    setMentorReward(data.mentorReward ?? 0);
                    setAssistantReward(data.assistantReward ?? 0);
                    setReferralRequestCount(data.referralRequestCount ?? 0);
             

                    
                    
                    setGiftCoinsAmount((data.userReward ?? '').toString());
                    setGiftCoinsRequestCount((data.rewardRequestCount ?? '').toString());

                    
                    setMentorRewardInput((data.mentorReward ?? '').toString());
                    setAssistantRewardInput((data.assistantReward ?? '').toString());
                    setReferralRequestCountInput((data.referralRequestCount ?? '').toString());

                    
                    setIsGiftCoinsEnabled(data.isRegularBonusEnabled ?? false);
                    setIsIntervalMode(data.isPermanentBonus ?? false);

                    
                    setModetwo((data.isPermanentReferral ?? false) ? 'interval' : 'single');
                } else {
                    console.error('Ошибка при получении данных о наградах:', data.message);
                }
            } catch (error) {
                console.error('Ошибка при запросе данных о наградах:', error);
            }
        };

        fetchRewards();
    }, []);




    const handleMentorRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMentorRewardInput(e.target.value);
    };

    const handleAssistantRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAssistantRewardInput(e.target.value);
    };

    const handleReferralRequestCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReferralRequestCountInput(e.target.value);
    };

    const handleGiftCoinsAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGiftCoinsAmount(e.target.value);
    };

    const handleGiftCoinsRequestCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGiftCoinsRequestCount(e.target.value);
    };

    const handleGiftCoinsToggle = () => {
        setIsGiftCoinsEnabled(!isGiftCoinsEnabled);
    };

    const handleIntervalModeToggle = () => {
        setIsIntervalMode(!isIntervalMode);
    };

    const handleModeChangetwo = () => {
        setModetwo(modetwo === 'single' ? 'interval' : 'single');
    };


    useEffect(() => {
        const fetchEdges = async () => {
            try {
                const response = await fetch('/api/get-edges', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                if (response.ok) {
                    setMaxRejects(data.maxRejects);
                    setMaxIgnores(data.maxIgnores);
                } else {
                    console.error('Ошибка при получении данных:', data.error);
                }
            } catch (error) {
                console.error('Ошибка при запросе данных:', error);
            }
        };

        fetchEdges();
    }, []);





    const handleSubmitRewards = async () => {
        if (
            !mentorRewardInput.trim() ||
            !assistantRewardInput.trim() ||
            !referralRequestCountInput.trim()
        ) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }

        const mentorRewardValue = parseInt(mentorRewardInput, 10);
        const assistantRewardValue = parseInt(assistantRewardInput, 10);
        const referralRequestCountValue = parseInt(referralRequestCountInput, 10);

        if (
            isNaN(mentorRewardValue) ||
            isNaN(assistantRewardValue) ||
            isNaN(referralRequestCountValue)
        ) {
            alert('Пожалуйста, введите корректные числовые значения.');
            return;
        }

        try {
            setIsSubmitRewardsLoading(true);

            const response = await fetch('/api/update-mentor-reward', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mentorReward: mentorRewardValue,
                    assistantReward: assistantRewardValue,
                    referralRequestCount: referralRequestCountValue,
                    isPermanentReferral: modetwo === 'interval',
                }),
            });

            const data = await response.json();
            alert(data.message);

            if (response.ok) {
                setMentorReward(mentorRewardValue);
                setAssistantReward(assistantRewardValue);
                setReferralRequestCount(referralRequestCountValue);
             

                setTimeout(() => {
                    setIsSubmitRewardsLoading(false);

                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }, 3000);
            } else {
                setIsSubmitRewardsLoading(false);
            }
        } catch (error) {
            console.error('Ошибка при обновлении данных о наградах:', error);
            alert('Произошла ошибка при обновлении данных.');
            setIsSubmitRewardsLoading(false);
        }
    };

    
    const handleUpdateBonus = async () => {
        
        if (
            !giftCoinsAmountInput.trim() ||
            !giftCoinsRequestCountInput.trim()
        ) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }

        
        const giftCoinsAmountValue = parseInt(giftCoinsAmountInput, 10);
        const rewardRequestCountValue = parseInt(giftCoinsRequestCountInput, 10);

        
        if (
            isNaN(giftCoinsAmountValue) ||
            isNaN(rewardRequestCountValue) ||
            giftCoinsAmountValue < 0 ||
            rewardRequestCountValue < 0
        ) {
            alert('Пожалуйста, введите корректные числовые значения.');
            return;
        }

        try {
            
            setIsUpdateBonusLoading(true);

            const response = await fetch('/api/update-bonus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isRegularBonusEnabled: isGiftCoinsEnabled,
                    isPermanentBonus: !isIntervalMode,
                    giftCoinsAmount: giftCoinsAmountValue,
                    rewardRequestCount: rewardRequestCountValue,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);

                
                setGiftCoinsAmount(giftCoinsAmountInput);
                setGiftCoinsRequestCount(giftCoinsRequestCountInput);

                
                setGiftCoinsAmountInput('');
                setGiftCoinsRequestCountInput('');

                
                setTimeout(() => {
                    
                    setIsUpdateBonusLoading(false);

                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }, 3000);
            } else {
                alert(`Ошибка: ${data.message}`);
                setIsUpdateBonusLoading(false);
            }
        } catch (error) {
            console.error('Ошибка при вызове update-bonus:', error);
            alert('Произошла ошибка при вызове update-bonus.');
            setIsUpdateBonusLoading(false);
        }
    };



    
    const handleSubmitGiftCoins = async () => {
        try {
            const response = await fetch('/api/update-gift-coins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    giftCoinsAmount: parseInt(giftCoinsAmount),
                    rewardRequestCount: parseInt(giftCoinsRequestCount),
                    isRegularBonusEnabled: isGiftCoinsEnabled,
                    isPermanentBonus: !isIntervalMode,
                }),
            });

            if (response.ok) {
                alert('Данные подарочных койнов успешно обновлены');
                
            } else {
                const data = await response.json();
                alert(`Ошибка: ${data.message}`);
            }
        } catch (error) {
            console.error('Ошибка при обновлении данных подарочных койнов:', error);
            alert('Произошла ошибка при обновлении данных подарочных койнов.');
        }
    };


    const [generatedLink, setGeneratedLink] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState<boolean>(false);
    const [message, setMessage] = useState(''); 

    const handleSendNotification = async () => {
        if (!message) {
            alert('Введите сообщение для ассистентов');
            return;
        }

        try {
            setIsSendNotificationLoading(true);

            const response = await fetch('/api/send-message-to-assistants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при отправке сообщения ассистентам');
            }

            alert('Сообщение успешно отправлено всем ассистентам');

            
            setTimeout(() => {
                setIsSendNotificationLoading(false);

                
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            }, 3000);
        } catch (error) {
            console.error('Ошибка при отправке уведомления:', error);
            alert('Не удалось отправить сообщение');
            setIsSendNotificationLoading(false);
        }
    };




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
        <div className={styles.main}>
            <div className={styles.settings}>
                <div className={styles.columnblock}>

                    <div className={styles.messageboxthree}>
                        <h1 className={styles.title}>Уведомления всем ассистентам</h1>
                        <h1 className={styles.undertitle}>Форма для сообщения</h1>
                        <textarea
                            className={styles.input}
                            placeholder="Сообщение"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button
                            className={styles.submitButton}
                            onClick={handleSendNotification}
                            disabled={isSendNotificationLoading}
                        >
                            {isSendNotificationLoading ? 'Загрузка...' : 'Отправить'}
                        </button>
                    </div>



                    <div className={styles.messagebox}>
                        <h1 className={styles.gifttitle}>Максимальное количество отказов (24ч)</h1>
                        <h1 className={styles.undertitletwo}>Введите количество</h1>
                        <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                            <input
                                type="text"
                                className={styles.inputFieldtwo}
                                placeholder={maxRejects !== null ? maxRejects.toString() : 'Загрузка...'}
                                value={rejectInput}
                                onChange={(e) => setRejectInput(e.target.value)}
                            />
                            <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Отказов</span>
                        </div>
                        <button
                            className={`${styles.submitButtontwo} ${isUpdateRejectsLoading ? styles.loading : ''}`}
                            onClick={handleUpdateRejects}
                            disabled={isUpdateRejectsLoading}
                        >
                            {isUpdateRejectsLoading ? (
                                <div className={styles.spinner}></div>
                            ) : (
                                'Подтвердить'
                            )}
                        </button>

                    </div>
                    <div className={styles.messageboxnine}>
                        <h1 className={styles.gifttitle}>Награда наставнику</h1>
                        <h1 className={styles.undertitletwo}>Введите количество</h1>
                        <div className={`${styles.inputContainertwo}`}>
                            <input
                                type="text"
                                className={styles.inputFieldtwo}
                                placeholder={mentorReward !== null ? mentorReward.toString() : 'Загрузка...'}
                                value={mentorRewardInput}
                                onChange={handleMentorRewardChange}
                            />
                            <span className={`${styles.label}`}>Койнов</span>
                        </div>
                        <div className={styles.userblock}>
                            <h1 className={styles.gifttitletwo}>Награда подопечному</h1>
                        </div>
                        <h1 className={styles.undertitletwo}>Введите количество</h1>
                        <div className={`${styles.inputContainertwo}`}>
                            <input
                                type="text"
                                className={styles.inputFieldtwo}
                                placeholder={assistantReward !== null ? assistantReward.toString() : 'Загрузка...'}
                                value={assistantRewardInput}
                                onChange={handleAssistantRewardChange}
                            />
                            <span className={`${styles.label}`}>Койнов</span>
                        </div>
                        <div className={styles.userblock}>
                            <h1 className={styles.gifttitletwo}>Количество запросов для награды</h1>
                        </div>
                        <h1 className={styles.undertitletwo}>Введите количество</h1>
                        <div className={`${styles.inputContainertwo}`}>
                            <input
                                type="text"
                                className={styles.inputFieldtwo}
                                placeholder={referralRequestCount !== null ? referralRequestCount.toString() : 'Загрузка...'}
                                value={referralRequestCountInput}
                                onChange={handleReferralRequestCountChange}
                            />
                            <span className={`${styles.label}`}>Запросов</span>
                        </div>
                        <div className={styles.modeSlider}>
                            <span className={modetwo === 'single' ? styles.activeMode : ''}>Разово</span>
                            <label className={styles.switchtwo}>
                                <input type="checkbox" checked={modetwo === 'interval'} onChange={handleModeChangetwo} />
                                <span className={styles.slider}></span>
                            </label>
                            <span className={modetwo === 'interval' ? styles.activeMode : ''}>
                                Через каждые {referralRequestCountInput}
                            </span>
                        </div>
                        <button
                            className={`${styles.submitButtontwo} ${isSubmitRewardsLoading ? styles.loading : ''}`}
                            onClick={handleSubmitRewards}
                            disabled={isSubmitRewardsLoading}
                        >
                            {isSubmitRewardsLoading ? 'Загрузка...' : 'Подтвердить'}
                        </button>
                    </div>


                </div>

                <div className={styles.columnblock}>
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
                    <div className={styles.messagebox}>
                        <h1 className={styles.gifttitle}>Максимальное количество пропусков (24ч)</h1>
                        <h1 className={styles.undertitletwo}>Введите количество</h1>
                        <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                            <input
                                type="text"
                                className={styles.inputFieldtwo}
                                placeholder={maxIgnores !== null ? maxIgnores.toString() : 'Загрузка...'}
                                value={ignoreInput}
                                onChange={(e) => setIgnoreInput(e.target.value)}
                            />
                            <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Пропусков</span>
                        </div>
                        <button
                            className={`${styles.submitButtontwo} ${isUpdateIgnoresLoading ? styles.loading : ''}`}
                            onClick={handleUpdateIgnores}
                            disabled={isUpdateIgnoresLoading}
                        >
                            {isUpdateIgnoresLoading ? 'Загрузка...' : 'Подтвердить'}
                        </button>
                    </div>

                    <h1 className={styles.notitle}></h1>
                    <div className={styles.messageboxtwo}>
                        <div className={styles.contentbox}>
                            <h1 className={styles.gifttitle}>Подарочные койны</h1>
                            <div className={styles.togglebox}>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={isGiftCoinsEnabled}
                                        onChange={handleGiftCoinsToggle}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={styles.label}>Включить эту опцию</span>
                            </div>
                        </div>
                        <div className={`${styles.contentbox} ${!isGiftCoinsEnabled ? styles.veil : ''}`}>
                            <h1 className={styles.undertitletwo}>Введите количество</h1>
                            <div className={styles.inputContainer}>
                                <input
                                    type="text"
                                    className={styles.inputField}
                                    placeholder={giftCoinsAmount}
                                    value={giftCoinsAmountInput}
                                    onChange={handleGiftCoinsAmountInputChange}
                                    disabled={!isGiftCoinsEnabled}
                                />
                                <span className={styles.label}>Койнов</span>
                            </div>

                            <div className={styles.modeSlider}>
                                <span className={!isIntervalMode ? styles.activeMode : ''}>Разово</span>
                                <label className={styles.switchtwo}>
                                    <input
                                        type="checkbox"
                                        checked={isIntervalMode}
                                        onChange={handleIntervalModeToggle}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={isIntervalMode ? styles.activeMode : ''}>Через</span>
                            </div>

                            
                            <h1 className={styles.undertitletwo}>Количество запросов</h1>
                            <div className={styles.inputContainer}>
                                <input
                                    type="text"
                                    className={styles.inputField}
                                    placeholder={giftCoinsRequestCount !== '' ? giftCoinsRequestCount : 'Загрузка...'}
                                    value={giftCoinsRequestCountInput}
                                    onChange={handleGiftCoinsRequestCountInputChange}
                                    disabled={!isGiftCoinsEnabled}
                                />
                                <span className={styles.label}></span>
                            </div>
                            <button
                                className={`${styles.submitButton} ${isUpdateBonusLoading ? styles.loading : ''}`}
                                onClick={handleUpdateBonus}
                                disabled={!isGiftCoinsEnabled || isUpdateBonusLoading}
                            >
                                Подтвердить
                            </button>
                        </div>
                    </div>

                    <div className={styles.messagebox}>
                        <h1 className={styles.gifttitle}>Время на принятие запроса</h1>
                        <h1 className={styles.undertitletwo}>Введите количество</h1>
                        <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                            <input
                                type="text"
                                className={styles.inputFieldtwo}
                                placeholder={duration !== null && duration !== undefined ? duration.toString() : 'Загрузка...'}
                                value={durationInput}
                                onChange={(e) => setDurationInput(e.target.value)}
                            />
                            <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Минут</span>
                        </div>
                        <button
                            className={`${styles.submitButtontwo} ${isUpdateDurationLoading ? styles.loading : ''}`}
                            onClick={handleUpdateDuration}
                            disabled={isUpdateDurationLoading}
                        >
                            Подтвердить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Page;

"use client"

import React, { useState } from 'react';
import styles from './Supports.module.css';
import Image from 'next/image';

function Page() {
    const [isToggled, setIsToggled] = useState(false);
    const [mode, setMode] = useState('single');

    const handleToggleChange = () => {
        setIsToggled(!isToggled);
    };

    const handleModeChange = () => {
        setMode(mode === 'single' ? 'interval' : 'single');
    };


    const [modetwo, setModetwo] = useState('single');

    const handleModeChangetwo = () => {
        setModetwo(modetwo === 'single' ? 'interval' : 'single');
    };

    const [inputValue, setInputValue] = useState('100');


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
        <div className={styles.main}>
            <div className={styles.settings}>
                <div className={styles.columnblock}>

                    <div className={styles.messageboxthree}>
                        <h1 className={styles.title}>Уведомления всем ассистентам</h1>
                        <h1 className={styles.undertitle}>Форма для сообщения</h1>
                        <textarea className={styles.input} placeholder="Сообщение" />
                        <button className={styles.submitButton}>Отправить</button>
                    </div>



                    <div className={styles.messagebox}>
                        <h1 className={styles.gifttitle}>Максимальное количество отказов</h1>
                        <h1 className={styles.undertitletwo}>Введите количество</h1>
                        <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                            <input type="text" className={styles.inputFieldtwo} placeholder="7" />
                            <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Отказов</span>
                        </div>
                        <button className={styles.submitButtontwo}>Подтвердить</button>
                    </div>
                    <div className={styles.messageboxfour}>
                        <h1 className={styles.gifttitle}>В качестве награды ассистент получает</h1>
                        <h1 className={styles.undertitletwo}>Введите количество</h1>
                        <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                            <input type="text" className={styles.inputFieldtwo} placeholder="10" />
                            <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Койнов</span>
                        </div>
                        <div className={styles.userblock}>
                            <h1 className={styles.gifttitletwo}>В качестве награды пользователь получает</h1>
                        </div>
                        <h1 className={styles.undertitletwo}>Введите количество</h1>
                        <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                            <input type="text" className={styles.inputFieldtwo} placeholder="10" />
                            <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Койнов</span>
                        </div>
                        <div className={styles.userblock}>
                            <h1 className={styles.gifttitletwo}>Количество запросов для награды</h1>
                        </div>
                        <h1 className={styles.undertitletwo}>Введите количество</h1>
                        <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                            <input
                                type="text"
                                className={styles.inputFieldtwo}
                                placeholder="100"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Запросов</span>
                        </div>
                        <div className={styles.modeSlider}>
                            <span className={modetwo === 'single' ? styles.activeMode : ''}>Разово</span>
                            <label className={styles.switchtwo}>
                                <input type="checkbox" checked={modetwo === 'interval'} onChange={handleModeChangetwo} />
                                <span className={styles.slider}></span>
                            </label>
                            <span className={modetwo === 'interval' ? styles.activeMode : ''}>
                                Через каждые {inputValue}
                            </span>
                        </div>
                        <button className={styles.submitButtontwo}>Подтвердить</button>

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

                    <h1 className={styles.notitle}></h1>
                    <div className={styles.messageboxtwo}>
                        <div className={styles.contentbox}>
                            <h1 className={styles.gifttitle}>Подарочные койны</h1>
                            <div className={styles.togglebox}>
                                <label className={styles.switch}>
                                    <input type="checkbox" checked={isToggled} onChange={handleToggleChange} />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={styles.label}>Включить эту опцию</span>
                            </div>
                        </div>
                        <div className={styles.contentbox}>
                            <h1 className={styles.undertitletwo}>Введите количество</h1>
                            <div className={`${styles.inputContainer} ${isToggled ? styles.active : ''}`}>
                                <input type="text" className={styles.inputField} placeholder="10000" />
                                <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Койнов</span>
                            </div>


                            <div className={styles.modeSlider}>
                                <span className={mode === 'single' ? styles.activeMode : ''}>Разово</span>
                                <label className={styles.switchtwo}>
                                    <input type="checkbox" checked={mode === 'interval'} onChange={handleModeChange} />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={mode === 'interval' ? styles.activeMode : ''}>Через</span>
                            </div>


                            <div className={`${styles.inputContainerthree} ${styles.intervalInputContainer} ${mode === 'interval' ? styles.show : styles.hide}`}>
                                <input type="text" className={styles.inputField} placeholder="5" />
                                <span className={styles.label}>Запросов</span>
                            </div>
                            <button className={styles.submitButton}>Подтвердить</button>
                        </div>
                    </div>
                    <div className={styles.messagebox}>
                        <h1 className={styles.gifttitle}>Время на принятие запроса</h1>
                        <h1 className={styles.undertitletwo}>Введите количество</h1>
                        <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                            <input type="text" className={styles.inputFieldtwo} placeholder="60" />
                            <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Секунд</span>
                        </div>
                        <button className={styles.submitButtontwo}>Подтвердить</button>
                    </div>
                    <div className={styles.messageboxfive}>
                        <h1 className={styles.title}>Текст кнопок</h1>


                        <div className={styles.fakeButton} contentEditable="true">
                            Лимиты
                        </div>


                        <div className={styles.fakeButton} contentEditable="true">
                            Инструкции
                        </div>

                        <button className={styles.submitButton}>Подтвердить</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Page;

"use client";

import React, { useState, useMemo } from 'react';
import styles from './Users.module.css';
import Image from 'next/image';
import Table from '@/components/Table/Table';
import { Column, CellProps } from 'react-table';

interface UserData {
    nickname: string;
    referrals: number;
    subscription: string;
    requests: number;
    renewed: boolean;
}

function Page() {

    const [isToggledNotifications, setIsToggledNotifications] = useState(false);
    const [checkboxesNotifications, setCheckboxesNotifications] = useState<boolean[]>([false, false, false, false]);


    const [inputValuesAssistant, setInputValuesAssistant] = useState<string[]>(['60', '120', '180', '240']);


    const [inputValuesAI, setInputValuesAI] = useState<string[]>(['60', '120', '180', '240']);


    const [percentage, setPercentage] = useState<number>(60);




    const [isToggledVoiceAI, setIsToggledVoiceAI] = useState<boolean>(false);
    const [checkboxesVoiceAI, setCheckboxesVoiceAI] = useState<boolean[]>([false, false, false, false]);


    const [isToggledVoiceAssistant, setIsToggledVoiceAssistant] = useState<boolean>(false);
    const [checkboxesVoiceAssistant, setCheckboxesVoiceAssistant] = useState<boolean[]>([false, false, false, false]);


    const [isToggledVideoAssistant, setIsToggledVideoAssistant] = useState<boolean>(false);
    const [checkboxesVideoAssistant, setCheckboxesVideoAssistant] = useState<boolean[]>([false, false, false, false]);


    const [isToggledFileAssistant, setIsToggledFileAssistant] = useState<boolean>(false);
    const [checkboxesFileAssistant, setCheckboxesFileAssistant] = useState<boolean[]>([false, false, false, false]);


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
        const newToggleState = !isToggledVoiceAssistant;
        setIsToggledVoiceAssistant(newToggleState);
        setCheckboxesVoiceAssistant(newToggleState ? [true, true, true, true] : [false, false, false, false]);
    };

    const handleCheckboxChangeVoiceAssistant = (index: number) => {
        const updatedCheckboxes = [...checkboxesVoiceAssistant];
        updatedCheckboxes[index] = !updatedCheckboxes[index];
        setCheckboxesVoiceAssistant(updatedCheckboxes);
        setIsToggledVoiceAssistant(updatedCheckboxes.every((checkbox) => checkbox));
    };


    const handleToggleChangeVideoAssistant = () => {
        const newToggleState = !isToggledVideoAssistant;
        setIsToggledVideoAssistant(newToggleState);
        setCheckboxesVideoAssistant(newToggleState ? [true, true, true, true] : [false, false, false, false]);
    };

    const handleCheckboxChangeVideoAssistant = (index: number) => {
        const updatedCheckboxes = [...checkboxesVideoAssistant];
        updatedCheckboxes[index] = !updatedCheckboxes[index];
        setCheckboxesVideoAssistant(updatedCheckboxes);
        setIsToggledVideoAssistant(updatedCheckboxes.every((checkbox) => checkbox));
    };


    const handleToggleChangeFileAssistant = () => {
        const newToggleState = !isToggledFileAssistant;
        setIsToggledFileAssistant(newToggleState);
        setCheckboxesFileAssistant(newToggleState ? [true, true, true, true] : [false, false, false, false]);
    };

    const handleCheckboxChangeFileAssistant = (index: number) => {
        const updatedCheckboxes = [...checkboxesFileAssistant];
        updatedCheckboxes[index] = !updatedCheckboxes[index];
        setCheckboxesFileAssistant(updatedCheckboxes);
        setIsToggledFileAssistant(updatedCheckboxes.every((checkbox) => checkbox));
    };


    const handleInputChangeAssistant = (index: number, value: string) => {
        const updatedValues = [...inputValuesAssistant];
        updatedValues[index] = value;
        setInputValuesAssistant(updatedValues);
    };


    const handleInputChangeAI = (index: number, value: string) => {
        const updatedValues = [...inputValuesAI];
        updatedValues[index] = value;
        setInputValuesAI(updatedValues);
    };

    const sliderStyle = {
        background: `linear-gradient(to right, #365CF5 0%, #365CF5 ${percentage}%, #e5e5e5 ${percentage}%, #e5e5e5 100%)`,
    };


    const [generatedLink, setGeneratedLink] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState<boolean>(false);


    const handleGenerateLink = () => {

        const newLink = 'https://example.com/invite/' + Math.random().toString(36).substr(2, 9);
        setGeneratedLink(newLink);
        setCopySuccess(false);
    };


    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink).then(() => {
            setCopySuccess(true);

            setTimeout(() => setCopySuccess(false), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    const columns: Column<UserData>[] = useMemo(
        () => [
            {
                Header: 'Ник пользователя',
                accessor: 'nickname',
            },
            {
                Header: 'Количество рефералов',
                accessor: 'referrals',
            },
            {
                Header: 'Вариант подписки',
                accessor: 'subscription',
            },
            {
                Header: 'Количество запросов',
                accessor: 'requests',
            },
            {
                Header: 'Продлевал ли ранее подписку',
                accessor: 'renewed',
                Cell: ({ value }: CellProps<UserData, boolean>) => (value ? 'Да' : 'Нет'),
            },
        ],
        []
    );



    const data = useMemo(
        () => [
            {
                nickname: 'User1',
                referrals: 5,
                subscription: 'Premium',
                requests: 120,
                renewed: true,
            },
            {
                nickname: 'User2',
                referrals: 2,
                subscription: 'Basic',
                requests: 60,
                renewed: false,
            },

        ],
        []
    );

    return (
        <div className={styles.main}>
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
                                    <span>{`Категория пользователей №${index + 1}`}</span>
                                </label>
                            ))}
                        </div>
                        <h1 className={styles.undertitle}>Форма для сообщения</h1>
                        <textarea className={styles.input} placeholder="Сообщение" />
                        <button className={styles.submitButton}>Отправить</button>
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

                    <div className={styles.messagebox}>
                        <h1 className={styles.gifttitle}>Количество запросов к ассистенту</h1>
                        {inputValuesAssistant.map((value, index) => (
                            <div key={index}>
                                <h1 className={styles.undertitletwo}>
                                    {`Введите количество для категории пользователей №${index + 1}`}
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
                </div>


                <div className={styles.columnblock}>
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
                        <h1 className={styles.gifttitle}>Количество запросов к ИИ</h1>
                        {inputValuesAI.map((value, index) => (
                            <div key={index}>
                                <h1 className={styles.undertitletwo}>
                                    {`Введите количество для категории пользователей №${index + 1}`}
                                </h1>
                                <div className={styles.inputContainertwo}>
                                    <input
                                        type="text"
                                        className={styles.inputFieldtwo}
                                        placeholder={value}
                                        value={value}
                                        onChange={(e) => handleInputChangeAI(index, e.target.value)}
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
                                    <span>{`Категория пользователей №${index + 1}`}</span>
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
                            {checkboxesVoiceAssistant.map((checked, index) => (
                                <label key={index} className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleCheckboxChangeVoiceAssistant(index)}
                                    />
                                    <span className={styles.animatedCheckbox}></span>
                                    <span>{`Категория пользователей №${index + 1}`}</span>
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
                            {checkboxesVideoAssistant.map((checked, index) => (
                                <label key={index} className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleCheckboxChangeVideoAssistant(index)}
                                    />
                                    <span className={styles.animatedCheckbox}></span>
                                    <span>{`Категория пользователей №${index + 1}`}</span>
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
                            {checkboxesFileAssistant.map((checked, index) => (
                                <label key={index} className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleCheckboxChangeFileAssistant(index)}
                                    />
                                    <span className={styles.animatedCheckbox}></span>
                                    <span>{`Категория пользователей №${index + 1}`}</span>
                                </label>
                            ))}
                        </div>

                        <button className={styles.submitButtonthree}>Подтвердить</button>
                    </div>
                </div>
            </div>
            <div className={styles.tablebox}>
                <div className={styles.tableWrapper}>
                    <div className={styles.header}>
                        <h3>
                            Запросы на распределение коинов <span>({data.length})</span>
                        </h3>
                    </div>
                    <Table columns={columns} data={data} />
                </div>
            </div>
        </div>

    );
}

export default Page;

"use client";

import React, { useState, useRef } from 'react';
import styles from './Assistent.module.css';
import Link from 'next/link';
import Table from '@/components/Table/Table';
import { Column } from 'react-table';
import Select from 'react-select';

interface RequestData {
  requestId: number;
  action: string;
  log: string;
  userId: number;
}



function Page() {
  const [showPopup, setShowPopup] = useState(false);

  const [inputValuesAssistant, setInputValuesAssistant] = useState<string[]>(['5', '14', '30', '3']);

  const handleInputChangeAssistant = (index: number, value: string) => {
    const updatedValues = [...inputValuesAssistant];
    updatedValues[index] = value;
    setInputValuesAssistant(updatedValues);
  };


  const popupRef = useRef<HTMLDivElement>(null);
  const [percentage, setPercentage] = useState<number>(60);

  const [isToggled] = useState(false);



  const options = [
    { value: 'ai5', label: 'AI + 5 запросов ассистенту' },
    { value: 'ai14', label: 'AI + 14 запросов ассистенту' },
    { value: 'ai30', label: 'AI + 30 запросов ассистенту' },
    { value: 'only-ai', label: 'Только AI' }
  ];






  const sliderStyle = {
    background: `linear-gradient(to right, #365CF5 0%, #365CF5 ${percentage}%, #e5e5e5 ${percentage}%, #e5e5e5 100%)`,
  };




  const columns: Column<RequestData>[] = [
    { Header: 'ID запроса', accessor: 'requestId' },
    { Header: 'Действие', accessor: 'action' },
    { Header: 'Лог', accessor: 'log' },
    { Header: 'ID пользователя', accessor: 'userId' }
  ];

  const data: RequestData[] = [
    { requestId: 1, action: 'Создан', log: 'Создание запроса', userId: 1001 },
    { requestId: 2, action: 'Изменен', log: 'Изменение статуса', userId: 1002 },
    { requestId: 3, action: 'Удален', log: 'Удаление записи', userId: 1003 }
  ];






  return (
    <div className={styles.main}>

      <div className={styles.titlebox}>
        <h1 className={styles.title}>Пользователь</h1>
        <div className={styles.pointerblock}>
          <p className={styles.pointertext}>
            <Link href="/admin/users" className={styles.link}>Пользователи</Link> &nbsp;&nbsp;/&nbsp;&nbsp;
            Пользователь
          </p>
        </div>
      </div>


      <div className={styles.assistantblock}>
        <div className={styles.containertwo}>
          <div className={styles.infoblock}>
            <div className={styles.metricsblock}>
              <div className={styles.logoparent}>
                <div className={styles.avatarblock}>

                  <p>Нет аватара</p>

                </div>
                <div className={styles.numbers}>
                  <div className={styles.metric}>
                    <p className={styles.number}>0</p>
                    <p className={styles.smalltitle}>Запросы/все время</p>
                  </div>
                  <div className={styles.metric}>
                    <p className={styles.number}>0</p>
                    <p className={styles.smalltitle}>Запросы/месяц</p>
                  </div>
                  <div className={styles.metric}>
                    <p className={styles.number}>0</p>
                    <p className={styles.smalltitle}>Запросы/неделя</p>
                  </div>

                </div>
              </div>


              <div className={styles.datablock}>
                <div className={styles.nameblock}>
                  <p className={styles.name}>@space_driver</p>
                  <p className={styles.undername}>ID: 543234634</p>
                  <p className={styles.undername}>Номер телефона: отсутствует</p>
                  <p className={styles.undername}>Платежная система: звезды telegram</p>
                </div>
                <div className={styles.numberstwo}>
                  <div className={styles.metric}>
                    <p className={styles.number}>0</p>
                    <p className={styles.smalltitle}>Запросы/сутки</p>
                  </div>
                  <div className={styles.metric}>
                    <p className={styles.number}>0</p>
                    <p className={styles.smalltitle}>Запросы к ИИ</p>
                  </div>
                </div>
              </div>
              <div className={styles.numbersthree}>
                <div className={styles.messageboxthree}>
                  <h1 className={styles.gifttitle}>Заблокировать пользователя</h1>
                  <h1 className={styles.undertitletwo}>Введите на какое время (в часах)</h1>
                  <div className={styles.inputContainertwo}>
                    <input type="text" className={styles.inputFieldtwo} placeholder="7" />
                    <span className={styles.label}>Часов</span>
                  </div>
                  <div className={styles.buttonblock}>
                    <button className={styles.submitButtontwo}>Подтвердить</button>
                    <button
                      className={styles.submitButtonthree}
                      onClick={() => setShowPopup(true)}
                    >
                      Удалить ассистента
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.containerthree}>
            <div className={styles.messageboxfive}>
              <h1 className={styles.gifttitle}>Текущее количество запросов к ИИ</h1>
              <h1 className={styles.undertitletwo}>Изменить количество</h1>
              <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                <input type="text" className={styles.inputFieldtwo} placeholder="7" />
                <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Отказов</span>
              </div>
              <button className={styles.submitButton}>Подтвердить</button>
            </div>
            <div className={styles.messageboxfive}>
              <h1 className={styles.gifttitle}>Текущее количество запросов к ассистенту</h1>
              <h1 className={styles.undertitletwo}>Изменить количество</h1>
              <div className={`${styles.inputContainertwo} ${isToggled ? styles.active : ''}`}>
                <input type="text" className={styles.inputFieldtwo} placeholder="7" />
                <span className={`${styles.label} ${isToggled ? styles.activeLabel : ''}`}>Отказов</span>
              </div>
              <button className={styles.submitButton}>Подтвердить</button>
            </div>
          </div>
          <div className={styles.containerthree}>
            <div className={styles.messageboxseven}>
              <h1 className={styles.title}>Уведомления всем ассистентам</h1>
              <h1 className={styles.undertitle}>Форма для сообщения</h1>
              <textarea className={styles.input} placeholder="Сообщение" />
              <button className={styles.submitButton}>Отправить</button>
            </div>
            <div className={styles.messageboxsix}>
              <h1 className={styles.gifttitle}>Выдать подписку</h1>
              <h1 className={styles.undertitletwo}>Выберите тип</h1>

              <div className={styles.selectWrapper}>
                <Select options={options} />
                <div className={styles.selectArrow}></div>
              </div>

              <button className={styles.submitButton}>Подтвердить</button>
            </div>
          </div>

        </div>

        <div className={styles.containerone}>
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
          <div className={styles.messageboxfour}>
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

            <button className={styles.submitButton}>Подтвердить</button>
          </div>
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Запросы <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} />
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Жалобы <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} />
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Рефералы <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} />
        </div>
      </div>


      {showPopup && (
        <>
          <div className={styles.overlay} />
          <div className={styles.popup} ref={popupRef}>
            <h2 className={styles.popupTitle}>Вы действительно хотите удалить ассистента?</h2>
            <div className={styles.popupButtons}>
              <button className={styles.confirmButton}>Да</button>
              <button className={styles.cancelButton} onClick={() => setShowPopup(false)}>Нет</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Page;

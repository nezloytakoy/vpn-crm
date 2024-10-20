"use client"

import React, { useState, useRef, useEffect } from 'react';
import styles from './Assistent.module.css';
import Link from 'next/link';
import { FaEllipsisH } from 'react-icons/fa';
import Table from '@/components/Table/Table';
import { Column } from 'react-table';

interface RequestData {
  requestId: number;
  action: string;
  log: string;
  userId: number;
}

interface TransactionData {
  id: number;
  amount: number;
  reason: string;
  time: string;
}

function Page() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showPupilDropdown, setShowPupilDropdown] = useState(false);
  const [isMessageboxVisible, setIsMessageboxVisible] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const pupilDropdownRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

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
  
  const transactionColumns: Column<TransactionData>[] = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Количество', accessor: 'amount' },
    { Header: 'Причина', accessor: 'reason' },
    { Header: 'Время', accessor: 'time' }
  ];

  const transactionData: TransactionData[] = [
    { id: 1, amount: 500, reason: 'Оплата услуг', time: '2023-10-20 14:30' },
    { id: 2, amount: 300, reason: 'Возврат средств', time: '2023-10-19 10:15' },
    { id: 3, amount: 200, reason: 'Пополнение счета', time: '2023-10-18 16:45' }
  ];
  
  
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(`.${styles.iconButton}`)
      ) {
        setShowDropdown(false);
      }

      if (
        pupilDropdownRef.current &&
        !pupilDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPupilDropdown(false);
      }

      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowPopup(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  
  const toggleMessagebox = () => {
    setIsMessageboxVisible(!isMessageboxVisible);
  };

  return (
    <div className={styles.main}>
      
      <div className={styles.titlebox}>
        <h1 className={styles.title}>Ассистент</h1>
        <div className={styles.pointerblock}>
          <p className={styles.pointertext}>
            <Link href="/admin/monitoring" className={styles.link}>Мониторинг</Link> &nbsp;&nbsp;/&nbsp;&nbsp;
            Ассистент
          </p>
        </div>
      </div>

      
      <div className={styles.assistantblock}>
        <div className={styles.infoblock}>
          <div className={styles.metricsblock}>
            <div className={styles.logoparent}>
              <div className={styles.avatarblock}></div>
              <div className={styles.numbers}>
                <div className={styles.metric}>
                  <p className={styles.number}>100</p>
                  <p className={styles.smalltitle}>Objects</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>100</p>
                  <p className={styles.smalltitle}>Objects</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>100</p>
                  <p className={styles.smalltitle}>Objects</p>
                </div>
                <div className={styles.metrictwo}>
                  
                  <button
                    className={styles.iconButton}
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-haspopup="true"
                    aria-expanded={showDropdown}
                  >
                    <FaEllipsisH />
                  </button>
                  
                  {showDropdown && (
                    <div className={`${styles.dropdownMenu} ${showDropdown ? styles.fadeIn : styles.fadeOut}`} ref={dropdownRef}>
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className={styles.dropdownItem}>
                          <p className={styles.number}>100</p>
                          <p className={styles.smalltitle}>Objects</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            
            <div className={styles.datablock}>
              <div className={styles.nameblock}>
                <p className={styles.name}>John Doe</p>
                <p className={styles.undername}>Founder, Abc Company</p>
              </div>
              <div className={styles.numberstwo}>
                <div className={styles.metric}>
                  <p className={styles.number}>100</p>
                  <p className={styles.smalltitle}>Objects</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>100</p>
                  <p className={styles.smalltitle}>Objects</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>100</p>
                  <p className={styles.smalltitle}>Objects</p>
                </div>
                <div className={styles.metric}>
                  <p className={styles.number}>100</p>
                  <p className={styles.smalltitle}>Objects</p>
                </div>
              </div>
            </div>
            <div className={styles.numbersthree}>
              <div className={styles.messagebox}>
                <h1 className={styles.gifttitle}>Заблокировать ассистента</h1>
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

        
        <div className={styles.pupil}>
          <div className={styles.pupiltitleblock}>
            <p className={styles.pupiltitle}>Подопечные</p>
            <button
              className={styles.iconButton}
              onClick={() => setShowPupilDropdown(!showPupilDropdown)}
            >
              <FaEllipsisH />
            </button>
          </div>

          
          {showPupilDropdown && (
            <div className={`${styles.pupilDropdown} ${showPupilDropdown ? styles.fadeIn : styles.fadeOut}`} ref={pupilDropdownRef}>
              <div onClick={toggleMessagebox} className={styles.pupilDropdownItem}>
                {isMessageboxVisible ? 'Скрыть' : 'Показать'}
              </div>
            </div>
          )}

          
          <div className={`${styles.messageboxtwo} ${isMessageboxVisible ? styles.show : styles.hide}`}>
            <h1 className={styles.gifttitle}>Добавить подопечного</h1>
            <h1 className={styles.undertitletwo}>Введите айди подопечного</h1>
            <div className={styles.inputContainerthree}>
              <input type="text" className={styles.inputFieldtwo} placeholder="7" />
            </div>
            <div className={styles.buttonblock}>
              <button className={styles.submitButtonfour}>Подтвердить</button>
            </div>
          </div>
          <div className={`${styles.pupilsblock} ${isMessageboxVisible ? styles.hidePupils : styles.showPupils}`}>
            <div className={styles.pupilblock}>
              <div className={styles.pupillogo}>
                <div className={styles.activecircle}></div>
              </div>
              <div className={styles.pupilnameblock}>
                <div className={styles.pupilinnername}>
                  <p className={styles.nametext}>John Doe</p>
                  <div className={styles.pupilinfo}>
                    <p className={styles.infotext}>В сети - 20м назад</p>
                  </div>
                </div>
                <div className={styles.pupilunderblock}>
                  <p className={styles.undertext}>Founder, Abc Company</p>
                  <p className={styles.undertext}>№1</p>
                </div>
              </div>


            </div>
            <div className={styles.pupilblock}>
              <div className={styles.pupillogo}>
                <div className={styles.activecircle}></div>
              </div>
              <div className={styles.pupilnameblock}>
                <div className={styles.pupilinnername}>
                  <p className={styles.nametext}>John Doe</p>
                  <div className={styles.pupilinfo}>
                    <p className={styles.infotext}>В сети - 20м назад</p>
                  </div>
                </div>
                <div className={styles.pupilunderblock}>
                  <p className={styles.undertext}>Founder, Abc Company</p>
                  <p className={styles.undertext}>№1</p>
                </div>
              </div>


            </div>
            <div className={styles.pupilblock}>
              <div className={styles.pupillogo}>
                <div className={styles.activecircle}></div>
              </div>
              <div className={styles.pupilnameblock}>
                <div className={styles.pupilinnername}>
                  <p className={styles.nametext}>John Doe</p>
                  <div className={styles.pupilinfo}>
                    <p className={styles.infotext}>В сети - 20м назад</p>
                  </div>
                </div>
                <div className={styles.pupilunderblock}>
                  <p className={styles.undertext}>Founder, Abc Company</p>
                  <p className={styles.undertext}>№1</p>
                </div>
              </div>


            </div>
            <div className={styles.pupilblock}>
              <div className={styles.pupillogo}>
                <div className={styles.activecircle}></div>
              </div>
              <div className={styles.pupilnameblock}>
                <div className={styles.pupilinnername}>
                  <p className={styles.nametext}>John Doe</p>
                  <div className={styles.pupilinfo}>
                    <p className={styles.infotext}>В сети - 20м назад</p>
                  </div>
                </div>
                <div className={styles.pupilunderblock}>
                  <p className={styles.undertext}>Founder, Abc Company</p>
                  <p className={styles.undertext}>№1</p>
                </div>
              </div>


            </div>
            <div className={styles.pupilblock}>
              <div className={styles.pupillogo}>
                <div className={styles.activecircle}></div>
              </div>
              <div className={styles.pupilnameblock}>
                <div className={styles.pupilinnername}>
                  <p className={styles.nametext}>John Doe</p>
                  <div className={styles.pupilinfo}>
                    <p className={styles.infotext}>В сети - 20м назад</p>
                  </div>
                </div>
                <div className={styles.pupilunderblock}>
                  <p className={styles.undertext}>Founder, Abc Company</p>
                  <p className={styles.undertext}>№1</p>
                </div>
              </div>


            </div>
            <div className={styles.pupilblock}>
              <div className={styles.pupillogo}>
                <div className={styles.activecircle}></div>
              </div>
              <div className={styles.pupilnameblock}>
                <div className={styles.pupilinnername}>
                  <p className={styles.nametext}>John Doe</p>
                  <div className={styles.pupilinfo}>
                    <p className={styles.infotext}>В сети - 20м назад</p>
                  </div>
                </div>
                <div className={styles.pupilunderblock}>
                  <p className={styles.undertext}>Founder, Abc Company</p>
                  <p className={styles.undertext}>№1</p>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              История запросов <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} />
        </div>
      </div>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              История транзакций <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={transactionColumns} data={transactionData} />
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

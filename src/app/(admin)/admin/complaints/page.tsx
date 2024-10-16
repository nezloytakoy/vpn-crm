"use client";

import React, { useEffect, useState } from 'react';
import Table from '@/components/Table/Table'; 
import { Column } from 'react-table'; 
import styles from './Complaints.module.css';

interface ConversationLog {
  sender: 'USER' | 'ASSISTANT'; 
  message: string; 
  timestamp: string; 
}

interface Complaint {
  id: string;
  text: string;
  photoUrls: string[]; 
  conversationLogs: ConversationLog[]; 
  userId: string;
  userNickname: string;
  assistantId: string;
  assistantNickname: string;
}

interface ComplaintData {
  complaintId: string;
  user: string;
  userId: string;
  assistant: string;
  assistantId: string;
}

const Complaints: React.FC = () => {
  const [data, setData] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch('/api/get-complaints');
        if (!response.ok) {
          throw new Error('Ошибка получения жалоб');
        }

        const complaintsData: Complaint[] = await response.json();

        const formattedData: ComplaintData[] = complaintsData.map((complaint) => ({
          complaintId: complaint.id,
          user: `@${complaint.userNickname}`,
          userId: complaint.userId,
          assistant: `@${complaint.assistantNickname}`,
          assistantId: complaint.assistantId,
        }));

        setData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при получении данных:', error);
        setError('Не удалось загрузить жалобы. Пожалуйста, попробуйте снова позже.');
      }
    };

    fetchComplaints();
  }, []);

  const columns: Array<Column<ComplaintData>> = [
    {
      Header: 'Номер жалобы',
      accessor: 'complaintId',
    },
    {
      Header: 'Пользователь',
      accessor: 'user',
      Cell: ({ row }: { row: { original: ComplaintData } }) => (
        <a
          href={`https://t.me/${row.original.user}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          {row.original.user}
        </a>
      ),
    },
    {
      Header: 'ID Пользователя',
      accessor: 'userId',
    },
    {
      Header: 'Ассистент',
      accessor: 'assistant',
      Cell: ({ row }: { row: { original: ComplaintData } }) => (
        <a
          href={`https://t.me/${row.original.assistant}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          {row.original.assistant}
        </a>
      ),
    },
    {
      Header: 'ID Ассистента',
      accessor: 'assistantId',
    },
  ];

  const handleRowClick = async (row: ComplaintData) => {
    try {
      
      const response = await fetch(`/api/get-complaint-details?id=${row.complaintId}`);
      if (!response.ok) {
        throw new Error('Ошибка получения деталей жалобы');
      }
      const complaintDetails: Complaint = await response.json();
      setSelectedComplaint(complaintDetails); 
    } catch (error) {
      console.error('Ошибка при получении деталей жалобы:', error);
    }
  };

  const handleApprove = async () => {
    if (selectedComplaint) {
      try {
        
        await fetch(`/api/approve-complaint?id=${selectedComplaint.id}`, {
          method: 'POST',
        });
        setSelectedComplaint(null); 
      } catch (error) {
        console.error('Ошибка при одобрении жалобы:', error);
      }
    }
  };

  const handleReject = async () => {
    if (selectedComplaint) {
      try {
        
        await fetch(`/api/reject-complaint?id=${selectedComplaint.id}`, {
          method: 'POST',
        });
        setSelectedComplaint(null); 
      } catch (error) {
        console.error('Ошибка при отклонении жалобы:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loaderWrapper}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  
  return (
    <div className={styles.main}>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Жалобы на ассистентов <span>({data.length})</span>
            </h3>
          </div>
          <Table
            columns={columns}
            data={data}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {selectedComplaint && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup}>
            <h3>Подробности жалобы</h3>
            <p><strong>Жалоба:</strong> {selectedComplaint.text}</p>

           
            {selectedComplaint.photoUrls.length > 0 && (
              <div>
                <strong>Скриншоты:</strong>
                
                <div className={styles.imagesContainer}>
                  {selectedComplaint.photoUrls.map((url, index) => (
                    
                    <img
                      key={index}
                      src={`/api/proxy-image?url=${encodeURIComponent(url)}`}
                      alt={`Фото ${index + 1}`}
                      className={styles.image}
                    />
                  ))}
                </div>
              </div>
            )}

            
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(selectedComplaint.conversationLogs, null, 2))}`}
              download="dialog-logs.txt"
              className={styles.link}
            >
              Скачать логи диалога
            </a>

            <div className={styles.buttonGroup}>
              <button onClick={handleApprove} className={styles.approveButton}>
                Одобрить
              </button>
              <button onClick={handleReject} className={styles.rejectButton}>
                Отклонить
              </button>
            </div>
          </div>
        </div>

      )}
    </div>
  );
};

export default Complaints;

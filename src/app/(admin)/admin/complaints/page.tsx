"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Table from "@/components/Table/Table";
import { Column } from "react-table";
import styles from "./Complaints.module.css";

interface ConversationLog {
  sender: "USER" | "ASSISTANT";
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  useEffect(() => {
    console.log("Начало загрузки жалоб...");
    const fetchComplaints = async () => {
      try {
        const response = await fetch("/api/get-complaints");
        if (!response.ok) {
          throw new Error("Ошибка получения жалоб");
        }

        const complaintsData: Complaint[] = await response.json();
        console.log("Жалобы получены:", complaintsData);

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
        console.error("Ошибка при получении данных:", error);
        setError("Не удалось загрузить жалобы. Пожалуйста, попробуйте снова позже.");
      }
    };

    fetchComplaints();
  }, []);

  const columns: Array<Column<ComplaintData>> = [
    {
      Header: "Номер жалобы",
      accessor: "complaintId",
    },
    {
      Header: "Пользователь",
      accessor: "user",
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
      Header: "ID Пользователя",
      accessor: "userId",
    },
    {
      Header: "Ассистент",
      accessor: "assistant",
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
      Header: "ID Ассистента",
      accessor: "assistantId",
    },
  ];

  const handleRowClick = async (row: ComplaintData) => {
    console.log(`Выбрана жалоба с ID: ${row.complaintId}`);
    try {
      const response = await fetch(`/api/get-complaint-details?id=${row.complaintId}`);
      if (!response.ok) {
        throw new Error("Ошибка получения деталей жалобы");
      }
      const complaintDetails: Complaint = await response.json();
      console.log("Детали жалобы получены:", complaintDetails);
      setSelectedComplaint(complaintDetails);
    } catch (error) {
      console.error("Ошибка при получении деталей жалобы:", error);
    }
  };

  const handleApprove = () => {
    setAction("approve");
    setFadeOut(true);
    setTimeout(() => {
      setIsFormVisible(true);
      setFadeOut(false);
    }, 300);
  };

  const handleReject = () => {
    setAction("reject");
    setFadeOut(true);
    setTimeout(() => {
      setIsFormVisible(true);
      setFadeOut(false);
    }, 300);
  };

  const handleFormSubmit = async () => {
    if (selectedComplaint) {
      setIsSubmitting(true);
      console.log(
        `${action === "approve" ? "Одобрение" : "Отклонение"} жалобы с ID: ${
          selectedComplaint.id
        }. Объяснение: ${explanation}`
      );
      try {
        
        const token = localStorage.getItem('token'); 
  
        const response = await fetch(
          `/api/${action === "approve" ? "approve-complaint" : "reject-complaint"}?id=${
            selectedComplaint.id
          }`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,  
            },
            body: JSON.stringify({
              complaintId: selectedComplaint.id,
              explanation,
            }),
          }
        );
  
        if (!response.ok) {
          throw new Error(
            `Ошибка при ${
              action === "approve" ? "одобрении" : "отклонении"
            } жалобы: ${response.status}`
          );
        }
  
        const result = await response.json();
        console.log(
          `Результат ${
            action === "approve" ? "одобрения" : "отклонения"
          } жалобы:`,
          result
        );
  
        setTimeout(() => {
          window.location.reload();
        }, 3000);
  
        setSelectedComplaint(null);
        setIsFormVisible(false);
      } catch (error) {
        console.error(
          `Ошибка при ${
            action === "approve" ? "одобрении" : "отклонении"
          } жалобы:`,
          error
        );
        setIsSubmitting(false);
      }
    }
  };
  

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
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
          <Table columns={columns} data={data} onRowClick={handleRowClick} />
        </div>
      </div>

      {selectedComplaint && (
        <div className={`${styles.popupOverlay} ${fadeOut ? styles.fadeOut : ""}`}>
          <div className={styles.popup}>
            {!isFormVisible ? (
              <>
                <p>
                  <strong>Сообщение:</strong> {selectedComplaint.text}
                </p>

                {selectedComplaint.photoUrls.length > 0 && (
                  <div>
                    <strong>Скриншоты:</strong>
                    <div className={styles.imagesContainer}>
                      {selectedComplaint.photoUrls.map((url, index) => (
                        <Image
                          key={index}
                          src={`/api/get-image-proxy?url=${encodeURIComponent(url)}`}
                          alt={`Фото ${index + 1}`}
                          className={styles.image}
                          onClick={() =>
                            openImageModal(
                              `/api/get-image-proxy?url=${encodeURIComponent(url)}`
                            )
                          }
                          width={500}
                          height={300}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                    JSON.stringify(selectedComplaint.conversationLogs, null, 2)
                  )}`}
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

                <div className={styles.indicators}>
                  <div className={styles.circleActive}></div>
                  <div className={styles.circle}></div>
                </div>
              </>
            ) : (
              <div className={styles.formContainer}>
                <h3>{action === "approve" ? "Одобрение жалобы" : "Отклонение жалобы"}</h3>
                <textarea
                  placeholder="Введите ваше объяснение"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className={styles.textArea}
                />
                <button
                  onClick={handleFormSubmit}
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <div className={styles.buttonLoader}></div> : "Отправить"}
                </button>

                <div className={styles.indicators}>
                  <div className={styles.circle}></div>
                  <div className={styles.circleActive}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedImage && (
        <div className={styles.imageModalOverlay} onClick={closeImageModal}>
          <Image
            src={selectedImage}
            alt="Увеличенное изображение"
            className={styles.imageModal}
            width={800}
            height={600}
          />
        </div>
      )}
    </div>
  );
};

export default Complaints;

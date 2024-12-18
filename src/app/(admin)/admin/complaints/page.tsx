"use client";

import React, { useState } from "react";
import Image from "next/image";
import Table from "@/components/Table/Table";
import styles from "./Complaints.module.css";
import ComplaintPopup from "./ComplaintPopup";
import { columns } from "./columns"; // Столбцы таблицы
import { useComplaintsData, ComplaintData } from "./useComplaintsData"; // Наш кастомный хук

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

const Complaints: React.FC = () => {
  const { data, loading, error } = useComplaintsData();

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        `${action === "approve" ? "Одобрение" : "Отклонение"} жалобы с ID: ${selectedComplaint.id
        }. Объяснение: ${explanation}`
      );
      try {

        const moderResponse = await fetch('/api/get-moder-id', {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!moderResponse.ok) {
          throw new Error('Не удалось получить moderatorId');
        }
        const moderResult = await moderResponse.json();
        const moderatorId = moderResult.userId;
        console.log(`Получен moderatorId: ${moderatorId}`);
        const response = await fetch(
          `/api/${action === "approve" ? "approve-complaint" : "reject-complaint"}?id=${selectedComplaint.id
          }`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              complaintId: selectedComplaint.id,
              explanation,
              moderatorId,
            }),
          }
        );
        if (!response.ok) {
          throw new Error(
            `Ошибка при ${action === "approve" ? "одобрении" : "отклонении"
            } жалобы: ${response.status}`
          );
        }
        const result = await response.json();
        console.log(
          `Результат ${action === "approve" ? "одобрения" : "отклонения"
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
          `Ошибка при ${action === "approve" ? "одобрении" : "отклонении"
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
        <ComplaintPopup
          selectedComplaint={selectedComplaint}
          fadeOut={fadeOut}
          isFormVisible={isFormVisible}
          explanation={explanation}
          action={action}
          isSubmitting={isSubmitting}
          setExplanation={setExplanation}
          handleApprove={handleApprove}
          handleReject={handleReject}
          handleFormSubmit={handleFormSubmit}
          openImageModal={openImageModal}
        />
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

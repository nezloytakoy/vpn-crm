"use client";

import React, { useState, useEffect } from "react";
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
  console.log("Render Complaints component"); // Лог при каждом рендере

  // Запрос данных жалоб
  const { data, loading, error } = useComplaintsData();
  console.log("useComplaintsData =>", { data, loading, error });

  // Состояния
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Лог изменений action для отладки
  useEffect(() => {
    console.log("Changed action =>", action);
  }, [action]);

  // Лог изменений selectedComplaint
  useEffect(() => {
    console.log("Changed selectedComplaint =>", selectedComplaint);
  }, [selectedComplaint]);

  // Обработка клика по строке таблицы (выбор жалобы)
  const handleRowClick = async (row: ComplaintData) => {
    console.log("handleRowClick - выбрана жалоба с ID:", row.complaintId);
    try {
      const response = await fetch(`/api/get-complaint-details?id=${row.complaintId}`);
      console.log("handleRowClick - ответ сервера по /get-complaint-details:", response);

      if (!response.ok) {
        throw new Error(`Ошибка получения деталей жалобы, статус = ${response.status}`);
      }

      const complaintDetails: Complaint = await response.json();
      console.log("handleRowClick - Детали жалобы получены:", complaintDetails);

      setSelectedComplaint(complaintDetails);
    } catch (err) {
      console.error("handleRowClick - Ошибка при получении деталей жалобы:", err);
    }
  };

  // Нажали на "Одобрить"
  const handleApprove = () => {
    console.log("handleApprove - пользователь нажал Одобрить");
    setAction("approve");
    setFadeOut(true);
    setTimeout(() => {
      setIsFormVisible(true);
      setFadeOut(false);
      console.log("handleApprove - форма стала видимой, fadeOut выключен");
    }, 300);
  };

  // Нажали на "Отклонить"
  const handleReject = () => {
    console.log("handleReject - пользователь нажал Отклонить");
    setAction("reject");
    setFadeOut(true);
    setTimeout(() => {
      setIsFormVisible(true);
      setFadeOut(false);
      console.log("handleReject - форма стала видимой, fadeOut выключен");
    }, 300);
  };

  // Сабмит формы (общая логика для approve/reject)
  const handleFormSubmit = async () => {
    console.log("handleFormSubmit - начало");
    if (!selectedComplaint) {
      console.log("handleFormSubmit - ошибка: нет selectedComplaint");
      return;
    }

    setIsSubmitting(true);
    console.log(
      `handleFormSubmit - ${action === "approve" ? "Одобрение" : "Отклонение"} жалобы с ID: ${
        selectedComplaint.id
      }. Объяснение: ${explanation}`
    );

    try {
      // Получаем ID модератора
      const moderResponse = await fetch("/api/get-moder-id", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      console.log("handleFormSubmit - ответ по /get-moder-id:", moderResponse);

      if (!moderResponse.ok) {
        throw new Error(`Не удалось получить moderatorId, статус = ${moderResponse.status}`);
      }
      const moderResult = await moderResponse.json();
      const moderatorId = moderResult.userId;
      console.log("handleFormSubmit - получен moderatorId:", moderatorId);

      const endpoint = `/api/${
        action === "approve" ? "approve-complaint" : "reject-complaint"
      }?id=${selectedComplaint.id}`;
      console.log("handleFormSubmit - делаем запрос на:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintId: selectedComplaint.id,
          explanation,
          moderatorId,
        }),
      });
      console.log("handleFormSubmit - ответ по approve/reject:", response);

      if (!response.ok) {
        throw new Error(
          `Ошибка при ${
            action === "approve" ? "одобрении" : "отклонении"
          } жалобы, статус = ${response.status}`
        );
      }

      const result = await response.json();
      console.log(
        `handleFormSubmit - результат ${
          action === "approve" ? "одобрения" : "отклонения"
        } жалобы:`,
        result
      );

      // Сбрасываем состояние после успешного запроса
      setSelectedComplaint(null);
      setIsFormVisible(false);
      setExplanation("");
      setIsSubmitting(false);
      setAction(null);

      console.log("handleFormSubmit - все состояния сброшены");
    } catch (err) {
      console.error(
        `handleFormSubmit - Ошибка при ${
          action === "approve" ? "одобрении" : "отклонении"
        } жалобы:`,
        err
      );
      setIsSubmitting(false);
    }
  };

  // Открыть модалку с изображением
  const openImageModal = (imageUrl: string) => {
    console.log("openImageModal - открываем изображение:", imageUrl);
    setSelectedImage(imageUrl);
  };

  // Закрыть модалку с изображением
  const closeImageModal = () => {
    console.log("closeImageModal - закрываем изображение");
    setSelectedImage(null);
  };

  // Отображение состояния «Загрузка»
  if (loading) {
    console.log("Complaints - пока идёт загрузка (loading = true)");
    return (
      <div className={styles.loaderWrapper}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  // Отображение ошибки (если есть)
  if (error) {
    console.error("Complaints - ошибка:", error);
    return <div className={styles.error}>{error}</div>;
  }

  console.log("Complaints - рендер таблицы, длина data =", data.length);

  return (
    <div className={styles.main}>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Жалобы на ассистентов <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} onRowClick={handleRowClick} isRowClickable={true}/>
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

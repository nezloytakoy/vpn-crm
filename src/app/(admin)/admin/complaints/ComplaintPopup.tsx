import React from "react";
import Image from "next/image";
import styles from "./Complaints.module.css";
import { generateLogContent } from "./utils";

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

interface ComplaintPopupProps {
  selectedComplaint: Complaint;
  fadeOut: boolean;
  isFormVisible: boolean;
  explanation: string;
  action: "approve" | "reject" | null;
  isSubmitting: boolean;
  setExplanation: (value: string) => void;
  handleApprove: () => void;
  handleReject: () => void;
  handleFormSubmit: () => void;
  openImageModal: (url: string) => void;
  closePopup: () => void;
}

const ComplaintPopup: React.FC<ComplaintPopupProps> = ({
  selectedComplaint,
  fadeOut,
  isFormVisible,
  explanation,
  action,
  isSubmitting,
  setExplanation,
  handleApprove,
  handleReject,
  handleFormSubmit,
  openImageModal,
  closePopup,
}) => {
  return (
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
                generateLogContent(selectedComplaint.conversationLogs)
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
  );
};

export default ComplaintPopup;

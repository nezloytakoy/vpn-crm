"use client";

import React, { useEffect, useCallback } from "react";
import Table from "@/components/Table/Table";
import { useRouter } from "next/navigation";
import styles from "./Monitoring.module.css";
import { useUserRole } from "./useUserRole";
import { useMessagePopup } from "./useMessagePopup";
import { RegularAssistantData, useAssistantsData } from './useAssistantsData';
import { BlockedAssistantData,useBlockedAssistantsData } from './useBlockedAssistantsData';
import { useUnblockConfirmation } from "./useUnblockConfirmation";
import { useRegularColumns, useBlockedColumns } from "./useMonitoringColumns";

const Monitoring: React.FC = () => {
  const { assistantsData, isLoading } = useAssistantsData(); // RegularAssistantData[]
  const { fetchUserRole } = useUserRole();
  const { blockedAssistants, isBlockedLoading } = useBlockedAssistantsData(); // BlockedAssistantData[]

  const router = useRouter();

  const onSendMessage = async (message: string, chatId: string) => {
    const response = await fetch("/api/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, chatId }),
    });

    if (!response.ok) {
      throw new Error("Ошибка при отправке сообщения");
    }

    console.log("Отправлено сообщение:", message);
  };

  const onUnblock = async (telegramId: string) => {
    try {
      const response = await fetch("/api/unblock-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ telegramId }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при разблокировке ассистента");
      }

      console.log("Ассистент разблокирован:", telegramId);
      window.location.reload();
    } catch (error) {
      console.error("Ошибка при разблокировке ассистента:", error);
    }
  };

  const {
    isPopupOpen,
    setIsPopupOpen,
    popupMessage,
    setPopupMessage,
    setCurrentAssistantTelegramId,
    popupRef,
    handleSendMessage
  } = useMessagePopup({ onSendMessage });

  const {
    isConfirmUnblockOpen,
    openConfirmUnblock,
    handleConfirmUnblock,
    handleCancelUnblock
  } = useUnblockConfirmation({ onUnblock });

  const handleRowClick = useCallback((telegramId: string) => {
    router.push(`/admin/monitoring/${telegramId}`);
  }, [router]);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const moderResponse = await fetch("/api/get-moder-id", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!moderResponse.ok) {
          throw new Error("Не удалось получить moderatorId");
        }

        const moderResult = await moderResponse.json();
        await fetchUserRole(moderResult.userId);
      } catch (error) {
        console.error("Ошибка при получении роли пользователя:", error);
      }
    };

    fetchRole();
  }, [fetchUserRole]);

  const columns = useRegularColumns({
    handleRowClick,
    setCurrentAssistantTelegramId,
    setIsPopupOpen
  });

  const blockedColumns = useBlockedColumns({
    openConfirmUnblock
  });

  return (
    <div className={styles.main}>
      {isLoading ? (
        <div className={styles.loaderWrapper}>
          <div className={styles.loader}></div>
        </div>
      ) : (
        <>
          {/* Первая таблица (Основные ассистенты) */}
          <div className={styles.tableWrapper}>
            <div className={styles.header}>
              <h3>
                Ассистенты <span>({assistantsData.length})</span>
              </h3>
            </div>
            <Table<RegularAssistantData> columns={columns} data={assistantsData} />
          </div>

          {/* Таблица с заблокированными ассистентами */}
          {isBlockedLoading ? (
            <div className={styles.loaderWrapper}>
              <div className={styles.loader}></div>
            </div>
          ) : (
            blockedAssistants.length > 0 && (
              <div className={styles.tableWrapper}>
                <div className={styles.header}>
                  <h3>
                    Заблокированные ассистенты <span>({blockedAssistants.length})</span>
                  </h3>
                </div>
                <Table<BlockedAssistantData> columns={blockedColumns} data={blockedAssistants} />
              </div>
            )
          )}

          {isPopupOpen && (
            <div className={styles.popupOverlay}>
              <div className={styles.popup} ref={popupRef}>
                <h3>Отправить сообщение</h3>
                <textarea
                  value={popupMessage}
                  onChange={(e) => setPopupMessage(e.target.value)}
                  placeholder="Введите ваше сообщение"
                  className={styles.textarea}
                />
                <button className={styles.sendButton} onClick={handleSendMessage}>
                  Отправить
                </button>
              </div>
            </div>
          )}

          {isConfirmUnblockOpen && (
            <div className={styles.popupOverlay}>
              <div className={styles.popup}>
                <h3>Разблокировать ассистента?</h3>
                <div className={styles.butblock}>
                  <button className={styles.confirmButton} onClick={handleConfirmUnblock}>Да</button>
                  <button className={styles.cancelButton} onClick={handleCancelUnblock}>Нет</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Monitoring;

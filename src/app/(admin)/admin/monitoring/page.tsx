"use client";

import React, { useEffect, useCallback, useMemo, useState } from "react";
import { Column } from "react-table";
import { FaEnvelope } from "react-icons/fa";
import Table from "@/components/Table/Table";
import { useRouter } from "next/navigation";
import styles from "./Monitoring.module.css";
import { useAssistantsData } from "./useAssistantsData";
import { useUserRole } from "./useUserRole";
import { useMessagePopup } from "./useMessagePopup";
import { useBlockedAssistantsData } from "./useBlockedAssistantsData";

interface RegularAssistantData {
  telegramId: string;
  nick: string;
  averageResponseTime: number;
  completed: number;
  denied: number;
  current: number;
  complaints: number;
  status: string;
  message: string;
}

interface BlockedAssistantData {
  telegramId: string;
  username: string;
  role: string;
  isWorking: boolean;
  startedAt: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  coins: number;
  lastActiveAt: string | null;
  orderNumber: number | null;
  avatarFileId: string | null;
  mentorId: string | null;
  isBlocked: boolean;
  unblockDate: string | null;
  activeConversationId: string | null;
}

const Monitoring: React.FC = () => {
  const { assistantsData, isLoading } = useAssistantsData(); // RegularAssistantData[]
  const { userRole, fetchUserRole } = useUserRole();
  const { blockedAssistants, isBlockedLoading } = useBlockedAssistantsData(); // BlockedAssistantData[]

  const router = useRouter();

  const [isConfirmUnblockOpen, setIsConfirmUnblockOpen] = useState(false);
  const [selectedUnblockTelegramId, setSelectedUnblockTelegramId] = useState<string | null>(null);

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

  const handleUnblock = async (telegramId: string) => {
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

  // Первая таблица (Основные ассистенты)
  const columns: Column<RegularAssistantData>[] = useMemo(
    () => [
      {
        Header: "Имя",
        accessor: "nick",
        Cell: ({ row }) => (
          <span onClick={() => handleRowClick(row.original.telegramId)} style={{ cursor: "pointer" }}>
            <strong className={styles.nick}>{row.original.nick}</strong>
          </span>
        ),
      },
      {
        Header: "Время ответа(секунды)",
        accessor: "averageResponseTime",
      },
      {
        Header: "Завершенные",
        accessor: "completed",
      },
      {
        Header: "Отказы",
        accessor: "denied",
      },
      {
        Header: "Открытые жалобы",
        accessor: "current",
      },
      {
        Header: "Жалобы",
        accessor: "complaints",
      },
      {
        Header: "",
        accessor: "status",
        Cell: ({ value }) => (
          <button
            className={
              value === "Работает"
                ? styles.statusWorking
                : value === "Не работает"
                ? styles.statusOffline
                : value === "Выкинуло с линии"
                ? styles.statusNotWorking
                : ""
            }
          >
            {value}
          </button>
        ),
      },
      {
        Header: "",
        accessor: "telegramId",
        Cell: ({ value }) => (
          <button
            className={styles.messageButton}
            onClick={() => {
              if (!value) {
                console.error("Ошибка: telegramId ассистента не установлен");
                return;
              }
              setCurrentAssistantTelegramId(value);
              setIsPopupOpen(true);
            }}
          >
            <FaEnvelope />
          </button>
        ),
      },
    ],
    [handleRowClick, setCurrentAssistantTelegramId, setIsPopupOpen]
  );

  // Таблица заблокированных ассистентов
  const blockedColumns: Column<BlockedAssistantData>[] = useMemo(() => [
    {
      Header: "Имя",
      accessor: "username",
      Cell: ({ row }) => (
        <span style={{ cursor: "pointer" }}>
          <strong className={styles.nick}>{row.original.username}</strong>
        </span>
      ),
    },
    {
      Header: "Последняя активность",
      accessor: "lastActiveAt",
      Cell: ({ value }) => (value ? new Date(value).toLocaleString() : "N/A"),
    },
    {
      Header: "Telegram ID",
      accessor: "telegramId",
    },
    {
      id: "unblock_action",
      Header: "",
      Cell: ({ row }) =>
        row.original.telegramId && (
          <button
            className={styles.unblockButton}
            onClick={() => {
              setSelectedUnblockTelegramId(row.original.telegramId);
              setIsConfirmUnblockOpen(true);
            }}
          >
            Разблокировать
          </button>
        ),
    },
  ], []);

  const handleConfirmUnblock = async () => {
    if (selectedUnblockTelegramId) {
      await handleUnblock(selectedUnblockTelegramId);
    }
    setIsConfirmUnblockOpen(false);
    setSelectedUnblockTelegramId(null);
  };

  const handleCancelUnblock = () => {
    setIsConfirmUnblockOpen(false);
    setSelectedUnblockTelegramId(null);
  };

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


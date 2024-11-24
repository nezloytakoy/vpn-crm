"use client";

import React, { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { Column } from "react-table";
import { FaEnvelope } from "react-icons/fa";
import Table from "@/components/Table/Table";
import { useRouter } from "next/navigation";
import styles from "./Monitoring.module.css";

interface AssistantData {
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

const Monitoring: React.FC = () => {
  const [assistantsData, setAssistantsData] = useState<AssistantData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [currentAssistantTelegramId, setCurrentAssistantTelegramId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const fetchAssistantsData = useCallback(async () => {
    try {
      const response = await fetch("/api/assistants-data", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка загрузки данных с сервера");
      }

      const data = await response.json();
      setAssistantsData(data);
    } catch (error) {
      console.error("Ошибка при получении данных ассистентов:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Первичная загрузка данных
    fetchAssistantsData();

    // Установка интервала для обновления данных каждые 5 секунд
    const intervalId = setInterval(() => {
      fetchAssistantsData();
    }, 5000);

    // Очистка интервала при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [fetchAssistantsData]);

  const fetchUserRole = async (telegramId: string) => {
    try {
      const response = await fetch("/api/get-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ telegramId }),
      });

      if (!response.ok) {
        throw new Error("Не удалось получить роль пользователя");
      }

      const result = await response.json();
      setUserRole(result.role);
    } catch (error) {
      console.error("Ошибка при получении роли пользователя:", error);
    }
  };

  const handleRowClick = useCallback(
    (telegramId: string) => {
      router.push(`/admin/monitoring/${telegramId}`);
    },
    [router]
  );

  const handleSendMessage = async () => {
    try {
      if (!currentAssistantTelegramId) {
        console.error("Ошибка: telegramId ассистента не установлен");
        return;
      }

      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: popupMessage,
          chatId: currentAssistantTelegramId,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при отправке сообщения");
      }

      console.log("Отправлено сообщение:", popupMessage);
      setIsPopupOpen(false);
      setPopupMessage("");
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsPopupOpen(false);
      }
    };

    if (isPopupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopupOpen]);

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
  }, []);

  const columns: Column<AssistantData>[] = useMemo(
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
        Cell: ({ value }) =>
          userRole === "Администратор" && (
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
    [handleRowClick, userRole]
  );

  return (
    <div className={styles.main}>
      {isLoading ? (
        <div className={styles.loaderWrapper}>
          <div className={styles.loader}></div>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <div className={styles.header}>
              <h3>
                Ассистенты <span>({assistantsData.length})</span>
              </h3>
            </div>
            <Table columns={columns} data={assistantsData} />
          </div>

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
        </>
      )}
    </div>
  );
};

export default Monitoring;

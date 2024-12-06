"use client";

import { useMemo } from "react";
import { Column } from "react-table";
import styles from "./Monitoring.module.css";
import { RegularAssistantData } from "./useAssistantsData";
import { BlockedAssistantData } from "./useBlockedAssistantsData";
import { FaEnvelope } from "react-icons/fa";

interface UseRegularColumnsProps {
  handleRowClick: (telegramId: string) => void;
  setCurrentAssistantTelegramId: (id: string) => void;
  setIsPopupOpen: (val: boolean) => void;
}

export function useRegularColumns({
  handleRowClick,
  setCurrentAssistantTelegramId,
  setIsPopupOpen
}: UseRegularColumnsProps) {
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

  return columns;
}

interface UseBlockedColumnsProps {
  openConfirmUnblock: (telegramId: string) => void;
}

export function useBlockedColumns({ openConfirmUnblock }: UseBlockedColumnsProps) {
  const columns: Column<BlockedAssistantData>[] = useMemo(() => [
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
              openConfirmUnblock(row.original.telegramId);
            }}
          >
            Разблокировать
          </button>
        ),
    },
  ], [openConfirmUnblock]);

  return columns;
}

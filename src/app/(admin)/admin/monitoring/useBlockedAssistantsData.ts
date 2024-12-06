"use client";

import { useState, useEffect } from "react";

export interface BlockedAssistantData {
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

export function useBlockedAssistantsData() {
  const [blockedAssistants, setBlockedAssistants] = useState<BlockedAssistantData[]>([]);
  const [isBlockedLoading, setIsBlockedLoading] = useState(true);

  useEffect(() => {
    const fetchBlockedAssistants = async () => {
      try {
        const response = await fetch("/api/get-blocked-assistants", {
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          throw new Error("Ошибка загрузки заблокированных ассистентов");
        }

        const data = await response.json();
        setBlockedAssistants(data);
      } catch (error) {
        console.error("Ошибка при получении заблокированных ассистентов:", error);
      } finally {
        setIsBlockedLoading(false);
      }
    };

    fetchBlockedAssistants();
  }, []);

  return { blockedAssistants, isBlockedLoading };
}

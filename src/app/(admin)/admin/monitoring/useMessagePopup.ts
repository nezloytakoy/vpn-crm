"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseMessagePopupProps {
  onSendMessage: (message: string, chatId: string) => Promise<void>;
}

export function useMessagePopup({ onSendMessage }: UseMessagePopupProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [currentAssistantTelegramId, setCurrentAssistantTelegramId] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = useCallback(async () => {
    try {
      if (!currentAssistantTelegramId) {
        console.error("Ошибка: telegramId ассистента не установлен");
        return;
      }

      await onSendMessage(popupMessage, currentAssistantTelegramId);
      setIsPopupOpen(false);
      setPopupMessage("");
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
    }
  }, [onSendMessage, popupMessage, currentAssistantTelegramId]);

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

  return {
    isPopupOpen,
    setIsPopupOpen,
    popupMessage,
    setPopupMessage,
    currentAssistantTelegramId,
    setCurrentAssistantTelegramId,
    popupRef,
    handleSendMessage,
  };
}

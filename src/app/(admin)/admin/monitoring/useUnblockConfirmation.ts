"use client";

import { useState } from "react";

interface UseUnblockConfirmationProps {
  onUnblock: (telegramId: string) => Promise<void>;
}

export function useUnblockConfirmation({ onUnblock }: UseUnblockConfirmationProps) {
  const [isConfirmUnblockOpen, setIsConfirmUnblockOpen] = useState(false);
  const [selectedUnblockTelegramId, setSelectedUnblockTelegramId] = useState<string | null>(null);

  const openConfirmUnblock = (telegramId: string) => {
    setSelectedUnblockTelegramId(telegramId);
    setIsConfirmUnblockOpen(true);
  };

  const handleConfirmUnblock = async () => {
    if (selectedUnblockTelegramId) {
      await onUnblock(selectedUnblockTelegramId);
    }
    setIsConfirmUnblockOpen(false);
    setSelectedUnblockTelegramId(null);
  };

  const handleCancelUnblock = () => {
    setIsConfirmUnblockOpen(false);
    setSelectedUnblockTelegramId(null);
  };

  return {
    isConfirmUnblockOpen,
    openConfirmUnblock,
    handleConfirmUnblock,
    handleCancelUnblock
  };
}

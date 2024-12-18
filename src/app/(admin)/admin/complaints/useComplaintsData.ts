import { useState, useEffect } from "react";

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

export interface ComplaintData {
  complaintId: string;
  user: string;
  userId: string;
  assistant: string;
  assistantId: string;
}

export function useComplaintsData() {
  const [data, setData] = useState<ComplaintData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaints = async () => {
    try {
      const response = await fetch("/api/get-complaints");
      if (!response.ok) {
        throw new Error("Ошибка получения жалоб");
      }

      const complaintsData: Complaint[] = await response.json();

      const formattedData: ComplaintData[] = complaintsData.map((complaint) => ({
        complaintId: complaint.id,
        user: `@${complaint.userNickname}`,
        userId: complaint.userId,
        assistant: `@${complaint.assistantNickname}`,
        assistantId: complaint.assistantId,
      }));

      setData(formattedData);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error("Ошибка при получении данных:", error);
      setError("Не удалось загрузить жалобы. Пожалуйста, попробуйте снова позже.");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Начало загрузки жалоб...");
    fetchComplaints();

    const eventSource = new EventSource("/api/complaints-stream");

    eventSource.onmessage = (event) => {
      console.log("Получено SSE событие:", event.data);
      fetchComplaints();
    };

    eventSource.onerror = (error) => {
      console.error("SSE ошибка:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, fetchComplaints };
}

export interface ConversationLog {
    sender: "USER" | "ASSISTANT";
    message: string;
    timestamp: string;
  }
  
  export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString("en-GB", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  
  export function generateLogContent(conversationLogs: ConversationLog[]): string {
    return conversationLogs
      .map(
        (log) =>
          `${formatTimestamp(log.timestamp)}: ${log.sender} - ${log.message}`
      )
      .join("\n");
  }
  
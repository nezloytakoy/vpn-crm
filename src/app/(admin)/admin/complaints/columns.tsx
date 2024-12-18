import { Column } from "react-table";
import styles from "./Complaints.module.css";

export interface ComplaintData {
  complaintId: string;
  user: string;
  userId: string;
  assistant: string;
  assistantId: string;
}

export const columns: Array<Column<ComplaintData>> = [
  {
    Header: "Номер жалобы",
    accessor: "complaintId",
  },
  {
    Header: "Пользователь",
    accessor: "user",
    Cell: ({ row }: { row: { original: ComplaintData } }) => (
      <a
        href={`https://t.me/${row.original.user}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        {row.original.user}
      </a>
    ),
  },
  {
    Header: "ID Пользователя",
    accessor: "userId",
  },
  {
    Header: "Ассистент",
    accessor: "assistant",
    Cell: ({ row }: { row: { original: ComplaintData } }) => (
      <a
        href={`https://t.me/${row.original.assistant}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        {row.original.assistant}
      </a>
    ),
  },
  {
    Header: "ID Ассистента",
    accessor: "assistantId",
  },
];

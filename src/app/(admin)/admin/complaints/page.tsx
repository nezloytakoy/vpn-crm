import React from 'react';
import { Column } from 'react-table';
import styles from './Complaints.module.css';
import Table from '@/components/Table/Table';

function App() {
  const data = React.useMemo(
    () => [
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 213',
        user: '@username',
        userId: '2332323232',
        assistant: '@username',
        assistantId: '2332323232',
      },
    ],
    []
  );

  const columns = React.useMemo<
    Column<{
      complaint: string;
      user: string;
      userId: string;
      assistant: string;
      assistantId: string;
    }>[]
  >(
    () => [
      {
        Header: 'Жалоба',
        accessor: 'complaint' as const,
      },
      {
        Header: 'Пользователь',
        accessor: 'user' as const,
      },
      {
        Header: '',
        accessor: 'userId' as const,
      },
      {
        Header: 'Ассистент',
        accessor: 'assistant' as const,
      },
      {
        Header: '',
        accessor: 'assistantId' as const,
      },
    ],
    []
  );

  return (
    <div className={styles.main}>
      <div className={styles.tablebox}>
        <div className={styles.tableWrapper}>
          <div className={styles.header}>
            <h3>
              Жалобы на ассистентов <span>({data.length})</span>
            </h3>
          </div>
          <Table columns={columns} data={data} />
        </div>
      </div>
    </div>
  );
}

export default App;

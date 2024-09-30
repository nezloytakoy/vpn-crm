import React from 'react';
import { useTable, Column } from 'react-table';
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
        complaint: 'Номер 22',
        user: '@username',
        userId: '676543',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 4565',
        user: '@username',
        userId: '2222333',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 3433',
        user: '@username',
        userId: '4343443',
        assistant: '@username',
        assistantId: '2332323232',
      },
      {
        complaint: 'Номер 4444',
        user: ' @username',
        userId: '987654',
        assistant: '@username',
        assistantId: '2332323232',
      },
    ],
    []
  );

  const columns = React.useMemo<Column<{ complaint: string; user: string; userId: string; assistant: string; assistantId: string; }>[]>( 
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
        <Table columns={columns} data={data} />
      </div>
    </div>
  );
}

export default App;

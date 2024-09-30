'use client';

import React from 'react';
import { useTable, Column } from 'react-table';
import styles from './Table.module.css';

interface TableProps<T extends object> {
    columns: Column<T>[];
    data: T[];
}

const Table = <T extends object>({ columns, data }: TableProps<T>) => {
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable<T>({
        columns,
        data,
    });

    return (
        <div className={styles.tableWrapper}>
            <div className={styles.header}>
                <h3>Жалобы на ассистентов <span>(5)</span></h3>
            </div>
            <table {...getTableProps()} className={styles.taskTable}>
                <thead>
                    {headerGroups.map((headerGroup, index) => (
                        <React.Fragment key={index}>
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map((column, columnIndex) => (
                                    <th
                                        {...column.getHeaderProps()}
                                        className={styles.th}
                                    >
                                        {column.render('Header')}
                                    </th>
                                ))}
                            </tr>
                        </React.Fragment>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map((row, rowIndex) => {
                        prepareRow(row);
                        return (
                            <React.Fragment key={rowIndex}>
                                <tr {...row.getRowProps()}>
                                    {row.cells.map((cell, cellIndex) => (
                                        <td
                                            {...cell.getCellProps()}
                                            className={styles.td}
                                        >
                                            {cell.render('Cell')}
                                        </td>
                                    ))}
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default Table;

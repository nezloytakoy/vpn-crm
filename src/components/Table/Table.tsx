/* eslint-disable react/jsx-key */

'use client';

import React, { useRef, useEffect } from 'react';
import {
  useTable,
  usePagination,
  Column,
  TableInstance,
  TableState,
  UsePaginationInstanceProps,
  UsePaginationState,
} from 'react-table';
import {
  FaAngleDoubleLeft,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleRight,
} from 'react-icons/fa';
import styles from './Table.module.css';

interface TableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
}

type TableStateWithPagination<T extends object> = TableState<T> & UsePaginationState<T>;

type TableInstanceWithPagination<T extends object> = TableInstance<T> &
  UsePaginationInstanceProps<T> & {
    state: TableStateWithPagination<T>;
  };

const Table = <T extends object>({ columns, data }: TableProps<T>) => {
  const instance = useTable<T>(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
      } as Partial<TableStateWithPagination<T>>,
    },
    usePagination
  ) as TableInstanceWithPagination<T>;

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = instance;

  // Create refs for the table and the wrapper
  const tableRef = useRef<HTMLTableElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Update the height of the wrapper when the page changes
  useEffect(() => {
    if (tableRef.current && wrapperRef.current) {
      const tableHeight = tableRef.current.getBoundingClientRect().height;
      wrapperRef.current.style.height = `${tableHeight}px`;
    }
  }, [page]);

  return (
    <>
      {/* Wrap the table in a container with class 'animatedTableWrapper' and add a ref */}
      <div className={styles.animatedTableWrapper} ref={wrapperRef}>
        <div className={styles.scrollableTableWrapper}>
          {/* Add ref to the table */}
          <table {...getTableProps()} className={styles.taskTable} ref={tableRef}>
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th {...column.getHeaderProps()} className={styles.th}>
                      {column.render('Header')}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map((cell) => (
                      <td {...cell.getCellProps()} className={styles.td}>
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.pagination}>
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          <FaAngleDoubleLeft />
        </button>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          <FaAngleLeft />
        </button>
        <span>
          Страница{' '}
          <strong>
            {pageIndex + 1} из {pageOptions.length}
          </strong>
        </span>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          <FaAngleRight />
        </button>
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          <FaAngleDoubleRight />
        </button>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[5, 10, 20, 30, 40, 50].map((size) => (
            <option key={size} value={size}>
              Показать {size}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default Table;


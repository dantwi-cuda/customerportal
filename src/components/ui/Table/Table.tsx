import classNames from 'classnames'
import React from 'react'
import type { ComponentPropsWithRef, ElementType, ReactNode } from 'react'

export interface ColumnType<T = any> {
    title: string | ReactNode
    dataIndex?: string
    key: string
    render?: (value: any, record: T, index: number) => ReactNode
    [key: string]: any
}

export interface TableProps<T = any> extends ComponentPropsWithRef<'table'> {
    asElement?: ElementType
    cellBorder?: boolean
    compact?: boolean
    hoverable?: boolean
    overflow?: boolean
    // Add dataSource and columns props
    dataSource?: T[]
    columns?: ColumnType<T>[]
    rowKey?: string | ((record: T) => string)
    loading?: boolean
    emptyText?: ReactNode
}

const Table = <T extends object = any>(props: TableProps<T>) => {
    // Use table tag directly instead of dynamic component to ensure stability
    // This removes the asElement feature but fixes the React error
    const {
        // Remove asElement from destructuring
        cellBorder,
        children,
        className,
        compact = false,
        hoverable = true,
        overflow = true,
        dataSource = [],
        columns = [],
        rowKey = 'key',
        loading = false,
        emptyText = 'No data',
        ...rest
    } = props

    const tableClass = classNames(
        'table-default', // Always use table-default since we're using a table element
        hoverable && 'table-hover',
        compact && 'table-compact',
        cellBorder && 'table-border',
        className,
    )

    // Generate rows from dataSource and columns if provided
    const renderTableContent = () => {
        if (children) {
            return children
        }

        if (loading) {
            return (
                <tbody>
                    <tr>
                        <td
                            colSpan={columns.length}
                            className="text-center py-4"
                        >
                            Loading...
                        </td>
                    </tr>
                </tbody>
            )
        }

        if (dataSource.length === 0) {
            return (
                <tbody>
                    <tr>
                        <td
                            colSpan={columns.length}
                            className="text-center py-4"
                        >
                            {emptyText}
                        </td>
                    </tr>
                </tbody>
            )
        }

        return (
            <>
                <thead>
                    <tr>
                        {columns.map((column, index) => (
                            <th key={column.key || index}>{column.title}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {dataSource.map((record, rowIndex) => {
                        const key =
                            typeof rowKey === 'function'
                                ? rowKey(record)
                                : (record[rowKey as keyof T] as string)

                        return (
                            <tr key={key || rowIndex}>
                                {columns.map((column, colIndex) => {
                                    const cellValue = column.dataIndex
                                        ? record[column.dataIndex as keyof T]
                                        : undefined

                                    return (
                                        <td key={column.key || colIndex}>
                                            {column.render
                                                ? column.render(
                                                      cellValue,
                                                      record,
                                                      rowIndex,
                                                  )
                                                : (cellValue as ReactNode)}
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </>
        )
    }

    return (
        <div className={classNames(overflow && 'overflow-x-auto')}>
            {loading && (
                <div className="p-4 flex justify-center">Loading...</div>
            )}
            <table className={tableClass} {...rest}>
                {renderTableContent()}
            </table>
        </div>
    )
}

export default Table

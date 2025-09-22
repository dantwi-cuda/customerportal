import React, { useState, useEffect, useMemo } from 'react'
import {
    Table,
    Avatar,
    Checkbox,
    Input,
    Pagination,
    Button,
} from '@/components/ui'
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table'
import type { UserDto } from '@/@types/user'
import UserService from '@/services/UserService'
import {
    HiOutlineSearch,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
} from 'react-icons/hi'

const { Tr, Th, Td, THead, TBody } = Table

interface UserTableProps {
    selectedUserIds: string[]
    onUserSelectionChange: (selectedIds: string[]) => void
}

const UserTable: React.FC<UserTableProps> = ({
    selectedUserIds,
    onUserSelectionChange,
}) => {
    const [users, setUsers] = useState<UserDto[]>([])
    const [loading, setLoading] = useState(true)
    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState<SortingState>([])

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true)
            try {
                const response = await UserService.getUsers()
                setUsers(response)
            } catch (error) {
                console.error('Error fetching users:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [])

    const columns: ColumnDef<UserDto>[] = useMemo(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                ),
            },
            {
                header: 'User',
                accessorKey: 'name',
                cell: ({ row }) => {
                    const user = row.original
                    return (
                        <div className="flex items-center">
                            <Avatar size="sm" shape="circle" />
                            <span className="ml-2 rtl:mr-2 capitalize">
                                {user.name}
                            </span>
                        </div>
                    )
                },
            },
            {
                header: 'Email',
                accessorKey: 'email',
            },
        ],
        [],
    )

    const table = useReactTable({
        data: users,
        columns,
        state: {
            sorting,
            globalFilter,
            rowSelection: selectedUserIds.reduce(
                (acc, id) => {
                    const userIndex = users.findIndex((u) => u.id === id)
                    if (userIndex > -1) {
                        acc[userIndex] = true
                    }
                    return acc
                },
                {} as Record<string, boolean>,
            ),
        },
        enableRowSelection: true,
        onRowSelectionChange: (updater) => {
            const selectedRows =
                typeof updater === 'function'
                    ? updater(table.getState().rowSelection)
                    : updater
            const selectedIndexes = Object.keys(selectedRows).filter(
                (index) => selectedRows[index],
            )
            const userIds = selectedIndexes
                .map((index) => users[parseInt(index, 10)]?.id)
                .filter(Boolean) as string[]
            onUserSelectionChange(userIds)
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    })

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGlobalFilter(e.target.value)
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <Input
                    size="sm"
                    placeholder="Search users..."
                    prefix={<HiOutlineSearch className="text-lg" />}
                    value={globalFilter}
                    onChange={onInputChange}
                    className="max-w-xs"
                />
                {selectedUserIds.length > 0 && (
                    <div className="text-sm text-gray-600">
                        {selectedUserIds.length} user(s) selected
                    </div>
                )}
            </div>
            <Table loading={loading}>
                <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <Th key={header.id} colSpan={header.colSpan}>
                                    {header.isPlaceholder ? null : (
                                        <div
                                            {...{
                                                className:
                                                    header.column.getCanSort()
                                                        ? 'cursor-pointer select-none'
                                                        : '',
                                                onClick:
                                                    header.column.getToggleSortingHandler(),
                                            }}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                        </div>
                                    )}
                                </Th>
                            ))}
                        </Tr>
                    ))}
                </THead>
                <TBody>
                    {table.getRowModel().rows.map((row) => (
                        <Tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <Td key={cell.id}>
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext(),
                                    )}
                                </Td>
                            ))}
                        </Tr>
                    ))}
                </TBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                        Showing{' '}
                        {table.getState().pagination.pageIndex *
                            table.getState().pagination.pageSize +
                            1}{' '}
                        to{' '}
                        {Math.min(
                            (table.getState().pagination.pageIndex + 1) *
                                table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length,
                        )}{' '}
                        of {table.getFilteredRowModel().rows.length} users
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="default"
                        icon={<HiOutlineChevronLeft />}
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-gray-700">
                        Page {table.getState().pagination.pageIndex + 1} of{' '}
                        {table.getPageCount()}
                    </span>
                    <Button
                        size="sm"
                        variant="default"
                        icon={<HiOutlineChevronRight />}
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default UserTable

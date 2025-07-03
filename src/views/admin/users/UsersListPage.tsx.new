// filepath: c:\work\customerportal\src\views\admin\users\UsersListPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import {
    Card,
    Input,
    Button,
    Tag,
    Dropdown,
    Menu,
    Dialog,
    Select,
    Badge,
    Notification,
    toast,
} from '@/components/ui'
import Table from '@/components/ui/Table'
import {
    HiOutlineSearch,
    HiOutlinePencilAlt,
    HiOutlineTrash,
    HiOutlineDotsVertical,
    HiOutlinePlus,
    HiOutlineFilter,
} from 'react-icons/hi'
import UserService from '@/services/UserService'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { UserDto, UserFilterParams } from '@/@types/user'
import useAuth from '@/auth/useAuth'
import { ADMIN } from '@/constants/roles.constant'

// Simple Space component to replace the missing Space component from UI library
const Space = ({ children }: { children: React.ReactNode }) => {
    return <div className="flex items-center gap-2">{children}</div>
}

const UsersListPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [users, setUsers] = useState<UserDto[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [filters, setFilters] = useState<UserFilterParams>({})
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const [userToDelete, setUserToDelete] = useState<UserDto | null>(null)

    // Check if current user has admin permission
    const hasAdminPermission = user?.authority?.includes(ADMIN)

    useEffect(() => {
        fetchUsers()
    }, [filters])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            console.log('Fetching users with filters:', filters)
            const data = await UserService.getUsers(filters)
            console.log('Fetched users:', data)
            setUsers(data)
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch users
                </Notification>,
            )
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Debounced search handler to prevent too many API calls
    const handleSearch = useCallback((value: string) => {
        setSearchText(value)

        // Use a timeout to debounce the API call
        const timeoutId = setTimeout(() => {
            // If search term is empty, just reset to using regular filters
            if (!value.trim()) {
                setFilters((prev) => ({
                    ...prev,
                    searchTerm: undefined
                }))
                return
            }
            
            // If there's a search term, use the dedicated search endpoint
            setLoading(true)
            UserService.searchUsers(value)
                .then((data) => {
                    setUsers(data)
                })
                .catch((error) => {
                    toast.push(
                        <Notification title="Error" type="danger" duration={3000}>
                            Failed to search users
                        </Notification>
                    )
                    console.error(error)
                })
                .finally(() => {
                    setLoading(false)
                })
        }, 300) // 300ms debounce time

        // Clear timeout on component unmount or when function is called again
        return () => clearTimeout(timeoutId)
    }, [])

    // Server-side filtering via searchTerm in filters; use fetched users directly

    const handleEdit = (userId: string) => {
        navigate('/admin/users/edit/' + userId)
    }

    const confirmDelete = (user: UserDto) => {
        setUserToDelete(user)
        setDeleteModalVisible(true)
    }

    const handleDelete = async () => {
        if (!userToDelete?.id) return

        try {
            await UserService.deleteUser(userToDelete.id)
            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    User deleted successfully
                </Notification>,
            )
            fetchUsers()
            setDeleteModalVisible(false)
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to delete user
                </Notification>,
            )
            console.error(error)
        }
    }

    const handleCreateUser = () => {
        navigate('/admin/users/create')
    }

    const handleFilterChange = (filterUpdate: Partial<UserFilterParams>) => {
        setFilters({ ...filters, ...filterUpdate })
    }

    const renderBooleanTag = (value: boolean) => {
        if (value === true) {
            return <Tag>Yes</Tag>
        } else {
            return <Tag>No</Tag>
        }
    }

    // No longer needed, but kept for reference
    const renderUserType = (user: UserDto) => {
        // Fix user type display by checking the actual properties that come from the API
        if (!user) {
            return <Tag>Unknown</Tag>
        }

        // Use direct property access (not strict === true comparison)
        if (user.isCCIUser && user.isCustomerUser) {
            return <Tag>Both</Tag>
        } else if (user.isCCIUser) {
            return <Tag>CCI User</Tag>
        } else if (user.isCustomerUser) {
            return <Tag>Customer User</Tag>
        }
        return <Tag>Unknown</Tag>
    }

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, user: UserDto) => (
                <div className="flex items-center">
                    <span className="font-semibold">{name}</span>
                </div>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'CCI User',
            key: 'isCCIUser',
            render: (_: any, user: UserDto) =>
                user
                    ? renderBooleanTag(user.isCCIUser || false)
                    : renderBooleanTag(false),
        },
        {
            title: 'Customer User',
            key: 'isCustomerUser',
            render: (_: any, user: UserDto) =>
                user
                    ? renderBooleanTag(user.isCustomerUser || false)
                    : renderBooleanTag(false),
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, user: UserDto) => {
                if (!user) {
                    return <Badge className="bg-gray-500">Unknown</Badge>
                }

                const status = user.status || 'Unknown'
                const color =
                    status === 'Active'
                        ? 'bg-emerald-500'
                        : status === 'Inactive'
                          ? 'bg-red-500'
                          : 'bg-gray-500'

                return <Badge className={color}>{status}</Badge>
            },
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) =>
                date ? dayjs(date).format('MM/DD/YYYY') : 'N/A',
        },
        {
            title: 'Last Login',
            dataIndex: 'lastLoginAt',
            key: 'lastLoginAt',
            render: (date: string) =>
                date ? dayjs(date).format('MM/DD/YYYY') : 'Never',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, user: UserDto) => (
                <div
                    className="flex gap-2"
                    style={{ zIndex: 5, position: 'relative' }}
                >
                    <Button
                        shape="circle"
                        variant="plain"
                        size="sm"
                        icon={<HiOutlinePencilAlt />}
                        onClick={(e: any) => {
                            e.stopPropagation()
                            handleEdit(user.id as string)
                        }}
                        disabled={!hasAdminPermission}
                        className="action-btn"
                    />
                    <Dropdown
                        placement="bottom-end"
                        trigger="click"
                        renderTitle={
                            <Button
                                shape="circle"
                                variant="plain"
                                size="sm"
                                icon={<HiOutlineDotsVertical />}
                                disabled={!hasAdminPermission}
                                className="action-btn"
                            />
                        }
                    >
                        {/* Using a custom Menu to avoid Menu.Item issues */}
                        <div className="min-w-[130px] py-1">
                            <div
                                className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-red-500 flex items-center gap-2"
                                onClick={(e: any) => {
                                    e.stopPropagation()
                                    confirmDelete(user)
                                }}
                            >
                                <HiOutlineTrash />
                                <span>Delete</span>
                            </div>
                        </div>
                    </Dropdown>
                </div>
            ),
        },
    ] // Determine which columns to show based on user role
    const getFilteredColumns = () => {
        // Create a copy of columns
        const filteredColumns = [...columns]

        // If user is not admin, remove the CCIUser and CustomerUser columns
        if (!hasAdminPermission) {
            return filteredColumns.filter(
                (column) =>
                    column.key !== 'isCCIUser' &&
                    column.key !== 'isCustomerUser',
            )
        }

        return filteredColumns
    }

    return (
        <div>
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3>User Management</h3>
                    {hasAdminPermission && (
                        <Button
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={handleCreateUser}
                        >
                            Add User
                        </Button>
                    )}
                </div>
                <Card>
                    <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between">
                        <Input
                            placeholder="Search users..."
                            prefix={<HiOutlineSearch className="text-lg" />}
                            onChange={(e) => handleSearch(e.target.value)}
                            onKeyDown={(e) => {
                                // Trigger search on Enter key
                                if (e.key === 'Enter') {
                                    if (!searchText.trim()) return
                                    setLoading(true)
                                    UserService.searchUsers(searchText)
                                        .then((data) => {
                                            setUsers(data)
                                        })
                                        .catch((error) => {
                                            toast.push(
                                                <Notification title="Error" type="danger" duration={3000}>
                                                    Failed to search users
                                                </Notification>
                                            )
                                            console.error(error)
                                        })
                                        .finally(() => {
                                            setLoading(false)
                                        })
                                }
                            }}
                            value={searchText}
                        />
                        <div className="flex gap-2">
                            {hasAdminPermission && (
                                <Select
                                    placeholder="User Type"
                                    options={[
                                        { value: 'all', label: 'All Users' },
                                        { value: 'cci', label: 'CCI Users' },
                                        {
                                            value: 'customer',
                                            label: 'Customer Users',
                                        },
                                    ]}
                                    onChange={(value: any) => {
                                        if (value?.value === 'all') {
                                            // Keep search term when showing all users
                                            setFilters(() => ({
                                                searchTerm: undefined,
                                                isCCIUser: undefined,
                                                isCustomerUser: undefined,
                                            }))
                                        } else if (value?.value === 'cci') {
                                            setFilters(() => ({
                                                searchTerm: undefined,
                                                isCCIUser: true,
                                                isCustomerUser: undefined,
                                            }))
                                        } else if (
                                            value?.value === 'customer'
                                        ) {
                                            setFilters(() => ({
                                                searchTerm: undefined,
                                                isCustomerUser: true,
                                                isCCIUser: undefined,
                                            }))
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                    <Table
                        columns={getFilteredColumns()}
                        dataSource={users}
                        loading={loading}
                        rowKey={(record) => record.id || record.email}
                    />
                </Card>
            </div>

            <Dialog
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <div className="px-6 py-4">
                    <p>
                        Are you sure you want to delete the user:{' '}
                        <strong>{userToDelete?.name}</strong>?
                    </p>
                    <p className="mt-2 text-red-500">
                        This action cannot be undone.
                    </p>
                </div>
                <div className="flex justify-end gap-2 px-6 py-3 border-t">
                    <Button onClick={() => setDeleteModalVisible(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        color="red-500"
                        onClick={handleDelete}
                        loading={loading}
                    >
                        Delete
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default UsersListPage

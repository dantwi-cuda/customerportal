import React, {
    useState,
    useEffect,
    useCallback,
    ChangeEvent,
    useMemo,
} from 'react' // Added useMemo
import { Button } from '@/components/ui/Button'
import {
    Input,
    Pagination,
    Select,
    Card,
    Notification,
    toast,
} from '@/components/ui' // Corrected Input import, Added Pagination, Select, Card, Notification, toast
import { HiPlusCircle, HiOutlineSearch } from 'react-icons/hi'
import TenantUsersTable from './components/TenantUsersTable'
import UserService from '@/services/UserService'
import { UserDto } from '@/@types/user'
import { Loading } from '@/components/shared'
import useAuth from '@/auth/useAuth'
import { useNavigate } from 'react-router-dom'

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 / page' },
    { value: 20, label: '20 / page' },
    { value: 50, label: '50 / page' },
    { value: 100, label: '100 / page' },
]

const UserManagementPage = () => {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<UserDto[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('') // Added for debouncing
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

    const { user } = useAuth()
    const navigate = useNavigate()

    const tenantId = user?.tenantId // Updated to use optional chaining

    // Effect for debouncing search term
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 300) // 300ms delay

        return () => {
            clearTimeout(timerId)
        }
    }, [searchTerm])

    const fetchUsers = useCallback(async () => {
        if (!tenantId) {
            setLoading(false)
            setUsers([])
            toast.push(
                <Notification title="Warning" type="warning" duration={3000}>
                    Tenant ID is not available, cannot fetch users.
                </Notification>,
            )
            return
        }
        setLoading(true)
        try {
            // Assuming UserService.getUsers can be filtered by tenantId or a specific method exists
            // For now, keeping the client-side filter as per original logic, but ideally, this should be a backend capability.
            const allUsers = await UserService.getUsers({
                // Potential future enhancement: pass tenantId to service if API supports it
                // tenantId: tenantId,
                isCustomerUser: true, // Keep this if it's a relevant filter
            })
            // Filter by tenantId on the client side if not done by the service
            const tenantUsers = allUsers.filter((u) => u.tenantId === tenantId)
            setUsers(tenantUsers)
        } catch (error) {
            console.error('Failed to fetch users:', error)
            setUsers([])
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch users.
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [tenantId]) // Removed user from dependency array as only tenantId from it is used.

    useEffect(() => {
        if (tenantId) {
            fetchUsers()
        } else {
            setLoading(false)
            // Notification for missing tenantId is handled in fetchUsers
        }
    }, [fetchUsers, tenantId])

    const handleAddUser = () => {
        navigate('/tenantportal/tenant/users/create')
    }

    const handleEditUser = (userToEdit: UserDto) => {
        navigate(`/tenantportal/tenant/users/edit/${userToEdit.id}`)
    }

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await UserService.deleteUser(userId)
                toast.push(
                    <Notification title="Success" type="success">
                        User deleted
                    </Notification>,
                )
                fetchUsers() // Refresh the list
            } catch (error) {
                console.error('Failed to delete user:', error)
                toast.push(
                    <Notification title="Error" type="danger">
                        Failed to delete user
                    </Notification>,
                )
            }
        }
    }

    const handleAssignShops = (user: UserDto) => {
        console.log('🔴 handleAssignShops called - navigating to assign-shops')
        navigate(`/tenantportal/tenant/users/assign-shops/${user.id}`)
    }

    const handleAssignReports = (user: UserDto) => {
        console.log(
            '🟢 handleAssignReports called - navigating to assign-reports',
        )
        navigate(`/tenantportal/tenant/users/assign-reports/${user.id}`)
    }

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    }

    const filteredUsers = useMemo(() => {
        if (!debouncedSearchTerm.trim()) {
            return users
        }
        return users.filter(
            (u) =>
                (u.name &&
                    u.name
                        .toLowerCase()
                        .includes(debouncedSearchTerm.toLowerCase())) ||
                (u.email &&
                    u.email
                        .toLowerCase()
                        .includes(debouncedSearchTerm.toLowerCase())),
        )
    }, [users, debouncedSearchTerm])

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return filteredUsers.slice(start, end)
    }, [filteredUsers, currentPage, pageSize])

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handlePageSizeChange = (selectedOption: any) => {
        if (selectedOption) {
            setPageSize(selectedOption.value)
            setCurrentPage(1) // Reset to first page
        }
    }

    useEffect(() => {
        setCurrentPage(1) // Reset to page 1 when search term or page size changes
    }, [debouncedSearchTerm, pageSize])

    if (!tenantId && !loading) {
        return (
            <div className="p-4">
                <Notification
                    title="Missing Tenant Info"
                    type="warning"
                    closable
                >
                    Tenant information is not available. Cannot display user
                    management.
                </Notification>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">User Management</h2>
                <div className="flex items-center">
                    <Input
                        prefix={<HiOutlineSearch className="text-lg" />}
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="mr-4"
                    />
                    <Button
                        variant="solid"
                        icon={<HiPlusCircle />}
                        onClick={handleAddUser}
                    >
                        Add User
                    </Button>
                </div>{' '}
            </div>
            <Card>
                {loading ? (
                    <Loading loading={true} />
                ) : (
                    <>
                        <TenantUsersTable
                            users={paginatedUsers} // Use paginatedUsers
                            onEdit={handleEditUser}
                            onDelete={handleDeleteUser}
                            onAssignShops={handleAssignShops}
                            onAssignReports={handleAssignReports}
                        />
                        {filteredUsers.length > 0 && (
                            <div className="flex justify-between items-center mt-4">
                                <Pagination
                                    currentPage={currentPage}
                                    total={filteredUsers.length}
                                    pageSize={pageSize}
                                    onChange={handlePageChange}
                                />
                                <div className="min-w-[120px]">
                                    <Select
                                        size="sm"
                                        options={PAGE_SIZE_OPTIONS}
                                        value={PAGE_SIZE_OPTIONS.find(
                                            (option) =>
                                                option.value === pageSize,
                                        )}
                                        onChange={handlePageSizeChange}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    )
}

export default UserManagementPage

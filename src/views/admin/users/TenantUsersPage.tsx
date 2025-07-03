import { useState, useEffect } from 'react'
import { Card, Button, Table, Input, Select } from '@/components/ui'
import { HiSearch, HiPlus, HiFilter } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import { getTenantUsers } from '@/services/UserService'
import type { TenantUser } from '@/@types/user'

const { Tr, Th, Td, THead, TBody } = Table

const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'active':
                return 'bg-emerald-100 text-emerald-600'
            case 'inactive':
                return 'bg-gray-100 text-gray-600'
            case 'pending':
                return 'bg-amber-100 text-amber-600'
            default:
                return 'bg-blue-100 text-blue-600'
        }
    }

    return (
        <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    )
}

const TenantUsersPage = () => {
    const [users, setUsers] = useState<TenantUser[]>([])
    const [loading, setLoading] = useState(true)
    const [searchText, setSearchText] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    const navigate = useNavigate()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true)
                const data = await getTenantUsers()
                setUsers(data)
            } catch (error) {
                console.error('Failed to fetch tenant users:', error)
                // In a real app, show an error notification here
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    // Apply filters
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase())

        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        const matchesStatus =
            statusFilter === 'all' || user.status === statusFilter

        return matchesSearch && matchesRole && matchesStatus
    })

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Users</h1>
                <Button
                    variant="solid"
                    icon={<HiPlus />}
                    onClick={() => navigate('/app/users/create')}
                >
                    Add User
                </Button>
            </div>

            <Card>
                <div className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <Input
                            prefix={<HiSearch className="text-lg" />}
                            placeholder="Search users..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="md:w-64"
                        />
                        <div className="flex gap-3 items-center ml-0 md:ml-auto">
                            <HiFilter className="text-lg text-gray-400" />
                            <Select
                                size="sm"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="min-w-[120px]"
                            >
                                <option value="all">All Roles</option>
                                <option value="User">User</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin</option>
                            </Select>
                            <Select
                                size="sm"
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                                className="min-w-[140px]"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </Select>
                        </div>
                    </div>

                    <Table>
                        <THead>
                            <Tr>
                                <Th>Name</Th>
                                <Th>Email</Th>
                                <Th>Role</Th>
                                <Th>Status</Th>
                                <Th>Last Login</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {loading ? (
                                <Tr>
                                    <Td
                                        colSpan={6}
                                        className="text-center py-5"
                                    >
                                        Loading users...
                                    </Td>
                                </Tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <Tr key={user.id}>
                                        <Td>{user.name}</Td>
                                        <Td>{user.email}</Td>
                                        <Td>{user.role}</Td>
                                        <Td>
                                            <StatusBadge status={user.status} />
                                        </Td>
                                        <Td>
                                            {user.lastLogin
                                                ? new Date(
                                                      user.lastLogin,
                                                  ).toLocaleDateString()
                                                : 'Never'}
                                        </Td>
                                        <Td>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="xs"
                                                    onClick={() =>
                                                        navigate(
                                                            `/app/users/edit/${user.id}`,
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    variant="plain"
                                                >
                                                    Reset Password
                                                </Button>
                                            </div>
                                        </Td>
                                    </Tr>
                                ))
                            ) : (
                                <Tr>
                                    <Td
                                        colSpan={6}
                                        className="text-center py-5"
                                    >
                                        No users found matching your criteria
                                    </Td>
                                </Tr>
                            )}
                        </TBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}

export default TenantUsersPage

import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Table,
    Notification,
    toast,
    Spinner,
    Input,
    Avatar,
    Dialog,
    Select,
} from '@/components/ui'
import RoleService from '@/services/RoleService'
import UserService from '@/services/UserService'
import { useNavigate, useParams } from 'react-router-dom'
import type { RoleDto } from '@/@types/role'
import type { UserDto } from '@/@types/user'
import { HiOutlineSearch, HiOutlinePlus, HiOutlineX } from 'react-icons/hi'

interface Option {
    value: string;
    label: string;
}

const RoleUsersPage = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [role, setRole] = useState<RoleDto | null>(null)
    const [users, setUsers] = useState<UserDto[]>([])
    const [roleUsers, setRoleUsers] = useState<UserDto[]>([])
    const [searchText, setSearchText] = useState('')
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
    const [availableUsers, setAvailableUsers] = useState<UserDto[]>([])

    useEffect(() => {
        if (id) {
            fetchRole(id)
            fetchUsers()
        }
    }, [id])

    // Filter role users when users or role changes
    useEffect(() => {
        if (role && users.length > 0) {
            const userIds = role.userIds || []
            console.log('Role user IDs:', userIds)
            console.log('Available users:', users.map(u => ({id: u.id, name: u.name})))
            
            // Make sure we're only including users with valid IDs that match the role's userIds
            const usersInRole = users.filter((user) => 
                user.id && userIds.includes(user.id)
            )
            
            console.log('Filtered users in role:', usersInRole)
            setRoleUsers(usersInRole)

            // Set available users (users not already in this role)
            const usersNotInRole = users.filter(
                (user) => user.id && !userIds.includes(user.id)
            )
            setAvailableUsers(usersNotInRole)
        }
    }, [role, users])

    const fetchRole = async (roleId: string) => {
        try {
            setLoading(true)
            const data = await RoleService.getRole(roleId)
            console.log('Fetched role data:', data)
            setRole(data)
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch role details
                </Notification>
            )
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const data = await UserService.getUsers()
            console.log('All users fetched:', data)
            if (Array.isArray(data)) {
                setUsers(data)
            } else {
                console.error('User data is not an array:', data)
                setUsers([])
                toast.push(
                    <Notification title="Warning" type="warning" duration={3000}>
                        User data format is incorrect
                    </Notification>
                )
            }
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch users
                </Notification>
            )
            console.error('Error fetching users:', error)
        }
    }

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const filteredRoleUsers = roleUsers.filter(
        (user) =>
            user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchText.toLowerCase()),
    )

    const handleRemoveUser = async (userId: string) => {
        if (!id) return

        try {
            setSaving(true)
            await RoleService.removeUserFromRole(id, userId)

            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    User removed from role
                </Notification>
            )

            fetchRole(id) // Refresh role data
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to remove user from role
                </Notification>
            )
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const handleAddUser = async () => {
        if (!id || !selectedUser) return

        try {
            setSaving(true)
            await RoleService.assignUserToRole(id, selectedUser)

            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    User added to role
                </Notification>
            )

            setAddUserDialogOpen(false)
            setSelectedUser(null)
            fetchRole(id) // Refresh role data
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to add user to role
                </Notification>
            )
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    if (loading || !role) {
        return (
            <div className="flex items-center justify-center h-80">
                <Spinner size={40} />
            </div>
        )
    }

    const columns = [
        {
            title: 'User',
            dataIndex: 'id',
            key: 'user',
            render: (id: string, record: UserDto) => {
                // Now we're explicitly accessing the user record from the table data
                return (
                    <div className="flex items-center">
                        <Avatar
                            size={30}
                            shape="circle"
                            className="mr-2"
                            icon={(record.name && record.name.charAt(0)) || '?'}
                        />
                        <div>
                            <div className="font-semibold">
                                {record.name || 'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {record.email || 'No email'}
                            </div>
                        </div>
                    </div>
                )
            },
        },
        {
            title: 'Type',
            dataIndex: 'id',
            key: 'type',
            render: (id: string, record: UserDto) => {
                if (record.isCCIUser && record.isCustomerUser) {
                    return 'Both'
                } else if (record.isCCIUser) {
                    return 'CCI Staff'
                } else if (record.isCustomerUser) {
                    return 'Customer'
                }
                return 'Unknown'
            },
        },
        {
            title: 'Actions',
            dataIndex: 'id',
            key: 'actions',
            render: (id: string, record: UserDto) => {
                if (!id) return null

                return (
                    <Button
                        shape="circle"
                        variant="plain"
                        size="sm"
                        icon={<HiOutlineX />}
                        onClick={() => handleRemoveUser(id)}
                        loading={saving}
                        title="Remove user from role"
                    />
                )
            },
        },
    ]

    const userSelectOptions = availableUsers.map((user) => ({
        value: user.id as string,
        label: `${user.name || 'Unknown'} (${user.email || 'No email'})`,
    }))

    return (
        <div>
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3>Manage Users: {role.name}</h3>
                    <div className="flex gap-2">
                        <Button onClick={() => navigate('/admin/roles')}>
                            Back to Roles
                        </Button>
                    </div>
                </div>

                <Card className="mb-4">
                    <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between">
                        <Input
                            placeholder="Search users..."
                            prefix={<HiOutlineSearch className="text-lg" />}
                            onChange={(e) => handleSearch(e.target.value)}
                            value={searchText}
                        />
                        <Button
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={() => setAddUserDialogOpen(true)}
                            disabled={availableUsers.length === 0}
                        >
                            Add User to Role
                        </Button>
                    </div>

                    <Table
                        columns={columns}
                        dataSource={filteredRoleUsers}
                        rowKey="id"
                        emptyText="No users assigned to this role"
                    />
                </Card>
            </div>
            
            <Dialog
                isOpen={addUserDialogOpen}
                onClose={() => setAddUserDialogOpen(false)}
                onRequestClose={() => setAddUserDialogOpen(false)}
                contentClassName="max-w-md"
                width={500}
            >
                <h4>Add User to Role</h4>
                <h5>
                    Select a user to add to the <strong>{role.name}</strong>{' '}
                    role
                </h5>
                
                <div className="my-4">
                    <Select<Option, false>
                        placeholder="Select user"
                        options={userSelectOptions}
                        value={selectedUser ? userSelectOptions.find(o => o.value === selectedUser) : null}
                        onChange={(option) => {
                            const selectedOption = option as Option;
                            setSelectedUser(selectedOption?.value || null);
                        }}
                    />
                </div>
                <div className="text-right mt-6">
                    <Button
                        className="mr-2"
                        onClick={() => setAddUserDialogOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        onClick={handleAddUser}
                        disabled={!selectedUser}
                        loading={saving}
                    >
                        Add User
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default RoleUsersPage

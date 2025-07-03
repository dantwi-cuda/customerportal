import React, { useState, useEffect, useCallback } from 'react'
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
import RoleService, {
    assignUsersToRole,
    removeUsersFromRole,
} from '@/services/RoleService' // Import specific functions
import UserService from '@/services/UserService'
import { useNavigate, useParams } from 'react-router-dom'
import type { RoleDto } from '@/@types/role'
import type { UserDto } from '@/@types/user'
import { HiOutlineSearch, HiOutlinePlus, HiOutlineX } from 'react-icons/hi'
import useAuth from '@/auth/useAuth' // Added useAuth

interface Option {
    value: string
    label: string
}

const RoleUsersPage = () => {
    const navigate = useNavigate()
    const { roleId: id } = useParams<{ roleId: string }>() // Correctly get roleId and assign to id
    const { user: authUser } = useAuth() // Renamed to authUser to avoid conflict

    const [loading, setLoading] = useState(false)
    const [roleLoading, setRoleLoading] = useState(true) // Separate loading for role
    const [usersLoading, setUsersLoading] = useState(true) // Separate loading for users
    const [saving, setSaving] = useState(false)
    const [role, setRole] = useState<RoleDto | null>(null)
    const [allTenantUsers, setAllTenantUsers] = useState<UserDto[]>([]) // All users for the tenant
    const [roleUsers, setRoleUsers] = useState<UserDto[]>([]) // Users currently in the role
    const [searchText, setSearchText] = useState('')
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
    const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<
        string | null
    >(null) // Store ID directly
    const [availableUsersForAdding, setAvailableUsersForAdding] = useState<
        UserDto[]
    >([]) // Users not in role
    const [error, setError] = useState<string | null>(null)

    const fetchRoleDetails = useCallback(
        async (roleId: string) => {
            if (!authUser) {
                setError('User not authenticated.')
                setRoleLoading(false)
                return
            }
            setRoleLoading(true)
            setError(null)
            try {
                const data = await RoleService.getRole(roleId)
                if (!data) {
                    throw new Error('Role data is empty or undefined.')
                }

                // Enhanced logging for debugging (keep these)
                console.log(
                    'RoleUsersPage: AuthUser for check:',
                    JSON.stringify(authUser, null, 2),
                )
                console.log(
                    'RoleUsersPage: Role data for check (data):',
                    JSON.stringify(data, null, 2),
                )

                // Debug actual string representation of both IDs
                const authTenantIdStr = String(authUser?.tenantId || '')
                const roleTenantIdStr = String(data?.tenantId || '')
                console.log(
                    'DEBUG TENANT IDS - Auth:',
                    authTenantIdStr,
                    'Role:',
                    roleTenantIdStr,
                    'Equal?:',
                    authTenantIdStr === roleTenantIdStr,
                )

                // Define system role names (ideally from constants)
                const SYSTEM_TENANT_ADMIN_NAME = 'Tenant-Admin'
                const SYSTEM_TENANT_USER_NAME = 'Tenant-User'

                const isSystemRoleByName =
                    data.name === SYSTEM_TENANT_ADMIN_NAME ||
                    data.name === SYSTEM_TENANT_USER_NAME
                let canManageThisRoleUsers = false

                if (authUser?.tenantId) {
                    // User must be a tenant-scoped user (e.g., tenant admin)

                    // Scenario 1: Managing users for a global system role
                    if (isSystemRoleByName && data.tenantId === null) {
                        canManageThisRoleUsers = true
                        console.log(
                            'Access granted: System role with null tenantId',
                        )
                    }
                    // Scenario 2: Managing users for a role specifically scoped to this user's tenant
                    // IMPORTANT: Convert both to strings for comparison to avoid type mismatches
                    else if (
                        data.tenantId &&
                        String(data.tenantId) === String(authUser.tenantId)
                    ) {
                        canManageThisRoleUsers = true
                        console.log(
                            'Access granted: tenantId match',
                            String(data.tenantId),
                            '===',
                            String(authUser.tenantId),
                        )
                    }
                    // Debug for the case where we're denying access
                    else if (data.tenantId) {
                        console.log(
                            "Access denied reason: tenantIds don't match -",
                            'data.tenantId type:',
                            typeof data.tenantId,
                            'authUser.tenantId type:',
                            typeof authUser.tenantId,
                            'data.tenantId:',
                            data.tenantId,
                            'authUser.tenantId:',
                            authUser.tenantId,
                        )
                    }
                }

                if (!canManageThisRoleUsers) {
                    console.error(
                        `RoleUsersPage: Access Denied. AuthUser TenantID: ${authUser?.tenantId}, Role TenantID: ${data.tenantId}, Role Name: ${data.name}`,
                    )
                    toast.push(
                        <Notification
                            title="Access Denied"
                            type="danger"
                            duration={3000}
                        >
                            You do not have permission to manage users for this
                            role.
                        </Notification>,
                    )
                    navigate('/tenantportal/tenant/roles')
                    setRoleLoading(false)
                    return
                }

                setRole(data)
            } catch (err) {
                console.error('Error fetching role details:', err)
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to fetch role details.'
                setError(errorMessage)
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        {errorMessage}
                    </Notification>,
                )
            } finally {
                setRoleLoading(false)
            }
        },
        [authUser, navigate],
    )

    const fetchTenantUsers = useCallback(async () => {
        if (!authUser?.tenantId) {
            setUsersLoading(false)
            setAllTenantUsers([])
            return
        }
        setUsersLoading(true)
        try {
            const numericTenantId = parseInt(authUser.tenantId, 10)
            if (isNaN(numericTenantId)) {
                throw new Error('Invalid Tenant ID format.')
            }
            const users = await UserService.getUsers({
                tenantId: numericTenantId,
                type: 'TENANT',
            })
            setAllTenantUsers(Array.isArray(users) ? users : [])
        } catch (err) {
            console.error('Error fetching tenant users:', err)
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch users for this tenant.'
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    {errorMessage}
                </Notification>,
            )
            setAllTenantUsers([])
        } finally {
            setUsersLoading(false)
        }
    }, [authUser])

    useEffect(() => {
        if (id) {
            fetchRoleDetails(id)
            fetchTenantUsers()
        }
    }, [id, fetchRoleDetails, fetchTenantUsers])

    // Update roleUsers and availableUsersForAdding when role or allTenantUsers changes
    useEffect(() => {
        if (role && allTenantUsers.length >= 0) {
            // Allow empty allTenantUsers
            const roleUserIds = role.userIds || []
            const currentRoleUsers = allTenantUsers.filter(
                (user) => user.id && roleUserIds.includes(user.id),
            )
            const usersNotInRole = allTenantUsers.filter(
                (user) => user.id && !roleUserIds.includes(user.id),
            )

            setRoleUsers(currentRoleUsers)
            setAvailableUsersForAdding(usersNotInRole)
        }
    }, [role, allTenantUsers])

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const filteredRoleUsers = roleUsers.filter(
        (user) =>
            user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchText.toLowerCase()),
    )

    const handleRemoveUser = async (userIdToRemove: string) => {
        if (!id || !role || !authUser?.tenantId) return

        // Authorization check:
        // Allow if it's a system role (role.tenantId is null) OR if it's a custom role and tenantIds match.
        if (
            role.tenantId !== null &&
            String(role.tenantId) !== authUser.tenantId
        ) {
            toast.push(
                <Notification title="Access Denied" type="danger">
                    Cannot modify users for this role (mismatching tenant or not
                    a system role).
                </Notification>,
            )
            return
        }

        setSaving(true)
        try {
            await removeUsersFromRole(id, [userIdToRemove]) // Use imported function
            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    User removed from role successfully.
                </Notification>,
            )
            // Re-fetch role details to update userIds, which will trigger useEffect to update lists
            fetchRoleDetails(id)
        } catch (err) {
            console.error('Error removing user from role:', err)
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to remove user.'
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    {errorMessage}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleAddUserToRole = async () => {
        if (!id || !selectedUserIdToAdd || !role || !authUser?.tenantId) return

        // Authorization check:
        // Allow if it's a system role (role.tenantId is null) OR if it's a custom role and tenantIds match.
        if (
            role.tenantId !== null &&
            String(role.tenantId) !== authUser.tenantId
        ) {
            toast.push(
                <Notification title="Access Denied" type="danger">
                    Cannot modify users for this role (mismatching tenant or not
                    a system role).
                </Notification>,
            )
            return
        }

        setSaving(true)
        try {
            await assignUsersToRole(id, [selectedUserIdToAdd]) // Use imported function
            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    User added to role successfully.
                </Notification>,
            )
            setAddUserDialogOpen(false)
            setSelectedUserIdToAdd(null)
            fetchRoleDetails(id) // Re-fetch role details
        } catch (err) {
            console.error('Error adding user to role:', err)
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to add user.'
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    {errorMessage}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    // Combined loading state
    useEffect(() => {
        setLoading(roleLoading || usersLoading)
    }, [roleLoading, usersLoading])

    if (loading) {
        // General loading for initial setup
        return (
            <div className="flex items-center justify-center h-80">
                <Spinner size={40} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4">
                <Notification type="danger" title="Error">
                    {error}
                </Notification>
                <Button
                    className="mt-4"
                    onClick={() => navigate('/tenantportal/tenant/roles')}
                >
                    Back to Roles List
                </Button>
            </div>
        )
    }

    if (!role) {
        // If role is null after loading and no error (e.g. auth redirect)
        return (
            <div className="p-4 text-center">
                <p>Role not found or access denied.</p>
                <Button
                    className="mt-4"
                    onClick={() => navigate('/tenantportal/tenant/roles')}
                >
                    Back to Roles List
                </Button>
            </div>
        )
    }

    const columns: any[] = [
        {
            title: 'User',
            dataIndex: 'name',
            key: 'user',
            render: (_: any, record: UserDto) => {
                return (
                    <div className="flex items-center">
                        <Avatar
                            size={30}
                            shape="circle"
                            className="mr-2"
                            icon={
                                record.name?.charAt(0) ||
                                record.email?.charAt(0) ||
                                '?'
                            }
                        />
                        <div>
                            <div className="font-semibold">
                                {record.name || 'Unnamed User'}
                            </div>
                            <div className="text-xs text-gray-500">
                                {record.email || 'No email provided'}
                            </div>
                        </div>
                    </div>
                )
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: any) => status || 'N/A',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: UserDto) => {
                if (!record.id) return null
                return (
                    <Button
                        shape="circle"
                        variant="plain"
                        size="sm"
                        icon={<HiOutlineX />}
                        onClick={() => handleRemoveUser(record.id!)}
                        loading={saving} // Consider a specific loading state for this row if many users
                        title="Remove user from role"
                        disabled={saving}
                    />
                )
            },
        },
    ]

    const userSelectOptions = availableUsersForAdding.map((u) => ({
        value: u.id as string,
        label: `${u.name || 'Unnamed User'} (${u.email || 'No email'})`,
    }))

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                    Manage Users for Role: {role.name}
                </h3>
                <Button onClick={() => navigate('/tenantportal/tenant/roles')}>
                    Back to Roles List
                </Button>
            </div>

            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
                        <Input
                            className="max-w-sm"
                            placeholder="Search users in this role..."
                            prefix={<HiOutlineSearch className="text-lg" />}
                            onChange={(e) => handleSearch(e.target.value)}
                            value={searchText}
                        />
                        <Button
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={() => setAddUserDialogOpen(true)}
                            disabled={
                                usersLoading ||
                                availableUsersForAdding.length === 0
                            }
                        >
                            Add User to Role
                        </Button>
                    </div>

                    {usersLoading && !roleUsers.length ? (
                        <div className="text-center p-4">
                            <Spinner /> <p>Loading users...</p>
                        </div>
                    ) : (
                        <Table
                            dataSource={filteredRoleUsers}
                            columns={columns}
                            rowKey="id"
                            loading={saving}
                            emptyText={
                                searchText
                                    ? 'No users match your search.'
                                    : 'No users are currently assigned to this role.'
                            }
                        />
                    )}
                </div>
            </Card>

            <Dialog
                isOpen={addUserDialogOpen}
                onClose={() => setAddUserDialogOpen(false)}
                onRequestClose={() => setAddUserDialogOpen(false)}
                shouldCloseOnOverlayClick={!saving}
                contentClassName="max-w-md"
            >
                <h4 className="mb-4 text-lg font-semibold">Add User to Role</h4>{' '}
                {/* Manual title */}
                <div className="p-1">
                    <p className="mb-4">
                        Select a user to add to the <strong>{role.name}</strong>{' '}
                        role.
                    </p>
                    <Select
                        placeholder="Select a user..."
                        options={userSelectOptions}
                        value={userSelectOptions.find(
                            (opt) => opt.value === selectedUserIdToAdd,
                        )}
                        onChange={(option) =>
                            setSelectedUserIdToAdd(option ? option.value : null)
                        }
                        isDisabled={
                            saving ||
                            usersLoading ||
                            userSelectOptions.length === 0
                        }
                    />
                    {userSelectOptions.length === 0 && !usersLoading && (
                        <p className="text-sm text-gray-500 mt-2">
                            All available tenant users are already in this role
                            or no other users exist in this tenant.
                        </p>
                    )}
                    <div className="text-right mt-6">
                        <Button
                            className="mr-2"
                            onClick={() => setAddUserDialogOpen(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            onClick={handleAddUserToRole}
                            loading={saving}
                            disabled={!selectedUserIdToAdd || saving}
                        >
                            Add User
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default RoleUsersPage

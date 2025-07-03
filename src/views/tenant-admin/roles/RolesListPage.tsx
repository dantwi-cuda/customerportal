import React, { useState, useEffect } from 'react'
import {
    Card,
    Table,
    Input,
    Button,
    Tag,
    Dropdown,
    Menu,
    Dialog,
    Badge,
    Notification,
    toast,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePencilAlt,
    HiOutlineTrash,
    HiOutlineDotsVertical,
    HiOutlinePlus,
    HiOutlineUserGroup,
    HiOutlineLockClosed,
} from 'react-icons/hi'
import RoleService from '@/services/RoleService'
import { useNavigate } from 'react-router-dom'
import type { RoleDto } from '@/@types/role'
import useAuth from '@/auth/useAuth'

// Simple Space component to replace the missing Space component from UI library
const Space = ({ children }: { children: React.ReactNode }) => {
    return <div className="flex items-center gap-2">{children}</div>
}

const RolesListPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [roles, setRoles] = useState<RoleDto[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const [roleToDelete, setRoleToDelete] = useState<RoleDto | null>(null)

    // Tenant admin check: User must have a tenantId to manage tenant roles
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        // Fetch roles only if user is a tenant admin (has a tenantId)
        if (isTenantAdmin && user?.tenantId) {
            fetchRoles()
        }
    }, [user]) // Re-fetch if user object changes (e.g., after login)

    const fetchRoles = async () => {
        if (!user?.tenantId) {
            setRoles([]) // Clear roles if no tenantId
            // Optionally, show a more permanent message if this state persists
            return
        }
        try {
            setLoading(true)
            const numericTenantId = parseInt(user.tenantId, 10)
            if (isNaN(numericTenantId)) {
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Invalid Tenant ID format.
                    </Notification>,
                )
                setRoles([])
                setLoading(false)
                return
            }
            // Fetch roles for the current tenant and of type TENANT
            const data = await RoleService.getRoles({
                tenantId: numericTenantId,
                type: 'TENANT',
            })
            console.log('Fetched tenant roles:', data)
            // Ensure data is an array before setting roles
            setRoles(Array.isArray(data) ? data : [])
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch roles
                </Notification>,
            )
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (value: string) => {
        setSearchText(value)
    }

    const filteredRoles = roles.filter((role) =>
        role.name?.toLowerCase().includes(searchText.toLowerCase()),
    )

    const handleEdit = (roleId: string) => {
        navigate(`/tenantportal/tenant/roles/edit/${roleId}`)
    }

    const handleManagePermissions = (roleId: string) => {
        console.log(
            'RolesListPage: handleManagePermissions called for roleId:',
            roleId,
        )
        console.log(
            'RolesListPage: authUser state at time of handleManagePermissions:',
            JSON.stringify(user, null, 2),
        )
        navigate(`/tenantportal/tenant/roles/permissions/${roleId}`)
    }

    const handleManageUsers = (roleId: string) => {
        console.log(
            'RolesListPage: handleManageUsers called for roleId:',
            roleId,
        )
        console.log(
            'RolesListPage: authUser state at time of handleManageUsers:',
            JSON.stringify(user, null, 2),
        )
        navigate(`/tenantportal/tenant/roles/users/${roleId}`)
    }

    const confirmDelete = (role: RoleDto) => {
        const currentUserIsIndeedTenantAdmin = isTenantAdmin && user?.tenantId
        const roleIsSystem =
            role.name === 'Tenant-User' || role.name === 'Tenant-Admin'

        const tenantIdsMatchForDelete =
            role.tenantId !== null &&
            user?.tenantId != null &&
            String(role.tenantId) === String(user.tenantId) // Compare as strings

        const canActuallyDeleteThisRole =
            currentUserIsIndeedTenantAdmin &&
            tenantIdsMatchForDelete &&
            !roleIsSystem

        if (canActuallyDeleteThisRole) {
            setRoleToDelete(role)
            setDeleteModalVisible(true)
        } else {
            toast.push(
                <Notification
                    title="Access Denied"
                    type="danger"
                    duration={3000}
                >
                    You do not have permission to delete this role, or this role
                    type cannot be deleted.
                </Notification>,
            )
        }
    }

    const handleDelete = async () => {
        if (!roleToDelete?.id) return

        try {
            await RoleService.deleteRole(roleToDelete.id)
            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    Role deleted successfully
                </Notification>,
            )
            fetchRoles()
            setDeleteModalVisible(false)
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to delete role
                </Notification>,
            )
            console.error(error)
        }
    }

    const handleCreateRole = () => {
        navigate('/tenantportal/tenant/roles/create') // Corrected path
    }

    const columns = [
        {
            title: 'Role Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => (
                <div className="font-semibold">{name}</div>
            ),
        },
        {
            title: 'Permissions',
            key: 'permissions',
            render: (cellValue: any, role: RoleDto) => (
                <Tag className="bg-blue-100 text-blue-600 border-blue-100">
                    {role?.permissions?.length || 0} Permissions
                </Tag>
            ),
        },
        {
            title: 'Assigned Users',
            key: 'users',
            render: (cellValue: any, role: RoleDto) => (
                <Tag className="bg-green-100 text-green-600 border-green-100">
                    {role?.userIds?.length || 0} Users
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (cellValue: any, role: RoleDto) => {
                // console.log(
                //     'Inspecting role object for actions:',
                //     JSON.stringify(role),
                // ) // Debugging line, can be removed

                const isCurrentUserTenantAdmin = isTenantAdmin && user?.tenantId

                const isSystemRole =
                    role.name === 'Tenant-User' || role.name === 'Tenant-Admin'

                // Check if the role is a custom role belonging to the current user's tenant
                const tenantIdsMatch =
                    role.tenantId !== null &&
                    user?.tenantId != null && // Ensure user.tenantId is not null/undefined before String()
                    String(role.tenantId) === String(user.tenantId) // Compare as strings

                const isCustomRoleOfCurrentTenant =
                    isCurrentUserTenantAdmin && // Ensures user.tenantId is valid and user is admin
                    tenantIdsMatch && // Ensures role.tenantId is valid and matches user's
                    !isSystemRole // Ensures it's not a system role

                const canEdit = isCustomRoleOfCurrentTenant && !!role?.id
                const canManagePermissions =
                    isCustomRoleOfCurrentTenant && !!role?.id
                const canDelete = isCustomRoleOfCurrentTenant && !!role?.id

                // Tenant admins can manage users for their custom roles AND for system tenant roles.
                const canManageUsers =
                    isCurrentUserTenantAdmin &&
                    role?.id &&
                    (isCustomRoleOfCurrentTenant || isSystemRole)

                return (
                    <Space>
                        <Button
                            shape="circle"
                            variant="plain"
                            size="sm"
                            icon={<HiOutlinePencilAlt />}
                            onClick={() => role?.id && handleEdit(role.id)}
                            disabled={!canEdit}
                        />
                        <Dropdown
                            placement="bottom-end"
                            title={
                                <Button
                                    shape="circle"
                                    variant="plain"
                                    size="sm"
                                    icon={<HiOutlineDotsVertical />}
                                    disabled={!isTenantAdmin} // General dropdown disable if not tenant admin
                                />
                            }
                        >
                            <Dropdown.Item
                                eventKey="permissions"
                                onClick={() =>
                                    role?.id && handleManagePermissions(role.id)
                                }
                                disabled={!canManagePermissions}
                            >
                                <span className="flex items-center gap-2">
                                    <HiOutlineLockClosed />
                                    <span>Manage Permissions</span>
                                </span>
                            </Dropdown.Item>
                            <Dropdown.Item
                                eventKey="users"
                                onClick={() =>
                                    role?.id && handleManageUsers(role.id)
                                }
                                disabled={!canManageUsers}
                            >
                                <span className="flex items-center gap-2">
                                    <HiOutlineUserGroup />
                                    <span>Manage Users</span>
                                </span>
                            </Dropdown.Item>
                            <Dropdown.Item
                                eventKey="delete"
                                onClick={() => confirmDelete(role)}
                                disabled={!canDelete}
                            >
                                <span className="text-red-500 flex items-center gap-2">
                                    <HiOutlineTrash />
                                    <span>Delete</span>
                                </span>
                            </Dropdown.Item>
                        </Dropdown>
                    </Space>
                )
            },
        },
    ]

    return (
        <div>
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3>Tenant Role Management</h3>
                    {isTenantAdmin && (
                        <Button
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={handleCreateRole}
                        >
                            Create Tenant Role
                        </Button>
                    )}
                </div>
                <Card>
                    <div className="mb-4">
                        <Input
                            placeholder="Search roles..."
                            prefix={<HiOutlineSearch className="text-lg" />}
                            onChange={(e) => handleSearch(e.target.value)}
                            value={searchText}
                        />
                    </div>
                    <Table
                        columns={columns}
                        dataSource={filteredRoles}
                        loading={loading}
                        rowKey="id"
                    />
                </Card>
            </div>

            <Dialog
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
            >
                <div className="px-6 py-4">
                    <h5>Confirm Delete</h5>
                    <p>
                        Are you sure you want to delete the role:{' '}
                        <strong>{roleToDelete?.name}</strong>?
                    </p>
                    <p className="mt-2 text-red-500">
                        This action cannot be undone. All users assigned to this
                        role will lose the associated permissions.
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

export default RolesListPage

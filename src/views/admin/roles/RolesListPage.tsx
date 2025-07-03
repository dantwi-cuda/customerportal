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
import { ADMIN } from '@/constants/roles.constant'

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

    // Check if current user has admin permission
    const hasAdminPermission = user?.authority?.includes(ADMIN)

    useEffect(() => {
        fetchRoles()
    }, [])

    const fetchRoles = async () => {
        try {
            setLoading(true)
            const data = await RoleService.getRoles()
            console.log('Fetched roles:', data) // Important: Check this log in your browser console
            setRoles(Array.isArray(data) ? data : []) // Ensure data is an array
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
        navigate(`/admin/roles/edit/${roleId}`)
    }

    const handleManagePermissions = (roleId: string) => {
        navigate(`/admin/roles/permissions/${roleId}`)
    }

    const handleManageUsers = (roleId: string) => {
        navigate(`/admin/roles/users/${roleId}`)
    }

    const confirmDelete = (role: RoleDto) => {
        setRoleToDelete(role)
        setDeleteModalVisible(true)
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
        navigate('/admin/roles/create')
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
            render: (cellValue: any, role: RoleDto) => (
                <Space>
                    <Button
                        shape="circle"
                        variant="plain"
                        size="sm"
                        icon={<HiOutlinePencilAlt />}
                        onClick={() => role?.id && handleEdit(role.id)}
                        disabled={!hasAdminPermission || !role?.id}
                    />
                    <Dropdown
                        placement="bottom-end"
                        title={
                            <Button
                                shape="circle"
                                variant="plain"
                                size="sm"
                                icon={<HiOutlineDotsVertical />}
                                disabled={!hasAdminPermission}
                            />
                        }
                    >
                        <Dropdown.Item
                            eventKey="permissions"
                            onClick={() =>
                                role?.id && handleManagePermissions(role.id)
                            }
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
                        >
                            <span className="flex items-center gap-2">
                                <HiOutlineUserGroup />
                                <span>Manage Users</span>
                            </span>
                        </Dropdown.Item>
                        <Dropdown.Item
                            eventKey="delete"
                            onClick={() => confirmDelete(role)}
                        >
                            <span className="text-red-500 flex items-center gap-2">
                                <HiOutlineTrash />
                                <span>Delete</span>
                            </span>
                        </Dropdown.Item>
                    </Dropdown>
                </Space>
            ),
        },
    ]

    return (
        <div>
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3>Role Management</h3>
                    {hasAdminPermission && (
                        <Button
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={handleCreateRole}
                        >
                            Create Role
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

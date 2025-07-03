import React, { useState, useEffect } from 'react'
import {
    Card,
    Tabs,
    Button,
    Notification,
    toast,
    Spinner,
    Alert,
    Table,
    Avatar,
    Select,
    Dialog,
    Input,
} from '@/components/ui'
import { useNavigate, useParams } from 'react-router-dom'
import { TbArrowNarrowLeft, TbPlus, TbX } from 'react-icons/tb'
import { HiOutlineSearch } from 'react-icons/hi'
import * as ReportService from '@/services/ReportService'
import UserService from '@/services/UserService'
import RoleService from '@/services/RoleService'
import { ReportCategory } from '@/@types/report'
import { UserDto } from '@/@types/user'
import { RoleDto } from '@/@types/role'
import useAuth from '@/auth/useAuth'

interface Option {
    value: string
    label: string
}

const { TabNav, TabList, TabContent } = Tabs

const ReportCategoryAssignmentsPage = () => {
    const navigate = useNavigate()
    const { categoryId } = useParams<{ categoryId: string }>()
    const { user } = useAuth()

    const [category, setCategory] = useState<ReportCategory | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('users')

    // Users state
    const [assignedUsers, setAssignedUsers] = useState<UserDto[]>([])
    const [availableUsers, setAvailableUsers] = useState<UserDto[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [usersLoading, setUsersLoading] = useState(false)
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
    const [usersSaving, setUsersSaving] = useState(false)

    // Roles state
    const [assignedRoles, setAssignedRoles] = useState<RoleDto[]>([])
    const [availableRoles, setAvailableRoles] = useState<RoleDto[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
    const [rolesLoading, setRolesLoading] = useState(false)
    const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false)
    const [rolesSaving, setRolesSaving] = useState(false)

    const [searchText, setSearchText] = useState('')

    // Tenant admin check
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (categoryId && isTenantAdmin) {
            fetchCategoryDetails()
        }
    }, [categoryId, isTenantAdmin])

    const fetchCategoryDetails = async () => {
        setLoading(true)
        setError(null)
        try {
            if (!categoryId) {
                throw new Error('Category ID is required')
            }
            const categoryData = await ReportService.getCategoryById(
                parseInt(categoryId, 10),
            )
            setCategory(categoryData)

            // Load assignments based on the active tab
            if (activeTab === 'users') {
                fetchAssignedUsers()
            } else {
                fetchAssignedRoles()
            }
        } catch (error) {
            console.error('Error fetching category details:', error)
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unknown error occurred'
            setError(errorMessage)
            toast.push(
                <Notification type="danger" title="Error">
                    {errorMessage}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const fetchAssignedUsers = async () => {
        if (!categoryId || !user?.tenantId) return

        setUsersLoading(true)
        try {
            // Get all users for this tenant
            const allUsers = await UserService.getUsers({
                isCustomerUser: true,
            })
            const tenantUsers = allUsers.filter(
                (u) => u.tenantId === user?.tenantId,
            )

            // Get users assigned to this category
            const assignedUserIds = category?.assignedUserIds || []

            // Separate into assigned and available users
            const assigned: UserDto[] = []
            const available: UserDto[] = []

            tenantUsers.forEach((user) => {
                if (user.id && assignedUserIds.includes(user.id)) {
                    assigned.push(user)
                } else {
                    available.push(user)
                }
            })

            setAssignedUsers(assigned)
            setAvailableUsers(available)
        } catch (error) {
            console.error('Error fetching assigned users:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to load users
                </Notification>,
            )
        } finally {
            setUsersLoading(false)
        }
    }

    const fetchAssignedRoles = async () => {
        if (!categoryId || !user?.tenantId) return

        setRolesLoading(true)
        try {
            // Get all roles
            const allRoles = await RoleService.getRoles()

            // Filter to only tenant roles
            const tenantRoles = allRoles.filter(
                (role) =>
                    role.tenantId === null || // System roles
                    String(role.tenantId) === String(user?.tenantId), // Tenant-specific roles
            )

            // Get roles assigned to this category
            const assignedRoleNames = category?.assignedRoles || []

            // Separate into assigned and available roles
            const assigned: RoleDto[] = []
            const available: RoleDto[] = []

            tenantRoles.forEach((role) => {
                const roleName = role.name || role.id || ''
                if (assignedRoleNames.includes(roleName)) {
                    assigned.push(role)
                } else {
                    available.push(role)
                }
            })

            setAssignedRoles(assigned)
            setAvailableRoles(available)
        } catch (error) {
            console.error('Error fetching assigned roles:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to load roles
                </Notification>,
            )
        } finally {
            setRolesLoading(false)
        }
    }

    const handleTabChange = (tabKey: string) => {
        setActiveTab(tabKey)
        if (tabKey === 'users') {
            fetchAssignedUsers()
        } else {
            fetchAssignedRoles()
        }
    }

    const handleAddUser = async () => {
        if (!categoryId || !selectedUserId) return

        setUsersSaving(true)
        try {
            const currentUserIds = category?.assignedUserIds || []
            const updatedUserIds = [...currentUserIds, selectedUserId]

            await ReportService.assignUsersToCategory(
                parseInt(categoryId, 10),
                updatedUserIds,
            )

            toast.push(
                <Notification type="success" title="Success">
                    User assigned to category successfully
                </Notification>,
            )

            setAddUserDialogOpen(false)
            fetchAssignedUsers() // Refresh the list
        } catch (error) {
            console.error('Error assigning user:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to assign user
                </Notification>,
            )
        } finally {
            setUsersSaving(false)
            setSelectedUserId(null)
        }
    }

    const handleRemoveUser = async (userId: string) => {
        if (!categoryId) return

        setUsersSaving(true)
        try {
            const currentUserIds = category?.assignedUserIds || []
            const updatedUserIds = currentUserIds.filter((id) => id !== userId)

            await ReportService.assignUsersToCategory(
                parseInt(categoryId, 10),
                updatedUserIds,
            )

            toast.push(
                <Notification type="success" title="Success">
                    User removed from category successfully
                </Notification>,
            )

            fetchAssignedUsers() // Refresh the list
        } catch (error) {
            console.error('Error removing user:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to remove user
                </Notification>,
            )
        } finally {
            setUsersSaving(false)
        }
    }

    const handleAddRole = async () => {
        if (!categoryId || !selectedRoleId) return

        setRolesSaving(true)
        try {
            const currentRoles = category?.assignedRoles || []
            const updatedRoles = [...currentRoles, selectedRoleId]

            await ReportService.assignRolesToCategory(
                parseInt(categoryId, 10),
                updatedRoles,
            )

            toast.push(
                <Notification type="success" title="Success">
                    Role assigned to category successfully
                </Notification>,
            )

            setAddRoleDialogOpen(false)
            fetchAssignedRoles() // Refresh the list
        } catch (error) {
            console.error('Error assigning role:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to assign role
                </Notification>,
            )
        } finally {
            setRolesSaving(false)
            setSelectedRoleId(null)
        }
    }

    const handleRemoveRole = async (roleName: string) => {
        if (!categoryId) return

        setRolesSaving(true)
        try {
            const currentRoles = category?.assignedRoles || []
            const updatedRoles = currentRoles.filter(
                (name) => name !== roleName,
            )

            await ReportService.assignRolesToCategory(
                parseInt(categoryId, 10),
                updatedRoles,
            )

            toast.push(
                <Notification type="success" title="Success">
                    Role removed from category successfully
                </Notification>,
            )

            fetchAssignedRoles() // Refresh the list
        } catch (error) {
            console.error('Error removing role:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to remove role
                </Notification>,
            )
        } finally {
            setRolesSaving(false)
        }
    }

    const handleBackToList = () => {
        navigate('/tenantportal/tenant/report-categories')
    }

    // Filter users or roles based on search text
    const filteredUsers = assignedUsers.filter((user) => {
        const searchLower = searchText.toLowerCase()
        return (
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower)
        )
    })

    const filteredRoles = assignedRoles.filter((role) => {
        const searchLower = searchText.toLowerCase()
        return (
            role.name?.toLowerCase().includes(searchLower) ||
            role.description?.toLowerCase().includes(searchLower)
        )
    })

    // Select options for dialogs
    const userOptions: Option[] = availableUsers.map((user) => ({
        value: user.id as string,
        label: `${user.name || 'Unnamed User'} (${user.email || 'No email'})`,
    }))

    const roleOptions: Option[] = availableRoles.map((role) => ({
        value: role.name || role.id || '',
        label: `${role.name || role.id || ''} ${role.description ? `- ${role.description}` : ''}`,
    }))

    // Table columns
    const userColumns = [
        {
            title: 'User',
            dataIndex: 'name',
            render: (_: any, record: UserDto) => (
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
                            {record.email || 'No email'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (_: any, record: UserDto) => record.status || 'Active',
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            render: (_: any, record: UserDto) => (
                <Button
                    size="sm"
                    variant="plain"
                    color="red-600"
                    icon={<TbX />}
                    onClick={() => handleRemoveUser(record.id as string)}
                    loading={usersSaving}
                    disabled={usersSaving}
                >
                    Remove
                </Button>
            ),
        },
    ]

    const roleColumns = [
        {
            title: 'Role',
            dataIndex: 'name',
            render: (_: any, record: RoleDto) => (
                <div>
                    <div className="font-semibold">
                        {record.name || record.id || 'Unnamed Role'}
                    </div>
                    {record.description && (
                        <div className="text-xs text-gray-500">
                            {record.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            render: (_: any, record: RoleDto) =>
                record.tenantId ? 'Tenant Role' : 'System Role',
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            render: (_: any, record: RoleDto) => (
                <Button
                    size="sm"
                    variant="plain"
                    color="red-600"
                    icon={<TbX />}
                    onClick={() =>
                        handleRemoveRole(record.name || record.id || '')
                    }
                    loading={rolesSaving}
                    disabled={rolesSaving}
                >
                    Remove
                </Button>
            ),
        },
    ]

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size={40} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4">
                <Alert type="danger" title="Error" showIcon>
                    {error}
                </Alert>
                <Button
                    className="mt-4"
                    icon={<TbArrowNarrowLeft />}
                    onClick={handleBackToList}
                >
                    Back to Categories
                </Button>
            </div>
        )
    }

    if (!category) {
        return (
            <div className="p-4">
                <Alert type="warning" title="Category Not Found" showIcon>
                    The requested category was not found or you don't have
                    permission to manage its assignments.
                </Alert>
                <Button
                    className="mt-4"
                    icon={<TbArrowNarrowLeft />}
                    onClick={handleBackToList}
                >
                    Back to Categories
                </Button>
            </div>
        )
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <Card>
                <div className="p-4">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="text-lg font-semibold">
                                Manage Category Assignments
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Category: {category.name}
                            </p>
                        </div>
                        <Button
                            variant="plain"
                            icon={<TbArrowNarrowLeft />}
                            onClick={handleBackToList}
                        >
                            Back to Categories
                        </Button>
                    </div>

                    <Tabs
                        value={activeTab}
                        variant="segmented"
                        onChange={handleTabChange}
                    >
                        <TabList>
                            <TabNav value="users">Users</TabNav>
                            <TabNav value="roles">Roles</TabNav>
                        </TabList>

                        <div className="mt-4">
                            {/* Search and Add Controls */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <Input
                                        placeholder={`Search ${activeTab}...`}
                                        value={searchText}
                                        onChange={(e) =>
                                            setSearchText(e.target.value)
                                        }
                                        size="sm"
                                        prefix={<HiOutlineSearch />}
                                        className="w-64"
                                    />
                                </div>
                                <Button
                                    variant="solid"
                                    size="sm"
                                    icon={<TbPlus />}
                                    onClick={() => {
                                        if (activeTab === 'users') {
                                            setAddUserDialogOpen(true)
                                        } else {
                                            setAddRoleDialogOpen(true)
                                        }
                                    }}
                                >
                                    Add{' '}
                                    {activeTab === 'users' ? 'User' : 'Role'}
                                </Button>
                            </div>

                            <TabContent value="users">
                                <Table
                                    columns={userColumns}
                                    data={filteredUsers}
                                    loading={usersLoading}
                                />
                            </TabContent>

                            <TabContent value="roles">
                                <Table
                                    columns={roleColumns}
                                    data={filteredRoles}
                                    loading={rolesLoading}
                                />
                            </TabContent>
                        </div>
                    </Tabs>
                </div>
            </Card>

            {/* Add User Dialog */}
            <Dialog
                isOpen={addUserDialogOpen}
                onClose={() => {
                    setAddUserDialogOpen(false)
                    setSelectedUserId(null)
                }}
                contentClassName="max-w-md"
            >
                <h5 className="mb-4">Add User to Category</h5>
                <div className="mb-4">
                    <Select
                        placeholder="Select a user..."
                        options={userOptions}
                        value={userOptions.find(
                            (option) => option.value === selectedUserId,
                        )}
                        onChange={(option) =>
                            setSelectedUserId(option ? option.value : null)
                        }
                        isSearchable
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        onClick={() => {
                            setAddUserDialogOpen(false)
                            setSelectedUserId(null)
                        }}
                        disabled={usersSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        onClick={handleAddUser}
                        loading={usersSaving}
                        disabled={!selectedUserId || usersSaving}
                    >
                        Add User
                    </Button>
                </div>
            </Dialog>

            {/* Add Role Dialog */}
            <Dialog
                isOpen={addRoleDialogOpen}
                onClose={() => {
                    setAddRoleDialogOpen(false)
                    setSelectedRoleId(null)
                }}
                contentClassName="max-w-md"
            >
                <h5 className="mb-4">Add Role to Category</h5>
                <div className="mb-4">
                    <Select
                        placeholder="Select a role..."
                        options={roleOptions}
                        value={roleOptions.find(
                            (option) => option.value === selectedRoleId,
                        )}
                        onChange={(option) =>
                            setSelectedRoleId(option ? option.value : null)
                        }
                        isSearchable
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        onClick={() => {
                            setAddRoleDialogOpen(false)
                            setSelectedRoleId(null)
                        }}
                        disabled={rolesSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        onClick={handleAddRole}
                        loading={rolesSaving}
                        disabled={!selectedRoleId || rolesSaving}
                    >
                        Add Role
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default ReportCategoryAssignmentsPage

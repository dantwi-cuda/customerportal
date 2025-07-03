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
import WorkspaceService from '@/services/WorkspaceService'
import RoleService from '@/services/RoleService'
import UserService from '@/services/UserService'
import { useNavigate, useParams } from 'react-router-dom'
import type { WorkspaceDto } from '@/@types/workspace'
import type { RoleDto } from '@/@types/role'
import type { UserDto } from '@/@types/user'
import useAuth from '@/auth/useAuth'
import {
    HiOutlineSearch,
    HiOutlinePlus,
    HiOutlineX,
    HiOutlineCheck,
} from 'react-icons/hi'

interface Option {
    value: string
    label: string
}

const { TabNav, TabList, TabContent } = Tabs

const WorkspaceAssignmentsPage = () => {
    const navigate = useNavigate()
    const { workspaceId } = useParams<{ workspaceId: string }>()
    const { user } = useAuth()

    const [workspace, setWorkspace] = useState<WorkspaceDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('users')

    const [assignedUsers, setAssignedUsers] = useState<UserDto[]>([])
    const [availableUsers, setAvailableUsers] = useState<UserDto[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [usersLoading, setUsersLoading] = useState(false)
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
    const [usersSaving, setUsersSaving] = useState(false)

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
        if (workspaceId && isTenantAdmin) {
            fetchWorkspaceDetails()
        }
    }, [workspaceId, isTenantAdmin])

    const fetchWorkspaceDetails = async () => {
        setLoading(true)
        setError(null)
        try {
            if (!workspaceId) {
                throw new Error('Workspace ID is required')
            }

            const customerId = user?.tenantId
            if (!customerId) {
                throw new Error('User tenant ID is required')
            }

            // Get workspace basic details
            const workspaceData =
                await WorkspaceService.getWorkspace(workspaceId)
            setWorkspace(workspaceData) // Get workspace assignments to verify it's assigned to this tenant
            const assignments = await WorkspaceService.getWorkspaceAssignments()

            // Debug to identify the issue
            console.log('Workspace ID from route:', workspaceId)
            console.log('Workspace ID from API:', workspaceData.id)
            console.log(
                'Workspace workspaceId from API:',
                workspaceData.workspaceId,
            )

            // Find assignment matching this workspace and customer
            // Match against both workspace.id and workspace.workspaceId to be safe
            const tenantAssignment = assignments.find((a) => {
                return (
                    (String(a.workspaceId) === String(workspaceId) ||
                        String(a.workspaceId) === String(workspaceData.id)) &&
                    String(a.customerId) === String(customerId)
                )
            })

            if (!tenantAssignment) {
                throw new Error('This workspace is not assigned to your tenant')
            }

            // If we've made it this far, load the assignments based on the active tab
            if (activeTab === 'users') {
                fetchAssignedUsers()
            } else {
                fetchAssignedRoles()
            }
        } catch (error) {
            console.error('Error fetching workspace details:', error)
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
        if (!workspaceId || !user?.tenantId) return

        setUsersLoading(true)
        try {
            // In a real implementation, you would get users assigned to this workspace
            // This is a placeholder - adjust according to your actual API
            const numericTenantId = parseInt(user.tenantId, 10)

            // Get all users for this tenant
            const allUsers = await UserService.getUsers({
                tenantId: numericTenantId,
                type: 'TENANT',
            })

            // Get workspace users (you would need to implement this API)
            // For now, let's simulate this with a mock
            // In a real application, use an actual endpoint like:
            // const workspaceUsers = await UserService.getWorkspaceUsers(workspaceId)

            // For this sample, let's assume all users are available and none are assigned
            setAssignedUsers([])
            setAvailableUsers(allUsers || [])
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
        if (!workspaceId || !user?.tenantId) return

        setRolesLoading(true)
        try {
            // Get all roles for this tenant
            const allRoles = await RoleService.getRoles()

            // Filter to only tenant roles
            const tenantRoles = allRoles.filter(
                (role) =>
                    role.tenantId === null || // System roles
                    String(role.tenantId) === String(user?.tenantId), // Tenant-specific roles
            )

            // Get roles assigned to this workspace
            const workspaceRoleIds =
                await WorkspaceService.getWorkspaceRoles(workspaceId)

            // Separate into assigned and available roles
            const assigned: RoleDto[] = []
            const available: RoleDto[] = []

            tenantRoles.forEach((role) => {
                if (role.id && workspaceRoleIds.includes(role.id)) {
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
        if (!workspaceId || !selectedUserId) return

        setUsersSaving(true)
        try {
            // In a real implementation, call your API to assign a user to workspace
            // For example:
            // await UserService.assignUserToWorkspace(workspaceId, selectedUserId)

            toast.push(
                <Notification type="success" title="Success">
                    User assigned to workspace successfully
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
        if (!workspaceId) return

        setUsersSaving(true)
        try {
            // In a real implementation, call your API to unassign a user from workspace
            // For example:
            // await UserService.removeUserFromWorkspace(workspaceId, userId)

            toast.push(
                <Notification type="success" title="Success">
                    User removed from workspace successfully
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
        if (!workspaceId || !selectedRoleId) return

        setRolesSaving(true)
        try {
            await WorkspaceService.assignRoleToWorkspace(
                workspaceId,
                selectedRoleId,
            )

            toast.push(
                <Notification type="success" title="Success">
                    Role assigned to workspace successfully
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

    const handleRemoveRole = async (roleId: string) => {
        if (!workspaceId) return

        setRolesSaving(true)
        try {
            await WorkspaceService.removeRoleFromWorkspace(workspaceId, roleId)

            toast.push(
                <Notification type="success" title="Success">
                    Role removed from workspace successfully
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
        value: role.id as string,
        label: `${role.name} ${role.description ? `- ${role.description}` : ''}`,
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
                    shape="circle"
                    variant="plain"
                    size="sm"
                    icon={<HiOutlineX />}
                    onClick={() => record.id && handleRemoveUser(record.id)}
                    disabled={usersSaving}
                    title="Remove from workspace"
                />
            ),
        },
    ]

    const roleColumns = [
        {
            title: 'Role',
            dataIndex: 'name',
            render: (name: string, record: RoleDto) => (
                <div>
                    <div className="font-semibold">{name}</div>
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
                record.tenantId === null ? 'System' : 'Tenant',
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            render: (_: any, record: RoleDto) => (
                <Button
                    shape="circle"
                    variant="plain"
                    size="sm"
                    icon={<HiOutlineX />}
                    onClick={() => record.id && handleRemoveRole(record.id)}
                    disabled={rolesSaving}
                    title="Remove from workspace"
                />
            ),
        },
    ]

    if (loading && !workspace) {
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
                    onClick={() => navigate('/tenantportal/tenant/workspaces')}
                >
                    Back to Workspaces
                </Button>
            </div>
        )
    }

    if (!workspace) {
        return (
            <div className="p-4">
                <Alert type="warning" title="Workspace Not Found" showIcon>
                    The requested workspace was not found or you don't have
                    permission to manage it.
                </Alert>
                <Button
                    className="mt-4"
                    onClick={() => navigate('/tenantportal/tenant/workspaces')}
                >
                    Back to Workspaces
                </Button>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <h3 className="text-lg font-medium">
                        Workspace: {workspace.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                        Manage user and role assignments
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/tenantportal/tenant/workspaces')}
                >
                    Back to Workspaces
                </Button>
            </div>

            <Card>
                <Tabs
                    defaultValue="users"
                    value={activeTab}
                    onChange={handleTabChange}
                >
                    <TabList>
                        <TabNav value="users">Users</TabNav>
                        <TabNav value="roles">Roles</TabNav>
                    </TabList>
                    <div className="p-4">
                        <TabContent value="users">
                            <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-2">
                                <Input
                                    className="md:w-60"
                                    placeholder="Search users..."
                                    prefix={
                                        <HiOutlineSearch className="text-lg" />
                                    }
                                    value={searchText}
                                    onChange={(e) =>
                                        setSearchText(e.target.value)
                                    }
                                />
                                <Button
                                    variant="solid"
                                    icon={<HiOutlinePlus />}
                                    onClick={() => setAddUserDialogOpen(true)}
                                    disabled={
                                        usersSaving ||
                                        availableUsers.length === 0
                                    }
                                >
                                    Assign User
                                </Button>
                            </div>
                            <Table
                                columns={userColumns}
                                data={filteredUsers}
                                loading={usersLoading}
                                rowKey="id"
                                paginate={{
                                    pageSize: 10,
                                    total: filteredUsers.length,
                                }}
                                emptyText="No users assigned to this workspace"
                            />
                        </TabContent>
                        <TabContent value="roles">
                            <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-2">
                                <Input
                                    className="md:w-60"
                                    placeholder="Search roles..."
                                    prefix={
                                        <HiOutlineSearch className="text-lg" />
                                    }
                                    value={searchText}
                                    onChange={(e) =>
                                        setSearchText(e.target.value)
                                    }
                                />
                                <Button
                                    variant="solid"
                                    icon={<HiOutlinePlus />}
                                    onClick={() => setAddRoleDialogOpen(true)}
                                    disabled={
                                        rolesSaving ||
                                        availableRoles.length === 0
                                    }
                                >
                                    Assign Role
                                </Button>
                            </div>
                            <Table
                                columns={roleColumns}
                                data={filteredRoles}
                                loading={rolesLoading}
                                rowKey="id"
                                paginate={{
                                    pageSize: 10,
                                    total: filteredRoles.length,
                                }}
                                emptyText="No roles assigned to this workspace"
                            />
                        </TabContent>
                    </div>
                </Tabs>
            </Card>

            {/* Add User Dialog */}
            <Dialog
                isOpen={addUserDialogOpen}
                onClose={() => setAddUserDialogOpen(false)}
                contentClassName="max-w-md"
            >
                <h4 className="mb-4 text-lg font-semibold">
                    Assign User to Workspace
                </h4>
                <div className="mb-4">
                    <p className="mb-2">
                        Select a user to assign to this workspace:
                    </p>
                    <Select
                        className="w-full"
                        placeholder="Select a user..."
                        options={userOptions}
                        value={userOptions.find(
                            (opt) => opt.value === selectedUserId,
                        )}
                        onChange={(option) =>
                            setSelectedUserId(option ? option.value : null)
                        }
                        isDisabled={usersSaving || userOptions.length === 0}
                    />
                    {userOptions.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                            All available users are already assigned to this
                            workspace.
                        </p>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        onClick={() => setAddUserDialogOpen(false)}
                        disabled={usersSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        color="blue-600"
                        onClick={handleAddUser}
                        icon={<HiOutlineCheck />}
                        disabled={!selectedUserId || usersSaving}
                        loading={usersSaving}
                    >
                        Assign
                    </Button>
                </div>
            </Dialog>

            {/* Add Role Dialog */}
            <Dialog
                isOpen={addRoleDialogOpen}
                onClose={() => setAddRoleDialogOpen(false)}
                contentClassName="max-w-md"
            >
                <h4 className="mb-4 text-lg font-semibold">
                    Assign Role to Workspace
                </h4>
                <div className="mb-4">
                    <p className="mb-2">
                        Select a role to assign to this workspace:
                    </p>
                    <Select
                        className="w-full"
                        placeholder="Select a role..."
                        options={roleOptions}
                        value={roleOptions.find(
                            (opt) => opt.value === selectedRoleId,
                        )}
                        onChange={(option) =>
                            setSelectedRoleId(option ? option.value : null)
                        }
                        isDisabled={rolesSaving || roleOptions.length === 0}
                    />
                    {roleOptions.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                            All available roles are already assigned to this
                            workspace.
                        </p>
                    )}
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        onClick={() => setAddRoleDialogOpen(false)}
                        disabled={rolesSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        color="blue-600"
                        onClick={handleAddRole}
                        icon={<HiOutlineCheck />}
                        disabled={!selectedRoleId || rolesSaving}
                        loading={rolesSaving}
                    >
                        Assign
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default WorkspaceAssignmentsPage

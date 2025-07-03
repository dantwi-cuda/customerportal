import React, { useState, useEffect } from 'react'
import {
    Card,
    Table,
    Input,
    Button,
    Tag,
    Dropdown,
    Menu,
    MenuItem,
    Dialog,
    Badge,
    Notification,
    toast,
    Select,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePencilAlt,
    HiOutlineDotsVertical,
    HiOutlineUserGroup,
    HiOutlineLockClosed,
} from 'react-icons/hi'
import WorkspaceService from '@/services/WorkspaceService'
import { useNavigate } from 'react-router-dom'
import type {
    WorkspaceDto,
    WorkspaceCustomerAssignment,
    Report,
} from '@/@types/workspace'
import useAuth from '@/auth/useAuth'

interface DisplayWorkspace extends WorkspaceDto {
    assignedToTenant?: boolean
    isAssignedToCustomerActive?: boolean
    customerWorkspaceName?: string
    reports?: Report[]
}

const WorkspacesListPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const [workspaces, setWorkspaces] = useState<DisplayWorkspace[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [activeFilter, setActiveFilter] = useState<string>('active') // Default to showing active only

    // Tenant admin check: User must have a tenantId to manage tenant workspaces
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        // Fetch workspaces only if user is a tenant admin (has a tenantId)
        if (isTenantAdmin && user?.tenantId) {
            fetchWorkspaces()
        }
    }, [user, activeFilter]) // Re-fetch if user object changes or filter changes

    const fetchWorkspaces = async () => {
        setLoading(true)
        try {
            // Fetch all workspaces from the /api/workspace endpoint
            // This endpoint is assumed to be already filtered by tenantId based on user context
            const workspacesData = await WorkspaceService.getWorkspaces()

            // Determine isActive filter for assignments
            const isActiveParam =
                activeFilter === 'active'
                    ? true
                    : activeFilter === 'inactive'
                      ? false
                      : undefined

            // Fetch assignments specifically for the current tenant and activeFilter status
            // user.tenantId is guaranteed to be a string here due to the useEffect condition
            const tenantAssignments =
                await WorkspaceService.getWorkspaceAssignments({
                    isActive: isActiveParam,
                    customerId: user.tenantId, // Pass tenantId to the service
                })

            // The previous client-side filtering of assignments is no longer needed:
            // const assignments = await WorkspaceService.getWorkspaceAssignments({ isActive: isActiveParam });
            // const numericTenantId = user?.tenantId ? parseInt(user.tenantId, 10) : undefined;
            // if (isNaN(Number(numericTenantId))) {
            //     throw new Error('Invalid tenant ID format');
            // }
            // const tenantAssignments = assignments.filter(
            //     (a) => String(a.customerId) === String(user?.tenantId),
            // );

            const enhancedWorkspaces: DisplayWorkspace[] = workspacesData.map(
                (workspace) => {
                    // Find if this workspace has a specific assignment for the current tenant
                    // that matches the activeFilter criteria
                    const assignment = tenantAssignments.find(
                        (a) => a.workspaceId === workspace.id,
                    )

                    return {
                        ...workspace,
                        assignedToTenant: !!assignment, // True if an assignment (matching filter) exists
                        isAssignedToCustomerActive:
                            assignment?.isAssignedToCustomerActive,
                        customerWorkspaceName: assignment
                            ? assignment.workspaceName !== workspace.name
                                ? assignment.workspaceName
                                : undefined
                            : undefined,
                        // reports are already part of workspace from workspacesData
                    }
                },
            )

            setWorkspaces(enhancedWorkspaces)
        } catch (error) {
            console.error('Error fetching workspaces:', error)
            toast.push(
                <Notification type="danger" title="Error fetching workspaces">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleNavigateToDetails = (workspaceId: string) => {
        navigate(`/tenantportal/tenant/workspaces/${workspaceId}`)
    }

    const handleNavigateToEditName = (workspaceId: string) => {
        navigate(`/tenantportal/tenant/workspaces/${workspaceId}/edit`)
    }

    const handleNavigateToAssignments = (workspaceId: string) => {
        navigate(`/tenantportal/tenant/workspaces/${workspaceId}/assignments`)
    }

    // Filter workspaces based on search text
    const filteredWorkspaces = workspaces.filter((workspace) => {
        const searchLower = searchText.toLowerCase()
        return (
            workspace.name.toLowerCase().includes(searchLower) ||
            (workspace.customerWorkspaceName &&
                workspace.customerWorkspaceName
                    .toLowerCase()
                    .includes(searchLower)) ||
            // workspace.description?.toLowerCase().includes(searchLower) || // Removed description from search
            workspace.workspaceID.toLowerCase().includes(searchLower)
        )
    })
    // const columns = [ // This array is not directly used by the custom HTML table, consider removing if not needed elsewhere
    //     {
    //         key: 'name',
    //         title: 'Name',
    //         dataIndex: 'name',
    //         render: (name: string, record: DisplayWorkspace) => (
    //             <div>
    //                 <div
    //                     className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
    //                     onClick={() => handleNavigateToDetails(record.id)}
    //                 >
    //                     {record.customerWorkspaceName || name}
    //                 </div>
    //                 {record.customerWorkspaceName && (
    //                     <div className="text-xs text-gray-500">
    //                         Original name: {name}
    //                     </div>
    //                 )}
    //             </div>
    //         ),
    //     },
    //     {
    //         key: 'workspaceId',
    //         title: 'Workspace ID',
    //         dataIndex: 'workspaceId',
    //     },
    //     // {
    //     //     key: 'description',
    //     //     title: 'Description',
    //     //     dataIndex: 'description',
    //     //     render: (description: string) => (
    //     //         <div className="max-w-xs truncate">
    //     //             {description || 'No description'}
    //     //         </div>
    //     //     ),
    //     // },
    //     {
    //         key: 'reportsCount',
    //         title: 'Reports',
    //         dataIndex: 'reports',
    //         render: (reports: Report[] | undefined) => (
    //             <div className="text-center">
    //                 <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-full text-xs font-medium">
    //                     {reports?.length || 0}
    //                 </span>
    //             </div>
    //         ),
    //     },
    //     {
    //         key: 'isActive',
    //         title: 'Global Status',
    //         dataIndex: 'isActive',
    //         render: (isActive: boolean) => (
    //             <Tag
    //                 className={`rounded-full px-2 ${
    //                     isActive
    //                         ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
    //                         : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
    //                 }`}
    //             >
    //                 {isActive ? 'Active' : 'Inactive'}
    //             </Tag>
    //         ),
    //     },
    //     {
    //         key: 'tenantStatus',
    //         title: 'Tenant Status',
    //         dataIndex: 'isAssignedToCustomerActive',
    //         render: (
    //             isAssignedToCustomerActive: boolean | undefined,
    //             record: DisplayWorkspace,
    //         ) => {
    //             if (!record.assignedToTenant) {
    //                 return (
    //                     <Tag className="rounded-full px-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
    //                         Not Assigned
    //                     </Tag>
    //                 )
    //             }

    //             return (
    //                 <Tag
    //                     className={`rounded-full px-2 ${
    //                         isAssignedToCustomerActive
    //                             ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
    //                             : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
    //                     }`}
    //                 >
    //                     {isAssignedToCustomerActive ? 'Active' : 'Inactive'}
    //                 </Tag>
    //             )
    //         },
    //     },
    //     {
    //         key: 'actions',
    //         title: 'Actions',
    //         dataIndex: 'actions',
    //         render: (_: any, record: DisplayWorkspace) => (
    //             <Dropdown
    //                 renderTitle={
    //                     <Button size="sm" icon={<HiOutlineDotsVertical />} />
    //                 }
    //                 placement="bottom-end"
    //             >
    //                 {' '}
    //                 <Menu>
    //                     {record.assignedToTenant && (
    //                         <>
    //                             <MenuItem
    //                                 eventKey="edit"
    //                                 onClick={() =>
    //                                     handleNavigateToEditName(record.id)
    //                                 }
    //                             >
    //                                 <span className="flex items-center gap-2">
    //                                     <HiOutlinePencilAlt />
    //                                     <span>Edit Name & Status</span>
    //                                 </span>
    //                             </MenuItem>
    //                             <MenuItem
    //                                 eventKey="assign"
    //                                 onClick={() =>
    //                                     handleNavigateToAssignments(record.id)
    //                                 }
    //                             >
    //                                 <span className="flex items-center gap-2">
    //                                     <HiOutlineUserGroup />
    //                                     <span>Users & Roles</span>
    //                                 </span>
    //                             </MenuItem>
    //                         </>
    //                     )}
    //                     {!record.assignedToTenant && (
    //                         <MenuItem eventKey="disabled" disabled={true}>
    //                             <span className="flex items-center gap-2 text-gray-400">
    //                                 <HiOutlineLockClosed />
    //                                 <span>Not assigned to your tenant</span>
    //                             </span>
    //                         </MenuItem>
    //                     )}
    //                 </Dropdown>
    //             ),
    //         },
    //     ]

    if (!isTenantAdmin) {
        return (
            <div className="p-4">
                <Card className="text-center p-4">
                    <h4 className="mb-2">Access Denied</h4>
                    <p>
                        You must be a tenant administrator to access this page.
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 className="text-lg font-medium">Workspaces</h3>
                <div className="flex flex-col md:flex-row items-center gap-2">
                    <Input
                        prefix={<HiOutlineSearch className="text-lg" />}
                        placeholder="Search workspaces..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="md:w-60"
                    />{' '}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={
                                activeFilter === 'active' ? 'solid' : 'default'
                            }
                            onClick={() => setActiveFilter('active')}
                        >
                            Active Only
                        </Button>
                        <Button
                            size="sm"
                            variant={
                                activeFilter === 'inactive'
                                    ? 'solid'
                                    : 'default'
                            }
                            onClick={() => setActiveFilter('inactive')}
                        >
                            Inactive Only
                        </Button>
                        <Button
                            size="sm"
                            variant={
                                activeFilter === 'all' ? 'solid' : 'default'
                            }
                            onClick={() => setActiveFilter('all')}
                        >
                            All Workspaces
                        </Button>
                    </div>
                </div>
            </div>{' '}
            <Card>
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Workspace ID
                                    </th>
                                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Description
                                    </th> */}
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Reports
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Global Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Tenant Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {filteredWorkspaces.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6} // Adjusted colSpan from 7 to 6
                                            className="px-6 py-4 text-center"
                                        >
                                            No workspaces found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredWorkspaces.map((workspace) => (
                                        <tr
                                            key={workspace.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div
                                                        className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                                        onClick={() =>
                                                            handleNavigateToDetails(
                                                                workspace.id,
                                                            )
                                                        }
                                                    >
                                                        {workspace.customerWorkspaceName ||
                                                            workspace.name}
                                                    </div>
                                                    {workspace.customerWorkspaceName && (
                                                        <div className="text-xs text-gray-500">
                                                            Original name:{' '}
                                                            {workspace.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {workspace.workspaceID || 'N/A'}
                                            </td>
                                            {/* <td className="px-6 py-4">
                                                <div className="max-w-xs truncate">
                                                    {workspace.description ||
                                                        'No description'}
                                                </div>
                                            </td> */}
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-full text-xs font-medium">
                                                    {workspace.reports
                                                        ?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Tag
                                                    className={`rounded-full px-2 ${
                                                        workspace.isActive
                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                            : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
                                                    }`}
                                                >
                                                    {workspace.isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Tag>
                                            </td>
                                            <td className="px-6 py-4">
                                                {!workspace.assignedToTenant ? (
                                                    <Tag className="rounded-full px-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                        Not Assigned
                                                    </Tag>
                                                ) : (
                                                    <Tag
                                                        className={`rounded-full px-2 ${
                                                            workspace.isAssignedToCustomerActive
                                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                                : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
                                                        }`}
                                                    >
                                                        {workspace.isAssignedToCustomerActive
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Tag>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex space-x-2">
                                                    {workspace.assignedToTenant && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="solid"
                                                                onClick={() =>
                                                                    handleNavigateToEditName(
                                                                        workspace.id,
                                                                    )
                                                                }
                                                                icon={
                                                                    <HiOutlinePencilAlt />
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="solid"
                                                                onClick={() =>
                                                                    handleNavigateToAssignments(
                                                                        workspace.id,
                                                                    )
                                                                }
                                                                icon={
                                                                    <HiOutlineUserGroup />
                                                                }
                                                            >
                                                                Assign
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default WorkspacesListPage

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
    HiOutlineCloudDownload,
    HiOutlineEye,
} from 'react-icons/hi'
import WorkspaceService from '@/services/WorkspaceService'
import { useNavigate } from 'react-router-dom'
import type {
    WorkspaceDto,
    WorkspaceCustomerAssignment,
    Report,
    DisplayWorkspace,
    WorkspaceImportStatus,
    ImportReportsResponse,
    LastImport,
} from '@/@types/workspace'
import useAuth from '@/auth/useAuth'

const WorkspacesListPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const [workspaces, setWorkspaces] = useState<DisplayWorkspace[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [activeFilter, setActiveFilter] = useState<string>('active') // Default to showing active only
    const [importStatuses, setImportStatuses] = useState<
        Record<string, WorkspaceImportStatus>
    >({})

    // Tenant admin check: User must have a tenantId to manage tenant workspaces
    const isTenantAdmin = !!user?.tenantId

    // Import status management
    const loadImportStatuses = () => {
        const stored = localStorage.getItem('workspaceImportStatuses')
        if (stored) {
            try {
                const statuses = JSON.parse(stored) as WorkspaceImportStatus[]
                const statusMap: Record<string, WorkspaceImportStatus> = {}
                statuses.forEach((status) => {
                    statusMap[status.workspaceId] = status
                })
                setImportStatuses(statusMap)
            } catch (error) {
                console.error('Error parsing import statuses:', error)
            }
        }
    }

    const saveImportStatus = (
        workspaceId: string,
        status: WorkspaceImportStatus,
    ) => {
        const newStatuses = { ...importStatuses, [workspaceId]: status }
        setImportStatuses(newStatuses)

        // Save to localStorage
        const statusArray = Object.values(newStatuses)
        localStorage.setItem(
            'workspaceImportStatuses',
            JSON.stringify(statusArray),
        )
    }

    const handleImportReports = async (workspace: DisplayWorkspace) => {
        try {
            // Set importing status
            const importingStatus: WorkspaceImportStatus = {
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                customerWorkspaceName: workspace.customerWorkspaceName,
                status: 'importing',
                lastImport: new Date().toISOString(),
            }
            saveImportStatus(workspace.id, importingStatus)

            // Call the import API
            const response = await WorkspaceService.importReports(workspace.id)

            // Update status with response
            const completedStatus: WorkspaceImportStatus = {
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                customerWorkspaceName: workspace.customerWorkspaceName,
                status: response.success ? 'success' : 'error',
                lastImport: new Date().toISOString(),
                response,
            }
            saveImportStatus(workspace.id, completedStatus)

            // Show notification
            toast.push(
                <Notification
                    type={response.success ? 'success' : 'danger'}
                    title={
                        response.success ? 'Import Completed' : 'Import Failed'
                    }
                >
                    {response.message ||
                        `Processed ${response.processedReports} reports`}
                </Notification>,
            )

            // Refresh workspaces to get updated report counts
            fetchWorkspaces()
        } catch (error) {
            console.error('Error importing reports:', error)
            const errorStatus: WorkspaceImportStatus = {
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                customerWorkspaceName: workspace.customerWorkspaceName,
                status: 'error',
                lastImport: new Date().toISOString(),
                response: {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    processedReports: 0,
                    newReports: 0,
                    updatedReports: 0,
                    deletedReports: 0,
                    errors: [
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    ],
                },
            }
            saveImportStatus(workspace.id, errorStatus)

            toast.push(
                <Notification type="danger" title="Import Failed">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        }
    }

    const handleNavigateToImportStatus = () => {
        navigate('/tenantportal/tenant/workspaces/import-status')
    }

    // Helper function to render refreshed on date from workspace.lastImport.importedAt
    const renderRefreshedOn = (workspace: DisplayWorkspace) => {
        // Check if workspace has lastImport data from API
        if (workspace.lastImport?.importedAt) {
            const date = new Date(workspace.lastImport.importedAt)
            return (
                <div className="flex flex-col">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                        {date.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                        {date.toLocaleTimeString()}
                    </div>
                </div>
            )
        }

        // Fallback to local import status if no API data
        const importStatus = workspace.importStatus
        if (importStatus?.lastImport) {
            const date = new Date(importStatus.lastImport)
            return (
                <div className="flex flex-col">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                        {date.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                        {date.toLocaleTimeString()}
                    </div>
                </div>
            )
        }

        return <div className="text-sm text-gray-500">Never refreshed</div>
    }

    useEffect(() => {
        // Fetch workspaces only if user is a tenant admin (has a tenantId)
        if (isTenantAdmin && user?.tenantId) {
            fetchWorkspaces()
        }

        loadImportStatuses()
    }, [user]) // Removed activeFilter dependency since we now filter client-side

    const fetchWorkspaces = async () => {
        setLoading(true)
        try {
            // Fetch all workspaces from the /api/workspace endpoint with reports included
            // This endpoint is assumed to be already filtered by tenantId based on user context
            const workspacesData = await WorkspaceService.getWorkspaces({
                includeReports: true,
            })

            // Fetch all assignments for the current tenant (without isActive filter)
            // We'll filter on the client side to have complete data
            const tenantAssignments =
                await WorkspaceService.getWorkspaceAssignments({
                    customerId: user.tenantId || undefined, // Pass tenantId to the service
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
                        importStatus: importStatuses[workspace.id],
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

    // Filter workspaces based on search text and active filter
    const filteredWorkspaces = workspaces.filter((workspace) => {
        // First check if workspace matches the search criteria
        const searchLower = searchText.toLowerCase()
        const matchesSearch =
            workspace.name.toLowerCase().includes(searchLower) ||
            (workspace.customerWorkspaceName &&
                workspace.customerWorkspaceName
                    .toLowerCase()
                    .includes(searchLower)) ||
            workspace.workspaceID.toLowerCase().includes(searchLower)

        // If it doesn't match search, exclude it
        if (!matchesSearch) return false

        // Then apply the active filter
        if (activeFilter === 'active') {
            // Show only workspaces that are assigned to tenant and active
            return workspace.assignedToTenant && workspace.isActive
        } else if (activeFilter === 'inactive') {
            // Show only workspaces that are assigned to tenant but inactive
            return workspace.assignedToTenant && !workspace.isActive
        } else {
            // Show all workspaces (assigned and unassigned)
            return true
        }
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
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header and Actions Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h4 className="mb-1">Workspaces</h4>
                        <p className="text-gray-600 text-sm">
                            Manage tenant workspaces and their assignments
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <Input
                            prefix={<HiOutlineSearch className="text-lg" />}
                            placeholder="Search workspaces..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full sm:w-60"
                        />
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                size="sm"
                                variant={
                                    activeFilter === 'active'
                                        ? 'solid'
                                        : 'default'
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
                            <Button
                                size="sm"
                                variant="plain"
                                icon={<HiOutlineEye />}
                                onClick={handleNavigateToImportStatus}
                            >
                                View Import Status
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Content Card */}
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
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Reports
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Refreshed on
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
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
                                            colSpan={6} // Updated colSpan to match new column count
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
                                                {renderRefreshedOn(workspace)}
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
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() =>
                                                                    handleImportReports(
                                                                        workspace,
                                                                    )
                                                                }
                                                                icon={
                                                                    <HiOutlineCloudDownload />
                                                                }
                                                                loading={
                                                                    workspace
                                                                        .importStatus
                                                                        ?.status ===
                                                                    'importing'
                                                                }
                                                                disabled={
                                                                    workspace
                                                                        .importStatus
                                                                        ?.status ===
                                                                    'importing'
                                                                }
                                                            >
                                                                Get Reports
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

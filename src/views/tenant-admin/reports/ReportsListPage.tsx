import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Input,
    Button,
    Tag,
    Notification,
    toast,
    Switcher,
    Pagination,
    Select,
    Dropdown,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePencilAlt,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineUserGroup,
    HiOutlineDocumentReport,
    HiOutlineBadgeCheck,
    HiOutlineAdjustments,
    HiOutlineSwitchVertical,
    HiOutlineExternalLink,
    HiOutlineX,
} from 'react-icons/hi'
import EllipsisButton from '@/components/shared/EllipsisButton'
import * as ReportService from '@/services/ReportService'
import { useNavigate } from 'react-router-dom'
import type { Report, ReportCategory, ReportWorkspace } from '@/@types/report'
import useAuth from '@/auth/useAuth'
import { usePermissionStore } from '@/store/permissionStore'
import {
    REPORT_ALL,
    REPORT_READ,
    REPORT_LAUNCH,
} from '@/constants/report-permissions.constant'
import { TENANT_ADMIN } from '@/constants/roles.constant'
import type { SingleValue } from 'react-select'

// Types for Select component
interface SelectOption {
    value: string
    label: string
}

const ReportsListPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { hasPermission } = usePermissionStore()

    // Permission checks
    const canLaunchReports =
        user?.authority?.includes(TENANT_ADMIN) || // Tenant Admins can always launch reports
        hasPermission(REPORT_READ) ||
        hasPermission(REPORT_ALL) ||
        hasPermission(REPORT_LAUNCH)

    // Debug: Log permission check results
    console.log('Launch permission check:', {
        isTenantAdmin: user?.authority?.includes(TENANT_ADMIN),
        hasReportRead: hasPermission(REPORT_READ),
        hasReportAll: hasPermission(REPORT_ALL),
        hasReportLaunch: hasPermission(REPORT_LAUNCH),
        canLaunchReports,
    })

    // State management
    const [reports, setReports] = useState<Report[]>([])
    const [categories, setCategories] = useState<ReportCategory[]>([])
    const [workspaces, setWorkspaces] = useState<ReportWorkspace[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>('all')
    const [selectedReports, setSelectedReports] = useState<Set<string>>(
        new Set(),
    )
    const [bulkOperationLoading, setBulkOperationLoading] = useState(false)

    // Loading states for individual reports
    const [updatingReports, setUpdatingReports] = useState<Set<string>>(
        new Set(),
    )

    // Sorting state
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Tenant admin check: User must have a tenantId to manage reports
    const isTenantAdmin = !!user?.tenantId

    console.log('Auth state:', { user, isTenantAdmin })

    useEffect(() => {
        if (isTenantAdmin) {
            fetchCategories()
            fetchWorkspaces()
            // Also fetch reports immediately when component mounts
            fetchReports()
        }
    }, [user])

    // Add a debug effect to test API connectivity
    useEffect(() => {
        if (isTenantAdmin) {
            // Test API connectivity
            console.log('Testing API connectivity...')
            fetch('/api/Report?Category=')
                .then((response) => {
                    console.log(
                        'Direct fetch response status:',
                        response.status,
                    )
                    return response.json()
                })
                .then((data) => {
                    console.log('Direct fetch data:', data)
                    console.log('Direct fetch data length:', data?.length)
                })
                .catch((error) => {
                    console.error('Direct fetch error:', error)
                })
        }
    }, [isTenantAdmin])

    // Only fetch reports when the component mounts or user changes
    useEffect(() => {
        if (isTenantAdmin) {
            fetchReports()
        }
    }, [isTenantAdmin])

    // Reset to first page when selected category changes
    useEffect(() => {
        setCurrentPage(1)
        setSelectedReports(new Set()) // Clear selections when category changes
    }, [selectedCategory])

    // Reset to first page when selected workspace changes
    useEffect(() => {
        setCurrentPage(1)
        setSelectedReports(new Set()) // Clear selections when workspace changes
    }, [selectedWorkspace])

    // Reset to first page when search text changes
    useEffect(() => {
        setCurrentPage(1)
        setSelectedReports(new Set()) // Clear selections when search changes
    }, [searchText])

    const fetchReports = async () => {
        setLoading(true)
        try {
            console.log(
                'Fetching all reports (client-side filtering will be applied)...',
            )

            // Fetch all reports - we'll do filtering client-side for better UX
            const data = await ReportService.getReportsList({ category: '' })
            console.log('API response received:', data)
            console.log('Number of reports received:', data?.length || 0)

            // Debug: Log workspace info for each report
            data?.forEach((report) => {
                console.log(
                    `Report: ${report.name}, WorkspaceId: ${report.workspaceId}, WorkspaceName: ${report.workspaceName}`,
                )
            })

            setReports(data || [])
        } catch (error) {
            console.error('Error fetching reports:', error)
            if (error && typeof error === 'object' && 'response' in error) {
                console.error(
                    'Error details:',
                    (error as any).response?.data || (error as any).message,
                )
            }
            toast.push(
                <Notification type="danger" title="Error fetching reports">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            console.log('Fetching categories...')
            const data = await ReportService.getCategories()
            console.log('Categories received:', data)
            setCategories(data || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
            // Don't show toast for categories error as it's not critical
            // The reports can still be displayed without categories
            setCategories([])
        }
    }

    const fetchWorkspaces = async () => {
        try {
            console.log('Fetching workspaces...')
            const data = await ReportService.getWorkspaces()
            console.log('Workspaces received:', data)

            // Debug: Log each workspace
            data?.forEach((workspace) => {
                console.log(`Workspace: ${workspace.name}, ID: ${workspace.id}`)
            })

            setWorkspaces(data || [])
        } catch (error) {
            console.error('Error fetching workspaces:', error)
            // Don't show toast for workspaces error as it's not critical
            // The reports can still be displayed without workspaces
            setWorkspaces([])
        }
    }

    const handleEditReport = (report: Report) => {
        navigate(`/tenantportal/tenant/reports/${report.id}/edit`)
    }

    const handleDeleteReport = async (report: Report) => {
        if (
            confirm(
                `Are you sure you want to delete "${report.name}"? This action cannot be undone.`,
            )
        ) {
            try {
                await ReportService.deleteReport(report.id)
                await fetchReports()
                toast.push(
                    <Notification type="success" title="Report deleted">
                        Report has been deleted successfully
                    </Notification>,
                )
            } catch (error) {
                console.error('Error deleting report:', error)
                toast.push(
                    <Notification type="danger" title="Error deleting report">
                        {error instanceof Error
                            ? error.message
                            : 'An unknown error occurred'}
                    </Notification>,
                )
            }
        }
    }

    const handleAssignments = (report: Report) => {
        navigate(`/tenantportal/tenant/reports/${report.id}/assignments`)
    }

    const handleLaunchReport = async (report: Report) => {
        try {
            // Check if the report has basic requirements for embedding
            if (!report.powerBiReportId) {
                toast.push(
                    <Notification type="warning" title="Cannot launch report">
                        This report does not have a valid Power BI report ID.
                    </Notification>,
                )
                return
            }

            console.log('Launching report:', report.name, 'ID:', report.id)

            // Show loading notification
            toast.push(
                <Notification type="info" title="Launching report">
                    Preparing report for viewing...
                </Notification>,
            )

            try {
                // Fetch embed config to verify report is accessible
                const embedConfig = await ReportService.getReportEmbedToken(
                    report.id,
                )
                console.log('Embed config received:', {
                    reportId: embedConfig.reportId,
                    hasToken: !!embedConfig.embedToken,
                    embedUrl: embedConfig.embedUrl,
                    expiresInMinutes: embedConfig.expiresInMinutes,
                })

                // Navigate to the report viewer page
                navigate(`/tenantportal/tenant/reports/${report.id}/view`)
            } catch (embedError) {
                console.error('Error getting embed config:', embedError)
                toast.push(
                    <Notification type="danger" title="Cannot launch report">
                        Unable to prepare report for viewing. Please try again.
                    </Notification>,
                )
            }
        } catch (error) {
            console.error('Error launching report:', error)
            toast.push(
                <Notification type="danger" title="Error launching report">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        }
    }

    const handleToggleApproval = async (report: Report) => {
        if (updatingReports.has(report.id)) return // Prevent multiple simultaneous updates

        setUpdatingReports((prev) => new Set(prev).add(report.id))
        try {
            const isCurrentlyApproved =
                report.isTenantApproved ?? report.status === 'Approved'

            console.log('Toggling report approval - Original report:', report)
            console.log('Current approval status:', isCurrentlyApproved)

            // Convert report ID to number for the new bulk API
            const reportIdAsNumber = parseInt(report.id, 10)
            if (isNaN(reportIdAsNumber)) {
                throw new Error(`Invalid report ID: ${report.id}`)
            }

            // Use the new bulk approve endpoint for both approve and unapprove
            const newApprovalStatus = !isCurrentlyApproved
            console.log(
                `${newApprovalStatus ? 'Approving' : 'Unapproving'} report using bulk approve API`,
            )
            console.log('Payload:', {
                reportIds: [reportIdAsNumber],
                isApproved: newApprovalStatus,
            })

            await ReportService.bulkApproveReportsNew(
                [reportIdAsNumber],
                newApprovalStatus,
            )

            await fetchReports()
            toast.push(
                <Notification
                    type="success"
                    title={`Report ${newApprovalStatus ? 'approved' : 'unapproved'}`}
                >
                    {report.name} has been{' '}
                    {newApprovalStatus ? 'approved' : 'unapproved'}
                </Notification>,
            )
        } catch (error) {
            console.error('Error updating report approval:', error)
            toast.push(
                <Notification type="danger" title="Error updating report">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setUpdatingReports((prev) => {
                const newSet = new Set(prev)
                newSet.delete(report.id)
                return newSet
            })
        }
    }

    const handleToggleEnabled = async (report: Report) => {
        if (updatingReports.has(report.id)) return // Prevent multiple simultaneous updates

        setUpdatingReports((prev) => new Set(prev).add(report.id))
        try {
            const isCurrentlyEnabled = report.isTenantEnabled ?? true

            console.log(
                'Toggling report enabled status - Original report:',
                report,
            )
            console.log('Current enabled status:', isCurrentlyEnabled)

            // Convert report ID to integer for the API
            const reportIdAsInt = parseInt(report.id, 10)
            if (isNaN(reportIdAsInt)) {
                throw new Error(`Invalid report ID: ${report.id}`)
            }

            const payload = {
                reportIds: [reportIdAsInt],
                isEnabled: !isCurrentlyEnabled,
            }

            console.log('Using bulk set-status API with payload:', payload)

            // Use the bulk set-status API with integer IDs
            await ReportService.bulkSetReportStatus(
                [reportIdAsInt],
                !isCurrentlyEnabled,
            )
            await fetchReports()
            toast.push(
                <Notification
                    type="success"
                    title={`Report ${!isCurrentlyEnabled ? 'enabled' : 'disabled'}`}
                >
                    {report.name} has been{' '}
                    {!isCurrentlyEnabled ? 'enabled' : 'disabled'}
                </Notification>,
            )
        } catch (error) {
            console.error('Error updating report enabled status:', error)
            toast.push(
                <Notification type="danger" title="Error updating report">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setUpdatingReports((prev) => {
                const newSet = new Set(prev)
                newSet.delete(report.id)
                return newSet
            })
        }
    }

    // Filter and sort reports
    const filteredAndSortedReports = useMemo(() => {
        console.log('Filtering reports:', {
            totalReports: reports.length,
            selectedWorkspace,
            selectedCategory,
            searchText,
        })

        // First filter by search text across all visible table fields
        let filtered = reports

        // Apply workspace filter first (client-side filtering to ensure it works)
        if (selectedWorkspace !== 'all') {
            const beforeWorkspaceFilter = filtered.length
            filtered = filtered.filter((report) => {
                const matches =
                    report.workspaceId?.toString() === selectedWorkspace
                if (!matches) {
                    console.log(
                        'Filtering out report:',
                        report.name,
                        'workspaceId:',
                        report.workspaceId,
                        'selectedWorkspace:',
                        selectedWorkspace,
                    )
                }
                return matches
            })
            console.log(
                `Workspace filter: ${beforeWorkspaceFilter} -> ${filtered.length}`,
            )
        }

        // Apply category filter (client-side filtering to ensure it works)
        if (selectedCategory !== 'all') {
            const selectedCategoryName = categories.find(
                (cat) => cat.id.toString() === selectedCategory,
            )?.name
            if (selectedCategoryName) {
                const beforeCategoryFilter = filtered.length
                filtered = filtered.filter((report) => {
                    return report.categoryName === selectedCategoryName
                })
                console.log(
                    `Category filter: ${beforeCategoryFilter} -> ${filtered.length}`,
                )
            }
        }

        // Apply search text filter
        if (searchText.trim()) {
            const searchLower = searchText.toLowerCase()
            filtered = filtered.filter((report) => {
                // Search in: name, tenantDescription, categoryName, workspaceName, approval status (approved/pending), enabled (enabled/disabled)
                const name = report.name?.toLowerCase() || ''
                const description = (
                    report.tenantDescription ||
                    report.description ||
                    ''
                ).toLowerCase()
                const category = report.categoryName?.toLowerCase() || ''
                const workspace = report.workspaceName?.toLowerCase() || ''
                const approvalStatus =
                    (report.isTenantApproved ?? report.status === 'Approved')
                        ? 'approved'
                        : 'pending'
                const enabled =
                    (report.isTenantEnabled ?? true) ? 'enabled' : 'disabled'

                return (
                    name.includes(searchLower) ||
                    description.includes(searchLower) ||
                    category.includes(searchLower) ||
                    workspace.includes(searchLower) ||
                    approvalStatus.includes(searchLower) ||
                    enabled.includes(searchLower)
                )
            })
        }

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            if (sortField === 'name') {
                // Case insensitive string comparison
                const valueA = a.name.toLowerCase()
                const valueB = b.name.toLowerCase()

                if (sortDirection === 'asc') {
                    return valueA.localeCompare(valueB)
                } else {
                    return valueB.localeCompare(valueA)
                }
            } else if (sortField === 'workspace') {
                // Case insensitive string comparison for workspace
                const valueA = (a.workspaceName || '').toLowerCase()
                const valueB = (b.workspaceName || '').toLowerCase()

                if (sortDirection === 'asc') {
                    return valueA.localeCompare(valueB)
                } else {
                    return valueB.localeCompare(valueA)
                }
            }
            return 0
        })

        return sorted
    }, [
        reports,
        sortField,
        sortDirection,
        searchText,
        selectedWorkspace,
        selectedCategory,
        categories,
    ])

    // Calculate pagination
    const totalItems = filteredAndSortedReports.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)
    const paginatedReports = filteredAndSortedReports.slice(
        startIndex,
        endIndex,
    )

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Toggle sort direction for field
    const toggleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Page size dropdown options
    const pageSizeOptions = [
        { value: '5', label: '5' },
        { value: '10', label: '10' },
        { value: '20', label: '20' },
        { value: '50', label: '50' },
        { value: '100', label: '100' },
    ]

    // Category options for filter
    const categoryOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All Categories' }]
        categories.forEach((category) => {
            options.push({
                value: category.id.toString(),
                label: category.name,
            })
        })
        return options
    }, [categories])

    // Workspace options for filter
    const workspaceOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All Workspaces' }]
        workspaces.forEach((workspace) => {
            options.push({
                value: workspace.id.toString(),
                label: workspace.name,
            })
        })
        return options
    }, [workspaces])

    const handlePageSizeChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        const newSize = parseInt(newValue.value, 10)
        setPageSize(newSize)
        setCurrentPage(1) // Reset to first page when page size changes
    }

    const handleCategoryChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        setSelectedCategory(newValue.value)
        // fetchReports will be called automatically by useEffect
    }

    const handleWorkspaceChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        setSelectedWorkspace(newValue.value)
        // fetchReports will be called automatically by useEffect
    }

    const handleSelectReport = (reportId: string, selected: boolean) => {
        setSelectedReports((prev) => {
            const newSet = new Set(prev)
            if (selected) {
                newSet.add(reportId)
            } else {
                newSet.delete(reportId)
            }
            return newSet
        })
    }

    const handleSelectAllReports = (selected: boolean) => {
        if (selected) {
            setSelectedReports(
                new Set(paginatedReports.map((report) => report.id)),
            )
        } else {
            setSelectedReports(new Set())
        }
    }

    const handleBulkApprove = async (isApproved: boolean) => {
        if (selectedReports.size === 0) {
            toast.push(
                <Notification type="warning" title="No reports selected">
                    Please select at least one report to{' '}
                    {isApproved ? 'approve' : 'unapprove'}
                </Notification>,
            )
            return
        }

        setBulkOperationLoading(true)
        try {
            const reportIdsAsNumbers = Array.from(selectedReports).map((id) => {
                const num = parseInt(id, 10)
                if (isNaN(num)) {
                    throw new Error(`Invalid report ID: ${id}`)
                }
                return num
            })

            console.log(
                `Bulk ${isApproved ? 'approving' : 'unapproving'} reports:`,
                reportIdsAsNumbers,
            )
            await ReportService.bulkApproveReportsNew(
                reportIdsAsNumbers,
                isApproved,
            )
            await fetchReports()

            toast.push(
                <Notification
                    type="success"
                    title={`Reports ${isApproved ? 'approved' : 'unapproved'}`}
                >
                    {selectedReports.size} report(s) have been{' '}
                    {isApproved ? 'approved' : 'unapproved'}
                </Notification>,
            )

            setSelectedReports(new Set()) // Clear selections after operation
        } catch (error) {
            console.error(
                `Error bulk ${isApproved ? 'approving' : 'unapproving'} reports:`,
                error,
            )
            toast.push(
                <Notification type="danger" title="Error updating reports">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setBulkOperationLoading(false)
        }
    }

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
                        <h4 className="mb-1">Reports</h4>
                        <p className="text-gray-600 text-sm">
                            Manage tenant reports and their assignments
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 w-full lg:w-auto">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Filter by Category:
                                </label>
                                <Select
                                    options={categoryOptions}
                                    value={categoryOptions.find(
                                        (option) =>
                                            option.value === selectedCategory,
                                    )}
                                    onChange={handleCategoryChange}
                                    className="min-w-[200px] w-full sm:w-auto"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Filter by Workspace:
                                </label>
                                <Select
                                    options={workspaceOptions}
                                    value={workspaceOptions.find(
                                        (option) =>
                                            option.value === selectedWorkspace,
                                    )}
                                    onChange={handleWorkspaceChange}
                                    className="min-w-[200px] w-full sm:w-auto"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            {selectedReports.size > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {selectedReports.size} selected
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        icon={<HiOutlineBadgeCheck />}
                                        onClick={() => handleBulkApprove(true)}
                                        disabled={bulkOperationLoading}
                                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                                    >
                                        {bulkOperationLoading
                                            ? 'Processing...'
                                            : 'Approve'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        icon={<HiOutlineX />}
                                        onClick={() => handleBulkApprove(false)}
                                        disabled={bulkOperationLoading}
                                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                                    >
                                        {bulkOperationLoading
                                            ? 'Processing...'
                                            : 'Unapprove'}
                                    </Button>
                                </div>
                            )}
                            <Button
                                size="sm"
                                variant="solid"
                                icon={<HiOutlineAdjustments />}
                                onClick={() =>
                                    navigate(
                                        '/tenantportal/tenant/reports/bulk-assign',
                                    )
                                }
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Bulk Category Assignment
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Content Card */}
            <Card className="px-0 sm:px-4">
                {/* Search bar inside card, above table */}
                <div className="px-4 sm:px-4 pt-4 pb-2">
                    <Input
                        prefix={<HiOutlineSearch className="text-lg" />}
                        placeholder="Search by name, description, category, workspace, approval status, enabled status..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full text-base py-3"
                        size="lg"
                    />
                </div>
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-4 sm:-mx-0">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            checked={
                                                paginatedReports.length > 0 &&
                                                selectedReports.size ===
                                                    paginatedReports.length
                                            }
                                            onChange={(e) =>
                                                handleSelectAllReports(
                                                    e.target.checked,
                                                )
                                            }
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th
                                        className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                                        onClick={() => toggleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Display Name
                                            {sortField === 'name' && (
                                                <span className="ml-1">
                                                    {sortDirection === 'asc'
                                                        ? '↑'
                                                        : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th
                                        className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                                        onClick={() => toggleSort('workspace')}
                                    >
                                        <div className="flex items-center">
                                            Workspace
                                            {sortField === 'workspace' && (
                                                <span className="ml-1">
                                                    {sortDirection === 'asc'
                                                        ? '↑'
                                                        : '↓'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Approved
                                    </th>
                                    <th className="hidden sm:table-cell px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Enabled
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {paginatedReports.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-6 py-4 text-center text-gray-500"
                                        >
                                            No reports found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedReports.map((report) => (
                                        <tr
                                            key={report.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="px-4 sm:px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedReports.has(
                                                        report.id,
                                                    )}
                                                    onChange={(e) =>
                                                        handleSelectReport(
                                                            report.id,
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {report.name}
                                                </div>
                                                {/* Show category, workspace and approval status on mobile */}
                                                <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="truncate max-w-[120px]">
                                                                {report.categoryName ||
                                                                    'No category'}
                                                            </span>
                                                            <div className="flex gap-1 ml-2">
                                                                <Tag
                                                                    className={`rounded-full px-2 whitespace-nowrap text-xs ${
                                                                        (report.isTenantApproved ??
                                                                        report.status ===
                                                                            'Approved')
                                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                                            : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-200'
                                                                    }`}
                                                                >
                                                                    {(report.isTenantApproved ??
                                                                    report.status ===
                                                                        'Approved')
                                                                        ? 'Approved'
                                                                        : 'Pending'}
                                                                </Tag>
                                                                <Tag
                                                                    className={`rounded-full px-2 whitespace-nowrap text-xs ${
                                                                        (report.isTenantEnabled ??
                                                                        true)
                                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                                            : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
                                                                    }`}
                                                                >
                                                                    {(report.isTenantEnabled ??
                                                                    true)
                                                                        ? 'Enabled'
                                                                        : 'Disabled'}
                                                                </Tag>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 lg:hidden">
                                                            <span className="font-medium">
                                                                Workspace:
                                                            </span>{' '}
                                                            {report.workspaceName ||
                                                                'Unknown'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4">
                                                <div className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                                                    {report.tenantDescription ||
                                                        report.description ||
                                                        'No description'}
                                                </div>
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4">
                                                <div className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                                                    {report.categoryName ||
                                                        'Uncategorized'}
                                                </div>
                                            </td>
                                            <td className="hidden lg:table-cell px-6 py-4">
                                                <div className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                                                    {report.workspaceName ||
                                                        'Unknown Workspace'}
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-center">
                                                <Switcher
                                                    checked={
                                                        report.isTenantApproved ??
                                                        report.status ===
                                                            'Approved'
                                                    }
                                                    onChange={() =>
                                                        handleToggleApproval(
                                                            report,
                                                        )
                                                    }
                                                    disabled={updatingReports.has(
                                                        report.id,
                                                    )}
                                                />
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4 text-center">
                                                <Switcher
                                                    checked={
                                                        report.isTenantEnabled ??
                                                        true
                                                    }
                                                    onChange={() =>
                                                        handleToggleEnabled(
                                                            report,
                                                        )
                                                    }
                                                    disabled={updatingReports.has(
                                                        report.id,
                                                    )}
                                                />
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="flex justify-end">
                                                    <Dropdown
                                                        placement="bottom-end"
                                                        renderTitle={
                                                            <EllipsisButton
                                                                size="xs"
                                                                className="touch-manipulation"
                                                            />
                                                        }
                                                    >
                                                        {/* Show enable/disable option for small screens */}
                                                        <Dropdown.Item
                                                            className="sm:hidden"
                                                            eventKey="toggle"
                                                            onClick={() =>
                                                                handleToggleEnabled(
                                                                    report,
                                                                )
                                                            }
                                                            disabled={updatingReports.has(
                                                                report.id,
                                                            )}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <span
                                                                    className={`h-2 w-2 rounded-full ${(report.isTenantEnabled ?? true) ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                                ></span>
                                                                <span>
                                                                    {(report.isTenantEnabled ??
                                                                    true)
                                                                        ? 'Disable'
                                                                        : 'Enable'}
                                                                </span>
                                                            </span>
                                                        </Dropdown.Item>

                                                        {/* Show approve/unapprove option for small screens */}
                                                        <Dropdown.Item
                                                            className="sm:hidden"
                                                            eventKey="approve"
                                                            onClick={() =>
                                                                handleToggleApproval(
                                                                    report,
                                                                )
                                                            }
                                                            disabled={updatingReports.has(
                                                                report.id,
                                                            )}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <HiOutlineBadgeCheck className="text-lg" />
                                                                <span>
                                                                    {(report.isTenantApproved ??
                                                                    report.status ===
                                                                        'Approved')
                                                                        ? 'Unapprove'
                                                                        : 'Approve'}
                                                                </span>
                                                            </span>
                                                        </Dropdown.Item>

                                                        {/* Launch Report option */}
                                                        {canLaunchReports && (
                                                            <Dropdown.Item
                                                                eventKey="launch"
                                                                onClick={() =>
                                                                    handleLaunchReport(
                                                                        report,
                                                                    )
                                                                }
                                                            >
                                                                <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                                                    <HiOutlineExternalLink className="text-lg" />
                                                                    <span>
                                                                        Launch
                                                                    </span>
                                                                </span>
                                                            </Dropdown.Item>
                                                        )}

                                                        {/* Edit Report option */}
                                                        <Dropdown.Item
                                                            eventKey="edit"
                                                            onClick={() =>
                                                                handleEditReport(
                                                                    report,
                                                                )
                                                            }
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <HiOutlinePencilAlt className="text-lg" />
                                                                <span>
                                                                    Edit
                                                                </span>
                                                            </span>
                                                        </Dropdown.Item>

                                                        {/* Assign Users/Roles option */}
                                                        <Dropdown.Item
                                                            eventKey="assign"
                                                            onClick={() =>
                                                                handleAssignments(
                                                                    report,
                                                                )
                                                            }
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <HiOutlineUserGroup className="text-lg" />
                                                                <span>
                                                                    Assign
                                                                </span>
                                                            </span>
                                                        </Dropdown.Item>

                                                        {/* Delete Report option */}
                                                        <Dropdown.Item
                                                            eventKey="delete"
                                                            onClick={() =>
                                                                handleDeleteReport(
                                                                    report,
                                                                )
                                                            }
                                                        >
                                                            <span className="flex items-center gap-2 text-red-500">
                                                                <HiOutlineTrash className="text-lg" />
                                                                <span>
                                                                    Delete
                                                                </span>
                                                            </span>
                                                        </Dropdown.Item>
                                                    </Dropdown>
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

            {/* Pagination */}
            <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
                    Showing{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                        {filteredAndSortedReports.length > 0
                            ? startIndex + 1
                            : 0}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                        {endIndex}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                        {totalItems}
                    </span>{' '}
                    reports
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center justify-center w-full sm:w-auto">
                        <span className="mr-2 text-sm text-gray-500 dark:text-gray-400">
                            Show:
                        </span>
                        <Select
                            size="sm"
                            options={pageSizeOptions}
                            value={{
                                value: pageSize.toString(),
                                label: pageSize.toString(),
                            }}
                            onChange={handlePageSizeChange}
                            className="min-w-[80px]"
                        />
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        total={totalItems}
                        pageSize={pageSize}
                        onChange={handlePageChange}
                        className="mt-2 sm:mt-0 w-full sm:w-auto justify-center"
                    />
                </div>
            </div>
        </div>
    )
}

export default ReportsListPage

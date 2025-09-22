import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Card,
    Button,
    Table,
    Tag,
    Tooltip,
    Input,
    Select,
    Badge,
    Avatar,
    Notification,
    toast,
    Drawer,
    Pagination,
} from '@/components/ui'
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineEye,
    HiOutlinePlay,
    HiOutlinePause,
    HiOutlineSearch,
    HiOutlineFilter,
    HiOutlineClock,
    HiOutlineUsers,
    HiOutlineDocumentReport,
    HiOutlineExclamation,
    HiOutlineCheckCircle,
    HiChevronUp,
    HiChevronDown,
} from 'react-icons/hi'
import SubscriptionService from '@/services/SubscriptionService'
import { usePermissionStore } from '@/store/permissionStore'
import useAuth from '@/auth/useAuth'
import type { Subscription } from '@/@types/subscription'

const { Tr, Th, Td, THead, TBody } = Table

const SubscriptionManagementPage = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [filteredSubscriptions, setFilteredSubscriptions] = useState<
        Subscription[]
    >([])
    const [loading, setLoading] = useState(true)
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedSubscription, setSelectedSubscription] =
        useState<Subscription | null>(null)
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Sorting states
    const [sortField, setSortField] = useState<'name' | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const navigate = useNavigate()
    const { hasPermission } = usePermissionStore()
    const { user } = useAuth()

    // Permission checks
    const canCreate =
        hasPermission('subscription.create') ||
        hasPermission('subscription.all') ||
        user?.authority?.includes('Tenant-Admin')
    const canEdit =
        hasPermission('subscription.edit') ||
        hasPermission('subscription.all') ||
        user?.authority?.includes('Tenant-Admin')
    const canDelete =
        hasPermission('subscription.delete') ||
        hasPermission('subscription.all') ||
        user?.authority?.includes('Tenant-Admin')
    const canView =
        hasPermission('subscription.view') ||
        hasPermission('subscription.all') ||
        user?.authority?.includes('Tenant-Admin') ||
        user?.authority?.includes('End-User')

    useEffect(() => {
        if (canView) {
            fetchSubscriptions()
        }
    }, [canView])

    useEffect(() => {
        applyFilters()
    }, [subscriptions, searchText, statusFilter, sortField, sortDirection])

    useEffect(() => {
        // Reset current page when filters change
        setCurrentPage(1)
    }, [searchText, statusFilter])

    const fetchSubscriptions = async () => {
        try {
            setLoading(true)
            const data = await SubscriptionService.getSubscriptions()
            setSubscriptions(data)
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to load subscriptions
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let filtered = subscriptions

        // Apply search filter
        if (searchText) {
            filtered = filtered.filter(
                (sub) =>
                    sub.name.toLowerCase().includes(searchText.toLowerCase()) ||
                    sub.description
                        ?.toLowerCase()
                        .includes(searchText.toLowerCase()),
            )
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((sub) => {
                switch (statusFilter) {
                    case 'active':
                        return sub.isActive
                    case 'inactive':
                        return !sub.isActive
                    case 'running':
                        return sub.executionStatus === 'Running'
                    case 'failed':
                        return sub.executionStatus === 'Failed'
                    default:
                        return true
                }
            })
        }

        // Apply sorting
        if (sortField) {
            filtered.sort((a, b) => {
                let aValue = ''
                let bValue = ''

                if (sortField === 'name') {
                    aValue = a.name.toLowerCase()
                    bValue = b.name.toLowerCase()
                }

                if (sortDirection === 'asc') {
                    return aValue.localeCompare(bValue)
                } else {
                    return bValue.localeCompare(aValue)
                }
            })
        }

        setFilteredSubscriptions(filtered)
    }

    const handleSort = (field: 'name') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Calculate pagination
    const totalItems = filteredSubscriptions.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedSubscriptions = filteredSubscriptions.slice(
        startIndex,
        endIndex,
    )

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setCurrentPage(1)
    }

    const handleDelete = async (id: number) => {
        if (!canDelete) return

        if (
            window.confirm('Are you sure you want to delete this subscription?')
        ) {
            try {
                await SubscriptionService.deleteSubscription(id)
                toast.push(
                    <Notification type="success" title="Success">
                        Subscription deleted successfully
                    </Notification>,
                )
                fetchSubscriptions()
            } catch (error) {
                console.error('Failed to delete subscription:', error)
                toast.push(
                    <Notification type="danger" title="Error">
                        Failed to delete subscription
                    </Notification>,
                )
            }
        }
    }

    const handleToggleStatus = async (subscription: Subscription) => {
        if (!canEdit) return

        try {
            await SubscriptionService.updateSubscription(subscription.id, {
                ...subscription,
                isActive: !subscription.isActive,
                scheduleStartDate: subscription.scheduleStartDate,
                scheduleEndDate: subscription.scheduleEndDate || undefined,
                reportIds: subscription.reports?.map((r) => r.reportId) || [],
                userIds:
                    (subscription.users
                        ?.map((u) => u.userId)
                        .filter(Boolean) as string[]) || [],
            })
            toast.push(
                <Notification type="success" title="Success">
                    Subscription{' '}
                    {subscription.isActive ? 'deactivated' : 'activated'}{' '}
                    successfully
                </Notification>,
            )
            fetchSubscriptions()
        } catch (error) {
            console.error('Failed to toggle subscription status:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to update subscription status
                </Notification>,
            )
        }
    }

    const getStatusTag = (subscription: Subscription) => {
        if (!subscription.isActive) {
            return <Tag className="bg-gray-100 text-gray-800">Inactive</Tag>
        }

        if (subscription.executionStatus === 'Running') {
            return <Tag className="bg-blue-100 text-blue-800">Running</Tag>
        }

        if (subscription.executionStatus === 'Failed') {
            return <Tag className="bg-red-100 text-red-800">Failed</Tag>
        }

        return <Tag className="bg-green-100 text-green-800">Active</Tag>
    }

    const formatSchedule = (subscription: Subscription) => {
        const { scheduleType, scheduleConfig } = subscription

        switch (scheduleType) {
            case 'daily':
                return `Daily at ${scheduleConfig.dailyTime || '00:00'}`
            case 'weekly':
                const days = scheduleConfig.weeklyDays
                    ?.map((d) => {
                        const dayNames = [
                            'Sun',
                            'Mon',
                            'Tue',
                            'Wed',
                            'Thu',
                            'Fri',
                            'Sat',
                        ]
                        return dayNames[d]
                    })
                    .join(', ')
                return `Weekly on ${days} at ${scheduleConfig.weeklyTime || '00:00'}`
            case 'monthly':
                if (scheduleConfig.lastDayOfMonth) {
                    return `Monthly on last day at ${scheduleConfig.monthlyTime || '00:00'}`
                }
                return `Monthly on day ${scheduleConfig.monthlyDay} at ${scheduleConfig.monthlyTime || '00:00'}`
            default:
                return scheduleType
        }
    }

    const showDetails = (subscription: Subscription) => {
        setSelectedSubscription(subscription)
        setIsDetailDrawerOpen(true)
    }

    if (!canView) {
        return (
            <div className="p-6">
                <Card className="p-6 text-center">
                    <HiOutlineExclamation className="text-red-500 text-4xl mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        Access Denied
                    </h3>
                    <p className="text-gray-600">
                        You don't have permission to view subscriptions.
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header and Filters Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h4 className="mb-1">Subscription Management</h4>
                        <p className="text-gray-600">
                            Manage automated report subscriptions and their
                            schedules
                        </p>
                    </div>
                    {canCreate && (
                        <Button
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={() => navigate('/subscriptions/create')}
                            className="w-full sm:w-auto"
                        >
                            <span className="hidden sm:inline">
                                Create Subscription
                            </span>
                            <span className="sm:hidden">Create</span>
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search subscriptions..."
                            prefix={<HiOutlineSearch />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 items-center">
                        <HiOutlineFilter className="text-gray-400 hidden sm:block" />
                        <Select
                            value={{
                                value: statusFilter,
                                label:
                                    statusFilter === 'all'
                                        ? 'All Status'
                                        : statusFilter === 'active'
                                          ? 'Active'
                                          : statusFilter === 'inactive'
                                            ? 'Inactive'
                                            : statusFilter === 'running'
                                              ? 'Running'
                                              : statusFilter === 'failed'
                                                ? 'Failed'
                                                : 'All Status',
                            }}
                            onChange={(option: any) =>
                                setStatusFilter(option?.value || 'all')
                            }
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'active', label: 'Active' },
                                {
                                    value: 'inactive',
                                    label: 'Inactive',
                                },
                                { value: 'running', label: 'Running' },
                                { value: 'failed', label: 'Failed' },
                            ]}
                            className="w-full sm:min-w-[140px]"
                        />
                    </div>
                </div>
            </Card>

            {/* Content Card */}
            <Card className="overflow-hidden">
                {/* Mobile Card View */}
                <div className="block lg:hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            Loading subscriptions...
                        </div>
                    ) : filteredSubscriptions.length === 0 ? (
                        <div className="p-8 text-center">
                            {subscriptions.length === 0 ? (
                                <div>
                                    <HiOutlineClock className="text-gray-400 text-3xl mx-auto mb-3" />
                                    <p className="text-gray-600 mb-3">
                                        No subscriptions found
                                    </p>
                                    {canCreate && (
                                        <Button
                                            variant="solid"
                                            size="sm"
                                            onClick={() =>
                                                navigate(
                                                    '/subscriptions/create',
                                                )
                                            }
                                        >
                                            Create First Subscription
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-600">
                                    No subscriptions match your filters
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {paginatedSubscriptions.map((subscription) => (
                                <div
                                    key={subscription.id}
                                    className="p-4 space-y-3"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-base">
                                                {subscription.name}
                                            </h3>
                                            {subscription.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {subscription.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            {getStatusTag(subscription)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-500">
                                                Schedule:
                                            </span>
                                            <div className="mt-1">
                                                {formatSchedule(subscription)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">
                                                Next Run:
                                            </span>
                                            <div className="mt-1">
                                                {subscription.nextExecutionAt ? (
                                                    new Date(
                                                        subscription.nextExecutionAt,
                                                    ).toLocaleDateString()
                                                ) : (
                                                    <span className="text-gray-400">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <HiOutlineDocumentReport className="text-gray-400" />
                                                <span>
                                                    {subscription.reports
                                                        ?.length || 0}{' '}
                                                    reports
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <HiOutlineUsers className="text-gray-400" />
                                                <span>
                                                    {subscription.users
                                                        ?.length || 0}{' '}
                                                    users
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="xs"
                                                variant="plain"
                                                icon={<HiOutlineEye />}
                                                onClick={() =>
                                                    showDetails(subscription)
                                                }
                                            />
                                            {canEdit && (
                                                <>
                                                    <Button
                                                        size="xs"
                                                        variant="plain"
                                                        icon={
                                                            <HiOutlinePencil />
                                                        }
                                                        onClick={() =>
                                                            navigate(
                                                                `/subscriptions/edit/${subscription.id}`,
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        size="xs"
                                                        variant="plain"
                                                        icon={
                                                            subscription.isActive ? (
                                                                <HiOutlinePause />
                                                            ) : (
                                                                <HiOutlinePlay />
                                                            )
                                                        }
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                subscription,
                                                            )
                                                        }
                                                    />
                                                </>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    size="xs"
                                                    variant="plain"
                                                    icon={<HiOutlineTrash />}
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() =>
                                                        handleDelete(
                                                            subscription.id,
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <Table>
                        <THead>
                            <Tr>
                                <Th>
                                    <button
                                        className="flex items-center gap-1 hover:text-blue-600"
                                        onClick={() => handleSort('name')}
                                    >
                                        Subscription
                                        {sortField === 'name' &&
                                            (sortDirection === 'asc' ? (
                                                <HiChevronUp className="w-4 h-4" />
                                            ) : (
                                                <HiChevronDown className="w-4 h-4" />
                                            ))}
                                    </button>
                                </Th>
                                <Th>Schedule</Th>
                                <Th>Status</Th>
                                <Th>Reports</Th>
                                <Th>Recipients</Th>
                                <Th>Last Execution</Th>
                                <Th>Next Execution</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {loading ? (
                                <Tr>
                                    <Td
                                        colSpan={8}
                                        className="text-center py-8"
                                    >
                                        Loading subscriptions...
                                    </Td>
                                </Tr>
                            ) : filteredSubscriptions.length === 0 ? (
                                <Tr>
                                    <Td
                                        colSpan={8}
                                        className="text-center py-8"
                                    >
                                        {subscriptions.length === 0 ? (
                                            <div>
                                                <HiOutlineClock className="text-gray-400 text-3xl mx-auto mb-3" />
                                                <p className="text-gray-600">
                                                    No subscriptions found
                                                </p>
                                                {canCreate && (
                                                    <Button
                                                        className="mt-3"
                                                        variant="solid"
                                                        size="sm"
                                                        onClick={() =>
                                                            navigate(
                                                                '/subscriptions/create',
                                                            )
                                                        }
                                                    >
                                                        Create First
                                                        Subscription
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-gray-600">
                                                No subscriptions match your
                                                filters
                                            </p>
                                        )}
                                    </Td>
                                </Tr>
                            ) : (
                                paginatedSubscriptions.map((subscription) => (
                                    <Tr key={subscription.id}>
                                        <Td>
                                            <div>
                                                <div className="font-semibold">
                                                    {subscription.name}
                                                </div>
                                                {subscription.description && (
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {
                                                            subscription.description
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="text-sm">
                                                {formatSchedule(subscription)}
                                            </div>
                                        </Td>
                                        <Td>{getStatusTag(subscription)}</Td>
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                <HiOutlineDocumentReport className="text-gray-400" />
                                                <span className="text-sm">
                                                    {subscription.reports
                                                        ?.length || 0}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                <HiOutlineUsers className="text-gray-400" />
                                                <span className="text-sm">
                                                    {subscription.users
                                                        ?.length || 0}
                                                </span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="text-sm">
                                                {subscription.lastExecutedAt ? (
                                                    <Tooltip
                                                        title={new Date(
                                                            subscription.lastExecutedAt,
                                                        ).toLocaleString()}
                                                    >
                                                        <span>
                                                            {new Date(
                                                                subscription.lastExecutedAt,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </Tooltip>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Never
                                                    </span>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="text-sm">
                                                {subscription.nextExecutionAt ? (
                                                    <Tooltip
                                                        title={new Date(
                                                            subscription.nextExecutionAt,
                                                        ).toLocaleString()}
                                                    >
                                                        <span>
                                                            {new Date(
                                                                subscription.nextExecutionAt,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </Tooltip>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                <Tooltip title="View Details">
                                                    <Button
                                                        size="xs"
                                                        variant="plain"
                                                        icon={<HiOutlineEye />}
                                                        onClick={() =>
                                                            showDetails(
                                                                subscription,
                                                            )
                                                        }
                                                    />
                                                </Tooltip>
                                                {canEdit && (
                                                    <>
                                                        <Tooltip title="Edit">
                                                            <Button
                                                                size="xs"
                                                                variant="plain"
                                                                icon={
                                                                    <HiOutlinePencil />
                                                                }
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/subscriptions/edit/${subscription.id}`,
                                                                    )
                                                                }
                                                            />
                                                        </Tooltip>
                                                        <Tooltip
                                                            title={
                                                                subscription.isActive
                                                                    ? 'Deactivate'
                                                                    : 'Activate'
                                                            }
                                                        >
                                                            <Button
                                                                size="xs"
                                                                variant="plain"
                                                                icon={
                                                                    subscription.isActive ? (
                                                                        <HiOutlinePause />
                                                                    ) : (
                                                                        <HiOutlinePlay />
                                                                    )
                                                                }
                                                                onClick={() =>
                                                                    handleToggleStatus(
                                                                        subscription,
                                                                    )
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </>
                                                )}
                                                {canDelete && (
                                                    <Tooltip title="Delete">
                                                        <Button
                                                            size="xs"
                                                            variant="plain"
                                                            icon={
                                                                <HiOutlineTrash />
                                                            }
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    subscription.id,
                                                                )
                                                            }
                                                        />
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </TBody>
                    </Table>
                </div>
            </Card>

            {/* Pagination */}
            {totalItems > 0 && (
                <Card>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-700">
                                Showing {startIndex + 1} to{' '}
                                {Math.min(endIndex, totalItems)} of {totalItems}{' '}
                                subscriptions
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700">
                                    Items per page:
                                </span>
                                <Select
                                    value={{
                                        value: pageSize,
                                        label: pageSize.toString(),
                                    }}
                                    onChange={(option: any) =>
                                        handlePageSizeChange(
                                            option?.value || 10,
                                        )
                                    }
                                    options={[
                                        { value: 5, label: '5' },
                                        { value: 10, label: '10' },
                                        { value: 20, label: '20' },
                                        { value: 50, label: '50' },
                                    ]}
                                    className="w-20"
                                />
                            </div>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            total={totalItems}
                            pageSize={pageSize}
                            onChange={handlePageChange}
                        />
                    </div>
                </Card>
            )}

            {/* Detail Drawer */}
            <Drawer
                title="Subscription Details"
                isOpen={isDetailDrawerOpen}
                onClose={() => setIsDetailDrawerOpen(false)}
                width={500}
            >
                {selectedSubscription && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h4 className="text-lg font-semibold mb-3">
                                Basic Information
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Name
                                    </label>
                                    <p className="mt-1">
                                        {selectedSubscription.name}
                                    </p>
                                </div>
                                {selectedSubscription.description && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">
                                            Description
                                        </label>
                                        <p className="mt-1">
                                            {selectedSubscription.description}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Status
                                    </label>
                                    <div className="mt-1">
                                        {getStatusTag(selectedSubscription)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Info */}
                        <div>
                            <h4 className="text-lg font-semibold mb-3">
                                Schedule
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Schedule
                                    </label>
                                    <p className="mt-1">
                                        {formatSchedule(selectedSubscription)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Start Date
                                    </label>
                                    <p className="mt-1">
                                        {new Date(
                                            selectedSubscription.scheduleStartDate,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                {selectedSubscription.scheduleEndDate && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">
                                            End Date
                                        </label>
                                        <p className="mt-1">
                                            {new Date(
                                                selectedSubscription.scheduleEndDate,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Email Info */}
                        <div>
                            <h4 className="text-lg font-semibold mb-3">
                                Email Configuration
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Subject
                                    </label>
                                    <p className="mt-1 break-words">
                                        {selectedSubscription.emailSubject}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Body
                                    </label>
                                    <div className="mt-1 p-3 bg-gray-50 rounded text-sm break-words">
                                        {selectedSubscription.emailBody}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reports */}
                        <div>
                            <h4 className="text-lg font-semibold mb-3">
                                Reports (
                                {selectedSubscription.reports?.length || 0})
                            </h4>
                            {selectedSubscription.reports?.length ? (
                                <div className="space-y-2">
                                    {selectedSubscription.reports.map(
                                        (report) => (
                                            <div
                                                key={report.id}
                                                className="p-3 bg-gray-50 rounded"
                                            >
                                                <div className="font-medium break-words">
                                                    {report.reportName}
                                                </div>
                                                {report.reportDescription && (
                                                    <div className="text-sm text-gray-600 mt-1 break-words">
                                                        {
                                                            report.reportDescription
                                                        }
                                                    </div>
                                                )}
                                                {report.workspaceName && (
                                                    <div className="text-xs text-gray-500 mt-1 break-words">
                                                        Workspace:{' '}
                                                        {report.workspaceName}
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500">
                                    No reports assigned
                                </p>
                            )}
                        </div>

                        {/* Recipients */}
                        <div>
                            <h4 className="text-lg font-semibold mb-3">
                                Recipients (
                                {selectedSubscription.users?.length || 0})
                            </h4>
                            {selectedSubscription.users?.length ? (
                                <div className="space-y-2">
                                    {selectedSubscription.users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded"
                                        >
                                            <Avatar size="sm" />
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium break-words">
                                                    {user.userName}
                                                </div>
                                                <div className="text-sm text-gray-600 break-words">
                                                    {user.userEmail}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">
                                    No recipients assigned
                                </p>
                            )}
                        </div>

                        {/* Execution History */}
                        {selectedSubscription.recentExecutions?.length && (
                            <div>
                                <h4 className="text-lg font-semibold mb-3">
                                    Recent Executions
                                </h4>
                                <div className="space-y-2">
                                    {selectedSubscription.recentExecutions
                                        .slice(0, 5)
                                        .map((execution) => (
                                            <div
                                                key={execution.id}
                                                className="p-3 bg-gray-50 rounded"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {execution.status ===
                                                        'Success' ? (
                                                            <HiOutlineCheckCircle className="text-green-500" />
                                                        ) : (
                                                            <HiOutlineExclamation className="text-red-500" />
                                                        )}
                                                        <span className="text-sm font-medium">
                                                            {execution.status}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(
                                                            execution.executedAt,
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    Sent: {execution.emailsSent}
                                                    , Failed:{' '}
                                                    {execution.emailsFailed}
                                                </div>
                                                {execution.errorDetails && (
                                                    <div className="text-xs text-red-600 mt-1 break-words">
                                                        {execution.errorDetails}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    )
}

export default SubscriptionManagementPage

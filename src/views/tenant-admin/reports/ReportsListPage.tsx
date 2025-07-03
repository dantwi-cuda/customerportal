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
} from 'react-icons/hi'
import EllipsisButton from '@/components/shared/EllipsisButton'
import * as ReportService from '@/services/ReportService'
import { useNavigate } from 'react-router-dom'
import type { Report, ReportCategory } from '@/@types/report'
import useAuth from '@/auth/useAuth'
import type { SingleValue } from 'react-select'

// Types for Select component
interface SelectOption {
    value: string
    label: string
}

const ReportsListPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    // State management
    const [reports, setReports] = useState<Report[]>([])
    const [categories, setCategories] = useState<ReportCategory[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    // Sorting state
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Tenant admin check: User must have a tenantId to manage reports
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (isTenantAdmin) {
            fetchReports()
            fetchCategories()
        }
    }, [user])

    // Reset to first page when search text or selected category changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchText, selectedCategory])

    const fetchReports = async () => {
        setLoading(true)
        try {
            const data = await ReportService.getReportsList({
                categoryId:
                    selectedCategory !== 'all' ? selectedCategory : undefined,
                search: searchText || undefined,
            })
            setReports(data)
        } catch (error) {
            console.error('Error fetching reports:', error)
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
            const data = await ReportService.getCategories()
            setCategories(data)
        } catch (error) {
            console.error('Error fetching categories:', error)
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

    const handleLaunchReport = (report: Report) => {
        navigate(`/tenantportal/tenant/reports/${report.id}/view`)
    }

    const handleToggleApproval = async (report: Report) => {
        try {
            const updatedReport = {
                ...report,
                isApproved: !report.isApproved,
            }
            await ReportService.updateReport(report.id, updatedReport)
            await fetchReports()
            toast.push(
                <Notification
                    type="success"
                    title={`Report ${updatedReport.isApproved ? 'approved' : 'unapproved'}`}
                >
                    {report.name} has been{' '}
                    {updatedReport.isApproved ? 'approved' : 'unapproved'}
                </Notification>,
            )
        } catch (error) {
            console.error('Error updating report:', error)
            toast.push(
                <Notification type="danger" title="Error updating report">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        }
    }

    const handleToggleEnabled = async (report: Report) => {
        try {
            const updatedReport = {
                ...report,
                isEnabled: !report.isEnabled,
            }
            await ReportService.updateReport(report.id, updatedReport)
            await fetchReports()
            toast.push(
                <Notification
                    type="success"
                    title={`Report ${updatedReport.isEnabled ? 'enabled' : 'disabled'}`}
                >
                    {report.name} has been{' '}
                    {updatedReport.isEnabled ? 'enabled' : 'disabled'}
                </Notification>,
            )
        } catch (error) {
            console.error('Error updating report:', error)
            toast.push(
                <Notification type="danger" title="Error updating report">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        }
    }

    // Filter and sort reports
    const filteredAndSortedReports = useMemo(() => {
        // First filter by search text
        let filtered = reports

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
            }
            return 0
        })

        return sorted
    }, [reports, sortField, sortDirection])

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

    const handlePageSizeChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        const newSize = parseInt(newValue.value, 10)
        setPageSize(newSize)
        setCurrentPage(1) // Reset to first page when page size changes
    }

    const handleCategoryChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        setSelectedCategory(newValue.value)
        fetchReports()
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
        <div className="p-2 sm:p-4">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h3 className="text-lg font-medium text-center md:text-left">
                    Reports
                </h3>{' '}
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-2 w-full md:w-auto">
                    <Input
                        prefix={<HiOutlineSearch className="text-lg" />}
                        placeholder="Search reports..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full sm:w-60"
                    />
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiOutlineSearch />}
                        onClick={fetchReports}
                        className="w-full sm:w-auto"
                    >
                        Search
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiOutlineAdjustments />}
                        onClick={() =>
                            navigate('/tenantportal/tenant/reports/bulk-assign')
                        }
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                    >
                        Bulk Category Assignment
                    </Button>
                </div>
            </div>

            {/* Category filter */}
            <div className="mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Filter by Category:
                    </label>
                    <Select
                        options={categoryOptions}
                        value={categoryOptions.find(
                            (option) => option.value === selectedCategory,
                        )}
                        onChange={handleCategoryChange}
                        className="min-w-[200px] w-full sm:w-auto"
                    />
                </div>
            </div>

            <Card className="px-0 sm:px-4">
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-4 sm:-mx-0">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
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
                                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="hidden sm:table-cell px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                                            colSpan={7}
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
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {report.name}
                                                </div>
                                                {/* Show category and status on mobile */}
                                                <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="truncate max-w-[150px]">
                                                            {report.categoryName ||
                                                                'No category'}
                                                        </span>
                                                        <Tag
                                                            className={`rounded-full px-2 whitespace-nowrap ml-2 ${
                                                                report.isEnabled
                                                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                                    : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
                                                            }`}
                                                        >
                                                            {report.isEnabled
                                                                ? 'Enabled'
                                                                : 'Disabled'}
                                                        </Tag>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4">
                                                <div className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                                                    {report.description ||
                                                        'No description'}
                                                </div>
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4">
                                                <div className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                                                    {report.categoryName ||
                                                        'Uncategorized'}
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-center">
                                                <Tag
                                                    className={`rounded-full px-2 whitespace-nowrap ${
                                                        report.isEnabled
                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                            : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
                                                    }`}
                                                >
                                                    {report.isEnabled
                                                        ? 'Enabled'
                                                        : 'Disabled'}
                                                </Tag>
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4 text-center">
                                                {report.isApproved ? (
                                                    <HiOutlineBadgeCheck className="w-5 h-5 text-emerald-500 mx-auto" />
                                                ) : (
                                                    <span className="text-gray-400 text-sm">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4 text-center">
                                                <Switcher
                                                    checked={report.isEnabled}
                                                    onChange={() =>
                                                        handleToggleEnabled(
                                                            report,
                                                        )
                                                    }
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
                                                        {/* Show approve/unapprove option */}
                                                        <Dropdown.Item
                                                            eventKey="approve"
                                                            onClick={() =>
                                                                handleToggleApproval(
                                                                    report,
                                                                )
                                                            }
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <HiOutlineBadgeCheck className="text-lg" />
                                                                <span>
                                                                    {report.isApproved
                                                                        ? 'Unapprove'
                                                                        : 'Approve'}
                                                                </span>
                                                            </span>
                                                        </Dropdown.Item>

                                                        {/* Show enable/disable option for small screens */}
                                                        <Dropdown.Item
                                                            className="sm:hidden"
                                                            eventKey="toggle"
                                                            onClick={() =>
                                                                handleToggleEnabled(
                                                                    report,
                                                                )
                                                            }
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <span
                                                                    className={`h-2 w-2 rounded-full ${report.isEnabled ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                                ></span>
                                                                <span>
                                                                    {report.isEnabled
                                                                        ? 'Disable'
                                                                        : 'Enable'}
                                                                </span>
                                                            </span>
                                                        </Dropdown.Item>

                                                        {/* Launch Report option */}
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

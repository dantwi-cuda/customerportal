import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Input,
    Button,
    Tag,
    Notification,
    toast,
    Select,
    Pagination,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlineChevronLeft,
    HiOutlineSave,
    HiOutlineAdjustments,
    HiOutlineCheckCircle,
} from 'react-icons/hi'
import * as ReportService from '@/services/ReportService'
import { useNavigate } from 'react-router-dom'
import type { Report, ReportCategory } from '@/@types/report'
import useAuth from '@/auth/useAuth'
import type { SingleValue } from 'react-select'
import paginate from '@/utils/paginate'

// Types for Select component
interface SelectOption {
    value: string
    label: string
}

// Page size options
interface PageSizeOption {
    value: number
    label: string
}

const pageSizeOptions: PageSizeOption[] = [
    { value: 5, label: '5 / page' },
    { value: 10, label: '10 / page' },
    { value: 20, label: '20 / page' },
    { value: 50, label: '50 / page' },
]

const BulkCategoryAssignmentPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    // State management
    const [reports, setReports] = useState<Report[]>([])
    const [categories, setCategories] = useState<ReportCategory[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [selectedReports, setSelectedReports] = useState<Set<string>>(
        new Set(),
    )
    const [selectedCategory, setSelectedCategory] = useState<string>('')

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

    const fetchReports = async () => {
        setLoading(true)
        try {
            const data = await ReportService.getReportsList({
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

    // Filter reports based on search text
    const filteredReports = useMemo(() => {
        if (!searchText) return reports

        return reports.filter(
            (report) =>
                report.name.toLowerCase().includes(searchText.toLowerCase()) ||
                (report.description &&
                    report.description
                        .toLowerCase()
                        .includes(searchText.toLowerCase())) ||
                (report.categoryName &&
                    report.categoryName
                        .toLowerCase()
                        .includes(searchText.toLowerCase())),
        )
    }, [reports, searchText])

    // Paginated reports
    const paginatedReports = useMemo(() => {
        return paginate(filteredReports, pageSize, currentPage)
    }, [filteredReports, pageSize, currentPage])

    // Total count for pagination
    const totalReports = filteredReports.length

    // Category options for dropdown
    const categoryOptions = useMemo(() => {
        const options: SelectOption[] = []
        categories.forEach((category) => {
            options.push({
                value: category.id.toString(),
                label: category.name,
            })
        })
        return options
    }, [categories])

    const handleReportSelection = (reportId: string, isSelected: boolean) => {
        const newSelection = new Set(selectedReports)
        if (isSelected) {
            newSelection.add(reportId)
        } else {
            newSelection.delete(reportId)
        }
        setSelectedReports(newSelection)
    }

    const handleSelectAll = (isSelected: boolean) => {
        const newSelection = new Set(selectedReports)

        if (isSelected) {
            // Add all reports from current page to selection
            paginatedReports.forEach((report) => {
                newSelection.add(report.id)
            })
        } else {
            // Remove all reports from current page from selection
            paginatedReports.forEach((report) => {
                newSelection.delete(report.id)
            })
        }

        setSelectedReports(newSelection)
    }

    const handlePaginationChange = (page: number) => {
        setCurrentPage(page)
    }

    const handlePageSizeChange = (option: PageSizeOption | null) => {
        if (option) {
            setPageSize(option.value)
            setCurrentPage(1) // Reset to first page when changing page size
        }
    }

    const handleCategoryChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        setSelectedCategory(newValue.value)
    }

    const handleBulkAssignment = async () => {
        if (selectedReports.size === 0) {
            toast.push(
                <Notification type="warning" title="No reports selected">
                    Please select at least one report to assign a category.
                </Notification>,
            )
            return
        }

        if (!selectedCategory) {
            toast.push(
                <Notification type="warning" title="No category selected">
                    Please select a category to assign.
                </Notification>,
            )
            return
        }

        setSaving(true)
        try {
            const selectedCategoryData = categories.find(
                (cat) => cat.id.toString() === selectedCategory,
            )

            await ReportService.bulkChangeReportCategory(
                Array.from(selectedReports),
                parseInt(selectedCategory, 10),
            )

            toast.push(
                <Notification
                    type="success"
                    title="Categories assigned successfully"
                >
                    {selectedReports.size} report(s) assigned to{' '}
                    {selectedCategoryData?.name || 'selected category'}
                </Notification>,
            )

            // Reset selections and refresh data
            setSelectedReports(new Set())
            setSelectedCategory('')
            await fetchReports()
        } catch (error) {
            console.error('Error assigning categories:', error)
            toast.push(
                <Notification type="danger" title="Error assigning categories">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleBack = () => {
        navigate('/tenantportal/tenant/reports')
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
    const isAllSelected =
        paginatedReports.length > 0 &&
        paginatedReports.every((report) => selectedReports.has(report.id))
    const isIndeterminate =
        paginatedReports.some((report) => selectedReports.has(report.id)) &&
        !isAllSelected

    return (
        <div className="p-2 sm:p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<HiOutlineChevronLeft />}
                        onClick={handleBack}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Back to Reports
                    </Button>
                </div>
                <div className="flex items-center gap-3">
                    <HiOutlineAdjustments className="text-2xl text-blue-600" />
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Bulk Category Assignment
                    </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Select multiple reports and assign them to a category
                </p>
            </div>

            {/* Assignment Controls */}
            <Card className="mb-6 p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                    <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Category
                        </label>
                        <Select
                            options={categoryOptions}
                            value={categoryOptions.find(
                                (option) => option.value === selectedCategory,
                            )}
                            onChange={handleCategoryChange}
                            placeholder="Choose a category..."
                            className="w-full"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedReports.size} report(s) selected
                        </div>
                        <Button
                            size="md"
                            variant="solid"
                            icon={<HiOutlineSave />}
                            onClick={handleBulkAssignment}
                            loading={saving}
                            disabled={
                                selectedReports.size === 0 || !selectedCategory
                            }
                            className="whitespace-nowrap"
                        >
                            Assign Category
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Search */}
            <div className="mb-4">
                <div className="flex gap-2">
                    <Input
                        prefix={<HiOutlineSearch className="text-lg" />}
                        placeholder="Search reports..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="flex-1"
                    />
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiOutlineSearch />}
                        onClick={fetchReports}
                    >
                        Search
                    </Button>
                </div>
            </div>

            {/* Reports Table */}
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
                                    {' '}
                                    <th className="px-4 sm:px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={(e) =>
                                                handleSelectAll(
                                                    e.target.checked,
                                                )
                                            }
                                            className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500 rounded"
                                        />
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Report Name
                                    </th>
                                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Current Category
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>{' '}
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {paginatedReports.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-4 text-center text-gray-500"
                                        >
                                            No reports found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedReports.map((report) => (
                                        <tr
                                            key={report.id}
                                            className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                                selectedReports.has(report.id)
                                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                                    : ''
                                            }`}
                                        >
                                            {' '}
                                            <td className="px-4 sm:px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedReports.has(
                                                        report.id,
                                                    )}
                                                    onChange={(e) =>
                                                        handleReportSelection(
                                                            report.id,
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500 rounded"
                                                />
                                            </td>
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
                                                <div className="flex items-center gap-2">
                                                    {report.categoryName ? (
                                                        <>
                                                            <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                {
                                                                    report.categoryName
                                                                }
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400 italic">
                                                            Uncategorized
                                                        </span>
                                                    )}
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
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Pagination Controls */}
            {totalReports > 0 && (
                <div className="flex items-center justify-between mt-4">
                    <Pagination
                        pageSize={pageSize}
                        currentPage={currentPage}
                        total={totalReports}
                        onChange={handlePaginationChange}
                    />
                    <div style={{ minWidth: 130 }}>
                        <Select<PageSizeOption>
                            size="sm"
                            isSearchable={false}
                            value={pageSizeOptions.find(
                                (option) => option.value === pageSize,
                            )}
                            options={pageSizeOptions}
                            onChange={handlePageSizeChange}
                            placeholder="Page size"
                        />
                    </div>
                </div>
            )}

            {/* Summary */}
            {selectedReports.size > 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HiOutlineCheckCircle className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                                {selectedReports.size} report(s) selected
                            </span>
                        </div>
                        {selectedCategory && (
                            <div className="text-sm text-blue-700 dark:text-blue-200">
                                Will be assigned to:{' '}
                                <span className="font-medium">
                                    {
                                        categories.find(
                                            (cat) =>
                                                cat.id.toString() ===
                                                selectedCategory,
                                        )?.name
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default BulkCategoryAssignmentPage

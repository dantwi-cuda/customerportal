import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    Tag,
    Notification,
    toast,
    Dialog,
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
    HiOutlineStar,
} from 'react-icons/hi'
import EllipsisButton from '@/components/shared/EllipsisButton'
import * as ReportService from '@/services/ReportService'
import { useNavigate } from 'react-router-dom'
import type { ReportCategory } from '@/@types/report'
import useAuth from '@/auth/useAuth'
import type { SingleValue } from 'react-select'

// Types for Select component
interface SelectOption {
    value: string
    label: string
}

const ReportCategoriesListPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const [categories, setCategories] = useState<ReportCategory[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [updatingCategories, setUpdatingCategories] = useState<Set<number>>(
        new Set(),
    )

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean
        category?: ReportCategory
    }>({ open: false })

    // Tenant admin check: User must have a tenantId to manage report categories
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (isTenantAdmin) {
            fetchCategories()
        }
    }, [user])

    // Reset to first page when search text changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchText])

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const data = await ReportService.getCategories()
            setCategories(data)
        } catch (error) {
            console.error('Error fetching categories:', error)
            toast.push(
                <Notification type="danger" title="Error fetching categories">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCategory = () => {
        navigate('/tenantportal/tenant/report-categories/new')
    }

    const handleEditCategory = (category: ReportCategory) => {
        navigate(`/tenantportal/tenant/report-categories/${category.id}/edit`)
    }

    const handleDeleteCategory = (category: ReportCategory) => {
        setDeleteDialog({ open: true, category })
    }

    const handleConfirmDelete = async () => {
        if (!deleteDialog.category) return

        try {
            await ReportService.deleteCategory(deleteDialog.category.id)
            await fetchCategories()
            setDeleteDialog({ open: false })
            toast.push(
                <Notification type="success" title="Category deleted">
                    Category has been deleted successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Error deleting category:', error)
            toast.push(
                <Notification type="danger" title="Error deleting category">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        }
    }

    const handleAssignments = (category: ReportCategory) => {
        navigate(
            `/tenantportal/tenant/report-categories/${category.id}/assignments`,
        )
    }

    const handleSetDefault = async (category: ReportCategory) => {
        try {
            await ReportService.setDefaultCategory(category.id)
            await fetchCategories()
            toast.push(
                <Notification type="success" title="Default category set">
                    {category.name} is now the default category
                </Notification>,
            )
        } catch (error) {
            console.error('Error setting default category:', error)
            toast.push(
                <Notification type="danger" title="Error setting default">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        }
    }

    const handleToggleEnabled = async (category: ReportCategory) => {
        // Prevent multiple simultaneous updates for the same category
        if (updatingCategories.has(category.id)) return

        try {
            // Add category to updating set
            setUpdatingCategories((prev) => new Set([...prev, category.id]))

            // Create updated category with toggled isActive status
            const updatedCategory = {
                ...category,
                isActive: !category.isActive,
            }

            // Update via API
            await ReportService.updateCategory(category.id, updatedCategory)

            // Update local state immediately for better UX
            setCategories((prevCategories) =>
                prevCategories.map((cat) =>
                    cat.id === category.id
                        ? { ...cat, isActive: !cat.isActive }
                        : cat,
                ),
            )

            toast.push(
                <Notification
                    type="success"
                    title={`Category ${updatedCategory.isActive ? 'enabled' : 'disabled'}`}
                >
                    {category.name} has been{' '}
                    {updatedCategory.isActive ? 'enabled' : 'disabled'}
                </Notification>,
            )
        } catch (error) {
            console.error('Error updating category:', error)
            toast.push(
                <Notification type="danger" title="Error updating category">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            // Remove category from updating set
            setUpdatingCategories((prev) => {
                const newSet = new Set(prev)
                newSet.delete(category.id)
                return newSet
            })
        }
    }

    // Filter categories based on search text
    const filteredCategories = categories.filter((category) => {
        const searchLower = searchText.toLowerCase()
        return (
            category.name.toLowerCase().includes(searchLower) ||
            (category.description || '').toLowerCase().includes(searchLower) ||
            (category.systemName || '').toLowerCase().includes(searchLower)
        )
    })

    // Calculate pagination
    const totalItems = filteredCategories.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Page size dropdown options
    const pageSizeOptions = [
        { value: '5', label: '5' },
        { value: '10', label: '10' },
        { value: '20', label: '20' },
        { value: '50', label: '50' },
        { value: '100', label: '100' },
    ]

    const handlePageSizeChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        const newSize = parseInt(newValue.value, 10)
        setPageSize(newSize)
        setCurrentPage(1) // Reset to first page when page size changes
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
                        <h4 className="mb-1">Report Categories</h4>
                        <p className="text-gray-600 text-sm">
                            Manage report categories and their settings
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <Input
                            prefix={<HiOutlineSearch className="text-lg" />}
                            placeholder="Search categories..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full sm:w-60"
                        />
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={handleCreateCategory}
                            className="w-full sm:w-auto"
                        >
                            Create Category
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Content Card */}
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
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="hidden sm:table-cell px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Default
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
                                {paginatedCategories.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-4 text-center text-gray-500"
                                        >
                                            No categories found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCategories.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="px-4 sm:px-6 py-4">
                                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {category.name}
                                                </div>
                                                {/* Show description on mobile as part of name cell */}
                                                <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] truncate">
                                                    {category.description ||
                                                        'No description'}
                                                    {/* Show default indicator in name cell on mobile */}
                                                    {category.isDefault && (
                                                        <span className="ml-2 inline-flex items-center">
                                                            <HiOutlineStar className="w-4 h-4 text-yellow-500" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4">
                                                <div className="max-w-xs truncate text-gray-600 dark:text-gray-400">
                                                    {category.description ||
                                                        'No description'}
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-center">
                                                <Tag
                                                    className={`rounded-full px-2 whitespace-nowrap ${
                                                        category.isActive
                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                            : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
                                                    }`}
                                                >
                                                    {category.isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Tag>
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4 text-center">
                                                {category.isDefault && (
                                                    <HiOutlineStar className="w-5 h-5 text-yellow-500 mx-auto" />
                                                )}
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4 text-center">
                                                <Switcher
                                                    checked={category.isActive}
                                                    onChange={() =>
                                                        handleToggleEnabled(
                                                            category,
                                                        )
                                                    }
                                                    disabled={
                                                        loading ||
                                                        updatingCategories.has(
                                                            category.id,
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
                                                        {/* Show enable/disable option for small screens */}
                                                        <Dropdown.Item
                                                            className="sm:hidden"
                                                            eventKey="toggle"
                                                            disabled={updatingCategories.has(
                                                                category.id,
                                                            )}
                                                            onClick={() =>
                                                                handleToggleEnabled(
                                                                    category,
                                                                )
                                                            }
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <span
                                                                    className={`h-2 w-2 rounded-full ${category.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                                ></span>
                                                                <span>
                                                                    {category.isActive
                                                                        ? 'Disable'
                                                                        : 'Enable'}
                                                                </span>
                                                            </span>
                                                        </Dropdown.Item>
                                                        <Dropdown.Item
                                                            eventKey="edit"
                                                            onClick={() =>
                                                                handleEditCategory(
                                                                    category,
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
                                                        <Dropdown.Item
                                                            eventKey="assign"
                                                            onClick={() =>
                                                                handleAssignments(
                                                                    category,
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
                                                        {!category.isDefault && (
                                                            <Dropdown.Item
                                                                eventKey="default"
                                                                onClick={() =>
                                                                    handleSetDefault(
                                                                        category,
                                                                    )
                                                                }
                                                            >
                                                                <span className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                                                                    <HiOutlineStar className="text-lg" />
                                                                    <span>
                                                                        Set
                                                                        Default
                                                                    </span>
                                                                </span>
                                                            </Dropdown.Item>
                                                        )}
                                                        <Dropdown.Item
                                                            eventKey="delete"
                                                            onClick={() =>
                                                                handleDeleteCategory(
                                                                    category,
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
                        {filteredCategories.length > 0 ? startIndex + 1 : 0}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                        {endIndex}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                        {totalItems}
                    </span>{' '}
                    categories
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
            {/* Delete Confirmation Dialog */}
            <Dialog
                isOpen={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false })}
                onRequestClose={() => setDeleteDialog({ open: false })}
                style={{
                    content: {
                        maxWidth: '90%',
                        width: '450px',
                        margin: 'auto',
                    },
                }}
            >
                <h4 className="mb-4">Delete Category</h4>
                <p className="mb-6">
                    Are you sure you want to delete "
                    <span className="font-semibold">
                        {deleteDialog.category?.name}
                    </span>
                    "? This action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button
                        variant="default"
                        onClick={() => setDeleteDialog({ open: false })}
                        className="w-full sm:w-auto order-2 sm:order-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        onClick={handleConfirmDelete}
                        className="w-full sm:w-auto order-1 sm:order-2"
                    >
                        Delete
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default ReportCategoriesListPage

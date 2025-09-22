import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Input,
    Button,
    Table,
    Alert,
    Notification,
    Skeleton,
    Select,
    Pagination,
    Tag,
    Avatar,
    Dropdown,
} from '@/components/ui'
import { toast } from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineDotsVertical,
    HiOutlineArrowLeft,
} from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import type { ProgramCategory } from '@/@types/programCategory'
import ProgramCategoryService from '@/services/ProgramCategoryService'
import useAuth from '@/auth/useAuth'
import classNames from '@/utils/classNames'

const ProgramCategoriesListPage: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [categories, setCategories] = useState<ProgramCategory[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)

    // Check if we're in tenant portal based on current path
    const isInTenantPortal =
        window.location.pathname.startsWith('/tenantportal')
    const programsPath = isInTenantPortal
        ? '/tenantportal/programs'
        : '/app/programs'
    const createCategoryPath = isInTenantPortal
        ? '/tenantportal/program-categories/add'
        : '/app/program-categories/add'

    // Permissions - Only CS-Admin and CS-User can access
    const hasAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const hasCreateAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const hasEditAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const hasDeleteAccess = user?.authority?.some((role: string) =>
        ['CS-Admin'].includes(role),
    )

    useEffect(() => {
        if (hasAccess) {
            loadCategories()
        }
    }, [hasAccess])

    const loadCategories = async () => {
        try {
            setLoading(true)
            const categoriesData =
                await ProgramCategoryService.getProgramCategories()
            setCategories(categoriesData)
        } catch (error) {
            console.error('Error loading program categories:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load program categories
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (categoryId: number) => {
        if (
            !window.confirm(
                'Are you sure you want to delete this program category?',
            )
        ) {
            return
        }

        try {
            await ProgramCategoryService.deleteProgramCategory(categoryId)
            toast.push(
                <Notification title="Success" type="success">
                    Program category deleted successfully
                </Notification>,
            )
            await loadCategories()
        } catch (error) {
            console.error('Error deleting program category:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to delete program category
                </Notification>,
            )
        }
    }

    // Filter categories based on search text and status
    const filteredCategories = useMemo(() => {
        return categories.filter((category) => {
            const searchLower = searchText.toLowerCase()
            const matchesSearch =
                category.categoryName.toLowerCase().includes(searchLower) ||
                (category.categoryDescription?.toLowerCase() || '').includes(
                    searchLower,
                )

            let matchesStatus = true
            if (statusFilter === 'active') {
                matchesStatus = category.isActive
            } else if (statusFilter === 'inactive') {
                matchesStatus = !category.isActive
            }

            return matchesSearch && matchesStatus
        })
    }, [categories, searchText, statusFilter])

    // Paginated categories
    const paginatedCategories = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        return filteredCategories.slice(startIndex, endIndex)
    }, [filteredCategories, currentPage, pageSize])

    const getStatusTag = (category: ProgramCategory) => {
        return category.isActive ? (
            <Tag className="bg-emerald-200">Active</Tag>
        ) : (
            <Tag className="bg-gray-200">Inactive</Tag>
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    if (!hasAccess) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to view program categories.
                </Alert>
            </Card>
        )
    }

    const totalPages = Math.ceil(filteredCategories.length / pageSize)

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="plain"
                            size="sm"
                            icon={<HiOutlineArrowLeft />}
                            onClick={() => navigate(programsPath)}
                        >
                            Back to Programs
                        </Button>
                        <div>
                            <h4 className="mb-1">Program Categories</h4>
                            <p className="text-gray-600">
                                Manage program categories and their settings
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {hasCreateAccess && (
                            <Button
                                variant="solid"
                                icon={<HiOutlinePlus />}
                                onClick={() => navigate(createCategoryPath)}
                                className="w-full sm:w-auto"
                            >
                                Add New Category
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium mb-2">
                            Search
                        </label>
                        <Input
                            placeholder="Search by name or description..."
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value)
                                setCurrentPage(1)
                            }}
                            prefix={<HiOutlineSearch />}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Status
                        </label>
                        <Select
                            placeholder="All statuses"
                            value={
                                statusFilter
                                    ? {
                                          value: statusFilter,
                                          label:
                                              statusFilter === 'all'
                                                  ? 'All statuses'
                                                  : statusFilter === 'active'
                                                    ? 'Active'
                                                    : 'Inactive',
                                      }
                                    : null
                            }
                            options={[
                                { value: 'all', label: 'All statuses' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                            onChange={(option: any) => {
                                setStatusFilter(option?.value || 'all')
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                </div>

                {/* Desktop Table - Hidden on mobile */}
                <div className="hidden lg:block">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, index) => (
                                <Skeleton key={index} height="50px" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <Table.THead>
                                        <Table.Tr>
                                            <Table.Th>Category Name</Table.Th>
                                            <Table.Th>Description</Table.Th>
                                            <Table.Th>Program Count</Table.Th>
                                            <Table.Th>Created</Table.Th>
                                            <Table.Th>Status</Table.Th>
                                            <Table.Th></Table.Th>
                                        </Table.Tr>
                                    </Table.THead>
                                    <Table.TBody>
                                        {paginatedCategories.length === 0 ? (
                                            <Table.Tr>
                                                <Table.Td
                                                    colSpan={6}
                                                    className="text-center py-8"
                                                >
                                                    No program categories found
                                                </Table.Td>
                                            </Table.Tr>
                                        ) : (
                                            paginatedCategories.map(
                                                (category) => (
                                                    <Table.Tr
                                                        key={
                                                            category.programCategoryID
                                                        }
                                                    >
                                                        <Table.Td>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar
                                                                    size="sm"
                                                                    shape="circle"
                                                                >
                                                                    {category.categoryName.charAt(
                                                                        0,
                                                                    )}
                                                                </Avatar>
                                                                <div>
                                                                    <span className="font-medium">
                                                                        {
                                                                            category.categoryName
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <span className="text-gray-600">
                                                                {category.categoryDescription ||
                                                                    'N/A'}
                                                            </span>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <span className="text-blue-600 font-medium">
                                                                {
                                                                    category.programCount
                                                                }
                                                            </span>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <span className="text-gray-600">
                                                                {formatDate(
                                                                    category.createdAt,
                                                                )}
                                                            </span>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            {getStatusTag(
                                                                category,
                                                            )}
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Dropdown
                                                                renderTitle={
                                                                    <Button
                                                                        variant="plain"
                                                                        size="xs"
                                                                        icon={
                                                                            <HiOutlineDotsVertical />
                                                                        }
                                                                    />
                                                                }
                                                                placement="bottom-end"
                                                            >
                                                                {hasEditAccess && (
                                                                    <Dropdown.Item
                                                                        eventKey="edit"
                                                                        onClick={() =>
                                                                            navigate(
                                                                                isInTenantPortal
                                                                                    ? `/tenantportal/program-categories/edit/${category.programCategoryID}`
                                                                                    : `/app/program-categories/edit/${category.programCategoryID}`,
                                                                            )
                                                                        }
                                                                    >
                                                                        <HiOutlinePencil className="mr-2" />
                                                                        Edit
                                                                        Category
                                                                    </Dropdown.Item>
                                                                )}

                                                                {hasDeleteAccess && (
                                                                    <>
                                                                        <div className="my-1 border-b border-gray-200 dark:border-gray-600" />
                                                                        <Dropdown.Item
                                                                            eventKey="delete"
                                                                            onClick={() =>
                                                                                handleDelete(
                                                                                    category.programCategoryID,
                                                                                )
                                                                            }
                                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                        >
                                                                            <HiOutlineTrash className="mr-2" />
                                                                            Delete
                                                                            Category
                                                                        </Dropdown.Item>
                                                                    </>
                                                                )}
                                                            </Dropdown>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ),
                                            )
                                        )}
                                    </Table.TBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination
                                        total={filteredCategories.length}
                                        pageSize={pageSize}
                                        currentPage={currentPage}
                                        onChange={(page) =>
                                            setCurrentPage(page)
                                        }
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Mobile Cards - Hidden on desktop */}
                <div className="lg:hidden">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, index) => (
                                <Skeleton key={index} height="120px" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {paginatedCategories.length === 0 ? (
                                <Card className="text-center py-8">
                                    <p className="text-gray-600">
                                        No program categories found
                                    </p>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {paginatedCategories.map((category) => (
                                        <Card
                                            key={category.programCategoryID}
                                            className="p-4"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Avatar
                                                        size="sm"
                                                        shape="circle"
                                                    >
                                                        {category.categoryName.charAt(
                                                            0,
                                                        )}
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-medium truncate">
                                                            {
                                                                category.categoryName
                                                            }
                                                        </h5>
                                                        <p className="text-sm text-gray-600">
                                                            {category.categoryDescription ||
                                                                'No description'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getStatusTag(category)}
                                                    <Dropdown
                                                        renderTitle={
                                                            <Button
                                                                variant="plain"
                                                                size="xs"
                                                                icon={
                                                                    <HiOutlineDotsVertical />
                                                                }
                                                            />
                                                        }
                                                        placement="bottom-end"
                                                    >
                                                        {hasEditAccess && (
                                                            <Dropdown.Item
                                                                eventKey="edit"
                                                                onClick={() =>
                                                                    navigate(
                                                                        isInTenantPortal
                                                                            ? `/tenantportal/program-categories/edit/${category.programCategoryID}`
                                                                            : `/app/program-categories/edit/${category.programCategoryID}`,
                                                                    )
                                                                }
                                                            >
                                                                <HiOutlinePencil className="mr-2" />
                                                                Edit Category
                                                            </Dropdown.Item>
                                                        )}

                                                        {hasDeleteAccess && (
                                                            <>
                                                                <div className="my-1 border-b border-gray-200 dark:border-gray-600" />
                                                                <Dropdown.Item
                                                                    eventKey="delete"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            category.programCategoryID,
                                                                        )
                                                                    }
                                                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                >
                                                                    <HiOutlineTrash className="mr-2" />
                                                                    Delete
                                                                    Category
                                                                </Dropdown.Item>
                                                            </>
                                                        )}
                                                    </Dropdown>
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">
                                                        Programs:
                                                    </span>
                                                    <span className="text-blue-600 font-medium">
                                                        {category.programCount}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">
                                                        Created:
                                                    </span>
                                                    <span>
                                                        {formatDate(
                                                            category.createdAt,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Mobile Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination
                                        total={filteredCategories.length}
                                        pageSize={pageSize}
                                        currentPage={currentPage}
                                        onChange={(page) =>
                                            setCurrentPage(page)
                                        }
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default ProgramCategoriesListPage

import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Tag,
    Notification,
    toast,
    Spinner,
} from '@/components/ui'
import { HiOutlinePencilAlt, HiOutlineUserGroup } from 'react-icons/hi'
import { TbArrowNarrowLeft } from 'react-icons/tb'
import { useNavigate, useParams } from 'react-router-dom'
import * as ReportService from '@/services/ReportService'
import type { ReportCategory } from '@/@types/report'
import useAuth from '@/auth/useAuth'

const ReportCategoryDetailsPage = () => {
    const navigate = useNavigate()
    const { categoryId } = useParams<{ categoryId: string }>()
    const { user } = useAuth()

    const [category, setCategory] = useState<ReportCategory | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (categoryId && isTenantAdmin) {
            fetchCategoryDetails()
        }
    }, [categoryId, isTenantAdmin])

    const fetchCategoryDetails = async () => {
        if (!categoryId) return

        setLoading(true)
        setError(null)

        try {
            const categoryData = await ReportService.getCategoryById(
                parseInt(categoryId, 10),
            )
            setCategory(categoryData)
        } catch (error) {
            console.error('Error fetching category details:', error)
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to load category details'

            setError(errorMessage)
            toast.push(
                <Notification title="Error" type="danger">
                    {errorMessage}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleNavigateToEdit = () => {
        navigate(`/tenantportal/tenant/report-categories/${categoryId}/edit`)
    }

    const handleNavigateToAssignments = () => {
        navigate(
            `/tenantportal/tenant/report-categories/${categoryId}/assignments`,
        )
    }

    const handleBackToList = () => {
        navigate('/tenantportal/tenant/report-categories')
    }

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
                <Card className="text-center p-4">
                    <h4 className="mb-2">Error Loading Category</h4>
                    <p className="mb-4 text-red-500">{error}</p>
                    <Button
                        onClick={handleBackToList}
                        icon={<TbArrowNarrowLeft />}
                    >
                        Back to Report Categories
                    </Button>
                </Card>
            </div>
        )
    }

    if (!category) {
        return (
            <div className="p-4">
                <Card className="text-center p-4">
                    <h4 className="mb-2">Category Not Found</h4>
                    <p className="mb-4">
                        The requested report category could not be found or you
                        don't have permission to view it.
                    </p>
                    <Button
                        onClick={handleBackToList}
                        icon={<TbArrowNarrowLeft />}
                    >
                        Back to Report Categories
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                    <Button
                        variant="plain"
                        onClick={handleBackToList}
                        className="mb-2"
                        icon={<TbArrowNarrowLeft />}
                    >
                        Back to Report Categories
                    </Button>
                    <h3 className="text-lg font-medium">
                        Report Category Details
                    </h3>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="solid"
                        onClick={handleNavigateToEdit}
                        icon={<HiOutlinePencilAlt />}
                    >
                        Edit Category
                    </Button>
                    <Button
                        size="sm"
                        variant="solid"
                        onClick={handleNavigateToAssignments}
                        icon={<HiOutlineUserGroup />}
                    >
                        Manage Assignments
                    </Button>
                </div>
            </div>

            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-lg font-semibold mb-4">
                            Category Information
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Category Name
                                </label>
                                <p className="text-lg font-medium">
                                    {category.name}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    System Name
                                </label>
                                <p className="font-mono text-gray-700">
                                    {category.systemName}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Description
                                </label>
                                <p className="text-gray-700">
                                    {category.description ||
                                        'No description provided'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Status
                                </label>
                                <div className="mt-1">
                                    <Tag
                                        className={`rounded-full px-2 ${
                                            category.isActive
                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200'
                                        }`}
                                    >
                                        {category.isActive
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Tag>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Default Category
                                </label>
                                <div className="mt-1">
                                    {category.isDefault ? (
                                        <Tag className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 rounded-full px-2">
                                            Default
                                        </Tag>
                                    ) : (
                                        <span className="text-gray-500">
                                            No
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Display Order
                                </label>
                                <p className="text-gray-700">
                                    {category.displayOrder}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4">
                            Additional Details
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Created Date
                                </label>
                                <p className="text-gray-700">
                                    {category.createdAt
                                        ? new Date(
                                              category.createdAt,
                                          ).toLocaleDateString()
                                        : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Last Modified
                                </label>
                                <p className="text-gray-700">
                                    {category.updatedAt
                                        ? new Date(
                                              category.updatedAt,
                                          ).toLocaleDateString()
                                        : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Tenant
                                </label>
                                <p className="text-gray-700">
                                    {user?.tenantName ||
                                        user?.tenantId ||
                                        'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default ReportCategoryDetailsPage

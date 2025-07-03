import React, { useState, useEffect, useCallback } from 'react'
import {
    Card,
    Input,
    Button,
    Notification,
    toast,
    FormItem,
    FormContainer,
    Spinner,
    Alert,
    Dialog,
} from '@/components/ui'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { TbArrowNarrowLeft } from 'react-icons/tb'
import * as ReportService from '@/services/ReportService'
import { ReportCategory } from '@/@types/report'
import useAuth from '@/auth/useAuth'

const ReportCategoryEditPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { categoryId: paramCategoryId } = useParams<{ categoryId: string }>()
    const { user } = useAuth()

    const pathIsNew = location.pathname.endsWith('/report-categories/new')
    const isEffectivelyNew =
        pathIsNew || paramCategoryId?.toLowerCase() === 'new'

    const [category, setCategory] = useState<ReportCategory | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [displayOrder, setDisplayOrder] = useState(0)

    const [errors, setErrors] = useState<{
        name?: string
        description?: string
        displayOrder?: string
    }>({})

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const isTenantAdmin = !!user?.tenantId

    const fetchCategoryDetails = useCallback(async (idToFetch: string) => {
        setLoading(true)
        setError(null)
        try {
            const categoryData = await ReportService.getCategoryById(
                parseInt(idToFetch, 10),
            )
            if (categoryData) {
                setCategory(categoryData)
                setName(categoryData.name || '')
                setDescription(categoryData.description || '')
                setDisplayOrder(categoryData.displayOrder || 0)
            } else {
                setCategory(null)
                setError(
                    "The requested category was not found or you don't have permission to edit it.",
                )
            }
        } catch (fetchErr) {
            console.error('Error fetching category details:', fetchErr)
            const msg =
                fetchErr instanceof Error
                    ? fetchErr.message
                    : 'An unknown error occurred while fetching details'
            setError(msg)
            toast.push(
                <Notification type="danger" title="Error Fetching Details">
                    {msg}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isTenantAdmin) {
            if (isEffectivelyNew) {
                setCategory(null)
                setName('')
                setDescription('')
                setDisplayOrder(0)
                setError(null)
                setLoading(false)
            } else if (paramCategoryId) {
                fetchCategoryDetails(paramCategoryId)
            } else {
                setError('Invalid category ID for editing.')
                setLoading(false)
            }
        } else {
            setError('Access denied. Tenant admin rights required.')
            setLoading(false)
        }
    }, [
        isTenantAdmin,
        isEffectivelyNew,
        paramCategoryId,
        fetchCategoryDetails,
        location.pathname,
    ])

    const validateForm = () => {
        const newErrors: typeof errors = {}

        if (!name.trim()) {
            newErrors.name = 'Category name is required'
        } else if (name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters'
        } else if (name.length > 100) {
            newErrors.name = 'Name must not exceed 100 characters'
        }

        if (description && description.length > 500) {
            newErrors.description = 'Description must not exceed 500 characters'
        }

        if (displayOrder < 0) {
            newErrors.displayOrder = 'Display order must be a positive number'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async () => {
        if (!validateForm()) {
            return
        }

        if (!user?.tenantId) {
            toast.push(
                <Notification type="danger" title="Error">
                    Missing tenant information
                </Notification>,
            )
            return
        }

        setSaving(true)
        try {
            const derivedSystemName = name.trim().replace(/\\s+/g, '_') // Derive systemName

            const categoryData: Partial<ReportCategory> = {
                name: name.trim(),
                systemName: derivedSystemName, // Use derived systemName
                description: description.trim(),
                displayOrder,
                isActive: category?.isActive ?? true,
                isDefault: category?.isDefault ?? false,
            }

            if (isEffectivelyNew) {
                await ReportService.createCategory(categoryData)
                toast.push(
                    <Notification type="success" title="Success">
                        Category created successfully
                    </Notification>,
                )
            } else if (paramCategoryId) {
                await ReportService.updateCategory(
                    parseInt(paramCategoryId, 10),
                    categoryData,
                )
                toast.push(
                    <Notification type="success" title="Success">
                        Category updated successfully
                    </Notification>,
                )
            } else {
                throw new Error(
                    'Cannot save category without a valid ID or mode.',
                )
            }

            navigate('/tenantportal/tenant/report-categories')
        } catch (saveError) {
            console.error('Error saving category:', saveError)
            toast.push(
                <Notification type="danger" title="Error saving category">
                    {saveError instanceof Error
                        ? saveError.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleBackToList = () => {
        navigate('/tenantportal/tenant/report-categories')
    }

    const handleConfirmNavigateBack = () => {
        const initialName = isEffectivelyNew ? '' : category?.name || ''
        const initialDescription = isEffectivelyNew
            ? ''
            : category?.description || ''
        const initialDisplayOrder = isEffectivelyNew
            ? 0
            : category?.displayOrder || 0

        const hasChanges =
            name !== initialName ||
            description !== initialDescription ||
            displayOrder !== initialDisplayOrder

        if (hasChanges) {
            setConfirmDialogOpen(true)
        } else {
            handleBackToList()
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size={40} />
            </div>
        )
    }

    // Error display logic:
    // 1. If it's the 'new' page, only show an error if it's explicitly set (e.g., access denied).
    //    Don't show 'category not found' for 'new' page.
    // 2. If it's the 'edit' page, show 'category not found' if applicable.
    // 3. Otherwise, show general errors.

    if (
        isEffectivelyNew &&
        error &&
        error !==
            "The requested category was not found or you don't have permission to edit it."
    ) {
        // For 'new' page, show general errors like 'Access Denied'
        return (
            <div className="p-4">
                <Alert type="danger" title="Error" showIcon>
                    {error}
                </Alert>
                <Button
                    className="mt-4"
                    icon={<TbArrowNarrowLeft />}
                    onClick={handleBackToList}
                >
                    Back to Categories
                </Button>
            </div>
        )
    }

    if (
        !isEffectivelyNew &&
        error ===
            "The requested category was not found or you don't have permission to edit it."
    ) {
        // Specific "Not Found" message for edit mode
        return (
            <div className="p-4">
                <Alert type="warning" title="Category Not Found" showIcon>
                    {error}
                </Alert>
                <Button
                    className="mt-4"
                    icon={<TbArrowNarrowLeft />}
                    onClick={handleBackToList}
                >
                    Back to Categories
                </Button>
            </div>
        )
    }

    if (!isEffectivelyNew && error) {
        // Other errors for 'edit' page (e.g. fetch failed for other reasons)
        return (
            <div className="p-4">
                <Alert type="danger" title="Error" showIcon>
                    {error}
                </Alert>
                <Button
                    className="mt-4"
                    icon={<TbArrowNarrowLeft />}
                    onClick={handleBackToList}
                >
                    Back to Categories
                </Button>
            </div>
        )
    }

    // This condition handles the case where it's an edit page, not loading, no category was found,
    // and no specific error message was set by fetchCategoryDetails (e.g. service returned null silently)
    if (!isEffectivelyNew && !category && !loading && !error) {
        return (
            <div className="p-4">
                <Alert type="warning" title="Category Not Found" showIcon>
                    The requested category could not be loaded.
                </Alert>
                <Button
                    className="mt-4"
                    icon={<TbArrowNarrowLeft />}
                    onClick={handleBackToList}
                >
                    Back to Categories
                </Button>
            </div>
        )
    }

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <Card>
                <div className="p-4">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-semibold">
                            {isEffectivelyNew
                                ? 'Create New Report Category'
                                : 'Edit Report Category'}
                        </h4>
                        <Button
                            variant="plain"
                            icon={<TbArrowNarrowLeft />}
                            onClick={handleConfirmNavigateBack}
                            disabled={saving}
                        >
                            Back to Categories
                        </Button>
                    </div>

                    <FormContainer>
                        <FormItem
                            label="Category Name"
                            invalid={!!errors.name}
                            errorMessage={errors.name}
                        >
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter category name"
                                invalid={!!errors.name}
                            />
                        </FormItem>
                        <FormItem
                            label="Description"
                            invalid={!!errors.description}
                            errorMessage={errors.description}
                        >
                            <Input
                                textArea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter category description (optional)"
                                invalid={!!errors.description}
                            />
                        </FormItem>
                        <FormItem
                            label="Display Order"
                            invalid={!!errors.displayOrder}
                            errorMessage={errors.displayOrder}
                        >
                            <Input
                                type="number"
                                value={displayOrder}
                                onChange={(e) =>
                                    setDisplayOrder(
                                        parseInt(e.target.value, 10) || 0,
                                    )
                                }
                                placeholder="Enter display order"
                                invalid={!!errors.displayOrder}
                            />
                        </FormItem>

                        <div className="mt-6 flex justify-end space-x-2">
                            <Button
                                variant="plain"
                                onClick={handleConfirmNavigateBack}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                color="blue-500"
                                onClick={handleSave}
                                loading={saving}
                                disabled={saving}
                            >
                                {isEffectivelyNew
                                    ? 'Create Category'
                                    : 'Save Changes'}
                            </Button>
                        </div>
                    </FormContainer>
                </div>
            </Card>

            <Dialog
                isOpen={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                onRequestClose={() => setConfirmDialogOpen(false)}
                width={400}
            >
                <h5 className="mb-4 text-lg font-semibold">Unsaved Changes</h5>
                <p className="mb-4">
                    You have unsaved changes. Are you sure you want to leave
                    this page?
                </p>
                <div className="text-right">
                    <Button
                        className="mr-2"
                        variant="plain"
                        onClick={() => setConfirmDialogOpen(false)}
                    >
                        Stay
                    </Button>
                    <Button variant="solid" onClick={handleBackToList}>
                        Leave
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default ReportCategoryEditPage

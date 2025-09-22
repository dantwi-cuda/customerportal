import React, { useState, useEffect } from 'react'
import { Formik, Field } from 'formik'
import * as Yup from 'yup'
import {
    Card,
    Button,
    Alert,
    Notification,
    Spinner,
    FormContainer,
} from '@/components/ui'
import { toast } from '@/components/ui'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { useNavigate, useParams } from 'react-router-dom'
import type {
    ProgramCategory,
    ProgramCategoryForm,
    CreateProgramCategoryRequest,
    UpdateProgramCategoryRequest,
} from '@/@types/programCategory'
import ProgramCategoryService from '@/services/ProgramCategoryService'
import useAuth from '@/auth/useAuth'

// Validation schema
const validationSchema = Yup.object().shape({
    categoryName: Yup.string()
        .required('Category name is required')
        .max(100, 'Category name must be 100 characters or less')
        .trim(),
    categoryDescription: Yup.string()
        .max(500, 'Category description must be 500 characters or less')
        .trim(),
    isActive: Yup.boolean().required('Active status is required'),
})

const CreateEditProgramCategoryPage: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const isEdit = Boolean(id)

    const [category, setCategory] = useState<ProgramCategory | null>(null)
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Check if we're in tenant portal based on current path
    const isInTenantPortal =
        window.location.pathname.startsWith('/tenantportal')
    const categoriesPath = isInTenantPortal
        ? '/tenantportal/program-categories'
        : '/app/program-categories'

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

    useEffect(() => {
        if (isEdit && id) {
            loadCategory(parseInt(id))
        }
    }, [id, isEdit])

    const loadCategory = async (categoryId: number) => {
        try {
            setLoading(true)
            const data =
                await ProgramCategoryService.getProgramCategoryById(categoryId)
            setCategory(data)
        } catch (error) {
            console.error('Error loading program category:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to load program category
                </Notification>,
            )
            navigate(categoriesPath)
        } finally {
            setLoading(false)
        }
    }

    const getInitialValues = (): ProgramCategoryForm => {
        if (isEdit && category) {
            return {
                categoryName: category.categoryName,
                categoryDescription: category.categoryDescription || '',
                isActive: category.isActive,
            }
        }

        return {
            categoryName: '',
            categoryDescription: '',
            isActive: true,
        }
    }

    const handleSubmit = async (values: ProgramCategoryForm) => {
        try {
            setSubmitting(true)

            if (isEdit && id) {
                // Update existing category
                const updateRequest: UpdateProgramCategoryRequest = {
                    categoryName: values.categoryName.trim(),
                    categoryDescription: values.categoryDescription.trim(),
                    isActive: values.isActive,
                }

                await ProgramCategoryService.updateProgramCategory(
                    parseInt(id),
                    updateRequest,
                )

                toast.push(
                    <Notification type="success" title="Success">
                        Program category updated successfully
                    </Notification>,
                )
            } else {
                // Create new category
                const createRequest: CreateProgramCategoryRequest = {
                    categoryName: values.categoryName.trim(),
                    categoryDescription: values.categoryDescription.trim(),
                    isActive: values.isActive,
                }

                await ProgramCategoryService.createProgramCategory(
                    createRequest,
                )

                toast.push(
                    <Notification type="success" title="Success">
                        Program category created successfully
                    </Notification>,
                )
            }

            navigate(categoriesPath)
        } catch (error) {
            console.error('Error saving program category:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    {error instanceof Error
                        ? error.message
                        : 'Failed to save program category'}
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <Spinner size="40px" />
            </div>
        )
    }

    if (!hasAccess) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to access program categories.
                </Alert>
            </Card>
        )
    }

    if (isEdit && !hasEditAccess) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to edit program categories.
                </Alert>
            </Card>
        )
    }

    if (!isEdit && !hasCreateAccess) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to create program categories.
                </Alert>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="plain"
                        size="sm"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate(categoriesPath)}
                    >
                        Back to Categories
                    </Button>
                    <div>
                        <h4 className="mb-1">
                            {isEdit
                                ? 'Edit Program Category'
                                : 'Add Program Category'}
                        </h4>
                        <p className="text-gray-600">
                            {isEdit
                                ? 'Update the program category information'
                                : 'Create a new program category'}
                        </p>
                    </div>
                </div>

                <Formik
                    initialValues={getInitialValues()}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ values, touched, errors, handleSubmit }) => (
                        <form onSubmit={handleSubmit}>
                            <FormContainer>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Category Name */}
                                    <div className="lg:col-span-1">
                                        <label className="block text-sm font-medium mb-2">
                                            Category Name *
                                        </label>
                                        <Field name="categoryName">
                                            {({ field, meta }: any) => (
                                                <div>
                                                    <input
                                                        {...field}
                                                        type="text"
                                                        placeholder="Enter category name"
                                                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                                            meta.touched &&
                                                            meta.error
                                                                ? 'border-red-300'
                                                                : 'border-gray-300'
                                                        }`}
                                                    />
                                                    {meta.touched &&
                                                        meta.error && (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                {meta.error}
                                                            </p>
                                                        )}
                                                </div>
                                            )}
                                        </Field>
                                    </div>

                                    {/* Status */}
                                    <div className="lg:col-span-1">
                                        <label className="block text-sm font-medium mb-2">
                                            Status *
                                        </label>
                                        <Field name="isActive">
                                            {({ field, meta }: any) => (
                                                <div>
                                                    <select
                                                        {...field}
                                                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                                            meta.touched &&
                                                            meta.error
                                                                ? 'border-red-300'
                                                                : 'border-gray-300'
                                                        }`}
                                                        value={
                                                            field.value
                                                                ? 'true'
                                                                : 'false'
                                                        }
                                                        onChange={(e) =>
                                                            field.onChange({
                                                                target: {
                                                                    name: field.name,
                                                                    value:
                                                                        e.target
                                                                            .value ===
                                                                        'true',
                                                                },
                                                            })
                                                        }
                                                    >
                                                        <option value="true">
                                                            Active
                                                        </option>
                                                        <option value="false">
                                                            Inactive
                                                        </option>
                                                    </select>
                                                    {meta.touched &&
                                                        meta.error && (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                {meta.error}
                                                            </p>
                                                        )}
                                                </div>
                                            )}
                                        </Field>
                                    </div>

                                    {/* Description */}
                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium mb-2">
                                            Description
                                        </label>
                                        <Field name="categoryDescription">
                                            {({ field, meta }: any) => (
                                                <div>
                                                    <textarea
                                                        {...field}
                                                        rows={4}
                                                        placeholder="Enter category description (optional)"
                                                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                                                            meta.touched &&
                                                            meta.error
                                                                ? 'border-red-300'
                                                                : 'border-gray-300'
                                                        }`}
                                                    />
                                                    {meta.touched &&
                                                        meta.error && (
                                                            <p className="mt-1 text-sm text-red-600">
                                                                {meta.error}
                                                            </p>
                                                        )}
                                                </div>
                                            )}
                                        </Field>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                                    <Button
                                        type="submit"
                                        variant="solid"
                                        loading={submitting}
                                        className="w-full sm:w-auto"
                                    >
                                        {isEdit
                                            ? 'Update Category'
                                            : 'Create Category'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="plain"
                                        onClick={() => navigate(categoriesPath)}
                                        disabled={submitting}
                                        className="w-full sm:w-auto"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </FormContainer>
                        </form>
                    )}
                </Formik>
            </Card>
        </div>
    )
}

export default CreateEditProgramCategoryPage

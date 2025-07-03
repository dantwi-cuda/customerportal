import React, { useState, useEffect } from 'react'
import {
    Dialog,
    Input,
    FormItem,
    FormContainer,
    Button,
    Notification,
    toast,
} from '@/components/ui'
import { Field, Form, Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import * as ReportService from '@/services/ReportService'
import { ReportCategory } from '@/@types/report'
import useAuth from '@/auth/useAuth'

interface CategoryDialogProps {
    open: boolean
    category?: ReportCategory
    onClose: () => void
    onSuccess: () => void
}

interface CategoryFormData {
    name: string
    systemName: string
    description: string
    displayOrder: number
}

const validationSchema = Yup.object().shape({
    name: Yup.string()
        .required('Category name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters'),
    systemName: Yup.string()
        .required('System name is required')
        .min(2, 'System name must be at least 2 characters')
        .max(50, 'System name must not exceed 50 characters')
        .matches(
            /^[a-zA-Z0-9_-]+$/,
            'System name can only contain letters, numbers, hyphens, and underscores',
        ),
    description: Yup.string().max(
        500,
        'Description must not exceed 500 characters',
    ),
    displayOrder: Yup.number()
        .required('Display order is required')
        .min(0, 'Display order must be a positive number')
        .integer('Display order must be a whole number'),
})

const CategoryDialog: React.FC<CategoryDialogProps> = ({
    open,
    category,
    onClose,
    onSuccess,
}) => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const isEdit = !!category

    const initialValues: CategoryFormData = {
        name: category?.name || '',
        systemName: category?.systemName || '',
        description: category?.description || '',
        displayOrder: category?.displayOrder || 0,
    }

    const handleSubmit = async (values: CategoryFormData) => {
        if (!user?.tenantId) {
            toast.push(
                <Notification type="danger" title="Access denied">
                    Tenant ID is required to manage categories
                </Notification>,
            )
            return
        }

        setLoading(true)
        try {
            const categoryData: Partial<ReportCategory> = {
                ...values,
                isActive: category?.isActive ?? true,
                isDefault: category?.isDefault ?? false,
            }

            if (isEdit && category) {
                await ReportService.updateCategory(category.id, categoryData)
                toast.push(
                    <Notification type="success" title="Category updated">
                        Category has been updated successfully
                    </Notification>,
                )
            } else {
                await ReportService.createCategory(categoryData)
                toast.push(
                    <Notification type="success" title="Category created">
                        Category has been created successfully
                    </Notification>,
                )
            }

            onSuccess()
        } catch (error) {
            console.error('Error saving category:', error)
            toast.push(
                <Notification
                    type="danger"
                    title={`Error ${isEdit ? 'updating' : 'creating'} category`}
                >
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog
            isOpen={open}
            onClose={onClose}
            onRequestClose={onClose}
            width={600}
        >
            <h4 className="mb-6">
                {isEdit ? 'Edit Category' : 'Create New Category'}
            </h4>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({
                    values,
                    errors,
                    touched,
                    isSubmitting,
                }: FormikProps<CategoryFormData>) => (
                    <Form>
                        <FormContainer>
                            <FormItem
                                label="Category Name"
                                invalid={!!(errors.name && touched.name)}
                                errorMessage={errors.name}
                            >
                                <Field name="name">
                                    {({ field }: any) => (
                                        <Input
                                            {...field}
                                            placeholder="Enter category name"
                                            invalid={
                                                !!(errors.name && touched.name)
                                            }
                                        />
                                    )}
                                </Field>
                            </FormItem>

                            <FormItem
                                label="System Name"
                                invalid={
                                    !!(errors.systemName && touched.systemName)
                                }
                                errorMessage={errors.systemName}
                            >
                                <Field name="systemName">
                                    {({ field }: any) => (
                                        <Input
                                            {...field}
                                            placeholder="Enter system name (e.g., financial_reports)"
                                            invalid={
                                                !!(
                                                    errors.systemName &&
                                                    touched.systemName
                                                )
                                            }
                                        />
                                    )}
                                </Field>
                            </FormItem>

                            <FormItem
                                label="Description"
                                invalid={
                                    !!(
                                        errors.description &&
                                        touched.description
                                    )
                                }
                                errorMessage={errors.description}
                            >
                                <Field name="description">
                                    {({ field }: any) => (
                                        <Input
                                            {...field}
                                            textArea
                                            rows={3}
                                            placeholder="Enter category description (optional)"
                                            invalid={
                                                !!(
                                                    errors.description &&
                                                    touched.description
                                                )
                                            }
                                        />
                                    )}
                                </Field>
                            </FormItem>

                            <FormItem
                                label="Display Order"
                                invalid={
                                    !!(
                                        errors.displayOrder &&
                                        touched.displayOrder
                                    )
                                }
                                errorMessage={errors.displayOrder}
                            >
                                <Field name="displayOrder">
                                    {({ field }: any) => (
                                        <Input
                                            {...field}
                                            type="number"
                                            min="0"
                                            placeholder="Enter display order"
                                            invalid={
                                                !!(
                                                    errors.displayOrder &&
                                                    touched.displayOrder
                                                )
                                            }
                                        />
                                    )}
                                </Field>
                            </FormItem>

                            <div className="flex justify-end gap-2 mt-6">
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={onClose}
                                    disabled={loading || isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="solid"
                                    loading={loading || isSubmitting}
                                >
                                    {isEdit ? 'Update' : 'Create'} Category
                                </Button>
                            </div>
                        </FormContainer>
                    </Form>
                )}
            </Formik>
        </Dialog>
    )
}

export default CategoryDialog

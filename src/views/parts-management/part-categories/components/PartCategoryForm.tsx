import React from 'react'
import { Button } from '@/components/ui/Button'
import { Input, FormItem, FormContainer } from '@/components/ui'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import type {
    PartCategory,
    CreatePartCategoryRequest,
    UpdatePartCategoryRequest,
} from '@/@types/parts'

interface PartCategoryFormProps {
    partCategory?: PartCategory
    onSubmit: (
        data: CreatePartCategoryRequest | UpdatePartCategoryRequest,
    ) => Promise<void>
    onCancel: () => void
    loading?: boolean
}

const validationSchema = Yup.object().shape({
    partCategoryName: Yup.string()
        .required('Part category name is required')
        .min(2, 'Part category name must be at least 2 characters'),
})

const PartCategoryForm: React.FC<PartCategoryFormProps> = ({
    partCategory,
    onSubmit,
    onCancel,
    loading = false,
}) => {
    const isEditing = !!partCategory

    const initialValues = {
        partCategoryName: partCategory?.partCategoryName || '',
    }

    const handleSubmit = async (values: typeof initialValues) => {
        await onSubmit(values)
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">
                {isEditing ? 'Edit Part Category' : 'Add New Part Category'}
            </h3>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ errors, touched, isSubmitting }) => (
                    <Form>
                        <FormContainer>
                            <FormItem
                                label="Part Category Name *"
                                invalid={
                                    !!(
                                        errors.partCategoryName &&
                                        touched.partCategoryName
                                    )
                                }
                                errorMessage={errors.partCategoryName}
                            >
                                <Field
                                    type="text"
                                    name="partCategoryName"
                                    placeholder="Enter part category name"
                                    component={Input}
                                />
                            </FormItem>

                            <div className="flex justify-end gap-2 mt-6">
                                <Button
                                    type="button"
                                    variant="plain"
                                    onClick={onCancel}
                                    disabled={isSubmitting || loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="solid"
                                    loading={isSubmitting || loading}
                                    disabled={isSubmitting || loading}
                                >
                                    {isEditing ? 'Update' : 'Create'} Part
                                    Category
                                </Button>
                            </div>
                        </FormContainer>
                    </Form>
                )}
            </Formik>
        </div>
    )
}

export default PartCategoryForm

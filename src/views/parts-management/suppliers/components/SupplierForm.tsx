import React from 'react'
import { Button } from '@/components/ui/Button'
import { Input, FormItem, FormContainer } from '@/components/ui'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import type {
    Supplier,
    CreateSupplierRequest,
    UpdateSupplierRequest,
} from '@/@types/parts'

interface SupplierFormProps {
    supplier?: Supplier
    onSubmit: (
        data: CreateSupplierRequest | UpdateSupplierRequest,
    ) => Promise<void>
    onCancel: () => void
    loading?: boolean
}

const validationSchema = Yup.object().shape({
    supplierName: Yup.string()
        .required('Supplier name is required')
        .min(2, 'Supplier name must be at least 2 characters'),
    contactInfo: Yup.string(),
    address: Yup.string(),
    website: Yup.string().url('Please enter a valid URL'),
    isActive: Yup.boolean(),
})

const SupplierForm: React.FC<SupplierFormProps> = ({
    supplier,
    onSubmit,
    onCancel,
    loading = false,
}) => {
    const isEditing = !!supplier

    const initialValues = {
        supplierName: supplier?.supplierName || '',
        contactInfo: supplier?.contactInfo || '',
        address: supplier?.address || '',
        website: supplier?.website || '',
        isActive: supplier?.isActive ?? true,
    }

    const handleSubmit = async (values: typeof initialValues) => {
        await onSubmit(values)
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">
                {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormItem
                                    label="Supplier Name *"
                                    invalid={
                                        !!(
                                            errors.supplierName &&
                                            touched.supplierName
                                        )
                                    }
                                    errorMessage={errors.supplierName}
                                >
                                    <Field
                                        type="text"
                                        name="supplierName"
                                        placeholder="Enter supplier name"
                                        component={Input}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Contact Info"
                                    invalid={
                                        !!(
                                            errors.contactInfo &&
                                            touched.contactInfo
                                        )
                                    }
                                    errorMessage={errors.contactInfo}
                                >
                                    <Field
                                        type="text"
                                        name="contactInfo"
                                        placeholder="Enter contact information"
                                        component={Input}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Address"
                                    invalid={
                                        !!(errors.address && touched.address)
                                    }
                                    errorMessage={errors.address}
                                >
                                    <Field
                                        type="text"
                                        name="address"
                                        placeholder="Enter address"
                                        component={Input}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Website"
                                    invalid={
                                        !!(errors.website && touched.website)
                                    }
                                    errorMessage={errors.website}
                                >
                                    <Field
                                        type="url"
                                        name="website"
                                        placeholder="https://example.com"
                                        component={Input}
                                    />
                                </FormItem>
                            </div>

                            <FormItem className="mt-4">
                                <label className="flex items-center">
                                    <Field
                                        type="checkbox"
                                        name="isActive"
                                        className="mr-2"
                                    />
                                    <span>Active</span>
                                </label>
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
                                    {isEditing ? 'Update' : 'Create'} Supplier
                                </Button>
                            </div>
                        </FormContainer>
                    </Form>
                )}
            </Formik>
        </div>
    )
}

export default SupplierForm

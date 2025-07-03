import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, FormItem, FormContainer } from '@/components/ui'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import type {
    Manufacturer,
    CreateManufacturerRequest,
    UpdateManufacturerRequest,
} from '@/@types/parts'

interface ManufacturerFormProps {
    manufacturer?: Manufacturer
    onSubmit: (
        data: CreateManufacturerRequest | UpdateManufacturerRequest,
    ) => Promise<void>
    onCancel: () => void
    loading?: boolean
}

const validationSchema = Yup.object().shape({
    manufacturerName: Yup.string()
        .required('Manufacturer name is required')
        .min(2, 'Manufacturer name must be at least 2 characters'),
    contactInfo: Yup.string(),
    address: Yup.string(),
    website: Yup.string().url('Please enter a valid URL'),
    isActive: Yup.boolean(),
})

const ManufacturerForm: React.FC<ManufacturerFormProps> = ({
    manufacturer,
    onSubmit,
    onCancel,
    loading = false,
}) => {
    const isEditing = !!manufacturer

    const initialValues = {
        manufacturerName: manufacturer?.manufacturerName || '',
        contactInfo: manufacturer?.contactInfo || '',
        address: manufacturer?.address || '',
        website: manufacturer?.website || '',
        isActive: manufacturer?.isActive ?? true,
    }

    const handleSubmit = async (values: typeof initialValues) => {
        await onSubmit(values)
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">
                {isEditing ? 'Edit Manufacturer' : 'Add New Manufacturer'}
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
                                    label="Manufacturer Name *"
                                    invalid={
                                        !!(
                                            errors.manufacturerName &&
                                            touched.manufacturerName
                                        )
                                    }
                                    errorMessage={errors.manufacturerName}
                                >
                                    <Field
                                        type="text"
                                        name="manufacturerName"
                                        placeholder="Enter manufacturer name"
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
                                    {isEditing ? 'Update' : 'Create'}{' '}
                                    Manufacturer
                                </Button>
                            </div>
                        </FormContainer>
                    </Form>
                )}
            </Formik>
        </div>
    )
}

export default ManufacturerForm

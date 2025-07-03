import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import {
    Input,
    FormItem,
    FormContainer,
    Select,
    Notification,
    toast,
} from '@/components/ui'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import ManufacturerService from '@/services/ManufacturerService'
import type {
    Brand,
    CreateBrandRequest,
    UpdateBrandRequest,
    Manufacturer,
} from '@/@types/parts'

interface BrandFormProps {
    brand?: Brand
    onSubmit: (data: CreateBrandRequest | UpdateBrandRequest) => Promise<void>
    onCancel: () => void
    loading?: boolean
}

const validationSchema = Yup.object().shape({
    brandName: Yup.string()
        .required('Brand name is required')
        .min(2, 'Brand name must be at least 2 characters'),
    description: Yup.string(),
    manufacturerID: Yup.number()
        .required('Manufacturer is required')
        .positive('Please select a manufacturer'),
    isActive: Yup.boolean(),
})

const BrandForm: React.FC<BrandFormProps> = ({
    brand,
    onSubmit,
    onCancel,
    loading = false,
}) => {
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
    const [loadingManufacturers, setLoadingManufacturers] = useState(true)
    const isEditing = !!brand

    const initialValues = {
        brandName: brand?.brandName || '',
        description: brand?.description || '',
        manufacturerID: brand?.manufacturerID || 0,
        isActive: brand?.isActive ?? true,
    }

    useEffect(() => {
        const fetchManufacturers = async () => {
            try {
                const data = await ManufacturerService.getManufacturers()
                setManufacturers(data.filter((m) => m.isActive))
            } catch (error) {
                console.error('Failed to fetch manufacturers:', error)
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Failed to fetch manufacturers.
                    </Notification>,
                )
            } finally {
                setLoadingManufacturers(false)
            }
        }
        fetchManufacturers()
    }, [])

    const handleSubmit = async (values: typeof initialValues) => {
        await onSubmit(values)
    }

    const manufacturerOptions = manufacturers.map((manufacturer) => ({
        value: manufacturer.manufacturerID,
        label: manufacturer.manufacturerName,
    }))

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">
                {isEditing ? 'Edit Brand' : 'Add New Brand'}
            </h3>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ errors, touched, isSubmitting, setFieldValue, values }) => (
                    <Form>
                        <FormContainer>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormItem
                                    label="Brand Name *"
                                    invalid={
                                        !!(
                                            errors.brandName &&
                                            touched.brandName
                                        )
                                    }
                                    errorMessage={errors.brandName}
                                >
                                    <Field
                                        type="text"
                                        name="brandName"
                                        placeholder="Enter brand name"
                                        component={Input}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Manufacturer *"
                                    invalid={
                                        !!(
                                            errors.manufacturerID &&
                                            touched.manufacturerID
                                        )
                                    }
                                    errorMessage={errors.manufacturerID}
                                >
                                    <Select
                                        placeholder={
                                            loadingManufacturers
                                                ? 'Loading manufacturers...'
                                                : 'Select manufacturer'
                                        }
                                        options={manufacturerOptions}
                                        value={manufacturerOptions.find(
                                            (option) =>
                                                option.value ===
                                                values.manufacturerID,
                                        )}
                                        onChange={(option) =>
                                            setFieldValue(
                                                'manufacturerID',
                                                option?.value || 0,
                                            )
                                        }
                                        isDisabled={loadingManufacturers}
                                    />
                                </FormItem>
                            </div>

                            <FormItem
                                label="Description"
                                invalid={
                                    !!(
                                        errors.description &&
                                        touched.description
                                    )
                                }
                                errorMessage={errors.description}
                                className="mt-4"
                            >
                                <Field
                                    as="textarea"
                                    name="description"
                                    placeholder="Enter brand description"
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </FormItem>

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
                                    disabled={
                                        isSubmitting ||
                                        loading ||
                                        loadingManufacturers
                                    }
                                >
                                    {isEditing ? 'Update' : 'Create'} Brand
                                </Button>
                            </div>
                        </FormContainer>
                    </Form>
                )}
            </Formik>
        </div>
    )
}

export default BrandForm

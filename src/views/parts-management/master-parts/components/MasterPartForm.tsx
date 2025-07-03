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
import BrandService from '@/services/BrandService'
import PartCategoryService from '@/services/PartCategoryService'
import type {
    MasterPart,
    CreateMasterPartRequest,
    UpdateMasterPartRequest,
    Manufacturer,
    Brand,
    PartCategory,
} from '@/@types/parts'

interface MasterPartFormProps {
    masterPart?: MasterPart
    onSubmit: (
        data: CreateMasterPartRequest | UpdateMasterPartRequest,
    ) => Promise<void>
    onCancel: () => void
    loading?: boolean
}

const validationSchema = Yup.object().shape({
    partNumber: Yup.string()
        .required('Part number is required')
        .min(2, 'Part number must be at least 2 characters'),
    uniqueCode: Yup.string()
        .required('Unique code is required')
        .min(2, 'Unique code must be at least 2 characters'),
    description: Yup.string(),
    manufacturerID: Yup.number()
        .required('Manufacturer is required')
        .positive('Please select a manufacturer'),
    brandID: Yup.number()
        .required('Brand is required')
        .positive('Please select a brand'),
    partCategoryID: Yup.number()
        .required('Part category is required')
        .positive('Please select a part category'),
    sizeUnitOfSale: Yup.string(),
})

const MasterPartForm: React.FC<MasterPartFormProps> = ({
    masterPart,
    onSubmit,
    onCancel,
    loading = false,
}) => {
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
    const [brands, setBrands] = useState<Brand[]>([])
    const [partCategories, setPartCategories] = useState<PartCategory[]>([])
    const [filteredBrands, setFilteredBrands] = useState<Brand[]>([])
    const [loadingData, setLoadingData] = useState(true)
    const isEditing = !!masterPart

    const initialValues = {
        partNumber: masterPart?.partNumber || '',
        uniqueCode: masterPart?.uniqueCode || '',
        description: masterPart?.description || '',
        manufacturerID: masterPart?.manufacturerID || 0,
        brandID: masterPart?.brandID || 0,
        partCategoryID: masterPart?.partCategoryID || 0,
        sizeUnitOfSale: masterPart?.sizeUnitOfSale || '',
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [manufacturersData, brandsData, partCategoriesData] =
                    await Promise.all([
                        ManufacturerService.getManufacturers(),
                        BrandService.getBrands(),
                        PartCategoryService.getPartCategories(),
                    ])
                setManufacturers(manufacturersData.filter((m) => m.isActive))
                setBrands(brandsData.filter((b) => b.isActive))
                setPartCategories(partCategoriesData)
            } catch (error) {
                console.error('Failed to fetch data:', error)
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Failed to fetch required data.
                    </Notification>,
                )
            } finally {
                setLoadingData(false)
            }
        }
        fetchData()
    }, [])

    const handleSubmit = async (values: typeof initialValues) => {
        await onSubmit(values)
    }

    const handleManufacturerChange = (
        manufacturerID: number,
        setFieldValue: any,
    ) => {
        setFieldValue('manufacturerID', manufacturerID)
        setFieldValue('brandID', 0) // Reset brand when manufacturer changes

        if (manufacturerID) {
            const filtered = brands.filter(
                (brand) => brand.manufacturerID === manufacturerID,
            )
            setFilteredBrands(filtered)
        } else {
            setFilteredBrands([])
        }
    }

    // Set initial filtered brands if editing
    useEffect(() => {
        if (masterPart?.manufacturerID && brands.length > 0) {
            const filtered = brands.filter(
                (brand) => brand.manufacturerID === masterPart.manufacturerID,
            )
            setFilteredBrands(filtered)
        }
    }, [masterPart, brands])

    const manufacturerOptions = manufacturers.map((manufacturer) => ({
        value: manufacturer.manufacturerID,
        label: manufacturer.manufacturerName,
    }))

    const brandOptions = filteredBrands.map((brand) => ({
        value: brand.brandID,
        label: brand.brandName,
    }))

    const partCategoryOptions = partCategories.map((category) => ({
        value: category.partCategoryID,
        label: category.partCategoryName,
    }))

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">
                {isEditing ? 'Edit Master Part' : 'Add New Master Part'}
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
                                    label="Part Number *"
                                    invalid={
                                        !!(
                                            errors.partNumber &&
                                            touched.partNumber
                                        )
                                    }
                                    errorMessage={errors.partNumber}
                                >
                                    <Field
                                        type="text"
                                        name="partNumber"
                                        placeholder="Enter part number"
                                        component={Input}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Unique Code *"
                                    invalid={
                                        !!(
                                            errors.uniqueCode &&
                                            touched.uniqueCode
                                        )
                                    }
                                    errorMessage={errors.uniqueCode}
                                >
                                    <Field
                                        type="text"
                                        name="uniqueCode"
                                        placeholder="Enter unique code"
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
                                            loadingData
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
                                            handleManufacturerChange(
                                                option?.value || 0,
                                                setFieldValue,
                                            )
                                        }
                                        isDisabled={loadingData}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Brand *"
                                    invalid={
                                        !!(errors.brandID && touched.brandID)
                                    }
                                    errorMessage={errors.brandID}
                                >
                                    <Select
                                        placeholder={
                                            !values.manufacturerID
                                                ? 'Select manufacturer first'
                                                : 'Select brand'
                                        }
                                        options={brandOptions}
                                        value={brandOptions.find(
                                            (option) =>
                                                option.value === values.brandID,
                                        )}
                                        onChange={(option) =>
                                            setFieldValue(
                                                'brandID',
                                                option?.value || 0,
                                            )
                                        }
                                        isDisabled={
                                            !values.manufacturerID ||
                                            loadingData
                                        }
                                    />
                                </FormItem>

                                <FormItem
                                    label="Part Category *"
                                    invalid={
                                        !!(
                                            errors.partCategoryID &&
                                            touched.partCategoryID
                                        )
                                    }
                                    errorMessage={errors.partCategoryID}
                                >
                                    <Select
                                        placeholder={
                                            loadingData
                                                ? 'Loading categories...'
                                                : 'Select part category'
                                        }
                                        options={partCategoryOptions}
                                        value={partCategoryOptions.find(
                                            (option) =>
                                                option.value ===
                                                values.partCategoryID,
                                        )}
                                        onChange={(option) =>
                                            setFieldValue(
                                                'partCategoryID',
                                                option?.value || 0,
                                            )
                                        }
                                        isDisabled={loadingData}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Size/Unit of Sale"
                                    invalid={
                                        !!(
                                            errors.sizeUnitOfSale &&
                                            touched.sizeUnitOfSale
                                        )
                                    }
                                    errorMessage={errors.sizeUnitOfSale}
                                >
                                    <Field
                                        type="text"
                                        name="sizeUnitOfSale"
                                        placeholder="Enter size/unit of sale"
                                        component={Input}
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
                                    placeholder="Enter part description"
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                                    disabled={
                                        isSubmitting || loading || loadingData
                                    }
                                >
                                    {isEditing ? 'Update' : 'Create'} Master
                                    Part
                                </Button>
                            </div>
                        </FormContainer>
                    </Form>
                )}
            </Formik>
        </div>
    )
}

export default MasterPartForm

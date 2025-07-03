import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    Select,
    FormItem,
    FormContainer,
    Notification,
    toast,
    Switcher,
} from '@/components/ui'
import {
    HiOutlineChevronLeft,
    HiOutlineSave,
    HiOutlineAdjustments,
} from 'react-icons/hi'
import { useNavigate, useParams } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import * as ShopAttributeService from '@/services/ShopAttributeService'
import type {
    ShopAttributeDto,
    CreateShopAttributeDto,
    UpdateShopAttributeDto,
    AttributeCategoryDto,
    AttributeUnitDto,
} from '@/@types/shop'
import useAuth from '@/auth/useAuth'

interface FormValues {
    attributeName: string
    attributeType: string
    attributeCategoryId: string
    attributeUnitId: string
    sortOrder: number
    validationString: string
}

const validationSchema = Yup.object({
    attributeName: Yup.string().required('Attribute name is required'),
    attributeType: Yup.string().required('Attribute type is required'),
    attributeCategoryId: Yup.string().required('Category is required'),
    attributeUnitId: Yup.string().required('Unit is required'),
    sortOrder: Yup.number()
        .min(0, 'Sort order must be 0 or greater')
        .required('Sort order is required'),
    validationString: Yup.string(),
})

const ShopAttributeFormPage = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const isEdit = !!id

    // State management
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [categories, setCategories] = useState<AttributeCategoryDto[]>([])
    const [units, setUnits] = useState<AttributeUnitDto[]>([])
    const [initialValues, setInitialValues] = useState<FormValues>({
        attributeName: '',
        attributeType: '',
        attributeCategoryId: '',
        attributeUnitId: '',
        sortOrder: 0,
        validationString: '',
    })

    // Check user permissions
    const hasPermissions = user?.roles?.some((role) =>
        ['CS_ADMIN', 'CS_USER'].includes(role),
    )

    useEffect(() => {
        if (hasPermissions) {
            fetchData()
        }
    }, [hasPermissions, id])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [categoriesData, unitsData] = await Promise.all([
                ShopAttributeService.getAttributeCategories(),
                ShopAttributeService.getAttributeUnits(),
            ])

            setCategories(categoriesData)
            setUnits(unitsData)

            if (isEdit && id) {
                const attributeData =
                    await ShopAttributeService.getShopAttribute(parseInt(id))
                setInitialValues({
                    attributeName: attributeData.attributeName || '',
                    attributeType: attributeData.attributeType || '',
                    attributeCategoryId:
                        attributeData.attributeCategoryId.toString(),
                    attributeUnitId: attributeData.attributeUnitId.toString(),
                    sortOrder: attributeData.sortOrder,
                    validationString: attributeData.validationString || '',
                })
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to fetch data
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (values: FormValues) => {
        setSaving(true)
        try {
            const payload: CreateShopAttributeDto | UpdateShopAttributeDto = {
                attributeName: values.attributeName,
                attributeType: values.attributeType,
                attributeCategoryId: parseInt(values.attributeCategoryId),
                attributeUnitId: parseInt(values.attributeUnitId),
                sortOrder: values.sortOrder,
                validationString: values.validationString || null,
            }

            if (isEdit && id) {
                await ShopAttributeService.updateShopAttribute(
                    parseInt(id),
                    payload as UpdateShopAttributeDto,
                )
                toast.push(
                    <Notification type="success" title="Success">
                        Shop attribute updated successfully
                    </Notification>,
                )
            } else {
                await ShopAttributeService.createShopAttribute(
                    payload as CreateShopAttributeDto,
                )
                toast.push(
                    <Notification type="success" title="Success">
                        Shop attribute created successfully
                    </Notification>,
                )
            }

            navigate('/admin/shop-attributes')
        } catch (error) {
            console.error('Error saving shop attribute:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to save shop attribute
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleBack = () => {
        navigate('/admin/shop-attributes')
    }

    if (!hasPermissions) {
        return (
            <div className="p-4">
                <Card className="text-center p-8">
                    <h4 className="mb-2">Access Denied</h4>
                    <p>
                        You need CS-Admin or CS-User permissions to access shop
                        attribute management.
                    </p>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="p-4">
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-2 sm:p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<HiOutlineChevronLeft />}
                        onClick={handleBack}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Back to Shop Attributes
                    </Button>
                </div>
                <div className="flex items-center gap-3">
                    <HiOutlineAdjustments className="text-2xl text-blue-600" />
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {isEdit
                            ? 'Edit Shop Attribute'
                            : 'Create Shop Attribute'}
                    </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {isEdit
                        ? 'Update the shop attribute details'
                        : 'Add a new shop attribute to the system'}
                </p>
            </div>

            {/* Form */}
            <Card className="max-w-2xl">
                <div className="p-6">
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        enableReinitialize
                    >
                        {({ values, errors, touched, setFieldValue }) => (
                            <Form>
                                <FormContainer>
                                    <FormItem
                                        label="Attribute Name"
                                        invalid={
                                            !!(
                                                errors.attributeName &&
                                                touched.attributeName
                                            )
                                        }
                                        errorMessage={errors.attributeName}
                                    >
                                        <Field
                                            type="text"
                                            name="attributeName"
                                            placeholder="Enter attribute name"
                                            component={Input}
                                        />
                                    </FormItem>

                                    <FormItem
                                        label="Attribute Type"
                                        invalid={
                                            !!(
                                                errors.attributeType &&
                                                touched.attributeType
                                            )
                                        }
                                        errorMessage={errors.attributeType}
                                    >
                                        <Field
                                            type="text"
                                            name="attributeType"
                                            placeholder="Enter attribute type"
                                            component={Input}
                                        />
                                    </FormItem>

                                    <FormItem
                                        label="Category"
                                        invalid={
                                            !!(
                                                errors.attributeCategoryId &&
                                                touched.attributeCategoryId
                                            )
                                        }
                                        errorMessage={
                                            errors.attributeCategoryId
                                        }
                                    >
                                        <Select
                                            placeholder="Select a category"
                                            value={categories.find(
                                                (cat) =>
                                                    cat.id.toString() ===
                                                    values.attributeCategoryId,
                                            )}
                                            options={categories.map((cat) => ({
                                                value: cat.id.toString(),
                                                label: cat.description || 'N/A',
                                            }))}
                                            onChange={(option) =>
                                                setFieldValue(
                                                    'attributeCategoryId',
                                                    option?.value || '',
                                                )
                                            }
                                        />
                                    </FormItem>

                                    <FormItem
                                        label="Unit"
                                        invalid={
                                            !!(
                                                errors.attributeUnitId &&
                                                touched.attributeUnitId
                                            )
                                        }
                                        errorMessage={errors.attributeUnitId}
                                    >
                                        <Select
                                            placeholder="Select a unit"
                                            value={units.find(
                                                (unit) =>
                                                    unit.id.toString() ===
                                                    values.attributeUnitId,
                                            )}
                                            options={units.map((unit) => ({
                                                value: unit.id.toString(),
                                                label: `${unit.type || 'N/A'}${
                                                    unit.isTable
                                                        ? ' (Table)'
                                                        : ''
                                                }`,
                                            }))}
                                            onChange={(option) =>
                                                setFieldValue(
                                                    'attributeUnitId',
                                                    option?.value || '',
                                                )
                                            }
                                        />
                                    </FormItem>

                                    <FormItem
                                        label="Sort Order"
                                        invalid={
                                            !!(
                                                errors.sortOrder &&
                                                touched.sortOrder
                                            )
                                        }
                                        errorMessage={errors.sortOrder}
                                    >
                                        <Field
                                            type="number"
                                            name="sortOrder"
                                            placeholder="Enter sort order"
                                            component={Input}
                                            min="0"
                                        />
                                    </FormItem>

                                    <FormItem
                                        label="Validation String"
                                        invalid={
                                            !!(
                                                errors.validationString &&
                                                touched.validationString
                                            )
                                        }
                                        errorMessage={errors.validationString}
                                    >
                                        <Field
                                            type="text"
                                            name="validationString"
                                            placeholder="Enter validation string (optional)"
                                            component={Input}
                                        />
                                    </FormItem>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <Button
                                            type="button"
                                            variant="plain"
                                            onClick={handleBack}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="solid"
                                            icon={<HiOutlineSave />}
                                            loading={saving}
                                        >
                                            {isEdit ? 'Update' : 'Create'}{' '}
                                            Attribute
                                        </Button>
                                    </div>
                                </FormContainer>
                            </Form>
                        )}
                    </Formik>
                </div>
            </Card>
        </div>
    )
}

export default ShopAttributeFormPage

import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Input,
    Button,
    Table,
    Dialog,
    FormItem,
    FormContainer,
    Notification,
    Skeleton,
    Alert,
    Badge,
    Select,
    Pagination,
} from '@/components/ui'
import { toast } from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineCheck,
    HiOutlineX,
    HiOutlineDocumentDuplicate,
} from 'react-icons/hi'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import * as ShopPropertiesService from '@/services/ShopPropertiesService'
import * as ShopService from '@/services/ShopService'
import type {
    ShopPropertiesDto,
    CreateShopPropertiesDto,
    UpdateShopPropertiesDto,
    Shop,
    ShopPropertyBulkUpdateItem,
} from '@/@types/shop'
import useAuth from '@/auth/useAuth'

interface FormValues {
    shopAttributeId: number
    shopId: number
    propertyYear: number
    propertyMonth: number
    propertyValue: number | null
}

interface BulkEditValues {
    propertyValue: number | null
}

const validationSchema = Yup.object({
    shopAttributeId: Yup.number().required('Shop Attribute is required'),
    shopId: Yup.number().required('Shop is required'),
    propertyYear: Yup.number()
        .required('Year is required')
        .min(2020, 'Year must be 2020 or later')
        .max(2030, 'Year must be 2030 or earlier'),
    propertyMonth: Yup.number()
        .required('Month is required')
        .min(1, 'Month must be between 1 and 12')
        .max(12, 'Month must be between 1 and 12'),
    propertyValue: Yup.number().nullable(),
})

const ShopPropertiesListPage = () => {
    const { user } = useAuth() // State management
    const [properties, setProperties] = useState<ShopPropertiesDto[]>([])
    const [shops, setShops] = useState<Shop[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [selectedShop, setSelectedShop] = useState<number | null>(() => {
        const saved = localStorage.getItem('shopProperties.selectedShop')
        return saved ? parseInt(saved, 10) : null
    })
    const [selectedDate, setSelectedDate] = useState<{
        year: number
        month: number
    } | null>(() => {
        const saved = localStorage.getItem('shopProperties.selectedDate')
        return saved ? JSON.parse(saved) : null
    })
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingProperty, setEditingProperty] =
        useState<ShopPropertiesDto | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(20)

    // Inline editing state
    const [editedValues, setEditedValues] = useState<{
        [key: number]: number | null
    }>({})
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Permissions
    const hasCreateAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'shopproperties.create'].includes(role),
    )
    const hasEditAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'shopproperties.edit'].includes(role),
    )
    const hasViewAccess = user?.authority?.some((role: string) =>
        [
            'CS-Admin',
            'CS-User',
            'Tenant-Admin',
            'Tenant-User',
            'shopproperties.view',
            'shopproperties.edit',
            'shopproperties.create',
        ].includes(role),
    )

    // Date options (2 years ago to 6 months in future)
    const dateOptions = useMemo(() => {
        return ShopPropertiesService.getDateOptions().sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year
            return b.month - a.month
        })
    }, []) // Set default date to current month on component mount (only if no saved date)
    useEffect(() => {
        if (!selectedDate && dateOptions.length > 0) {
            // Check if there's a saved date first
            const savedDate = localStorage.getItem(
                'shopProperties.selectedDate',
            )
            if (savedDate) {
                try {
                    const parsedDate = JSON.parse(savedDate)
                    // Validate that the saved date is still available in dateOptions
                    const isDateAvailable = dateOptions.some(
                        (option) =>
                            option.year === parsedDate.year &&
                            option.month === parsedDate.month,
                    )
                    if (isDateAvailable) {
                        return // Don't set default, the saved date will be used
                    }
                } catch (error) {
                    console.warn('Invalid saved date format:', error)
                }
            }

            // Find current month or default to first available option
            const currentYear = new Date().getFullYear()
            const currentMonth = new Date().getMonth() + 1
            const currentOption = dateOptions.find(
                (option) =>
                    option.year === currentYear &&
                    option.month === currentMonth,
            )

            if (currentOption) {
                setSelectedDate({
                    year: currentOption.year,
                    month: currentOption.month,
                })
            } else {
                // Default to first available option
                setSelectedDate({
                    year: dateOptions[0].year,
                    month: dateOptions[0].month,
                })
            }
        }
    }, [dateOptions, selectedDate])

    // Load shops on component mount
    useEffect(() => {
        loadShops()
    }, [])

    // Load properties when shop or date selection changes
    useEffect(() => {
        if (selectedShop && selectedDate) {
            loadProperties()
        } else {
            setProperties([])
        }
    }, [selectedShop, selectedDate]) // Reset edited values when properties change
    useEffect(() => {
        setEditedValues({})
        setHasChanges(false)
    }, [properties])

    // Save selected shop to localStorage
    useEffect(() => {
        if (selectedShop !== null) {
            localStorage.setItem(
                'shopProperties.selectedShop',
                selectedShop.toString(),
            )
        } else {
            localStorage.removeItem('shopProperties.selectedShop')
        }
    }, [selectedShop])

    // Save selected date to localStorage
    useEffect(() => {
        if (selectedDate !== null) {
            localStorage.setItem(
                'shopProperties.selectedDate',
                JSON.stringify(selectedDate),
            )
        } else {
            localStorage.removeItem('shopProperties.selectedDate')
        }
    }, [selectedDate])

    const loadShops = async () => {
        try {
            const shopsData = await ShopService.getShopsList()
            setShops(shopsData.filter((shop) => shop.isActive))
        } catch (error) {
            console.error('Error loading shops:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load shops
                </Notification>,
            )
        }
    }

    const loadProperties = async () => {
        if (!selectedShop || !selectedDate) return

        console.log(
            'Loading properties for shop:',
            selectedShop,
            'year:',
            selectedDate.year,
            'month:',
            selectedDate.month,
        )
        setLoading(true)
        try {
            const propertiesData =
                await ShopPropertiesService.getShopPropertiesByShopAndYear(
                    selectedShop,
                    selectedDate.year,
                    selectedDate.month,
                )

            console.log('Properties data received:', propertiesData)
            console.log('Properties data length:', propertiesData?.length)
            setProperties(propertiesData)
        } catch (error) {
            console.error('Error loading shop properties:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load shop properties
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    // Filter properties based on search text - search across all fields
    const filteredProperties = useMemo(() => {
        if (!searchText) return properties

        const searchLower = searchText.toLowerCase()
        return properties.filter(
            (property) =>
                property.attributeName?.toLowerCase().includes(searchLower) ||
                property.attributeCategoryDescription
                    ?.toLowerCase()
                    .includes(searchLower) ||
                property.attributeUnitType
                    ?.toLowerCase()
                    .includes(searchLower) ||
                property.propertyValue
                    ?.toString()
                    .toLowerCase()
                    .includes(searchLower) ||
                property.rowModifiedBy?.toLowerCase().includes(searchLower) ||
                property.rowModifiedOn?.toLowerCase().includes(searchLower) ||
                ShopPropertiesService.formatPropertyDate(
                    property.propertyYear,
                    property.propertyMonth,
                )
                    .toLowerCase()
                    .includes(searchLower),
        )
    }, [properties, searchText])

    // Paginated properties
    const paginatedProperties = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        return filteredProperties.slice(startIndex, startIndex + pageSize)
    }, [filteredProperties, currentPage, pageSize])

    const totalItems = filteredProperties.length

    const handleCreate = async (values: FormValues) => {
        try {
            const newProperty =
                await ShopPropertiesService.createShopProperty(values)
            setProperties((prev) => [...prev, newProperty])
            setShowCreateDialog(false)
            toast.push(
                <Notification title="Success" type="success">
                    Shop property created successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Error creating shop property:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to create shop property
                </Notification>,
            )
        }
    }

    const handleEdit = async (values: FormValues) => {
        if (!editingProperty) return

        try {
            const updateData: UpdateShopPropertiesDto = {
                propertyYear: values.propertyYear,
                propertyMonth: values.propertyMonth,
                propertyValue: values.propertyValue,
            }

            const updatedProperty =
                await ShopPropertiesService.updateShopProperty(
                    editingProperty.id,
                    updateData,
                )

            setProperties((prev) =>
                prev.map((property) =>
                    property.id === editingProperty.id
                        ? updatedProperty
                        : property,
                ),
            )
            setShowEditDialog(false)
            setEditingProperty(null)
            toast.push(
                <Notification title="Success" type="success">
                    Shop property updated successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Error updating shop property:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to update shop property
                </Notification>,
            )
        }
    }

    const handleDelete = async (property: ShopPropertiesDto) => {
        try {
            await ShopPropertiesService.deleteShopProperty(property.id)
            setProperties((prev) => prev.filter((p) => p.id !== property.id))
            toast.push(
                <Notification title="Success" type="success">
                    Shop property deleted successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Error deleting shop property:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to delete shop property
                </Notification>,
            )
        }
    }

    const formatDate = (year: number, month: number) => {
        return ShopPropertiesService.formatPropertyDate(year, month)
    }

    // Inline editing handlers
    const handleValueChange = (propertyId: number, value: string) => {
        const numericValue = value === '' ? null : parseFloat(value)
        setEditedValues((prev) => ({
            ...prev,
            [propertyId]: numericValue,
        }))
        setHasChanges(true)
    }

    const handleBulkSave = async () => {
        if (Object.keys(editedValues).length === 0) return

        setIsSaving(true)
        try {
            const updates: ShopPropertyBulkUpdateItem[] = Object.entries(
                editedValues,
            ).map(([id, value]) => ({
                id: parseInt(id),
                propertyValue: value,
            }))

            const updatedProperties =
                await ShopPropertiesService.bulkUpdateShopProperties({
                    updates,
                })

            // Update local state
            setProperties((prev) =>
                prev.map((property) => {
                    const updated = updatedProperties.find(
                        (u) => u.id === property.id,
                    )
                    return updated || property
                }),
            )

            // Reset editing state
            setEditedValues({})
            setHasChanges(false)

            toast.push(
                <Notification title="Success" type="success">
                    {Object.keys(editedValues).length} properties updated
                    successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Error bulk saving properties:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to save changes
                </Notification>,
            )
        } finally {
            setIsSaving(false)
        }
    }

    const handleResetChanges = () => {
        setEditedValues({})
        setHasChanges(false)
    }

    const getCurrentValue = (property: ShopPropertiesDto): number | null => {
        return editedValues.hasOwnProperty(property.id)
            ? editedValues[property.id]
            : property.propertyValue
    }

    if (!hasViewAccess) {
        return (
            <div className="flex items-center justify-center h-96">
                <Alert type="warning" title="Access Denied">
                    You don't have permission to view shop properties.
                </Alert>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Shop Properties
                </h1>
                <p className="text-gray-600">
                    Manage shop properties filtered by shop and date
                </p>
            </div>

            {/* Filters */}
            <Card className="mb-6 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Shop Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Shop *
                        </label>
                        <Select<{ value: number; label: string }>
                            placeholder="Select a shop"
                            value={
                                selectedShop
                                    ? shops.find(
                                          (shop) => shop.id === selectedShop,
                                      ) && {
                                          value: selectedShop,
                                          label:
                                              shops.find(
                                                  (shop) =>
                                                      shop.id === selectedShop,
                                              )?.name || '',
                                      }
                                    : null
                            }
                            onChange={(option) =>
                                setSelectedShop(option ? option.value : null)
                            }
                            options={shops
                                .slice()
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((shop) => ({
                                    value: shop.id,
                                    label: shop.name,
                                }))}
                        />
                    </div>

                    {/* Date Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date *
                        </label>
                        <Select<{
                            label: string
                            value: string
                            year: number
                            month: number
                        }>
                            placeholder="Select a date"
                            value={
                                selectedDate
                                    ? dateOptions.find(
                                          (option) =>
                                              option.year ===
                                                  selectedDate.year &&
                                              option.month ===
                                                  selectedDate.month,
                                      ) || null
                                    : null
                            }
                            onChange={(option) => {
                                if (!option) {
                                    setSelectedDate(null)
                                } else {
                                    setSelectedDate({
                                        year: option.year,
                                        month: option.month,
                                    })
                                }
                            }}
                            options={dateOptions}
                        />
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search
                        </label>
                        <Input
                            placeholder="Search all fields..."
                            prefix={<HiOutlineSearch />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            {selectedShop && (
                <Card>
                    {/* Actions Bar */}
                    <div className="flex justify-between items-center p-4 border-b">
                        <div className="flex items-center space-x-4">
                            {hasCreateAccess && (
                                <Button
                                    variant="solid"
                                    onClick={() => setShowCreateDialog(true)}
                                    icon={<HiOutlinePlus />}
                                >
                                    Add Property
                                </Button>
                            )}
                            {hasChanges && (
                                <>
                                    <Button
                                        variant="solid"
                                        color="emerald"
                                        onClick={handleBulkSave}
                                        loading={isSaving}
                                        icon={<HiOutlineCheck />}
                                    >
                                        Save Changes (
                                        {Object.keys(editedValues).length})
                                    </Button>
                                    <Button
                                        variant="plain"
                                        onClick={handleResetChanges}
                                        icon={<HiOutlineX />}
                                    >
                                        Reset
                                    </Button>
                                </>
                            )}
                        </div>
                        <div className="text-sm text-gray-500">
                            {totalItems} properties found
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-6">
                                <Skeleton height={40} />
                                <Skeleton height={40} />
                                <Skeleton height={40} />
                                <Skeleton height={40} />
                                <Skeleton height={40} />
                            </div>
                        ) : (
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Attribute</th>
                                        <th>Category</th>
                                        <th>Value</th>
                                        <th>Unit Type</th>
                                        <th>Modified By</th>
                                        <th>Modified On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedProperties.map((property) => (
                                        <tr key={property.id}>
                                            <td className="font-medium">
                                                {property.attributeName ||
                                                    'N/A'}
                                            </td>
                                            <td>
                                                <Badge>
                                                    {property.attributeCategoryDescription ||
                                                        'N/A'}
                                                </Badge>
                                            </td>
                                            <td className="font-mono">
                                                {hasEditAccess ? (
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            getCurrentValue(
                                                                property,
                                                            ) !== null &&
                                                            getCurrentValue(
                                                                property,
                                                            ) !== undefined
                                                                ? String(
                                                                      getCurrentValue(
                                                                          property,
                                                                      ),
                                                                  )
                                                                : ''
                                                        }
                                                        onChange={(e) =>
                                                            handleValueChange(
                                                                property.id,
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-32"
                                                        placeholder="Enter value"
                                                    />
                                                ) : getCurrentValue(
                                                      property,
                                                  ) !== null ? (
                                                    getCurrentValue(
                                                        property,
                                                    )!.toLocaleString()
                                                ) : (
                                                    'N/A'
                                                )}
                                            </td>
                                            <td>
                                                {property.attributeUnitType ||
                                                    'N/A'}
                                            </td>
                                            <td>
                                                {property.rowModifiedBy ||
                                                    'N/A'}
                                            </td>
                                            <td>
                                                {property.rowModifiedOn
                                                    ? new Date(
                                                          property.rowModifiedOn,
                                                      ).toLocaleDateString()
                                                    : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedProperties.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="text-center py-8 text-gray-500"
                                            >
                                                No properties found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalItems > pageSize && (
                        <div className="flex justify-center p-4 border-t">
                            <Pagination
                                total={totalItems}
                                currentPage={currentPage}
                                pageSize={pageSize}
                                onChange={(page) => setCurrentPage(page)}
                            />
                        </div>
                    )}
                </Card>
            )}

            {!selectedShop && (
                <Card className="p-8">
                    <div className="text-center text-gray-500">
                        <HiOutlineSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Select a Shop
                        </h3>
                        <p>
                            Choose a shop from the dropdown above to view its
                            properties.
                        </p>
                    </div>
                </Card>
            )}

            {/* Create Dialog */}
            <Dialog
                isOpen={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
            >
                <Formik
                    initialValues={{
                        shopAttributeId: 0,
                        shopId: selectedShop || 0,
                        propertyYear: new Date().getFullYear(),
                        propertyMonth: new Date().getMonth() + 1,
                        propertyValue: null,
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleCreate}
                >
                    {({ errors, touched, setFieldValue, values }) => (
                        <Form>
                            <FormContainer className="space-y-4">
                                <FormItem
                                    label="Shop Attribute ID"
                                    invalid={Boolean(
                                        errors.shopAttributeId &&
                                            touched.shopAttributeId,
                                    )}
                                    errorMessage={errors.shopAttributeId}
                                >
                                    <Field name="shopAttributeId">
                                        {({ field }: any) => (
                                            <Input
                                                {...field}
                                                type="number"
                                                placeholder="Enter shop attribute ID"
                                            />
                                        )}
                                    </Field>
                                </FormItem>

                                <FormItem
                                    label="Shop"
                                    invalid={Boolean(
                                        errors.shopId && touched.shopId,
                                    )}
                                    errorMessage={errors.shopId}
                                >
                                    <Field name="shopId">
                                        {({ field }: any) => (
                                            <Select
                                                {...field}
                                                placeholder="Select shop"
                                                onChange={(value) =>
                                                    setFieldValue(
                                                        'shopId',
                                                        Number(value),
                                                    )
                                                }
                                                options={shops.map((shop) => ({
                                                    value: shop.id,
                                                    label: shop.name,
                                                }))}
                                            />
                                        )}
                                    </Field>
                                </FormItem>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormItem
                                        label="Year"
                                        invalid={Boolean(
                                            errors.propertyYear &&
                                                touched.propertyYear,
                                        )}
                                        errorMessage={errors.propertyYear}
                                    >
                                        <Field name="propertyYear">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="YYYY"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="Month"
                                        invalid={Boolean(
                                            errors.propertyMonth &&
                                                touched.propertyMonth,
                                        )}
                                        errorMessage={errors.propertyMonth}
                                    >
                                        <Field name="propertyMonth">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="MM"
                                                    min="1"
                                                    max="12"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>
                                </div>

                                <FormItem
                                    label="Property Value"
                                    invalid={Boolean(
                                        errors.propertyValue &&
                                            touched.propertyValue,
                                    )}
                                    errorMessage={errors.propertyValue}
                                >
                                    <Field name="propertyValue">
                                        {({ field }: any) => (
                                            <Input
                                                {...field}
                                                type="number"
                                                step="0.01"
                                                placeholder="Enter property value"
                                            />
                                        )}
                                    </Field>
                                </FormItem>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="plain"
                                        onClick={() =>
                                            setShowCreateDialog(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="solid">
                                        Create Property
                                    </Button>
                                </div>
                            </FormContainer>
                        </Form>
                    )}
                </Formik>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                isOpen={showEditDialog}
                onClose={() => {
                    setShowEditDialog(false)
                    setEditingProperty(null)
                }}
            >
                {editingProperty && (
                    <Formik
                        initialValues={{
                            shopAttributeId: editingProperty.shopAttributeId,
                            shopId: editingProperty.shopId,
                            propertyYear: editingProperty.propertyYear,
                            propertyMonth: editingProperty.propertyMonth,
                            propertyValue: editingProperty.propertyValue,
                        }}
                        validationSchema={validationSchema}
                        onSubmit={handleEdit}
                    >
                        {({ errors, touched }) => (
                            <Form>
                                <FormContainer className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormItem
                                            label="Year"
                                            invalid={Boolean(
                                                errors.propertyYear &&
                                                    touched.propertyYear,
                                            )}
                                            errorMessage={errors.propertyYear}
                                        >
                                            <Field name="propertyYear">
                                                {({ field }: any) => (
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        placeholder="YYYY"
                                                    />
                                                )}
                                            </Field>
                                        </FormItem>

                                        <FormItem
                                            label="Month"
                                            invalid={Boolean(
                                                errors.propertyMonth &&
                                                    touched.propertyMonth,
                                            )}
                                            errorMessage={errors.propertyMonth}
                                        >
                                            <Field name="propertyMonth">
                                                {({ field }: any) => (
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        placeholder="MM"
                                                        min="1"
                                                        max="12"
                                                    />
                                                )}
                                            </Field>
                                        </FormItem>
                                    </div>

                                    <FormItem
                                        label="Property Value"
                                        invalid={Boolean(
                                            errors.propertyValue &&
                                                touched.propertyValue,
                                        )}
                                        errorMessage={errors.propertyValue}
                                    >
                                        <Field name="propertyValue">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Enter property value"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="plain"
                                            onClick={() => {
                                                setShowEditDialog(false)
                                                setEditingProperty(null)
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="solid">
                                            Update Property
                                        </Button>
                                    </div>
                                </FormContainer>
                            </Form>
                        )}
                    </Formik>
                )}
            </Dialog>
        </div>
    )
}

export default ShopPropertiesListPage

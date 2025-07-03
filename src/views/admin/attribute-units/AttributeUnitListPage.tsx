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
    toast,
    Tag,
    Skeleton,
    Alert,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
} from 'react-icons/hi'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import * as ShopAttributeService from '@/services/ShopAttributeService'
import type {
    AttributeUnitDto,
    CreateAttributeUnitDto,
    UpdateAttributeUnitDto,
} from '@/@types/shop'
import useAuth from '@/auth/useAuth'

interface FormValues {
    type: string
    isTable: boolean
}

const validationSchema = Yup.object({
    type: Yup.string()
        .required('Type is required')
        .max(100, 'Type must be less than 100 characters'),
    isTable: Yup.boolean().required('Table type is required'),
})

const AttributeUnitListPage = () => {
    const { user } = useAuth()

    // State management
    const [units, setUnits] = useState<AttributeUnitDto[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<AttributeUnitDto | null>(
        null,
    )
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [unitToDelete, setUnitToDelete] = useState<AttributeUnitDto | null>(
        null,
    )

    // Check user permissions
    const canEdit = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )
    const canDelete = user?.authority?.some((role: string) =>
        ['CS-Admin'].includes(role),
    )

    useEffect(() => {
        if (canEdit) {
            fetchUnits()
        }
    }, [canEdit])

    const fetchUnits = async () => {
        setLoading(true)
        try {
            const data = await ShopAttributeService.getAttributeUnits()
            setUnits(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error fetching units:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to fetch attribute units
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    // Filter and search logic
    const filteredUnits = useMemo(() => {
        if (!searchText) return units
        return units.filter((unit) =>
            unit.type?.toLowerCase().includes(searchText.toLowerCase()),
        )
    }, [units, searchText])

    const handleOpenDialog = (unit?: AttributeUnitDto) => {
        setEditingUnit(unit || null)
        setDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setDialogOpen(false)
        setEditingUnit(null)
    }

    const handleDeleteClick = (unit: AttributeUnitDto) => {
        setUnitToDelete(unit)
        setDeleteConfirmOpen(true)
    }

    const handleSubmit = async (values: FormValues) => {
        try {
            if (editingUnit) {
                // Update existing unit
                await ShopAttributeService.updateAttributeUnit(
                    editingUnit.id,
                    values,
                )
                toast.push(
                    <Notification type="success" title="Success">
                        Attribute unit updated successfully
                    </Notification>,
                )
            } else {
                // Create new unit
                const createData: CreateAttributeUnitDto = values
                await ShopAttributeService.createAttributeUnit(createData)
                toast.push(
                    <Notification type="success" title="Success">
                        Attribute unit created successfully
                    </Notification>,
                )
            }

            handleCloseDialog()
            fetchUnits()
        } catch (error) {
            console.error('Error saving unit:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to save attribute unit
                </Notification>,
            )
        }
    }

    const handleDeleteConfirm = async () => {
        if (!unitToDelete) return

        try {
            await ShopAttributeService.deleteAttributeUnit(unitToDelete.id)
            toast.push(
                <Notification type="success" title="Success">
                    Attribute unit deleted successfully
                </Notification>,
            )
            setDeleteConfirmOpen(false)
            setUnitToDelete(null)
            fetchUnits()
        } catch (error) {
            console.error('Error deleting unit:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to delete attribute unit
                </Notification>,
            )
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // Search is handled by filteredUnits useMemo
    }

    if (!canEdit) {
        return (
            <div className="p-6">
                <Alert type="warning">
                    You don't have permission to access this page.
                </Alert>
            </div>
        )
    }

    const { Tr, Th, Td, THead, TBody } = Table

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Attribute Units Management
                </h1>
            </div>

            <Card>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Attribute Units
                        </h2>
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiOutlinePlus />}
                            onClick={() => handleOpenDialog()}
                        >
                            Add Unit
                        </Button>
                    </div>

                    <div className="mb-6">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search by type..."
                                    value={searchText}
                                    onChange={(e) =>
                                        setSearchText(e.target.value)
                                    }
                                    prefix={
                                        <HiOutlineSearch className="text-lg" />
                                    }
                                />
                            </div>
                            <Button type="submit" variant="solid">
                                Search
                            </Button>
                        </form>
                    </div>

                    <Table>
                        <THead>
                            <Tr>
                                <Th>Type</Th>
                                <Th>Is Table</Th>
                                <Th>Created Date</Th>
                                <Th>Created By</Th>
                                <Th></Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {loading ? (
                                Array.from(new Array(5)).map((_, index) => (
                                    <Tr key={index}>
                                        <Td>
                                            <Skeleton />
                                        </Td>
                                        <Td>
                                            <Skeleton />
                                        </Td>
                                        <Td>
                                            <Skeleton />
                                        </Td>
                                        <Td>
                                            <Skeleton />
                                        </Td>
                                        <Td>
                                            <Skeleton />
                                        </Td>
                                    </Tr>
                                ))
                            ) : filteredUnits.length === 0 ? (
                                <Tr>
                                    <Td colSpan={5} className="text-center">
                                        <div className="text-gray-500">
                                            No attribute units found
                                        </div>
                                    </Td>
                                </Tr>
                            ) : (
                                filteredUnits.map((unit) => (
                                    <Tr key={unit.id}>
                                        <Td>
                                            <div className="font-medium text-gray-900">
                                                {unit.type || '-'}
                                            </div>
                                        </Td>
                                        <Td>
                                            <Tag
                                                className={
                                                    unit.isTable
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }
                                            >
                                                {unit.isTable
                                                    ? 'Table'
                                                    : 'Single'}
                                            </Tag>
                                        </Td>
                                        <Td>
                                            <div className="text-gray-500 text-sm">
                                                {unit.rowCreatedDate
                                                    ? new Date(
                                                          unit.rowCreatedDate,
                                                      ).toLocaleDateString()
                                                    : '-'}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="text-gray-500 text-sm">
                                                {unit.rowCreatedBy || '-'}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    size="xs"
                                                    variant="plain"
                                                    icon={<HiOutlinePencil />}
                                                    onClick={() =>
                                                        handleOpenDialog(unit)
                                                    }
                                                />
                                                {canDelete && (
                                                    <Button
                                                        size="xs"
                                                        variant="plain"
                                                        icon={
                                                            <HiOutlineTrash />
                                                        }
                                                        onClick={() =>
                                                            handleDeleteClick(
                                                                unit,
                                                            )
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </TBody>
                    </Table>
                </div>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog isOpen={dialogOpen} onClose={handleCloseDialog}>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {editingUnit
                            ? 'Edit Attribute Unit'
                            : 'Create Attribute Unit'}
                    </h3>

                    <Formik
                        initialValues={{
                            type: editingUnit?.type || '',
                            isTable: editingUnit?.isTable || false,
                        }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        enableReinitialize
                    >
                        {({ errors, touched, isSubmitting }) => (
                            <Form>
                                <FormContainer>
                                    <FormItem
                                        label="Type"
                                        invalid={
                                            !!(errors.type && touched.type)
                                        }
                                        errorMessage={errors.type}
                                    >
                                        <Field
                                            type="text"
                                            name="type"
                                            placeholder="Enter type"
                                            component={Input}
                                        />
                                    </FormItem>

                                    <FormItem
                                        label="Is Table"
                                        invalid={
                                            !!(
                                                errors.isTable &&
                                                touched.isTable
                                            )
                                        }
                                        errorMessage={errors.isTable}
                                    >
                                        <Field name="isTable">
                                            {({ field, form }: any) => (
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            checked={
                                                                field.value ===
                                                                true
                                                            }
                                                            onChange={() =>
                                                                form.setFieldValue(
                                                                    'isTable',
                                                                    true,
                                                                )
                                                            }
                                                            className="text-blue-600"
                                                        />
                                                        <span>Table</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            checked={
                                                                field.value ===
                                                                false
                                                            }
                                                            onChange={() =>
                                                                form.setFieldValue(
                                                                    'isTable',
                                                                    false,
                                                                )
                                                            }
                                                            className="text-blue-600"
                                                        />
                                                        <span>Single</span>
                                                    </label>
                                                </div>
                                            )}
                                        </Field>
                                    </FormItem>

                                    <div className="flex gap-4 justify-end mt-6">
                                        <Button
                                            type="button"
                                            onClick={handleCloseDialog}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="solid"
                                            loading={isSubmitting}
                                        >
                                            {editingUnit ? 'Update' : 'Create'}
                                        </Button>
                                    </div>
                                </FormContainer>
                            </Form>
                        )}
                    </Formik>
                </div>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Confirm Delete
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Are you sure you want to delete the attribute unit "
                        {unitToDelete?.type}"? This action cannot be undone.
                    </p>
                    <div className="flex gap-4 justify-end">
                        <Button onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default AttributeUnitListPage

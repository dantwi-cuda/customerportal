import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Input,
    Button,
    Table,
    Pagination,
    Notification,
    toast,
    Dialog,
    FormItem,
    FormContainer,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineChevronLeft,
    HiOutlineTag,
} from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import * as ShopAttributeService from '@/services/ShopAttributeService'
import type {
    AttributeCategoryDto,
    CreateAttributeCategoryDto,
    UpdateAttributeCategoryDto,
} from '@/@types/shop'
import useAuth from '@/auth/useAuth'

interface FormValues {
    description: string
}

const validationSchema = Yup.object({
    description: Yup.string().required('Description is required'),
})

const AttributeCategoryListPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    // State management
    const [categories, setCategories] = useState<AttributeCategoryDto[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)

    // Dialog states
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] =
        useState<AttributeCategoryDto | null>(null)
    const [saving, setSaving] = useState(false) // Check user permissions
    const hasPermissions = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    useEffect(() => {
        if (hasPermissions) {
            fetchCategories()
        }
    }, [hasPermissions])

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const data = await ShopAttributeService.getAttributeCategories()
            setCategories(data)
        } catch (error) {
            console.error('Error fetching categories:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to fetch attribute categories
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    // Filter and search logic
    const filteredCategories = useMemo(() => {
        if (!searchText) return categories

        return categories.filter((category) =>
            category.description
                ?.toLowerCase()
                .includes(searchText.toLowerCase()),
        )
    }, [categories, searchText])

    // Pagination logic
    const totalItems = filteredCategories.length
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

    const handleCreate = () => {
        setEditingCategory(null)
        setDialogOpen(true)
    }

    const handleEdit = (category: AttributeCategoryDto) => {
        setEditingCategory(category)
        setDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (
            window.confirm(
                'Are you sure you want to delete this attribute category?',
            )
        ) {
            try {
                await ShopAttributeService.deleteAttributeCategory(id)
                toast.push(
                    <Notification type="success" title="Success">
                        Attribute category deleted successfully
                    </Notification>,
                )
                fetchCategories()
            } catch (error) {
                console.error('Error deleting category:', error)
                toast.push(
                    <Notification type="danger" title="Error">
                        Failed to delete attribute category
                    </Notification>,
                )
            }
        }
    }

    const handleSubmit = async (values: FormValues) => {
        setSaving(true)
        try {
            if (editingCategory) {
                // Update existing category
                await ShopAttributeService.updateAttributeCategory(
                    editingCategory.id,
                    { description: values.description },
                )
                toast.push(
                    <Notification type="success" title="Success">
                        Attribute category updated successfully
                    </Notification>,
                )
            } else {
                // Create new category
                await ShopAttributeService.createAttributeCategory({
                    description: values.description,
                })
                toast.push(
                    <Notification type="success" title="Success">
                        Attribute category created successfully
                    </Notification>,
                )
            }

            setDialogOpen(false)
            fetchCategories()
        } catch (error) {
            console.error('Error saving category:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to save attribute category
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
                        You need CS-Admin or CS-User permissions to access
                        attribute category management.
                    </p>
                </Card>
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
                    <HiOutlineTag className="text-2xl text-blue-600" />
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Attribute Categories
                    </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Manage attribute categories for shop attributes
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 min-w-0">
                    <Input
                        prefix={<HiOutlineSearch className="text-lg" />}
                        placeholder="Search categories..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <Button
                    variant="solid"
                    icon={<HiOutlinePlus />}
                    onClick={handleCreate}
                >
                    Add Category
                </Button>
            </div>

            {/* Table */}
            <Card>
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        <Table>
                            <Table.THead>
                                <Table.Tr>
                                    <Table.Th>Description</Table.Th>
                                    <Table.Th>Created Date</Table.Th>
                                    <Table.Th>Created By</Table.Th>
                                    <Table.Th>Actions</Table.Th>
                                </Table.Tr>
                            </Table.THead>
                            <Table.TBody>
                                {paginatedCategories.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td
                                            colSpan={4}
                                            className="text-center py-8"
                                        >
                                            <div className="text-gray-500">
                                                {searchText
                                                    ? 'No categories match your search'
                                                    : 'No attribute categories found'}
                                            </div>
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    paginatedCategories.map((category) => (
                                        <Table.Tr key={category.id}>
                                            <Table.Td>
                                                <div className="font-semibold">
                                                    {category.description ||
                                                        'N/A'}
                                                </div>
                                            </Table.Td>
                                            <Table.Td>
                                                {new Date(
                                                    category.rowCreatedDate,
                                                ).toLocaleDateString()}
                                            </Table.Td>
                                            <Table.Td>
                                                {category.rowCreatedBy || 'N/A'}
                                            </Table.Td>
                                            <Table.Td>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="plain"
                                                        icon={
                                                            <HiOutlinePencil />
                                                        }
                                                        onClick={() =>
                                                            handleEdit(category)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="plain"
                                                        color="red"
                                                        icon={
                                                            <HiOutlineTrash />
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                category.id,
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))
                                )}
                            </Table.TBody>
                        </Table>

                        {/* Pagination */}
                        {totalItems > pageSize && (
                            <div className="flex items-center justify-between mt-4 px-4 pb-4">
                                <div className="text-sm text-gray-500">
                                    Showing {startIndex + 1} to{' '}
                                    {Math.min(endIndex, totalItems)} of{' '}
                                    {totalItems} entries
                                </div>{' '}
                                <Pagination
                                    currentPage={currentPage}
                                    total={totalItems}
                                    pageSize={pageSize}
                                    onChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onRequestClose={() => setDialogOpen(false)}
            >
                <div className="p-6">
                    <h4 className="text-lg font-semibold mb-4">
                        {editingCategory ? 'Edit Category' : 'Create Category'}
                    </h4>
                    <Formik
                        initialValues={{
                            description: editingCategory?.description || '',
                        }}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        enableReinitialize
                    >
                        {({ errors, touched }) => (
                            <Form>
                                <FormContainer>
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
                                        <Field
                                            type="text"
                                            name="description"
                                            placeholder="Enter category description"
                                            component={Input}
                                        />
                                    </FormItem>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <Button
                                            type="button"
                                            variant="plain"
                                            onClick={() => setDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="solid"
                                            loading={saving}
                                        >
                                            {editingCategory
                                                ? 'Update'
                                                : 'Create'}
                                        </Button>
                                    </div>
                                </FormContainer>
                            </Form>
                        )}
                    </Formik>
                </div>
            </Dialog>
        </div>
    )
}

export default AttributeCategoryListPage

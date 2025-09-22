import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Notification, toast, Card } from '@/components/ui'
import { HiPlusCircle, HiOutlineSearch } from 'react-icons/hi'
import PartCategoriesTable from './components/PartCategoriesTable'
import PartCategoryForm from './components/PartCategoryForm'
import PartCategoryService from '@/services/PartCategoryService'
import { Loading } from '@/components/shared'
import type {
    PartCategory,
    CreatePartCategoryRequest,
    UpdatePartCategoryRequest,
} from '@/@types/parts'

const PartCategoryManagementPage = () => {
    const [loading, setLoading] = useState(true)
    const [partCategories, setPartCategories] = useState<PartCategory[]>([])
    const [filteredPartCategories, setFilteredPartCategories] = useState<
        PartCategory[]
    >([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingPartCategory, setEditingPartCategory] =
        useState<PartCategory | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const fetchPartCategories = useCallback(async () => {
        setLoading(true)
        try {
            const data = await PartCategoryService.getPartCategories()
            setPartCategories(data)
            setFilteredPartCategories(data)
        } catch (error) {
            console.error('Failed to fetch part categories:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch part categories.
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPartCategories()
    }, [fetchPartCategories])

    // Filter part categories based on search term
    useEffect(() => {
        if (searchTerm) {
            const filtered = partCategories.filter((partCategory) =>
                partCategory.partCategoryName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
            )
            setFilteredPartCategories(filtered)
        } else {
            setFilteredPartCategories(partCategories)
        }
    }, [searchTerm, partCategories])

    const handleAddNew = () => {
        setEditingPartCategory(null)
        setShowForm(true)
    }

    const handleEdit = (partCategory: PartCategory) => {
        setEditingPartCategory(partCategory)
        setShowForm(true)
    }

    const handleSubmit = async (
        data: CreatePartCategoryRequest | UpdatePartCategoryRequest,
    ) => {
        setSubmitting(true)
        try {
            if (editingPartCategory) {
                await PartCategoryService.updatePartCategory(
                    editingPartCategory.partCategoryID,
                    data as UpdatePartCategoryRequest,
                )
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Part category updated successfully.
                    </Notification>,
                )
            } else {
                await PartCategoryService.createPartCategory(
                    data as CreatePartCategoryRequest,
                )
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Part category created successfully.
                    </Notification>,
                )
            }
            setShowForm(false)
            setEditingPartCategory(null)
            await fetchPartCategories()
        } catch (error) {
            console.error('Failed to save part category:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to save part category.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (partCategoryId: number) => {
        if (
            window.confirm(
                'Are you sure you want to delete this part category?',
            )
        ) {
            try {
                await PartCategoryService.deletePartCategory(partCategoryId)
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Part category deleted successfully.
                    </Notification>,
                )
                await fetchPartCategories()
            } catch (error) {
                console.error('Failed to delete part category:', error)
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Failed to delete part category.
                    </Notification>,
                )
            }
        }
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingPartCategory(null)
    }

    if (loading && !showForm) {
        return <Loading loading={true} />
    }

    return (
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header and Controls Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h4 className="mb-1">Part Category Management</h4>
                        <p className="text-gray-600">
                            Manage part categories and their information
                        </p>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiPlusCircle />}
                        onClick={handleAddNew}
                        disabled={showForm}
                        className="w-full sm:w-auto"
                    >
                        Add Part Category
                    </Button>
                </div>

                {/* Search */}
                <div className="flex items-center">
                    <HiOutlineSearch className="text-gray-400 mr-2" />
                    <Input
                        type="text"
                        placeholder="Search part categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                </div>
            </Card>

            {showForm && (
                <PartCategoryForm
                    partCategory={editingPartCategory || undefined}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            )}

            {/* Content Card */}
            <Card>
                <PartCategoriesTable
                    partCategories={filteredPartCategories}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>
        </div>
    )
}

export default PartCategoryManagementPage

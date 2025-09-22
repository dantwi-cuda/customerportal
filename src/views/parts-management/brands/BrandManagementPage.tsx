import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Notification, toast, Card } from '@/components/ui'
import { HiPlusCircle, HiOutlineSearch } from 'react-icons/hi'
import BrandsTable from './components/BrandsTable'
import BrandForm from './components/BrandForm'
import BrandService from '@/services/BrandService'
import { Loading } from '@/components/shared'
import type {
    Brand,
    CreateBrandRequest,
    UpdateBrandRequest,
} from '@/@types/parts'

const BrandManagementPage = () => {
    const [loading, setLoading] = useState(true)
    const [brands, setBrands] = useState<Brand[]>([])
    const [filteredBrands, setFilteredBrands] = useState<Brand[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const fetchBrands = useCallback(async () => {
        setLoading(true)
        try {
            const data = await BrandService.getBrands()
            setBrands(data)
            setFilteredBrands(data)
        } catch (error) {
            console.error('Failed to fetch brands:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch brands.
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBrands()
    }, [fetchBrands])

    // Filter brands based on search term
    useEffect(() => {
        if (searchTerm) {
            const filtered = brands.filter(
                (brand) =>
                    brand.brandName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    brand.description
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    brand.manufacturerName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            )
            setFilteredBrands(filtered)
        } else {
            setFilteredBrands(brands)
        }
    }, [searchTerm, brands])

    const handleAddNew = () => {
        setEditingBrand(null)
        setShowForm(true)
    }

    const handleEdit = (brand: Brand) => {
        setEditingBrand(brand)
        setShowForm(true)
    }

    const handleSubmit = async (
        data: CreateBrandRequest | UpdateBrandRequest,
    ) => {
        setSubmitting(true)
        try {
            if (editingBrand) {
                await BrandService.updateBrand(
                    editingBrand.brandID,
                    data as UpdateBrandRequest,
                )
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Brand updated successfully.
                    </Notification>,
                )
            } else {
                await BrandService.createBrand(data as CreateBrandRequest)
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Brand created successfully.
                    </Notification>,
                )
            }
            setShowForm(false)
            setEditingBrand(null)
            await fetchBrands()
        } catch (error) {
            console.error('Failed to save brand:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to save brand.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (brandId: number) => {
        if (window.confirm('Are you sure you want to delete this brand?')) {
            try {
                await BrandService.deleteBrand(brandId)
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Brand deleted successfully.
                    </Notification>,
                )
                await fetchBrands()
            } catch (error) {
                console.error('Failed to delete brand:', error)
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Failed to delete brand.
                    </Notification>,
                )
            }
        }
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingBrand(null)
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
                        <h4 className="mb-1">Brand Management</h4>
                        <p className="text-gray-600">
                            Manage brands and their information
                        </p>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiPlusCircle />}
                        onClick={handleAddNew}
                        disabled={showForm}
                        className="w-full sm:w-auto"
                    >
                        Add Brand
                    </Button>
                </div>

                {/* Search */}
                <div className="flex items-center">
                    <HiOutlineSearch className="text-gray-400 mr-2" />
                    <Input
                        type="text"
                        placeholder="Search brands..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                </div>
            </Card>

            {showForm && (
                <BrandForm
                    brand={editingBrand || undefined}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            )}

            {/* Content Card */}
            <Card>
                <BrandsTable
                    brands={filteredBrands}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>
        </div>
    )
}

export default BrandManagementPage

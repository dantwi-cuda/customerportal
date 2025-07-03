import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Notification, toast, Card } from '@/components/ui'
import { HiPlusCircle, HiOutlineSearch } from 'react-icons/hi'
import SupplierPartsTable from './components/SupplierPartsTable'
import SupplierPartForm from './components/SupplierPartForm'
import BulkUpload from '../master-parts/components/BulkUpload' // Reuse the same component
import SupplierPartService from '@/services/SupplierPartService'
import { Loading } from '@/components/shared'
import type {
    SupplierPart,
    CreateSupplierPartRequest,
    UpdateSupplierPartRequest,
} from '@/@types/parts'

const SupplierPartManagementPage = () => {
    const [loading, setLoading] = useState(true)
    const [supplierParts, setSupplierParts] = useState<SupplierPart[]>([])
    const [filteredSupplierParts, setFilteredSupplierParts] = useState<
        SupplierPart[]
    >([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [showBulkUpload, setShowBulkUpload] = useState(false)
    const [editingSupplierPart, setEditingSupplierPart] =
        useState<SupplierPart | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const fetchSupplierParts = useCallback(async () => {
        setLoading(true)
        try {
            const data = await SupplierPartService.getSupplierParts()
            setSupplierParts(data)
            setFilteredSupplierParts(data)
        } catch (error) {
            console.error('Failed to fetch supplier parts:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch supplier parts.
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSupplierParts()
    }, [fetchSupplierParts])

    // Filter supplier parts based on search term
    useEffect(() => {
        if (searchTerm) {
            const filtered = supplierParts.filter(
                (supplierPart) =>
                    supplierPart.supplierPartNumber
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    supplierPart.description
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    supplierPart.supplierName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    supplierPart.manufacturerName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    supplierPart.brandName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    supplierPart.partCategoryName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            )
            setFilteredSupplierParts(filtered)
        } else {
            setFilteredSupplierParts(supplierParts)
        }
    }, [searchTerm, supplierParts])

    const handleAddNew = () => {
        setEditingSupplierPart(null)
        setShowForm(true)
        setShowBulkUpload(false)
    }

    const handleEdit = (supplierPart: SupplierPart) => {
        setEditingSupplierPart(supplierPart)
        setShowForm(true)
        setShowBulkUpload(false)
    }

    const handleShowBulkUpload = () => {
        setShowBulkUpload(true)
        setShowForm(false)
        setEditingSupplierPart(null)
    }

    const handleSubmit = async (
        data: CreateSupplierPartRequest | UpdateSupplierPartRequest,
    ) => {
        setSubmitting(true)
        try {
            if (editingSupplierPart) {
                await SupplierPartService.updateSupplierPart(
                    editingSupplierPart.partID,
                    data as UpdateSupplierPartRequest,
                )
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Supplier part updated successfully.
                    </Notification>,
                )
            } else {
                await SupplierPartService.createSupplierPart(
                    data as CreateSupplierPartRequest,
                )
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Supplier part created successfully.
                    </Notification>,
                )
            }
            setShowForm(false)
            setEditingSupplierPart(null)
            await fetchSupplierParts()
        } catch (error) {
            console.error('Failed to save supplier part:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to save supplier part.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (supplierPartId: number) => {
        if (
            window.confirm(
                'Are you sure you want to delete this supplier part?',
            )
        ) {
            try {
                await SupplierPartService.deleteSupplierPart(supplierPartId)
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Supplier part deleted successfully.
                    </Notification>,
                )
                await fetchSupplierParts()
            } catch (error) {
                console.error('Failed to delete supplier part:', error)
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Failed to delete supplier part.
                    </Notification>,
                )
            }
        }
    }

    const handleCancel = () => {
        setShowForm(false)
        setShowBulkUpload(false)
        setEditingSupplierPart(null)
    }

    const handleUploadComplete = () => {
        fetchSupplierParts()
    }

    if (loading && !showForm && !showBulkUpload) {
        return <Loading loading={true} />
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    {/* <h1 className="text-2xl font-bold">
                        Supplier Parts Management
                    </h1> */}
                    <p className="text-gray-600 mt-1">
                        Manage supplier parts and their information
                    </p>
                </div>
                <Button
                    variant="solid"
                    icon={<HiPlusCircle />}
                    onClick={handleAddNew}
                    disabled={showForm || showBulkUpload}
                >
                    Add Supplier Part
                </Button>
            </div>

            {showForm && (
                <SupplierPartForm
                    supplierPart={editingSupplierPart || undefined}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            )}

            {showBulkUpload && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">
                            Bulk Upload Supplier Parts
                        </h2>
                        <Button variant="plain" onClick={handleCancel}>
                            Close
                        </Button>
                    </div>
                    <BulkUpload
                        type="supplierparts"
                        onUploadComplete={handleUploadComplete}
                    />
                </div>
            )}

            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <HiOutlineSearch className="text-gray-400 mr-2" />
                        <Input
                            type="text"
                            placeholder="Search supplier parts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-md"
                        />
                    </div>
                    <Button
                        variant="solid"
                        onClick={handleShowBulkUpload}
                        disabled={showForm || showBulkUpload}
                    >
                        Bulk Upload
                    </Button>
                </div>

                <SupplierPartsTable
                    supplierParts={filteredSupplierParts}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>
        </div>
    )
}

export default SupplierPartManagementPage

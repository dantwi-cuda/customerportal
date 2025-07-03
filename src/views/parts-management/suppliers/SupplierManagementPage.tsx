import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Notification, toast, Card } from '@/components/ui'
import { HiPlusCircle, HiOutlineSearch } from 'react-icons/hi'
import SuppliersTable from './components/SuppliersTable'
import SupplierForm from './components/SupplierForm'
import SupplierService from '@/services/SupplierService'
import { Loading } from '@/components/shared'
import type {
    Supplier,
    CreateSupplierRequest,
    UpdateSupplierRequest,
} from '@/@types/parts'

const SupplierManagementPage = () => {
    const [loading, setLoading] = useState(true)
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(
        null,
    )
    const [submitting, setSubmitting] = useState(false)

    const fetchSuppliers = useCallback(async () => {
        setLoading(true)
        try {
            const data = await SupplierService.getSuppliers()
            setSuppliers(data)
            setFilteredSuppliers(data)
        } catch (error) {
            console.error('Failed to fetch suppliers:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch suppliers.
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSuppliers()
    }, [fetchSuppliers])

    // Filter suppliers based on search term
    useEffect(() => {
        if (searchTerm) {
            const filtered = suppliers.filter(
                (supplier) =>
                    supplier.supplierName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    supplier.contactInfo
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    supplier.address
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            )
            setFilteredSuppliers(filtered)
        } else {
            setFilteredSuppliers(suppliers)
        }
    }, [searchTerm, suppliers])

    const handleAddNew = () => {
        setEditingSupplier(null)
        setShowForm(true)
    }

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier)
        setShowForm(true)
    }

    const handleSubmit = async (
        data: CreateSupplierRequest | UpdateSupplierRequest,
    ) => {
        setSubmitting(true)
        try {
            if (editingSupplier) {
                await SupplierService.updateSupplier(
                    editingSupplier.supplierID,
                    data as UpdateSupplierRequest,
                )
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Supplier updated successfully.
                    </Notification>,
                )
            } else {
                await SupplierService.createSupplier(
                    data as CreateSupplierRequest,
                )
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Supplier created successfully.
                    </Notification>,
                )
            }
            setShowForm(false)
            setEditingSupplier(null)
            await fetchSuppliers()
        } catch (error) {
            console.error('Failed to save supplier:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to save supplier.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (supplierId: number) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            try {
                await SupplierService.deleteSupplier(supplierId)
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Supplier deleted successfully.
                    </Notification>,
                )
                await fetchSuppliers()
            } catch (error) {
                console.error('Failed to delete supplier:', error)
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Failed to delete supplier.
                    </Notification>,
                )
            }
        }
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingSupplier(null)
    }

    if (loading && !showForm) {
        return <Loading loading={true} />
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    {/* <h1 className="text-2xl font-bold">Supplier Management</h1> */}
                    <p className="text-gray-600 mt-1">
                        Manage suppliers and their information
                    </p>
                </div>
                <Button
                    variant="solid"
                    icon={<HiPlusCircle />}
                    onClick={handleAddNew}
                    disabled={showForm}
                >
                    Add Supplier
                </Button>
            </div>

            {showForm && (
                <SupplierForm
                    supplier={editingSupplier || undefined}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            )}

            <Card className="p-6">
                <div className="mb-4">
                    <div className="flex items-center">
                        <HiOutlineSearch className="text-gray-400 mr-2" />
                        <Input
                            type="text"
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-md"
                        />
                    </div>
                </div>

                <SuppliersTable
                    suppliers={filteredSuppliers}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>
        </div>
    )
}

export default SupplierManagementPage

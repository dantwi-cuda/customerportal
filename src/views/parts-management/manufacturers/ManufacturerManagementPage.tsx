import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Notification, toast, Card } from '@/components/ui'
import { HiPlusCircle, HiOutlineSearch } from 'react-icons/hi'
import ManufacturersTable from './components/ManufacturersTable'
import ManufacturerForm from './components/ManufacturerForm'
import ManufacturerService from '@/services/ManufacturerService'
import { Loading } from '@/components/shared'
import type {
    Manufacturer,
    CreateManufacturerRequest,
    UpdateManufacturerRequest,
} from '@/@types/parts'

const ManufacturerManagementPage = () => {
    const [loading, setLoading] = useState(true)
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
    const [filteredManufacturers, setFilteredManufacturers] = useState<
        Manufacturer[]
    >([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingManufacturer, setEditingManufacturer] =
        useState<Manufacturer | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const fetchManufacturers = useCallback(async () => {
        setLoading(true)
        try {
            const data = await ManufacturerService.getManufacturers()
            setManufacturers(data)
            setFilteredManufacturers(data)
        } catch (error) {
            console.error('Failed to fetch manufacturers:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch manufacturers.
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchManufacturers()
    }, [fetchManufacturers])

    // Filter manufacturers based on search term
    useEffect(() => {
        if (searchTerm) {
            const filtered = manufacturers.filter(
                (manufacturer) =>
                    manufacturer.manufacturerName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    manufacturer.contactInfo
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    manufacturer.address
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            )
            setFilteredManufacturers(filtered)
        } else {
            setFilteredManufacturers(manufacturers)
        }
    }, [searchTerm, manufacturers])

    const handleAddNew = () => {
        setEditingManufacturer(null)
        setShowForm(true)
    }

    const handleEdit = (manufacturer: Manufacturer) => {
        setEditingManufacturer(manufacturer)
        setShowForm(true)
    }

    const handleSubmit = async (
        data: CreateManufacturerRequest | UpdateManufacturerRequest,
    ) => {
        setSubmitting(true)
        try {
            if (editingManufacturer) {
                await ManufacturerService.updateManufacturer(
                    editingManufacturer.manufacturerID,
                    data as UpdateManufacturerRequest,
                )
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Manufacturer updated successfully.
                    </Notification>,
                )
            } else {
                await ManufacturerService.createManufacturer(
                    data as CreateManufacturerRequest,
                )
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Manufacturer created successfully.
                    </Notification>,
                )
            }
            setShowForm(false)
            setEditingManufacturer(null)
            await fetchManufacturers()
        } catch (error) {
            console.error('Failed to save manufacturer:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to save manufacturer.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (manufacturerId: number) => {
        if (
            window.confirm('Are you sure you want to delete this manufacturer?')
        ) {
            try {
                await ManufacturerService.deleteManufacturer(manufacturerId)
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Manufacturer deleted successfully.
                    </Notification>,
                )
                await fetchManufacturers()
            } catch (error) {
                console.error('Failed to delete manufacturer:', error)
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Failed to delete manufacturer.
                    </Notification>,
                )
            }
        }
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingManufacturer(null)
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
                        <h4 className="mb-1">Manufacturer Management</h4>
                        <p className="text-gray-600">
                            Manage manufacturers and their information
                        </p>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiPlusCircle />}
                        onClick={handleAddNew}
                        disabled={showForm}
                        className="w-full sm:w-auto"
                    >
                        Add Manufacturer
                    </Button>
                </div>

                {/* Search */}
                <div className="flex items-center">
                    <HiOutlineSearch className="text-gray-400 mr-2" />
                    <Input
                        type="text"
                        placeholder="Search manufacturers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                </div>
            </Card>

            {showForm && (
                <ManufacturerForm
                    manufacturer={editingManufacturer || undefined}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            )}

            {/* Content Card */}
            <Card>
                <ManufacturersTable
                    manufacturers={filteredManufacturers}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>
        </div>
    )
}

export default ManufacturerManagementPage

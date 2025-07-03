import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Notification, toast, Card } from '@/components/ui'
import {
    HiPlusCircle,
    HiOutlineSearch,
    HiOfficeBuilding,
    HiTag,
} from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import MasterPartsTable from './components/MasterPartsTable'
import MasterPartForm from './components/MasterPartForm'
import BulkUpload from './components/BulkUpload'
import MasterPartService from '@/services/MasterPartService'
import { Loading } from '@/components/shared'
import type {
    MasterPart,
    CreateMasterPartRequest,
    UpdateMasterPartRequest,
} from '@/@types/parts'

const MasterPartManagementPage = () => {
    const [loading, setLoading] = useState(true)
    const [masterParts, setMasterParts] = useState<MasterPart[]>([])
    const [filteredMasterParts, setFilteredMasterParts] = useState<
        MasterPart[]
    >([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [showBulkUpload, setShowBulkUpload] = useState(false)
    const [editingMasterPart, setEditingMasterPart] =
        useState<MasterPart | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const navigate = useNavigate()

    const fetchMasterParts = useCallback(async () => {
        setLoading(true)
        try {
            const data = await MasterPartService.getMasterParts()
            setMasterParts(data)
            setFilteredMasterParts(data)
        } catch (error) {
            console.error('Failed to fetch master parts:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch master parts.
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchMasterParts()
    }, [fetchMasterParts])

    // Filter master parts based on search term
    useEffect(() => {
        if (searchTerm) {
            const filtered = masterParts.filter(
                (masterPart) =>
                    masterPart.partNumber
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    masterPart.uniqueCode
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    masterPart.description
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    masterPart.manufacturerName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    masterPart.brandName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    masterPart.partCategoryName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()),
            )
            setFilteredMasterParts(filtered)
        } else {
            setFilteredMasterParts(masterParts)
        }
    }, [searchTerm, masterParts])

    const handleAddNew = () => {
        setEditingMasterPart(null)
        setShowForm(true)
        setShowBulkUpload(false)
    }

    const handleEdit = (masterPart: MasterPart) => {
        setEditingMasterPart(masterPart)
        setShowForm(true)
        setShowBulkUpload(false)
    }

    const handleShowBulkUpload = () => {
        setShowBulkUpload(true)
        setShowForm(false)
        setEditingMasterPart(null)
    }

    const handleAddManufacturer = () => {
        navigate('/parts-management/manufacturers')
    }

    const handleAddBrand = () => {
        navigate('/parts-management/brands')
    }

    const handleSubmit = async (
        data: CreateMasterPartRequest | UpdateMasterPartRequest,
    ) => {
        setSubmitting(true)
        try {
            if (editingMasterPart) {
                await MasterPartService.updateMasterPart(
                    editingMasterPart.partID,
                    data as UpdateMasterPartRequest,
                )
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Master part updated successfully.
                    </Notification>,
                )
            } else {
                await MasterPartService.createMasterPart(
                    data as CreateMasterPartRequest,
                )
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Master part created successfully.
                    </Notification>,
                )
            }
            setShowForm(false)
            setEditingMasterPart(null)
            await fetchMasterParts()
        } catch (error) {
            console.error('Failed to save master part:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to save master part.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (masterPartId: number) => {
        if (
            window.confirm('Are you sure you want to delete this master part?')
        ) {
            try {
                await MasterPartService.deleteMasterPart(masterPartId)
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Master part deleted successfully.
                    </Notification>,
                )
                await fetchMasterParts()
            } catch (error) {
                console.error('Failed to delete master part:', error)
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Failed to delete master part.
                    </Notification>,
                )
            }
        }
    }

    const handleCancel = () => {
        setShowForm(false)
        setShowBulkUpload(false)
        setEditingMasterPart(null)
    }

    const handleUploadComplete = () => {
        fetchMasterParts()
    }

    if (loading && !showForm && !showBulkUpload) {
        return <Loading loading={true} />
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    {/* <h1 className="text-2xl font-bold">
                        Master Parts Management
                    </h1> */}
                    <p className="text-gray-600 mt-1">
                        Manage master parts and their information
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="plain"
                        icon={<HiOfficeBuilding />}
                        onClick={handleAddManufacturer}
                        disabled={showForm || showBulkUpload}
                    >
                        Add Manufacturer
                    </Button>
                    <Button
                        variant="plain"
                        icon={<HiTag />}
                        onClick={handleAddBrand}
                        disabled={showForm || showBulkUpload}
                    >
                        Add Brand
                    </Button>
                    <Button
                        variant="solid"
                        icon={<HiPlusCircle />}
                        onClick={handleAddNew}
                        disabled={showForm || showBulkUpload}
                    >
                        Add Master Part
                    </Button>
                </div>
            </div>

            {showForm && (
                <MasterPartForm
                    masterPart={editingMasterPart || undefined}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={submitting}
                />
            )}

            {showBulkUpload && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">
                            Bulk Upload Master Parts
                        </h2>
                        <Button variant="plain" onClick={handleCancel}>
                            Close
                        </Button>
                    </div>
                    <BulkUpload
                        type="masterparts"
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
                            placeholder="Search master parts..."
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

                <MasterPartsTable
                    masterParts={filteredMasterParts}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Card>
        </div>
    )
}

export default MasterPartManagementPage

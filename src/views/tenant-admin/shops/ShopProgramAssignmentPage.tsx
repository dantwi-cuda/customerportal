import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Notification,
    toast,
    Input,
    Checkbox,
    Pagination,
} from '@/components/ui'
import {
    HiOutlineArrowLeft,
    HiOutlineSave,
    HiOutlineSearch,
    HiOutlineOfficeBuilding,
} from 'react-icons/hi'
import * as ShopService from '@/services/ShopService'
import { useNavigate, useParams } from 'react-router-dom'
import type { Shop, AssignProgramsRequest } from '@/@types/shop'
import useAuth from '@/auth/useAuth'

// Mock Program interface - replace with actual Program type when available
interface Program {
    id: number
    name: string
    description?: string
    isActive: boolean
}

const ShopProgramAssignmentPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    // State management
    const [shop, setShop] = useState<Shop | null>(null)
    const [programs, setPrograms] = useState<Program[]>([])
    const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([])
    const [loading, setLoading] = useState(false)
    const [programsLoading, setProgramsLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [searchText, setSearchText] = useState('')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)

    // Tenant admin check: User must have a tenantId to manage shops
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (isTenantAdmin && id) {
            fetchShopDetails(parseInt(id, 10))
            fetchPrograms()
        }
    }, [isTenantAdmin, id])

    const fetchShopDetails = async (shopId: number) => {
        setLoading(true)
        try {
            const data = await ShopService.getShopById(shopId)
            setShop(data)
        } catch (error) {
            console.error('Error fetching shop details:', error)
            toast.push(
                <Notification type="danger" title="Error fetching shop details">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
            navigate('/admin/shops')
        } finally {
            setLoading(false)
        }
    }

    const fetchPrograms = async () => {
        setProgramsLoading(true)
        try {
            // TODO: Replace with actual program API call when available
            // For now, using mock data based on existing program names in shops
            const mockPrograms: Program[] = [
                {
                    id: 1,
                    name: 'Premium Service',
                    description: 'Premium customer service program',
                    isActive: true,
                },
                {
                    id: 2,
                    name: 'Loyalty Rewards',
                    description: 'Customer loyalty and rewards program',
                    isActive: true,
                },
                {
                    id: 3,
                    name: 'Express Delivery',
                    description: 'Fast delivery service program',
                    isActive: true,
                },
                {
                    id: 4,
                    name: 'VIP Experience',
                    description: 'Exclusive VIP customer experience',
                    isActive: true,
                },
                {
                    id: 5,
                    name: 'Seasonal Promotion',
                    description: 'Seasonal marketing and promotion program',
                    isActive: true,
                },
            ]
            setPrograms(mockPrograms)
        } catch (error) {
            console.error('Error fetching programs:', error)
            toast.push(
                <Notification type="danger" title="Error fetching programs">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setProgramsLoading(false)
        }
    }

    const handleBack = () => {
        navigate(`/admin/shops/${id}/view`)
    }

    const handleSave = async () => {
        if (!shop) return

        setSaving(true)
        try {
            const request: AssignProgramsRequest = {
                programIds: selectedProgramIds,
            }
            await ShopService.assignPrograms(shop.id, request)
            toast.push(
                <Notification type="success" title="Programs assigned">
                    Programs have been assigned to the shop successfully
                </Notification>,
            )
            navigate(`/admin/shops/${id}/view`)
        } catch (error) {
            console.error('Error assigning programs:', error)
            toast.push(
                <Notification type="danger" title="Error assigning programs">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleProgramToggle = (programId: number) => {
        setSelectedProgramIds((prev) => {
            if (prev.includes(programId)) {
                return prev.filter((id) => id !== programId)
            } else {
                return [...prev, programId]
            }
        })
    }

    const handleSelectAll = () => {
        const filteredProgramIds = filteredPrograms.map((p) => p.id)
        if (selectedProgramIds.length === filteredProgramIds.length) {
            // Deselect all filtered programs
            setSelectedProgramIds((prev) =>
                prev.filter((id) => !filteredProgramIds.includes(id)),
            )
        } else {
            // Select all filtered programs
            setSelectedProgramIds((prev) => {
                const newIds = [...prev]
                filteredProgramIds.forEach((id) => {
                    if (!newIds.includes(id)) {
                        newIds.push(id)
                    }
                })
                return newIds
            })
        }
    }

    // Filter programs based on search text
    const filteredPrograms = programs.filter((program) => {
        if (!searchText) return true
        const searchLower = searchText.toLowerCase()
        return (
            program.name.toLowerCase().includes(searchLower) ||
            program.description?.toLowerCase().includes(searchLower)
        )
    })

    // Calculate pagination
    const totalItems = filteredPrograms.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)
    const paginatedPrograms = filteredPrograms.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    if (!isTenantAdmin) {
        return (
            <div className="p-4">
                <Card className="text-center p-4">
                    <h4 className="mb-2">Access Denied</h4>
                    <p>
                        You must be a tenant administrator to access this page.
                    </p>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="p-2 sm:p-4">
                <Card className="text-center p-8">
                    <div>Loading shop details...</div>
                </Card>
            </div>
        )
    }

    if (!shop) {
        return (
            <div className="p-2 sm:p-4">
                <Card className="text-center p-8">
                    <div>Shop not found</div>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-2 sm:p-4">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<HiOutlineArrowLeft />}
                        onClick={handleBack}
                    >
                        Back to Shop
                    </Button>
                    <h3 className="text-lg font-medium">
                        Assign Programs to: {shop.name}
                    </h3>
                </div>
                <Button
                    size="sm"
                    variant="solid"
                    icon={<HiOutlineSave />}
                    onClick={handleSave}
                    loading={saving}
                >
                    Save Assignments
                </Button>
            </div>

            <Card>
                {/* Search and Stats */}
                <div className="p-4 border-b">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <Input
                                placeholder="Search programs by name or description..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                prefix={<HiOutlineSearch />}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600">
                                {selectedProgramIds.length} of{' '}
                                {filteredPrograms.length} programs selected
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSelectAll}
                            >
                                {selectedProgramIds.length ===
                                filteredPrograms.length
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Current Assignments Info */}
                {shop.programNames && shop.programNames.length > 0 && (
                    <div className="p-4 bg-blue-50 border-b">
                        <h5 className="font-medium text-blue-900 mb-2">
                            Currently Assigned Programs:
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {shop.programNames.map((programName, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                                >
                                    {programName}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Programs List */}
                <div className="p-4">
                    {programsLoading ? (
                        <div className="text-center py-8">
                            <div>Loading programs...</div>
                        </div>
                    ) : paginatedPrograms.length === 0 ? (
                        <div className="text-center py-8">
                            <HiOutlineOfficeBuilding
                                className="mx-auto mb-2 text-gray-400"
                                size={48}
                            />
                            <div className="text-gray-500">
                                {searchText
                                    ? 'No programs found matching your search'
                                    : 'No programs available'}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {paginatedPrograms.map((program) => (
                                    <div
                                        key={program.id}
                                        className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
                                    >
                                        <Checkbox
                                            checked={selectedProgramIds.includes(
                                                program.id,
                                            )}
                                            onChange={() =>
                                                handleProgramToggle(program.id)
                                            }
                                        />
                                        <div className="ml-4 flex-1">
                                            <div className="font-medium text-gray-900">
                                                {program.name}
                                            </div>
                                            {program.description && (
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {program.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${
                                                    program.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {program.isActive
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                            <div className="text-sm text-gray-500">
                                                ID: {program.id}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination
                                        total={totalItems}
                                        current={currentPage}
                                        pageSize={pageSize}
                                        onChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default ShopProgramAssignmentPage

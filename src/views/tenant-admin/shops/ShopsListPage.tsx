import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Input,
    Button,
    Tag,
    Notification,
    toast,
    Switcher,
    Pagination,
    Select,
    Dropdown,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePencilAlt,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineUserGroup,
    HiOutlineDocumentReport,
    HiOutlineBadgeCheck,
    HiOutlineAdjustments,
    HiOutlineSwitchVertical,
    HiOutlineExternalLink,
    HiOutlineLocationMarker,
    HiOutlineOfficeBuilding,
} from 'react-icons/hi'
import EllipsisButton from '@/components/shared/EllipsisButton'
import * as ShopService from '@/services/ShopService'
import { useNavigate } from 'react-router-dom'
import type { Shop } from '@/@types/shop'
import useAuth from '@/auth/useAuth'
import type { SingleValue } from 'react-select'

// Types for Select component
interface SelectOption {
    value: string
    label: string
}

const ShopsListPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    // State management
    const [shops, setShops] = useState<Shop[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [selectedCity, setSelectedCity] = useState<string>('all')
    const [selectedState, setSelectedState] = useState<string>('all')
    const [selectedProgram, setSelectedProgram] = useState<string>('all')

    // Sorting state
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Tenant admin check: User must have a tenantId to manage shops
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (isTenantAdmin) {
            fetchShops()
        }
    }, [user])

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchText, selectedCity, selectedState, selectedProgram])

    const fetchShops = async () => {
        setLoading(true)
        try {
            const filters = {
                searchText: searchText || undefined,
                city: selectedCity !== 'all' ? selectedCity : undefined,
                state: selectedState !== 'all' ? selectedState : undefined,
                program:
                    selectedProgram !== 'all' ? selectedProgram : undefined,
            }
            const data = await ShopService.getShopsList(filters)
            setShops(data)
        } catch (error) {
            console.error('Error fetching shops:', error)
            toast.push(
                <Notification type="danger" title="Error fetching shops">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleCreateShop = () => {
        navigate('/admin/shops/create')
    }

    const handleEditShop = (shop: Shop) => {
        navigate(`/admin/shops/${shop.id}/edit`)
    }

    const handleViewShop = (shop: Shop) => {
        navigate(`/admin/shops/${shop.id}/view`)
    }

    const handleDeleteShop = async (shop: Shop) => {
        if (
            confirm(
                `Are you sure you want to delete "${shop.name}"? This action cannot be undone.`,
            )
        ) {
            try {
                await ShopService.deleteShop(shop.id)
                await fetchShops()
                toast.push(
                    <Notification type="success" title="Shop deleted">
                        Shop has been deleted successfully
                    </Notification>,
                )
            } catch (error) {
                console.error('Error deleting shop:', error)
                toast.push(
                    <Notification type="danger" title="Error deleting shop">
                        {error instanceof Error
                            ? error.message
                            : 'An unknown error occurred'}
                    </Notification>,
                )
            }
        }
    }

    const handleAssignUsers = (shop: Shop) => {
        navigate(`/admin/shops/${shop.id}/users`)
    }

    const handleAssignPrograms = (shop: Shop) => {
        navigate(`/admin/shops/${shop.id}/programs`)
    }

    const handleToggleActive = async (shop: Shop) => {
        try {
            if (shop.isActive) {
                await ShopService.deactivateShop(shop.id)
            } else {
                await ShopService.activateShop(shop.id)
            }
            await fetchShops()
            toast.push(
                <Notification
                    type="success"
                    title={`Shop ${!shop.isActive ? 'activated' : 'deactivated'}`}
                >
                    {shop.name} has been{' '}
                    {!shop.isActive ? 'activated' : 'deactivated'}
                </Notification>,
            )
        } catch (error) {
            console.error('Error updating shop status:', error)
            toast.push(
                <Notification type="danger" title="Error updating shop">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        }
    }

    // Filter and sort shops
    const filteredAndSortedShops = useMemo(() => {
        let filtered = shops

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            if (sortField === 'name') {
                const valueA = a.name.toLowerCase()
                const valueB = b.name.toLowerCase()
                if (sortDirection === 'asc') {
                    return valueA.localeCompare(valueB)
                } else {
                    return valueB.localeCompare(valueA)
                }
            } else if (sortField === 'city') {
                const valueA = (a.city || '').toLowerCase()
                const valueB = (b.city || '').toLowerCase()
                if (sortDirection === 'asc') {
                    return valueA.localeCompare(valueB)
                } else {
                    return valueB.localeCompare(valueA)
                }
            } else if (sortField === 'state') {
                const valueA = (a.state || '').toLowerCase()
                const valueB = (b.state || '').toLowerCase()
                if (sortDirection === 'asc') {
                    return valueA.localeCompare(valueB)
                } else {
                    return valueB.localeCompare(valueA)
                }
            }
            return 0
        })

        return sorted
    }, [shops, sortField, sortDirection])

    // Calculate pagination
    const totalItems = filteredAndSortedShops.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)
    const paginatedShops = filteredAndSortedShops.slice(startIndex, endIndex)

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    // Toggle sort direction for field
    const toggleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Page size dropdown options
    const pageSizeOptions = [
        { value: '5', label: '5' },
        { value: '10', label: '10' },
        { value: '20', label: '20' },
        { value: '50', label: '50' },
        { value: '100', label: '100' },
    ]

    // Get unique cities from shops for filter
    const cityOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All Cities' }]
        const uniqueCities = [
            ...new Set(shops.map((shop) => shop.city).filter(Boolean)),
        ]
        uniqueCities.forEach((city) => {
            options.push({
                value: city,
                label: city,
            })
        })
        return options
    }, [shops])

    // Get unique states from shops for filter
    const stateOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All States' }]
        const uniqueStates = [
            ...new Set(shops.map((shop) => shop.state).filter(Boolean)),
        ]
        uniqueStates.forEach((state) => {
            options.push({
                value: state,
                label: state,
            })
        })
        return options
    }, [shops])

    // Get unique programs from shops for filter
    const programOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All Programs' }]
        const uniquePrograms = [
            ...new Set(shops.flatMap((shop) => shop.programNames || [])),
        ]
        uniquePrograms.forEach((program) => {
            options.push({
                value: program,
                label: program,
            })
        })
        return options
    }, [shops])

    const handlePageSizeChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        const newSize = parseInt(newValue.value, 10)
        setPageSize(newSize)
        setCurrentPage(1)
    }

    const handleCityChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        setSelectedCity(newValue.value)
        fetchShops()
    }

    const handleStateChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        setSelectedState(newValue.value)
        fetchShops()
    }

    const handleProgramChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        setSelectedProgram(newValue.value)
        fetchShops()
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

    return (
        <div className="p-2 sm:p-4">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h3 className="text-lg font-medium text-center md:text-left">
                    Shop Management
                </h3>
                <Button
                    size="sm"
                    variant="solid"
                    icon={<HiOutlinePlus />}
                    onClick={handleCreateShop}
                >
                    Create Shop
                </Button>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Search
                        </label>
                        <Input
                            placeholder="Search shops..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            prefix={<HiOutlineSearch />}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            City
                        </label>
                        <Select
                            placeholder="Select city"
                            value={cityOptions.find(
                                (option) => option.value === selectedCity,
                            )}
                            onChange={handleCityChange}
                            options={cityOptions}
                            isClearable={false}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            State
                        </label>
                        <Select
                            placeholder="Select state"
                            value={stateOptions.find(
                                (option) => option.value === selectedState,
                            )}
                            onChange={handleStateChange}
                            options={stateOptions}
                            isClearable={false}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Program
                        </label>
                        <Select
                            placeholder="Select program"
                            value={programOptions.find(
                                (option) => option.value === selectedProgram,
                            )}
                            onChange={handleProgramChange}
                            options={programOptions}
                            isClearable={false}
                        />
                    </div>

                    <div className="flex items-end">
                        <Button
                            size="sm"
                            variant="solid"
                            onClick={fetchShops}
                            loading={loading}
                        >
                            Search
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Main Content */}
            <Card>
                {/* Table Header with Pagination Controls */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b">
                    <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {endIndex} of {totalItems}{' '}
                        shops
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Show:</span>
                        <Select
                            value={pageSizeOptions.find(
                                (option) =>
                                    option.value === pageSize.toString(),
                            )}
                            onChange={handlePageSizeChange}
                            options={pageSizeOptions}
                            className="w-20"
                            isSearchable={false}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <Button
                                        variant="plain"
                                        size="sm"
                                        className="font-semibold"
                                        onClick={() => toggleSort('name')}
                                        icon={
                                            sortField === 'name' && (
                                                <HiOutlineSwitchVertical
                                                    className={`transform ${
                                                        sortDirection === 'desc'
                                                            ? 'rotate-180'
                                                            : ''
                                                    }`}
                                                />
                                            )
                                        }
                                    >
                                        Shop Name
                                    </Button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <Button
                                        variant="plain"
                                        size="sm"
                                        className="font-semibold"
                                        onClick={() => toggleSort('city')}
                                        icon={
                                            sortField === 'city' && (
                                                <HiOutlineSwitchVertical
                                                    className={`transform ${
                                                        sortDirection === 'desc'
                                                            ? 'rotate-180'
                                                            : ''
                                                    }`}
                                                />
                                            )
                                        }
                                    >
                                        Location
                                    </Button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <span className="font-semibold">
                                        Programs
                                    </span>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <span className="font-semibold">
                                        Status
                                    </span>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <span className="font-semibold">
                                        Source
                                    </span>
                                </th>
                                <th className="px-4 py-3 text-center">
                                    <span className="font-semibold">
                                        Actions
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center"
                                    >
                                        <div>Loading shops...</div>
                                    </td>
                                </tr>
                            ) : paginatedShops.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center"
                                    >
                                        <div>No shops found</div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedShops.map((shop) => (
                                    <tr
                                        key={shop.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">
                                                {shop.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                ID: {shop.id}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <HiOutlineLocationMarker className="mr-1 text-gray-400" />
                                                <div>
                                                    <div>{shop.city}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {shop.state}{' '}
                                                        {shop.postalCode}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {shop.programNames &&
                                                shop.programNames.length > 0 ? (
                                                    shop.programNames
                                                        .slice(0, 2)
                                                        .map(
                                                            (
                                                                program,
                                                                index,
                                                            ) => (
                                                                <Tag
                                                                    key={index}
                                                                >
                                                                    {program}
                                                                </Tag>
                                                            ),
                                                        )
                                                ) : (
                                                    <span className="text-sm text-gray-500">
                                                        No programs
                                                    </span>
                                                )}
                                                {shop.programNames &&
                                                    shop.programNames.length >
                                                        2 && (
                                                        <Tag className="bg-gray-100">
                                                            +
                                                            {shop.programNames
                                                                .length -
                                                                2}{' '}
                                                            more
                                                        </Tag>
                                                    )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Switcher
                                                    checked={shop.isActive}
                                                    onChange={() =>
                                                        handleToggleActive(shop)
                                                    }
                                                />
                                                <span className="text-sm">
                                                    {shop.isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-600">
                                                {shop.source || 'N/A'}
                                            </span>
                                        </td>{' '}
                                        <td className="px-4 py-3 text-center">
                                            <Dropdown
                                                placement="bottom-end"
                                                renderTitle={<EllipsisButton />}
                                            >
                                                <Dropdown.Item
                                                    eventKey="view"
                                                    onClick={() =>
                                                        handleViewShop(shop)
                                                    }
                                                >
                                                    <HiOutlineDocumentReport className="mr-2" />
                                                    View Details
                                                </Dropdown.Item>
                                                <Dropdown.Item
                                                    eventKey="edit"
                                                    onClick={() =>
                                                        handleEditShop(shop)
                                                    }
                                                >
                                                    <HiOutlinePencilAlt className="mr-2" />
                                                    Edit Shop
                                                </Dropdown.Item>
                                                <Dropdown.Item
                                                    eventKey="users"
                                                    onClick={() =>
                                                        handleAssignUsers(shop)
                                                    }
                                                >
                                                    <HiOutlineUserGroup className="mr-2" />
                                                    Assign Users
                                                </Dropdown.Item>
                                                <Dropdown.Item
                                                    eventKey="programs"
                                                    onClick={() =>
                                                        handleAssignPrograms(
                                                            shop,
                                                        )
                                                    }
                                                >
                                                    <HiOutlineOfficeBuilding className="mr-2" />
                                                    Assign Programs
                                                </Dropdown.Item>
                                                <Dropdown.Item
                                                    eventKey="delete"
                                                    onClick={() =>
                                                        handleDeleteShop(shop)
                                                    }
                                                    className="text-red-600"
                                                >
                                                    {' '}
                                                    <HiOutlineTrash className="mr-2" />
                                                    Delete Shop
                                                </Dropdown.Item>
                                            </Dropdown>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center py-4">
                        {' '}
                        <Pagination
                            total={totalItems}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            onChange={handlePageChange}
                        />
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ShopsListPage

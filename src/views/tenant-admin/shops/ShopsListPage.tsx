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
import type { Shop, ShopPaginatedResponse } from '@/@types/shop'
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
    const [selectedStatus, setSelectedStatus] = useState<string>('all')

    // Server-side pagination state
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    // Available filter options (loaded from all shops for filter dropdowns)
    const [allCities, setAllCities] = useState<string[]>([])
    const [allStates, setAllStates] = useState<string[]>([])
    const [allPrograms, setAllPrograms] = useState<string[]>([])

    // Loading states for individual shops
    const [updatingShops, setUpdatingShops] = useState<Set<number>>(new Set())

    // Sorting state (not used for server-side sorting yet)
    const [sortField, setSortField] = useState<string>('name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Tenant admin check: User must have a tenantId to manage shops
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (isTenantAdmin) {
            fetchShops()
        }
    }, [user, currentPage, pageSize])

    // Reset to first page when filters change
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1)
        } else {
            fetchShops()
        }
    }, [
        searchText,
        selectedCity,
        selectedState,
        selectedProgram,
        selectedStatus,
    ])

    const fetchShops = async () => {
        setLoading(true)
        try {
            const params = {
                searchText: searchText || undefined,
                city: selectedCity !== 'all' ? selectedCity : undefined,
                state: selectedState !== 'all' ? selectedState : undefined,
                program:
                    selectedProgram !== 'all' ? selectedProgram : undefined,
                isActive:
                    selectedStatus !== 'all'
                        ? selectedStatus === 'active'
                        : undefined,
                page: currentPage,
                pageSize: pageSize,
            }

            console.log('Fetching shops with params:', params)

            const response: ShopPaginatedResponse =
                await ShopService.getShopsList(params)

            setShops(response.shops)
            setTotalCount(response.totalCount)
            setTotalPages(response.totalPages)

            // Extract unique values for filter dropdowns from current results
            // Note: In a real implementation, you might want to get these from a separate endpoint
            // that returns all unique values without pagination
            const cities = [
                ...new Set(
                    response.shops.map((shop) => shop.city).filter(Boolean),
                ),
            ]
            const states = [
                ...new Set(
                    response.shops.map((shop) => shop.state).filter(Boolean),
                ),
            ]
            const programs = [
                ...new Set(
                    response.shops.flatMap((shop) => shop.programNames || []),
                ),
            ]

            setAllCities((prev) => [...new Set([...prev, ...cities])])
            setAllStates((prev) => [...new Set([...prev, ...states])])
            setAllPrograms((prev) => [...new Set([...prev, ...programs])])
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
        if (updatingShops.has(shop.id)) return // Prevent multiple simultaneous updates

        setUpdatingShops((prev) => new Set(prev).add(shop.id))
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
        } finally {
            setUpdatingShops((prev) => {
                const newSet = new Set(prev)
                newSet.delete(shop.id)
                return newSet
            })
        }
    }

    // Since we're using server-side pagination, we don't need client-side filtering or sorting
    // The shops displayed are exactly what we get from the server
    const displayedShops = shops

    // Calculate display information for server-side pagination
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalCount)

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
        { value: '10', label: '10' },
        { value: '20', label: '20' },
        { value: '50', label: '50' },
        { value: '100', label: '100' },
    ]

    // Get unique cities from state for filter
    const cityOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All Cities' }]
        allCities.forEach((city) => {
            options.push({
                value: city,
                label: city,
            })
        })
        return options
    }, [allCities])

    // Get unique states from state for filter
    const stateOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All States' }]
        allStates.forEach((state) => {
            options.push({
                value: state,
                label: state,
            })
        })
        return options
    }, [allStates])

    // Get unique programs from state for filter
    const programOptions = useMemo(() => {
        const options = [{ value: 'all', label: 'All Programs' }]
        allPrograms.forEach((program) => {
            options.push({
                value: program,
                label: program,
            })
        })
        return options
    }, [allPrograms])

    // Status filter options
    const statusOptions = useMemo(
        () => [
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
        ],
        [],
    )

    const handlePageSizeChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        const newSize = parseInt(newValue.value, 10)
        setPageSize(newSize)
        setCurrentPage(1)
    }

    const handleCityChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        setSelectedCity(newValue.value)
    }

    const handleStateChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        setSelectedState(newValue.value)
    }

    const handleProgramChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        setSelectedProgram(newValue.value)
    }

    const handleStatusChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return
        setSelectedStatus(newValue.value)
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
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header and Filters Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h4 className="mb-1">Shop Management</h4>
                        <p className="text-gray-600">
                            Manage shops and their configurations
                        </p>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiOutlinePlus />}
                        onClick={handleCreateShop}
                        className="w-full sm:w-auto"
                    >
                        Create Shop
                    </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Status
                        </label>
                        <Select
                            placeholder="Select status"
                            value={statusOptions.find(
                                (option) => option.value === selectedStatus,
                            )}
                            onChange={handleStatusChange}
                            options={statusOptions}
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

            {/* Table Card */}
            <Card>
                {/* Table Header with Pagination Controls */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b">
                    <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {endIndex} of {totalCount}{' '}
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
                            ) : displayedShops.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center"
                                    >
                                        <div>No shops found</div>
                                    </td>
                                </tr>
                            ) : (
                                displayedShops.map((shop: Shop) => (
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
                                            <div className="flex items-center">
                                                {shop.programNames &&
                                                shop.programNames.length > 0 ? (
                                                    <button
                                                        onClick={() =>
                                                            handleAssignPrograms(
                                                                shop,
                                                            )
                                                        }
                                                        className="group flex items-center gap-2 hover:bg-blue-50 rounded-lg px-2 py-1 transition-colors"
                                                    >
                                                        <div className="bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full text-sm group-hover:bg-blue-200 transition-colors">
                                                            {
                                                                shop
                                                                    .programNames
                                                                    .length
                                                            }
                                                        </div>
                                                        <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                                                            program
                                                            {shop.programNames
                                                                .length !== 1
                                                                ? 's'
                                                                : ''}
                                                        </span>
                                                        <HiOutlineExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            handleAssignPrograms(
                                                                shop,
                                                            )
                                                        }
                                                        className="group flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
                                                    >
                                                        <div className="bg-gray-100 text-gray-600 font-semibold px-3 py-1 rounded-full text-sm group-hover:bg-gray-200 transition-colors">
                                                            0
                                                        </div>
                                                        <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                                                            programs
                                                        </span>
                                                        <HiOutlinePlus className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                                    </button>
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
                                                    disabled={updatingShops.has(
                                                        shop.id,
                                                    )}
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
                                        </td>
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
                        <Pagination
                            total={totalCount}
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

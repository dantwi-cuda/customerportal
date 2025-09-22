import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Input,
    Button,
    Table,
    Dialog,
    FormItem,
    FormContainer,
    Notification,
    Skeleton,
    Alert,
    Select,
    Pagination,
} from '@/components/ui'
import { toast } from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineCheck,
    HiOutlineX,
    HiOutlineDocumentDuplicate,
} from 'react-icons/hi'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import * as ShopKpiService from '@/services/ShopKpiService'
import * as ShopService from '@/services/ShopService'
import * as ShopPropertiesService from '@/services/ShopPropertiesService'
import UserService from '@/services/UserService'
import type {
    ShopKpiDto,
    ShopKpiBulkUpdateItem,
} from '@/services/ShopKpiService'
import type { Shop } from '@/@types/shop'
import type { UserDto } from '@/@types/user'
import useAuth from '@/auth/useAuth'

interface BulkEditValues {
    kpiValue: number | null
    kpiGoal: number | null
}

const ShopKPIListPage = () => {
    const { user } = useAuth() // State management
    const [kpis, setKpis] = useState<ShopKpiDto[]>([])
    const [shops, setShops] = useState<Shop[]>([])
    const [users, setUsers] = useState<UserDto[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [selectedShop, setSelectedShop] = useState<number | null>(() => {
        const saved = localStorage.getItem('shopKPI.selectedShop')
        // Return the saved value but we'll validate it once shops are loaded
        return saved ? parseInt(saved, 10) : null
    })
    const [selectedDate, setSelectedDate] = useState<{
        year: number
        month: number
    } | null>(() => {
        const saved = localStorage.getItem('shopKPI.selectedDate')
        return saved ? JSON.parse(saved) : null
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)

    // Inline editing state
    const [editedValues, setEditedValues] = useState<{
        [key: number]: { kpiValue?: number | null; kpiGoal?: number | null }
    }>({})
    const [editingCell, setEditingCell] = useState<{
        kpiId: number
        field: 'kpiValue' | 'kpiGoal'
    } | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Permissions
    const hasEditAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'Tenant-User', 'shopkpi.edit'].includes(
            role,
        ),
    )
    const hasViewAccess = user?.authority?.some((role: string) =>
        [
            'CS-Admin',
            'CS-User',
            'Tenant-Admin',
            'Tenant-User',
            'shopkpi.view',
            'shopkpi.edit',
        ].includes(role),
    )

    // Date options (2 years ago to 6 months in future)
    const dateOptions = useMemo(() => {
        return ShopPropertiesService.getDateOptions().sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year
            return b.month - a.month
        })
    }, []) // Set default date to current month on component mount (only if no saved date)
    useEffect(() => {
        if (!selectedDate && dateOptions.length > 0) {
            // Check if there's a saved date first
            const savedDate = localStorage.getItem('shopKPI.selectedDate')
            if (savedDate) {
                try {
                    const parsedDate = JSON.parse(savedDate)
                    // Validate that the saved date is still available in dateOptions
                    const isDateAvailable = dateOptions.some(
                        (option) =>
                            option.year === parsedDate.year &&
                            option.month === parsedDate.month,
                    )
                    if (isDateAvailable) {
                        return // Don't set default, the saved date will be used
                    }
                } catch (error) {
                    console.warn('Invalid saved date format:', error)
                }
            }

            // Find current month or default to first available option
            const currentYear = new Date().getFullYear()
            const currentMonth = new Date().getMonth() + 1
            const currentOption = dateOptions.find(
                (option) =>
                    option.year === currentYear &&
                    option.month === currentMonth,
            )

            if (currentOption) {
                setSelectedDate({
                    year: currentOption.year,
                    month: currentOption.month,
                })
            } else {
                // Default to first available option
                setSelectedDate({
                    year: dateOptions[0].year,
                    month: dateOptions[0].month,
                })
            }
        }
    }, [dateOptions, selectedDate])

    // Load shops on component mount
    useEffect(() => {
        loadShops()
        loadUsers()
    }, [])

    // Load KPIs when shop or date selection changes
    useEffect(() => {
        // Only load KPIs if we have a valid shop that exists in our shops list
        const shopExists =
            selectedShop &&
            shops.length > 0 &&
            shops.find((shop) => shop.id === selectedShop)

        if (shopExists && selectedDate) {
            loadKpis()
        } else {
            setKpis([])
            // If shop is selected but doesn't exist in the list, clear it
            if (
                selectedShop &&
                shops.length > 0 &&
                !shops.find((shop) => shop.id === selectedShop)
            ) {
                console.warn(
                    `Selected shop ${selectedShop} not found in shops list, clearing selection`,
                )
                setSelectedShop(null)
                localStorage.removeItem('shopKPI.selectedShop')
            }
        }
    }, [selectedShop, selectedDate, shops]) // Reset edited values when KPIs change
    useEffect(() => {
        setEditedValues({})
        setHasChanges(false)
    }, [kpis])

    // Save selected shop to localStorage
    useEffect(() => {
        if (selectedShop !== null) {
            localStorage.setItem(
                'shopKPI.selectedShop',
                selectedShop.toString(),
            )
        } else {
            localStorage.removeItem('shopKPI.selectedShop')
        }
    }, [selectedShop])

    // Save selected date to localStorage
    useEffect(() => {
        if (selectedDate !== null) {
            localStorage.setItem(
                'shopKPI.selectedDate',
                JSON.stringify(selectedDate),
            )
        } else {
            localStorage.removeItem('shopKPI.selectedDate')
        }
    }, [selectedDate])
    const loadShops = async () => {
        try {
            const shopsResponse = await ShopService.getShopsList()
            // Extract shops array from the paginated response
            const shopsData = shopsResponse?.shops || []
            const activeShops = shopsData.filter((shop) => shop.isActive)
            setShops(activeShops)

            // Validate that the selected shop still exists in the active shops
            if (
                selectedShop &&
                !activeShops.find((shop) => shop.id === selectedShop)
            ) {
                console.warn(
                    `Selected shop ${selectedShop} is no longer available, clearing selection`,
                )
                setSelectedShop(null)
                localStorage.removeItem('shopKPI.selectedShop')
            }
        } catch (error) {
            console.error('Error loading shops:', error)
            // Clear selected shop if shops failed to load
            setSelectedShop(null)
            localStorage.removeItem('shopKPI.selectedShop')
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load shops
                </Notification>,
            )
        }
    }
    const loadUsers = async () => {
        try {
            const usersData = await UserService.getUsers()
            setUsers(usersData || [])
        } catch (error) {
            console.error('Error loading users:', error)
            // Don't show error notification for users as it's not critical
        }
    }

    const loadKpis = async () => {
        if (!selectedShop || !selectedDate) return

        // Verify that the selected shop exists in our shops list
        const shopExists = shops.find((shop) => shop.id === selectedShop)
        if (!shopExists) {
            console.warn(
                `Cannot load KPIs: Shop ${selectedShop} not found in shops list`,
            )
            setKpis([])
            return
        }

        console.log(
            'Loading KPIs for shop:',
            selectedShop,
            '(',
            shopExists.name,
            ') year:',
            selectedDate.year,
            'month:',
            selectedDate.month,
        )
        setLoading(true)
        try {
            const kpisData =
                await ShopKpiService.apiGetShopKpis<ShopKpiDto[]>(selectedShop)

            console.log('KPIs data received:', kpisData)

            // Filter KPIs by selected year and month
            const filteredKpis = kpisData.filter(
                (kpi) =>
                    kpi.kpiYear === selectedDate.year &&
                    kpi.kpiMonth === selectedDate.month,
            )

            setKpis(filteredKpis || [])
        } catch (error) {
            console.error('Error loading KPIs:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load KPIs for {shopExists.name}
                </Notification>,
            )
            setKpis([])
        } finally {
            setLoading(false)
        }
    }

    // Filter KPIs based on search text
    const filteredKpis = useMemo(() => {
        return kpis.filter((kpi) => {
            const searchLower = searchText.toLowerCase()
            return (
                (kpi.attributeName?.toLowerCase() || '').includes(
                    searchLower,
                ) ||
                (
                    kpi.attributeCategoryDescription?.toLowerCase() || ''
                ).includes(searchLower) ||
                (kpi.attributeUnitType?.toLowerCase() || '').includes(
                    searchLower,
                ) ||
                (kpi.rowModifiedBy?.toLowerCase() || '').includes(searchLower)
            )
        })
    }, [kpis, searchText])

    // Paginated KPIs
    const paginatedKpis = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        return filteredKpis.slice(startIndex, endIndex)
    }, [filteredKpis, currentPage, pageSize])

    // Handle cell click for editing
    const handleCellClick = (kpiId: number, field: 'kpiValue' | 'kpiGoal') => {
        if (hasEditAccess) {
            setEditingCell({ kpiId, field })
        }
    }

    // Handle clicking outside to save cell edit
    const handleCellBlur = () => {
        setEditingCell(null)
    }

    // Handle inline editing
    const handleInputChange = (
        kpiId: number,
        field: 'kpiValue' | 'kpiGoal',
        value: string,
    ) => {
        const numericValue = value === '' ? null : parseFloat(value)

        setEditedValues((prev) => ({
            ...prev,
            [kpiId]: {
                ...prev[kpiId],
                [field]: numericValue,
            },
        }))
        setHasChanges(true)
    }

    // Get display value for inline editing
    const getDisplayValue = (
        kpi: ShopKpiDto,
        field: 'kpiValue' | 'kpiGoal',
    ): string => {
        const editedValue = editedValues[kpi.id]?.[field]
        if (editedValue !== undefined) {
            return editedValue === null ? '' : editedValue.toString()
        }
        const originalValue = kpi[field]
        return originalValue === null ? '' : originalValue.toString()
    }

    // Save bulk changes
    const handleSaveChanges = async () => {
        if (!hasChanges || Object.keys(editedValues).length === 0) return

        setIsSaving(true)
        try {
            const updates: ShopKpiBulkUpdateItem[] = Object.entries(
                editedValues,
            )
                .map(([kpiId, changes]) => {
                    const originalKpi = kpis.find(
                        (kpi) => kpi.id === parseInt(kpiId),
                    )
                    if (!originalKpi) return null

                    return {
                        id: parseInt(kpiId),
                        kpiValue:
                            changes.kpiValue !== undefined
                                ? changes.kpiValue
                                : originalKpi.kpiValue,
                        kpiGoal:
                            changes.kpiGoal !== undefined
                                ? changes.kpiGoal
                                : originalKpi.kpiGoal,
                    }
                })
                .filter(
                    (update): update is ShopKpiBulkUpdateItem =>
                        update !== null,
                )

            await ShopKpiService.apiBulkUpdateShopKpis({ updates })

            toast.push(
                <Notification title="Success" type="success">
                    KPIs updated successfully
                </Notification>,
            )

            // Reload KPIs to get updated data
            await loadKpis()
            setEditedValues({})
            setHasChanges(false)
        } catch (error) {
            console.error('Error saving KPIs:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to save KPI changes
                </Notification>,
            )
        } finally {
            setIsSaving(false)
        }
    }

    // Cancel changes
    const handleCancelChanges = () => {
        setEditedValues({})
        setHasChanges(false)
    }

    // Format date for display
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleString()
    } // Format percentage
    const formatPercentage = (value: number | null) => {
        if (value === null || value === undefined) return 'N/A'
        return `${value.toFixed(2)}%`
    } // Get user name by ID
    const getUserName = (userId: string | null) => {
        if (!userId) return 'N/A'
        const user = users.find((u) => u.id === userId)
        return user ? user.name : userId
    }

    // Tab navigation between editable cells
    const getEditableCells = () => {
        const cells: { kpiId: number; field: 'kpiValue' | 'kpiGoal' }[] = []
        paginatedKpis.forEach((kpi) => {
            cells.push({ kpiId: kpi.id, field: 'kpiGoal' })
            cells.push({ kpiId: kpi.id, field: 'kpiValue' })
        })
        return cells
    }

    const handleTabNavigation = (
        currentKpiId: number,
        currentField: 'kpiValue' | 'kpiGoal',
        direction: 'next' | 'prev',
    ) => {
        const editableCells = getEditableCells()
        const currentIndex = editableCells.findIndex(
            (cell) =>
                cell.kpiId === currentKpiId && cell.field === currentField,
        )

        if (currentIndex === -1) return

        let nextIndex
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % editableCells.length
        } else {
            nextIndex =
                currentIndex === 0 ? editableCells.length - 1 : currentIndex - 1
        }

        const nextCell = editableCells[nextIndex]
        if (nextCell) {
            setEditingCell({ kpiId: nextCell.kpiId, field: nextCell.field })
        }
    }

    if (!hasViewAccess) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to view Shop KPIs.
                </Alert>
            </Card>
        )
    }

    const totalPages = Math.ceil(filteredKpis.length / pageSize)

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div>
                        <h4 className="mb-1">Shop KPIs</h4>
                        <p className="text-gray-600">
                            Manage KPI data for shops by date
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Shop *
                        </label>
                        <Select
                            placeholder="Select shop..."
                            value={
                                selectedShop
                                    ? {
                                          value: selectedShop,
                                          label:
                                              shops.find(
                                                  (shop) =>
                                                      shop.id === selectedShop,
                                              )?.name || '',
                                      }
                                    : null
                            }
                            options={shops
                                .slice()
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((shop) => ({
                                    value: shop.id,
                                    label: shop.name,
                                }))}
                            onChange={(option) => {
                                setSelectedShop(option?.value || null)
                                setCurrentPage(1)
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Date *
                        </label>
                        <Select
                            placeholder="Select date..."
                            value={
                                selectedDate
                                    ? {
                                          value: `${selectedDate.year}-${selectedDate.month}`,
                                          label: `${selectedDate.year}-${selectedDate.month.toString().padStart(2, '0')}`,
                                      }
                                    : null
                            }
                            options={dateOptions.map((option) => ({
                                value: `${option.year}-${option.month}`,
                                label: `${option.year}-${option.month.toString().padStart(2, '0')}`,
                            }))}
                            onChange={(option) => {
                                if (option?.value) {
                                    const [year, month] = option.value
                                        .split('-')
                                        .map(Number)
                                    setSelectedDate({ year, month })
                                    setCurrentPage(1)
                                } else {
                                    setSelectedDate(null)
                                }
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Search
                        </label>
                        <Input
                            placeholder="Search by category, KPI, unit, or modifier..."
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value)
                                setCurrentPage(1)
                            }}
                            prefix={<HiOutlineSearch />}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                {hasEditAccess && hasChanges && (
                    <div className="flex gap-2 mb-4">
                        <Button
                            variant="solid"
                            color="green"
                            size="sm"
                            icon={<HiOutlineCheck />}
                            onClick={handleSaveChanges}
                            loading={isSaving}
                        >
                            Save Changes
                        </Button>{' '}
                        <Button
                            variant="plain"
                            size="sm"
                            icon={<HiOutlineX />}
                            onClick={handleCancelChanges}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                {/* Data display condition message */}
                {(!selectedShop || !selectedDate) && (
                    <Alert type="info" className="mb-4">
                        Please select both shop and date to view KPI data.
                    </Alert>
                )}

                {/* Table */}
                {selectedShop && selectedDate && (
                    <>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, index) => (
                                    <Skeleton key={index} height="50px" />
                                ))}
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <Table.THead>
                                        <Table.Tr>
                                            <Table.Th>Category</Table.Th>
                                            <Table.Th>KPI</Table.Th>
                                            <Table.Th>Goal</Table.Th>
                                            <Table.Th>Adjusted KPI</Table.Th>
                                            <Table.Th>From BMS</Table.Th>
                                            <Table.Th>Unit</Table.Th>
                                            <Table.Th>Modified By</Table.Th>
                                            <Table.Th>
                                                Modified Date/Time
                                            </Table.Th>
                                            <Table.Th>KPI Threshold %</Table.Th>
                                        </Table.Tr>
                                    </Table.THead>
                                    <Table.TBody>
                                        {paginatedKpis.length === 0 ? (
                                            <Table.Tr>
                                                <Table.Td
                                                    colSpan={9}
                                                    className="text-center py-8"
                                                >
                                                    No KPI data found for the
                                                    selected shop and date.
                                                </Table.Td>
                                            </Table.Tr>
                                        ) : (
                                            paginatedKpis.map((kpi) => (
                                                <Table.Tr key={kpi.id}>
                                                    <Table.Td>
                                                        <span className="font-medium">
                                                            {kpi.attributeCategoryDescription ||
                                                                'N/A'}
                                                        </span>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <span className="font-medium text-blue-600">
                                                            {kpi.attributeName ||
                                                                'N/A'}
                                                        </span>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        {hasEditAccess &&
                                                        editingCell?.kpiId ===
                                                            kpi.id &&
                                                        editingCell?.field ===
                                                            'kpiGoal' ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Goal"
                                                                size="sm"
                                                                className="w-full min-w-[140px]"
                                                                value={getDisplayValue(
                                                                    kpi,
                                                                    'kpiGoal',
                                                                )}
                                                                onChange={(e) =>
                                                                    handleInputChange(
                                                                        kpi.id,
                                                                        'kpiGoal',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                onBlur={
                                                                    handleCellBlur
                                                                }
                                                                onKeyDown={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                        'Enter'
                                                                    ) {
                                                                        handleCellBlur()
                                                                    }
                                                                    if (
                                                                        e.key ===
                                                                        'Escape'
                                                                    ) {
                                                                        setEditingCell(
                                                                            null,
                                                                        )
                                                                    }
                                                                    if (
                                                                        e.key ===
                                                                        'Tab'
                                                                    ) {
                                                                        e.preventDefault()
                                                                        handleTabNavigation(
                                                                            kpi.id,
                                                                            'kpiGoal',
                                                                            e.shiftKey
                                                                                ? 'prev'
                                                                                : 'next',
                                                                        )
                                                                    }
                                                                }}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <div
                                                                className={`group relative p-2 rounded min-h-[40px] flex items-center transition-colors ${
                                                                    hasEditAccess
                                                                        ? 'cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200'
                                                                        : ''
                                                                }`}
                                                                onClick={() =>
                                                                    hasEditAccess &&
                                                                    handleCellClick(
                                                                        kpi.id,
                                                                        'kpiGoal',
                                                                    )
                                                                }
                                                                title={
                                                                    hasEditAccess
                                                                        ? `Click to edit goal value: ${kpi.kpiGoal?.toFixed(2) || 'N/A'}`
                                                                        : `Goal: ${kpi.kpiGoal?.toFixed(2) || 'N/A'}`
                                                                }
                                                            >
                                                                <span className="text-right w-full font-medium">
                                                                    {(() => {
                                                                        const editedValue =
                                                                            editedValues[
                                                                                kpi
                                                                                    .id
                                                                            ]
                                                                                ?.kpiGoal
                                                                        const displayValue =
                                                                            editedValue !==
                                                                            undefined
                                                                                ? editedValue
                                                                                : kpi.kpiGoal
                                                                        return displayValue !==
                                                                            null
                                                                            ? displayValue.toFixed(
                                                                                  2,
                                                                              )
                                                                            : 'N/A'
                                                                    })()}
                                                                </span>
                                                                {hasEditAccess && (
                                                                    <HiOutlinePencil className="ml-2 h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </Table.Td>
                                                    <Table.Td>
                                                        {hasEditAccess &&
                                                        editingCell?.kpiId ===
                                                            kpi.id &&
                                                        editingCell?.field ===
                                                            'kpiValue' ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Adjusted KPI"
                                                                size="sm"
                                                                className="w-full min-w-[140px]"
                                                                value={getDisplayValue(
                                                                    kpi,
                                                                    'kpiValue',
                                                                )}
                                                                onChange={(e) =>
                                                                    handleInputChange(
                                                                        kpi.id,
                                                                        'kpiValue',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                onBlur={
                                                                    handleCellBlur
                                                                }
                                                                onKeyDown={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                        'Enter'
                                                                    ) {
                                                                        handleCellBlur()
                                                                    }
                                                                    if (
                                                                        e.key ===
                                                                        'Escape'
                                                                    ) {
                                                                        setEditingCell(
                                                                            null,
                                                                        )
                                                                    }
                                                                    if (
                                                                        e.key ===
                                                                        'Tab'
                                                                    ) {
                                                                        e.preventDefault()
                                                                        handleTabNavigation(
                                                                            kpi.id,
                                                                            'kpiValue',
                                                                            e.shiftKey
                                                                                ? 'prev'
                                                                                : 'next',
                                                                        )
                                                                    }
                                                                }}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <div
                                                                className={`group relative p-2 rounded min-h-[40px] flex items-center transition-colors ${
                                                                    hasEditAccess
                                                                        ? 'cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200'
                                                                        : ''
                                                                }`}
                                                                onClick={() =>
                                                                    hasEditAccess &&
                                                                    handleCellClick(
                                                                        kpi.id,
                                                                        'kpiValue',
                                                                    )
                                                                }
                                                                title={
                                                                    hasEditAccess
                                                                        ? `Click to edit KPI value: ${kpi.kpiValue?.toFixed(2) || 'N/A'}`
                                                                        : `KPI Value: ${kpi.kpiValue?.toFixed(2) || 'N/A'}`
                                                                }
                                                            >
                                                                <span className="text-right w-full font-medium">
                                                                    {(() => {
                                                                        const editedValue =
                                                                            editedValues[
                                                                                kpi
                                                                                    .id
                                                                            ]
                                                                                ?.kpiValue
                                                                        const displayValue =
                                                                            editedValue !==
                                                                            undefined
                                                                                ? editedValue
                                                                                : kpi.kpiValue
                                                                        return displayValue !==
                                                                            null
                                                                            ? displayValue.toFixed(
                                                                                  2,
                                                                              )
                                                                            : 'N/A'
                                                                    })()}
                                                                </span>
                                                                {hasEditAccess && (
                                                                    <HiOutlinePencil className="ml-2 h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                                )}
                                                            </div>
                                                        )}{' '}
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <span>
                                                            {kpi.kpibmsValue?.toFixed(
                                                                2,
                                                            ) || 'N/A'}
                                                        </span>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <span>
                                                            {kpi.attributeUnitType ||
                                                                'N/A'}
                                                        </span>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <span className="text-gray-600">
                                                            {getUserName(
                                                                kpi.rowModifiedBy,
                                                            )}
                                                        </span>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <span className="text-gray-600 text-sm">
                                                            {formatDate(
                                                                kpi.rowModifiedOn,
                                                            )}
                                                        </span>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <span>
                                                            {formatPercentage(
                                                                kpi.kpiThreshold,
                                                            )}
                                                        </span>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))
                                        )}
                                    </Table.TBody>
                                </Table>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center mt-6">
                                        <Pagination
                                            total={filteredKpis.length}
                                            pageSize={pageSize}
                                            currentPage={currentPage}
                                            onChange={(page) =>
                                                setCurrentPage(page)
                                            }
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </Card>
        </div>
    )
}

export default ShopKPIListPage

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Button,
    Notification,
    toast,
    Card,
    Table,
    Input,
    Pagination,
} from '@/components/ui'
import { Loading } from '@/components/shared'
import { UserDto } from '@/@types/user'
import { Shop } from '@/@types/shop'
import ShopService from '@/services/ShopService'
import UserService from '@/services/UserService'
import { HiOutlineSearch } from 'react-icons/hi'

const { Tr, Th, Td, THead, TBody, Sorter } = Table

const AssignShopsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>()
    const navigate = useNavigate()

    // Debug log to verify correct component is loaded
    console.log(
        '🔴 LOADING AssignShopsPage - This should show "Assign Shops to User" title',
    )

    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<UserDto | null>(null)
    const [shops, setShops] = useState<Shop[]>([])
    const [selectedShopIds, setSelectedShopIds] = useState<number[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const pageSize = 10

    // Filter and sort shops based on search term and sort order
    const filteredAndSortedShops = useMemo(() => {
        let filtered = shops.filter(
            (shop) =>
                shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shop.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shop.state?.toLowerCase().includes(searchTerm.toLowerCase()),
        )

        filtered.sort((a, b) => {
            const nameA = a.name.toLowerCase()
            const nameB = b.name.toLowerCase()
            return sortOrder === 'asc'
                ? nameA.localeCompare(nameB)
                : nameB.localeCompare(nameA)
        })

        return filtered
    }, [shops, searchTerm, sortOrder])

    // Paginate the filtered shops
    const paginatedShops = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        return filteredAndSortedShops.slice(startIndex, startIndex + pageSize)
    }, [filteredAndSortedShops, currentPage, pageSize])

    const totalPages = Math.ceil(filteredAndSortedShops.length / pageSize)

    useEffect(() => {
        if (userId) {
            fetchUserAndShops()
        } else {
            navigate('/tenantportal/tenant/users')
        }
    }, [userId, navigate])

    const fetchUserAndShops = async () => {
        setLoading(true)
        try {
            // Fetch user details and shops in parallel
            const [userResponse, shopsResponse] = await Promise.all([
                UserService.getUser(userId!),
                ShopService.getShopsList(),
            ])

            setUser(userResponse)
            setShops(shopsResponse || [])

            // Set currently assigned shops if any (this would need to come from a separate endpoint)
            // For now, initialize as empty array
            setSelectedShopIds([])
        } catch (error) {
            console.error('Failed to fetch data:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load user or shops data
                </Notification>,
            )
            navigate('/tenantportal/tenant/users')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!user) return

        setSubmitting(true)
        try {
            await ShopService.assignShopsToUser(user.id!, selectedShopIds)
            toast.push(
                <Notification title="Success" type="success">
                    Shops assigned successfully
                </Notification>,
            )
            navigate('/tenantportal/tenant/users')
        } catch (error) {
            console.error('Failed to assign shops:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to assign shops
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleCancel = () => {
        navigate('/tenantportal/tenant/users')
    }

    const handleShopSelect = (shopId: number, isSelected: boolean) => {
        if (isSelected) {
            setSelectedShopIds((prev) => [...prev, shopId])
        } else {
            setSelectedShopIds((prev) => prev.filter((id) => id !== shopId))
        }
    }

    const handleSelectAll = (isSelected: boolean) => {
        if (isSelected) {
            setSelectedShopIds(filteredAndSortedShops.map((shop) => shop.id))
        } else {
            setSelectedShopIds([])
        }
    }

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1) // Reset to first page when searching
    }

    const handleSortToggle = () => {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    }

    const isAllSelected =
        filteredAndSortedShops.length > 0 &&
        filteredAndSortedShops.every((shop) =>
            selectedShopIds.includes(shop.id),
        )

    const isIndeterminate =
        selectedShopIds.length > 0 &&
        !isAllSelected &&
        filteredAndSortedShops.some((shop) => selectedShopIds.includes(shop.id))

    if (loading) {
        return (
            <div className="p-4">
                <Loading loading={true} />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="p-4">
                <Card>
                    <Notification title="Error" type="danger" closable>
                        User not found
                    </Notification>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-semibold">Assign Shops</h2>{' '}
                    <p className="text-gray-600">
                        Assign shops to {user.name} ({user.email})
                    </p>
                </div>
                <Button variant="plain" onClick={handleCancel}>
                    Back to Users
                </Button>
            </div>

            <Card>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            {' '}
                            <label className="block text-sm font-medium">
                                Select Shops ({selectedShopIds.length} of{' '}
                                {filteredAndSortedShops.length} selected)
                            </label>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-4">
                            <Input
                                placeholder="Search shops by name, city, or state..."
                                value={searchTerm}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                prefix={<HiOutlineSearch className="text-lg" />}
                            />
                        </div>

                        <Table>
                            <THead>
                                <Tr>
                                    {' '}
                                    <Th className="w-12">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={(e) =>
                                                handleSelectAll(
                                                    e.target.checked,
                                                )
                                            }
                                            ref={(ref) => {
                                                if (ref) {
                                                    ref.indeterminate =
                                                        isIndeterminate
                                                }
                                            }}
                                            className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500"
                                        />
                                    </Th>{' '}
                                    <Th>
                                        <div
                                            className="flex items-center cursor-pointer hover:text-blue-600"
                                            onClick={handleSortToggle}
                                        >
                                            Shop Name
                                            <Sorter
                                                sort={sortOrder}
                                                className="ml-1"
                                            />
                                        </div>
                                    </Th>
                                    <Th>Location</Th>
                                    <Th>Status</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {paginatedShops.map((shop) => (
                                    <Tr key={shop.id}>
                                        {' '}
                                        <Td>
                                            <input
                                                type="checkbox"
                                                checked={selectedShopIds.includes(
                                                    shop.id,
                                                )}
                                                onChange={(e) =>
                                                    handleShopSelect(
                                                        shop.id,
                                                        e.target.checked,
                                                    )
                                                }
                                                className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500"
                                            />
                                        </Td>
                                        <Td>
                                            <div className="font-medium">
                                                {shop.name}
                                            </div>
                                        </Td>{' '}
                                        <Td>
                                            <div className="text-gray-600">
                                                {shop.city && shop.state
                                                    ? `${shop.city}, ${shop.state}`
                                                    : shop.city ||
                                                      shop.state ||
                                                      'No location'}
                                            </div>
                                        </Td>{' '}
                                        <Td>
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                    shop.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {shop.isActive
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </Td>
                                    </Tr>
                                ))}
                            </TBody>
                        </Table>

                        {paginatedShops.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                {searchTerm
                                    ? 'No shops found matching your search'
                                    : 'No shops available'}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-4">
                                <Pagination
                                    pageSize={pageSize}
                                    currentPage={currentPage}
                                    total={filteredAndSortedShops.length}
                                    onChange={(page) => setCurrentPage(page)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button
                            variant="plain"
                            onClick={handleCancel}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            onClick={handleSubmit}
                            loading={submitting}
                            disabled={submitting}
                        >
                            Assign Shops
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default AssignShopsPage

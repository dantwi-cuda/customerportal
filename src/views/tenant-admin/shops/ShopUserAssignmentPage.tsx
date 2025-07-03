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
    HiOutlineUserGroup,
} from 'react-icons/hi'
import * as ShopService from '@/services/ShopService'
import UserService from '@/services/UserService'
import { useNavigate, useParams } from 'react-router-dom'
import type { Shop, AssignUsersRequest } from '@/@types/shop'
import type { User } from '@/@types/user'
import useAuth from '@/auth/useAuth'

const ShopUserAssignmentPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    // State management
    const [shop, setShop] = useState<Shop | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
    const [loading, setLoading] = useState(false)
    const [usersLoading, setUsersLoading] = useState(false)
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
            fetchUsers()
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

    const fetchUsers = async () => {
        setUsersLoading(true)
        try {
            // Fetch tenant users
            const data = await UserService.getUsers({ isCustomerUser: true })
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.push(
                <Notification type="danger" title="Error fetching users">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setUsersLoading(false)
        }
    }

    const handleBack = () => {
        navigate(`/admin/shops/${id}/view`)
    }

    const handleSave = async () => {
        if (!shop) return

        setSaving(true)
        try {
            const request: AssignUsersRequest = {
                userIds: selectedUserIds,
            }
            await ShopService.assignUsers(shop.id, request)
            toast.push(
                <Notification type="success" title="Users assigned">
                    Users have been assigned to the shop successfully
                </Notification>,
            )
            navigate(`/admin/shops/${id}/view`)
        } catch (error) {
            console.error('Error assigning users:', error)
            toast.push(
                <Notification type="danger" title="Error assigning users">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleUserToggle = (userId: number) => {
        setSelectedUserIds((prev) => {
            if (prev.includes(userId)) {
                return prev.filter((id) => id !== userId)
            } else {
                return [...prev, userId]
            }
        })
    }

    const handleSelectAll = () => {
        const filteredUserIds = filteredUsers.map((u) => u.id)
        if (selectedUserIds.length === filteredUserIds.length) {
            // Deselect all filtered users
            setSelectedUserIds((prev) =>
                prev.filter((id) => !filteredUserIds.includes(id)),
            )
        } else {
            // Select all filtered users
            setSelectedUserIds((prev) => {
                const newIds = [...prev]
                filteredUserIds.forEach((id) => {
                    if (!newIds.includes(id)) {
                        newIds.push(id)
                    }
                })
                return newIds
            })
        }
    }

    // Filter users based on search text
    const filteredUsers = users.filter((user) => {
        if (!searchText) return true
        const searchLower = searchText.toLowerCase()
        return (
            user.firstName?.toLowerCase().includes(searchLower) ||
            user.lastName?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower)
        )
    })

    // Calculate pagination
    const totalItems = filteredUsers.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

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
                        Assign Users to: {shop.name}
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
                                placeholder="Search users by name or email..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                prefix={<HiOutlineSearch />}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600">
                                {selectedUserIds.length} of{' '}
                                {filteredUsers.length} users selected
                            </div>{' '}
                            <Button
                                size="sm"
                                variant="default"
                                onClick={handleSelectAll}
                            >
                                {selectedUserIds.length === filteredUsers.length
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Users List */}
                <div className="p-4">
                    {usersLoading ? (
                        <div className="text-center py-8">
                            <div>Loading users...</div>
                        </div>
                    ) : paginatedUsers.length === 0 ? (
                        <div className="text-center py-8">
                            <HiOutlineUserGroup
                                className="mx-auto mb-2 text-gray-400"
                                size={48}
                            />
                            <div className="text-gray-500">
                                {searchText
                                    ? 'No users found matching your search'
                                    : 'No users available'}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {paginatedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
                                    >
                                        <Checkbox
                                            checked={selectedUserIds.includes(
                                                user.id,
                                            )}
                                            onChange={() =>
                                                handleUserToggle(user.id)
                                            }
                                        />
                                        <div className="ml-4 flex-1">
                                            <div className="font-medium text-gray-900">
                                                {user.firstName} {user.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {user.email}
                                            </div>
                                            {user.role && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Role: {user.role}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            ID: {user.id}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    {' '}
                                    <Pagination
                                        total={totalItems}
                                        currentPage={currentPage}
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

export default ShopUserAssignmentPage

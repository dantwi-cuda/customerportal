import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Notification,
    toast,
    Tag,
    Switcher,
} from '@/components/ui'
import {
    HiOutlineArrowLeft,
    HiOutlinePencilAlt,
    HiOutlineUserGroup,
    HiOutlineOfficeBuilding,
    HiOutlineLocationMarker,
    HiOutlineIdentification,
    HiOutlineGlobeAlt,
    HiOutlineBadgeCheck,
    HiOutlineChartBar,
} from 'react-icons/hi'
import * as ShopService from '@/services/ShopService'
import { useNavigate, useParams } from 'react-router-dom'
import type { Shop, ShopKpiRecentViewDto } from '@/@types/shop'
import useAuth from '@/auth/useAuth'

const ShopViewPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    // State management
    const [shop, setShop] = useState<Shop | null>(null)
    const [kpis, setKpis] = useState<ShopKpiRecentViewDto[]>([])
    const [loading, setLoading] = useState(false)
    const [kpisLoading, setKpisLoading] = useState(false)

    // Tenant admin check: User must have a tenantId to manage shops
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (isTenantAdmin && id) {
            fetchShopDetails(parseInt(id, 10))
            fetchShopKpis(parseInt(id, 10))
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

    const fetchShopKpis = async (shopId: number) => {
        setKpisLoading(true)
        try {
            const data = await ShopService.getShopKpisRecent(shopId)
            setKpis(data)
        } catch (error) {
            console.error('Error fetching shop KPIs:', error)
            // Don't show error for KPIs as it might not be critical
        } finally {
            setKpisLoading(false)
        }
    }

    const handleBack = () => {
        navigate('/admin/shops')
    }

    const handleEdit = () => {
        navigate(`/admin/shops/${id}/edit`)
    }

    const handleAssignUsers = () => {
        navigate(`/admin/shops/${id}/users`)
    }

    const handleAssignPrograms = () => {
        navigate(`/admin/shops/${id}/programs`)
    }

    const handleToggleActive = async () => {
        if (!shop) return

        try {
            if (shop.isActive) {
                await ShopService.deactivateShop(shop.id)
            } else {
                await ShopService.activateShop(shop.id)
            }
            // Refresh shop details
            await fetchShopDetails(shop.id)
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
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header and Actions Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<HiOutlineArrowLeft />}
                            onClick={handleBack}
                        >
                            Back to Shops
                        </Button>
                        <div>
                            <h4 className="mb-1">Shop Details</h4>
                            <p className="text-gray-600 text-sm">
                                View information for: {shop.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            size="sm"
                            variant="default"
                            icon={<HiOutlineUserGroup />}
                            onClick={handleAssignUsers}
                        >
                            Assign Users
                        </Button>
                        <Button
                            size="sm"
                            variant="default"
                            icon={<HiOutlineOfficeBuilding />}
                            onClick={handleAssignPrograms}
                        >
                            Assign Programs
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<HiOutlinePencilAlt />}
                            onClick={handleEdit}
                        >
                            Edit Shop
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Content Card */}
            <Card>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <div className="p-6">
                                <h4 className="text-base font-semibold mb-4 flex items-center">
                                    <HiOutlineIdentification className="mr-2" />
                                    Basic Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Shop Name
                                        </label>
                                        <div className="text-sm text-gray-900">
                                            {shop.name}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Shop ID
                                        </label>
                                        <div className="text-sm text-gray-900">
                                            {shop.id}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Source
                                        </label>
                                        <div className="text-sm text-gray-900">
                                            {shop.source || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <Switcher
                                                checked={shop.isActive}
                                                onChange={handleToggleActive}
                                            />
                                            <span className="text-sm">
                                                {shop.isActive
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Location Information */}
                        <Card>
                            <div className="p-6">
                                <h4 className="text-base font-semibold mb-4 flex items-center">
                                    <HiOutlineLocationMarker className="mr-2" />
                                    Location Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            City
                                        </label>
                                        <div className="text-sm text-gray-900">
                                            {shop.city || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            State
                                        </label>
                                        <div className="text-sm text-gray-900">
                                            {shop.state || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Postal Code
                                        </label>
                                        <div className="text-sm text-gray-900">
                                            {shop.postalCode || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Country
                                        </label>
                                        <div className="text-sm text-gray-900 flex items-center">
                                            <HiOutlineGlobeAlt className="mr-1" />
                                            {shop.country || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* KPIs Section */}
                        {kpis.length > 0 && (
                            <Card>
                                <div className="p-6">
                                    <h4 className="text-base font-semibold mb-4 flex items-center">
                                        <HiOutlineChartBar className="mr-2" />
                                        Key Performance Indicators
                                    </h4>
                                    {kpisLoading ? (
                                        <div className="text-center py-4">
                                            Loading KPIs...
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {kpis.map((kpi) => (
                                                <div
                                                    key={kpi.id}
                                                    className="bg-gray-50 p-4 rounded-lg"
                                                >
                                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                                        {kpi.attributeName ||
                                                            'N/A'}
                                                    </div>
                                                    <div className="text-lg font-semibold text-gray-900">
                                                        {kpi.kpiValue ?? 'N/A'}{' '}
                                                        {kpi.unitType &&
                                                            `(${kpi.unitType})`}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Goal:{' '}
                                                        {kpi.kpiGoal ?? 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        BMS Value:{' '}
                                                        {kpi.kpibmsValue ??
                                                            'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        Category:{' '}
                                                        {kpi.categoryDescription ||
                                                            'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Period: {kpi.kpiMonth}/
                                                        {kpi.kpiYear}
                                                    </div>
                                                    {kpi.rowModifiedOn && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Last updated:{' '}
                                                            {new Date(
                                                                kpi.rowModifiedOn,
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Programs */}
                        <Card>
                            <div className="p-6">
                                <h4 className="text-base font-semibold mb-4 flex items-center">
                                    <HiOutlineOfficeBuilding className="mr-2" />
                                    Assigned Programs
                                </h4>
                                {shop.programNames &&
                                shop.programNames.length > 0 ? (
                                    <div className="space-y-2">
                                        {shop.programNames.map(
                                            (program, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                                >
                                                    <div className="flex items-center">
                                                        <HiOutlineBadgeCheck className="mr-2 text-green-600" />
                                                        <span className="text-sm font-medium">
                                                            {program}
                                                        </span>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-500">
                                        <HiOutlineOfficeBuilding
                                            className="mx-auto mb-2 text-gray-400"
                                            size={24}
                                        />
                                        <div className="text-sm">
                                            No programs assigned
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={handleAssignPrograms}
                                        className="w-full"
                                    >
                                        Manage Programs
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <div className="p-6">
                                <h4 className="text-base font-semibold mb-4">
                                    Quick Actions
                                </h4>
                                <div className="space-y-2">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        icon={<HiOutlinePencilAlt />}
                                        onClick={handleEdit}
                                        className="w-full justify-start"
                                    >
                                        Edit Shop Details
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="default"
                                        icon={<HiOutlineUserGroup />}
                                        onClick={handleAssignUsers}
                                        className="w-full justify-start"
                                    >
                                        Manage User Assignments
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="default"
                                        icon={<HiOutlineOfficeBuilding />}
                                        onClick={handleAssignPrograms}
                                        className="w-full justify-start"
                                    >
                                        Manage Program Assignments
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default ShopViewPage

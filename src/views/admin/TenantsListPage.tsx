/**
 * Tenants List Page
 * Admin interface for viewing and managing all tenants and their feature access
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminFeatures } from '@/hooks/useFeatureNavigation'
import {
    FEATURE_DEFINITIONS,
    FREE_FEATURES,
} from '@/constants/features.constant'

// Mock tenant data - in real implementation, this would come from a tenant service
interface Tenant {
    id: string
    name: string
    email: string
    plan: 'free' | 'basic' | 'premium' | 'enterprise'
    status: 'active' | 'inactive' | 'suspended'
    createdAt: string
    lastLoginAt?: string
}

const mockTenants: Tenant[] = [
    {
        id: 'tenant-1',
        name: 'Acme Corporation',
        email: 'admin@acme.com',
        plan: 'enterprise',
        status: 'active',
        createdAt: '2024-01-15T10:00:00Z',
        lastLoginAt: '2024-01-20T14:30:00Z',
    },
    {
        id: 'tenant-2',
        name: 'Small Business Inc',
        email: 'owner@smallbiz.com',
        plan: 'basic',
        status: 'active',
        createdAt: '2024-01-10T09:00:00Z',
        lastLoginAt: '2024-01-19T11:15:00Z',
    },
    {
        id: 'tenant-3',
        name: 'Startup Ltd',
        email: 'founder@startup.com',
        plan: 'free',
        status: 'active',
        createdAt: '2024-01-18T16:00:00Z',
    },
    {
        id: 'tenant-4',
        name: 'Suspended Corp',
        email: 'admin@suspended.com',
        plan: 'premium',
        status: 'suspended',
        createdAt: '2024-01-05T12:00:00Z',
        lastLoginAt: '2024-01-12T08:45:00Z',
    },
]

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
    </div>
)

const StatusBadge: React.FC<{ status: Tenant['status'] }> = ({ status }) => {
    const styles = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        suspended: 'bg-red-100 text-red-800',
    }

    return (
        <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}
        >
            {status.toUpperCase()}
        </span>
    )
}

const PlanBadge: React.FC<{ plan: Tenant['plan'] }> = ({ plan }) => {
    const styles = {
        free: 'bg-gray-100 text-gray-800',
        basic: 'bg-blue-100 text-blue-800',
        premium: 'bg-purple-100 text-purple-800',
        enterprise: 'bg-yellow-100 text-yellow-800',
    }

    return (
        <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[plan]}`}
        >
            {plan.toUpperCase()}
        </span>
    )
}

const TenantRow: React.FC<{
    tenant: Tenant
    enabledFeaturesCount: number
    totalPaidFeatures: number
    onManageFeatures: (tenantId: string) => void
    onViewDetails: (tenantId: string) => void
}> = ({
    tenant,
    enabledFeaturesCount,
    totalPaidFeatures,
    onManageFeatures,
    onViewDetails,
}) => {
    const freeFeatureCount = FREE_FEATURES.length
    const totalFeatures = enabledFeaturesCount + freeFeatureCount

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                                {tenant.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                            {tenant.name}
                        </div>
                        <div className="text-sm text-gray-500">
                            {tenant.email}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <PlanBadge plan={tenant.plan} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={tenant.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="flex items-center space-x-2">
                    <span className="font-medium">{totalFeatures}</span>
                    <span className="text-gray-500">features</span>
                    <div className="flex space-x-1">
                        <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                            {freeFeatureCount} free
                        </span>
                        {enabledFeaturesCount > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                {enabledFeaturesCount} paid
                            </span>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {tenant.lastLoginAt
                    ? new Date(tenant.lastLoginAt).toLocaleDateString()
                    : 'Never'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2">
                    <button
                        onClick={() => onViewDetails(tenant.id)}
                        className="text-blue-600 hover:text-blue-900"
                    >
                        View
                    </button>
                    <button
                        onClick={() => onManageFeatures(tenant.id)}
                        className="text-green-600 hover:text-green-900"
                    >
                        Manage Features
                    </button>
                </div>
            </td>
        </tr>
    )
}

const TenantsListPage: React.FC = () => {
    const navigate = useNavigate()

    const { allFeatures, fetchAllFeatures, isLoading, error } =
        useAdminFeatures()

    const [tenants] = useState<Tenant[]>(mockTenants) // In real app, fetch from API
    const [searchTerm, setSearchTerm] = useState('')
    const [planFilter, setPlanFilter] = useState<'all' | Tenant['plan']>('all')
    const [statusFilter, setStatusFilter] = useState<'all' | Tenant['status']>(
        'all',
    )

    // Load features on mount
    useEffect(() => {
        fetchAllFeatures()
    }, [fetchAllFeatures])

    // Calculate feature statistics for each tenant
    const tenantStats = useMemo(() => {
        const stats: Record<
            string,
            { enabledFeatures: number; totalPaidFeatures: number }
        > = {}

        tenants.forEach((tenant) => {
            // Mock data - in real implementation, this would come from API
            // For now, we'll simulate based on plan
            let enabledFeatures = 0
            const totalPaidFeatures = allFeatures.filter(
                (f) => FEATURE_DEFINITIONS[f.featureKey]?.category === 'paid',
            ).length

            switch (tenant.plan) {
                case 'enterprise':
                    enabledFeatures = totalPaidFeatures // All paid features
                    break
                case 'premium':
                    enabledFeatures = Math.floor(totalPaidFeatures * 0.8) // 80% of paid features
                    break
                case 'basic':
                    enabledFeatures = Math.floor(totalPaidFeatures * 0.4) // 40% of paid features
                    break
                case 'free':
                    enabledFeatures = 0 // Only free features
                    break
            }

            stats[tenant.id] = { enabledFeatures, totalPaidFeatures }
        })

        return stats
    }, [tenants, allFeatures])

    // Filter tenants
    const filteredTenants = useMemo(() => {
        return tenants.filter((tenant) => {
            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase()
                const matchesSearch =
                    tenant.name.toLowerCase().includes(searchLower) ||
                    tenant.email.toLowerCase().includes(searchLower) ||
                    tenant.id.toLowerCase().includes(searchLower)

                if (!matchesSearch) return false
            }

            // Plan filter
            if (planFilter !== 'all' && tenant.plan !== planFilter) {
                return false
            }

            // Status filter
            if (statusFilter !== 'all' && tenant.status !== statusFilter) {
                return false
            }

            return true
        })
    }, [tenants, searchTerm, planFilter, statusFilter])

    const handleManageFeatures = (tenantId: string) => {
        navigate(`/admin/tenants/${tenantId}/features`)
    }

    const handleViewDetails = (tenantId: string) => {
        navigate(`/admin/tenants/${tenantId}`)
    }

    // Summary stats
    const summaryStats = useMemo(() => {
        const totalTenants = tenants.length
        const activeTenants = tenants.filter(
            (t) => t.status === 'active',
        ).length
        const paidPlans = tenants.filter((t) => t.plan !== 'free').length
        const averageFeatures =
            tenants.length > 0
                ? Math.round(
                      Object.values(tenantStats).reduce(
                          (sum, stats) => sum + stats.enabledFeatures,
                          0,
                      ) / tenants.length,
                  )
                : 0

        return { totalTenants, activeTenants, paidPlans, averageFeatures }
    }, [tenants, tenantStats])

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Tenant Management
                </h1>
                <p className="text-gray-600 mt-1">
                    Manage tenants and their feature access
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">
                        {summaryStats.totalTenants}
                    </div>
                    <div className="text-sm text-gray-600">Total Tenants</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">
                        {summaryStats.activeTenants}
                    </div>
                    <div className="text-sm text-gray-600">Active Tenants</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-purple-600">
                        {summaryStats.paidPlans}
                    </div>
                    <div className="text-sm text-gray-600">Paid Plans</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-yellow-600">
                        {summaryStats.averageFeatures}
                    </div>
                    <div className="text-sm text-gray-600">
                        Avg. Paid Features
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search Tenants
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, or ID..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plan
                        </label>
                        <select
                            value={planFilter}
                            onChange={(e) =>
                                setPlanFilter(e.target.value as any)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Plans</option>
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as any)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                setPlanFilter('all')
                                setStatusFilter('all')
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Tenants Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tenant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Plan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Features
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Login
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTenants.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-4 text-center text-gray-500"
                                    >
                                        No tenants found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <TenantRow
                                        key={tenant.id}
                                        tenant={tenant}
                                        enabledFeaturesCount={
                                            tenantStats[tenant.id]
                                                ?.enabledFeatures || 0
                                        }
                                        totalPaidFeatures={
                                            tenantStats[tenant.id]
                                                ?.totalPaidFeatures || 0
                                        }
                                        onManageFeatures={handleManageFeatures}
                                        onViewDetails={handleViewDetails}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default TenantsListPage

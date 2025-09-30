/**
 * Feature Analytics Dashboard
 * Admin interface for viewing feature usage analytics and audit logs
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useAdminFeatures } from '@/hooks/useFeatureNavigation'
import { FEATURE_DEFINITIONS } from '@/constants/features.constant'
import type { AuditQuery } from '@/@types/feature'

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
    </div>
)

const MetricCard: React.FC<{
    title: string
    value: string | number
    subtitle?: string
    trend?: { value: number; direction: 'up' | 'down' | 'neutral' }
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}> = ({ title, value, subtitle, trend, color = 'blue' }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50 border-blue-200',
        green: 'text-green-600 bg-green-50 border-green-200',
        yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        red: 'text-red-600 bg-red-50 border-red-200',
        purple: 'text-purple-600 bg-purple-50 border-purple-200',
    }

    return (
        <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p
                        className={`text-2xl font-bold ${colorClasses[color].split(' ')[0]}`}
                    >
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    )}
                </div>
                {trend && (
                    <div
                        className={`flex items-center space-x-1 text-sm ${
                            trend.direction === 'up'
                                ? 'text-green-600'
                                : trend.direction === 'down'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                        }`}
                    >
                        {trend.direction === 'up' && (
                            <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                        {trend.direction === 'down' && (
                            <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                        <span>{trend.value}%</span>
                    </div>
                )}
            </div>
        </div>
    )
}

const FeatureUsageChart: React.FC<{
    usageData: Array<{ featureKey: string; usage: number; tenants: number }>
}> = ({ usageData }) => {
    const maxUsage = Math.max(...usageData.map((d) => d.usage))

    return (
        <div className="space-y-3">
            {usageData.map((data) => {
                const definition = FEATURE_DEFINITIONS[data.featureKey]
                const percentage =
                    maxUsage > 0 ? (data.usage / maxUsage) * 100 : 0

                return (
                    <div
                        key={data.featureKey}
                        className="flex items-center space-x-3"
                    >
                        <div className="w-32 text-sm font-medium text-gray-700 truncate">
                            {definition?.name || data.featureKey}
                        </div>
                        <div className="flex-1">
                            <div className="bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 w-16 text-right">
                            {data.tenants} tenants
                        </div>
                        <div className="text-sm font-medium text-gray-900 w-12 text-right">
                            {data.usage}%
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

const AuditLogTable: React.FC<{
    auditEntries: Array<{
        id: string
        timestamp: string
        action: string
        entityType: string
        entityId: string
        userId: string
        tenantId?: string
        details?: string
    }>
}> = ({ auditEntries }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Feature
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tenant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {auditEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(entry.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        entry.action === 'ENABLE'
                                            ? 'bg-green-100 text-green-800'
                                            : entry.action === 'DISABLE'
                                              ? 'bg-red-100 text-red-800'
                                              : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    {entry.action}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.entityId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {entry.tenantId || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {entry.userId}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                {entry.details || '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const FeatureAnalyticsDashboard: React.FC = () => {
    const {
        usageReport,
        auditLog,
        isLoading,
        error,
        fetchUsageReport,
        fetchAuditLog,
    } = useAdminFeatures()

    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0], // 30 days ago
        endDate: new Date().toISOString().split('T')[0], // Today
    })

    const [auditFilters, setAuditFilters] = useState<Partial<AuditQuery>>({
        entityType: 'Feature',
        page: 1,
        pageSize: 50,
    })

    // Load data on mount and when filters change
    useEffect(() => {
        fetchUsageReport(dateRange.startDate, dateRange.endDate)
    }, [dateRange, fetchUsageReport])

    useEffect(() => {
        const query: AuditQuery = {
            ...auditFilters,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
        }
        fetchAuditLog(query)
    }, [auditFilters, dateRange, fetchAuditLog])

    // Process usage data for charts
    const processedUsageData = useMemo(() => {
        if (!usageReport) return []

        // Mock data processing - in real implementation, this would process actual usage report
        return Object.keys(FEATURE_DEFINITIONS)
            .map((featureKey) => {
                const definition = FEATURE_DEFINITIONS[featureKey]
                // Simulate usage data
                const baseUsage = Math.random() * 100
                const tenantCount = Math.floor(Math.random() * 50) + 1

                return {
                    featureKey,
                    usage: Math.round(baseUsage),
                    tenants: tenantCount,
                }
            })
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 10) // Top 10 features
    }, [usageReport])

    // Mock audit entries - in real implementation, this would come from auditLog
    const mockAuditEntries = [
        {
            id: '1',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            action: 'ENABLE',
            entityType: 'Feature',
            entityId: 'partsManagement',
            userId: 'admin@example.com',
            tenantId: 'tenant-1',
            details: 'Enabled Parts Management for premium upgrade',
        },
        {
            id: '2',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            action: 'DISABLE',
            entityType: 'Feature',
            entityId: 'accounting',
            userId: 'admin@example.com',
            tenantId: 'tenant-2',
            details: 'Disabled due to payment failure',
        },
        {
            id: '3',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            action: 'ENABLE',
            entityType: 'Feature',
            entityId: 'reports',
            userId: 'admin@example.com',
            tenantId: 'tenant-3',
            details: 'Enabled as part of trial extension',
        },
    ]

    const handleDateRangeChange = (
        field: 'startDate' | 'endDate',
        value: string,
    ) => {
        setDateRange((prev) => ({ ...prev, [field]: value }))
    }

    const handleRefresh = () => {
        fetchUsageReport(dateRange.startDate, dateRange.endDate)
        const query: AuditQuery = {
            ...auditFilters,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
        }
        fetchAuditLog(query)
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Feature Analytics
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Monitor feature usage and audit trail across all
                            tenants
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Date Range Filter */}
            <div className="bg-white p-4 rounded-lg border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) =>
                                handleDateRangeChange(
                                    'startDate',
                                    e.target.value,
                                )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) =>
                                handleDateRangeChange('endDate', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                const thirtyDaysAgo = new Date(
                                    Date.now() - 30 * 24 * 60 * 60 * 1000,
                                )
                                    .toISOString()
                                    .split('T')[0]
                                const today = new Date()
                                    .toISOString()
                                    .split('T')[0]
                                setDateRange({
                                    startDate: thirtyDaysAgo,
                                    endDate: today,
                                })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Last 30 Days
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <MetricCard
                    title="Total Features"
                    value={Object.keys(FEATURE_DEFINITIONS).length}
                    subtitle="System-wide"
                    color="blue"
                />
                <MetricCard
                    title="Active Tenants"
                    value="42"
                    subtitle="Using paid features"
                    trend={{ value: 12, direction: 'up' }}
                    color="green"
                />
                <MetricCard
                    title="Feature Adoptions"
                    value="156"
                    subtitle="This month"
                    trend={{ value: 8, direction: 'up' }}
                    color="purple"
                />
                <MetricCard
                    title="Revenue Impact"
                    value="$24,500"
                    subtitle="From paid features"
                    trend={{ value: 15, direction: 'up' }}
                    color="yellow"
                />
            </div>

            {/* Feature Usage Chart */}
            <div className="bg-white p-6 rounded-lg border mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Top Feature Usage
                </h2>
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <FeatureUsageChart usageData={processedUsageData} />
                )}
            </div>

            {/* Audit Log */}
            <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Recent Feature Changes
                    </h2>
                    <div className="flex space-x-2">
                        <select
                            value={auditFilters.actions?.[0] || ''}
                            onChange={(e) =>
                                setAuditFilters((prev) => ({
                                    ...prev,
                                    actions: e.target.value
                                        ? [e.target.value]
                                        : undefined,
                                }))
                            }
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                        >
                            <option value="">All Actions</option>
                            <option value="ENABLE">Enable</option>
                            <option value="DISABLE">Disable</option>
                            <option value="UPDATE">Update</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <AuditLogTable auditEntries={mockAuditEntries} />
                )}
            </div>
        </div>
    )
}

export default FeatureAnalyticsDashboard

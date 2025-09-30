/**
 * Tenant Feature Management Page
 * Admin interface for managing feature access for tenants
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAdminFeatures } from '@/hooks/useFeatureNavigation'
import {
    FEATURE_DEFINITIONS,
    FREE_FEATURES,
} from '@/constants/features.constant'
import type { TenantFeatureResponse, FeatureResponse } from '@/@types/feature'

// Components
const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
    </div>
)

const ErrorAlert: React.FC<{ message: string; onDismiss?: () => void }> = ({
    message,
    onDismiss,
}) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex">
            <div className="flex-shrink-0">
                <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                    <p>{message}</p>
                </div>
                {onDismiss && (
                    <div className="mt-3">
                        <button
                            onClick={onDismiss}
                            className="text-sm font-medium text-red-800 hover:text-red-600"
                        >
                            Dismiss
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
)

const SuccessAlert: React.FC<{ message: string; onDismiss?: () => void }> = ({
    message,
    onDismiss,
}) => (
    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
        <div className="flex">
            <div className="flex-shrink-0">
                <svg
                    className="h-5 w-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                    <p>{message}</p>
                </div>
                {onDismiss && (
                    <div className="mt-3">
                        <button
                            onClick={onDismiss}
                            className="text-sm font-medium text-green-800 hover:text-green-600"
                        >
                            Dismiss
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
)

const FeatureToggle: React.FC<{
    feature: FeatureResponse
    tenantFeature?: TenantFeatureResponse
    onToggle: (
        featureId: string,
        enabled: boolean,
        reason?: string,
    ) => Promise<void>
    isLoading: boolean
    disabled?: boolean
}> = ({ feature, tenantFeature, onToggle, isLoading, disabled = false }) => {
    const [showReasonModal, setShowReasonModal] = useState(false)
    const [reason, setReason] = useState('')
    const [pendingAction, setPendingAction] = useState<
        'enable' | 'disable' | null
    >(null)

    const isEnabled = tenantFeature?.isEnabled || false
    const isFreeFeature = FREE_FEATURES.includes(feature.featureKey as any)
    const definition = FEATURE_DEFINITIONS[feature.featureKey]

    const handleToggle = (enabled: boolean) => {
        setPendingAction(enabled ? 'enable' : 'disable')
        setShowReasonModal(true)
    }

    const handleConfirm = async () => {
        if (pendingAction) {
            await onToggle(
                feature.featureId,
                pendingAction === 'enable',
                reason,
            )
            setShowReasonModal(false)
            setReason('')
            setPendingAction(null)
        }
    }

    const handleCancel = () => {
        setShowReasonModal(false)
        setReason('')
        setPendingAction(null)
    }

    return (
        <>
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                    <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                            {feature.featureName}
                        </h3>
                        <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                definition?.category === 'paid'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                            }`}
                        >
                            {definition?.category === 'paid' ? 'PAID' : 'FREE'}
                        </span>
                        {isFreeFeature && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                ALWAYS ENABLED
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        {feature.description || definition?.description}
                    </p>
                    {tenantFeature?.enabledAt && (
                        <p className="text-xs text-gray-400 mt-1">
                            Last modified:{' '}
                            {new Date(tenantFeature.enabledAt).toLocaleString()}
                        </p>
                    )}
                </div>

                <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isEnabled || isFreeFeature}
                            onChange={(e) => handleToggle(e.target.checked)}
                            disabled={disabled || isLoading || isFreeFeature}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                            {isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </label>
                </div>
            </div>

            {/* Reason Modal */}
            {showReasonModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 transition-opacity"
                            aria-hidden="true"
                        >
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    {pendingAction === 'enable'
                                        ? 'Enable'
                                        : 'Disable'}{' '}
                                    Feature: {feature.featureName}
                                </h3>

                                <div className="mb-4">
                                    <label
                                        htmlFor="reason"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Reason (optional)
                                    </label>
                                    <textarea
                                        id="reason"
                                        value={reason}
                                        onChange={(e) =>
                                            setReason(e.target.value)
                                        }
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter reason for this change..."
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {isLoading ? 'Processing...' : 'Confirm'}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isLoading}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

const TenantFeatureManagement: React.FC = () => {
    const { tenantId } = useParams<{ tenantId: string }>()
    const navigate = useNavigate()

    const {
        allFeatures,
        getTenantFeatures,
        isLoading,
        error,
        clearError,
        fetchAllFeatures,
        fetchTenantFeatures,
        enableTenantFeature,
        disableTenantFeature,
        isEnablingFeature,
        isDisablingFeature,
    } = useAdminFeatures()

    const [successMessage, setSuccessMessage] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<
        'all' | 'free' | 'paid'
    >('all')
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'enabled' | 'disabled'
    >('all')

    const tenantFeatures = tenantId ? getTenantFeatures(tenantId) : []

    // Load data on mount
    useEffect(() => {
        fetchAllFeatures()
        if (tenantId) {
            fetchTenantFeatures(tenantId)
        }
    }, [tenantId, fetchAllFeatures, fetchTenantFeatures])

    // Filter and search features
    const filteredFeatures = useMemo(() => {
        return allFeatures.filter((feature) => {
            const definition = FEATURE_DEFINITIONS[feature.featureKey]
            const tenantFeature = tenantFeatures.find(
                (tf) => tf.featureId === feature.featureId,
            )

            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase()
                const matchesSearch =
                    feature.featureName.toLowerCase().includes(searchLower) ||
                    feature.featureKey.toLowerCase().includes(searchLower) ||
                    feature.description?.toLowerCase().includes(searchLower) ||
                    definition?.description?.toLowerCase().includes(searchLower)

                if (!matchesSearch) return false
            }

            // Category filter
            if (categoryFilter !== 'all') {
                const category = definition?.category || 'free'
                if (category !== categoryFilter) return false
            }

            // Status filter
            if (statusFilter !== 'all') {
                const isEnabled =
                    tenantFeature?.isEnabled ||
                    FREE_FEATURES.includes(feature.featureKey as any)
                if (statusFilter === 'enabled' && !isEnabled) return false
                if (statusFilter === 'disabled' && isEnabled) return false
            }

            return true
        })
    }, [allFeatures, tenantFeatures, searchTerm, categoryFilter, statusFilter])

    const handleToggleFeature = async (
        featureId: string,
        enabled: boolean,
        reason?: string,
    ) => {
        if (!tenantId) return

        try {
            if (enabled) {
                await enableTenantFeature(tenantId, featureId, reason)
                setSuccessMessage('Feature enabled successfully')
            } else {
                await disableTenantFeature(tenantId, featureId, reason)
                setSuccessMessage('Feature disabled successfully')
            }

            // Auto-dismiss success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (error) {
            console.error('Error toggling feature:', error)
        }
    }

    // Stats
    const stats = useMemo(() => {
        const enabled =
            tenantFeatures.filter((tf) => tf.isEnabled).length +
            FREE_FEATURES.length
        const total = allFeatures.length
        const paid = allFeatures.filter(
            (f) => FEATURE_DEFINITIONS[f.featureKey]?.category === 'paid',
        ).length
        const free = allFeatures.filter(
            (f) => FEATURE_DEFINITIONS[f.featureKey]?.category === 'free',
        ).length

        return { enabled, total, paid, free }
    }, [allFeatures, tenantFeatures])

    if (!tenantId) {
        return (
            <div className="p-6">
                <ErrorAlert message="Tenant ID is required" />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Feature Management
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage feature access for tenant:{' '}
                            <span className="font-semibold">{tenantId}</span>
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => navigate('/admin/tenants')}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Back to Tenants
                        </button>
                        <button
                            onClick={() => {
                                fetchAllFeatures()
                                fetchTenantFeatures(tenantId)
                            }}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && <ErrorAlert message={error} onDismiss={clearError} />}
            {successMessage && (
                <SuccessAlert
                    message={successMessage}
                    onDismiss={() => setSuccessMessage('')}
                />
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">
                        {stats.enabled}
                    </div>
                    <div className="text-sm text-gray-600">
                        Enabled Features
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900">
                        {stats.total}
                    </div>
                    <div className="text-sm text-gray-600">Total Features</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-yellow-600">
                        {stats.paid}
                    </div>
                    <div className="text-sm text-gray-600">Paid Features</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">
                        {stats.free}
                    </div>
                    <div className="text-sm text-gray-600">Free Features</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search Features
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name or description..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={(e) =>
                                setCategoryFilter(e.target.value as any)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Categories</option>
                            <option value="free">Free</option>
                            <option value="paid">Paid</option>
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
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                setCategoryFilter('all')
                                setStatusFilter('all')
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Features List */}
            {isLoading && <LoadingSpinner />}

            {!isLoading && (
                <div className="space-y-3">
                    {filteredFeatures.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No features found matching your criteria.
                        </div>
                    ) : (
                        filteredFeatures.map((feature) => {
                            const tenantFeature = tenantFeatures.find(
                                (tf) => tf.featureId === feature.featureId,
                            )
                            const isFeatureLoading =
                                isEnablingFeature(
                                    tenantId,
                                    feature.featureId,
                                ) ||
                                isDisablingFeature(tenantId, feature.featureId)

                            return (
                                <FeatureToggle
                                    key={feature.featureId}
                                    feature={feature}
                                    tenantFeature={tenantFeature}
                                    onToggle={handleToggleFeature}
                                    isLoading={isFeatureLoading}
                                />
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}

export default TenantFeatureManagement

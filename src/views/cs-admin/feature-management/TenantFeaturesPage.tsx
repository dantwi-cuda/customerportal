import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import {
    HiUsers,
    HiCog,
    HiRefresh,
    HiExclamationCircle,
    HiSwitchHorizontal,
} from 'react-icons/hi'
import { useFeatures, useTenantFeatures } from '@/store/featureManagementStore'
import { TenantSelector, FeatureAssignmentMatrix } from './components'
import type {
    FeatureResponse,
    TenantFeatureResponse,
} from '@/@types/featureManagement'

const TenantFeaturesPage = () => {
    const navigate = useNavigate()
    const { features, fetchFeatures } = useFeatures()
    const { tenantFeatures, loading, fetchTenantFeatures } = useTenantFeatures()

    const [selectedTenantId, setSelectedTenantId] = useState<number | null>(
        null,
    )
    const [stats, setStats] = useState({
        totalAssignments: 0,
        enabledFeatures: 0,
        availableFeatures: 0,
    })

    useEffect(() => {
        fetchFeatures()
    }, [fetchFeatures])

    useEffect(() => {
        if (selectedTenantId) {
            fetchTenantFeatures(selectedTenantId)
        }
    }, [selectedTenantId, fetchTenantFeatures])

    useEffect(() => {
        // Calculate stats for selected tenant
        if (selectedTenantId) {
            const tenantFeatureList = tenantFeatures[selectedTenantId] || []
            const enabledFeatures = tenantFeatureList.filter(
                (tf: TenantFeatureResponse) => tf.enabledAt,
            ).length

            setStats({
                totalAssignments: tenantFeatureList.length,
                enabledFeatures,
                availableFeatures: features.filter(
                    (f: FeatureResponse) => f.isActive,
                ).length,
            })
        } else {
            setStats({
                totalAssignments: 0,
                enabledFeatures: 0,
                availableFeatures: features.filter(
                    (f: FeatureResponse) => f.isActive,
                ).length,
            })
        }
    }, [selectedTenantId, tenantFeatures, features])

    const handleTenantSelect = (tenantId: number) => {
        setSelectedTenantId(tenantId)
    }

    const handleAssignmentChange = (featureId: number, enabled: boolean) => {
        console.log('Assignment changed:', {
            featureId,
            enabled,
            tenantId: selectedTenantId,
        })
        // The FeatureAssignmentMatrix component will handle the actual API calls
    }

    const handleRefresh = () => {
        fetchFeatures()
        if (selectedTenantId) {
            fetchTenantFeatures(selectedTenantId)
        }
    }

    const currentTenantFeatures = selectedTenantId
        ? tenantFeatures[selectedTenantId] || []
        : []

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Tenant Feature Assignments
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage feature assignments for specific tenants and
                        customers
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="plain"
                        icon={<HiRefresh />}
                        onClick={handleRefresh}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="plain"
                        icon={<HiCog />}
                        onClick={() =>
                            navigate('/tenantportal/cs-admin/features')
                        }
                    >
                        Manage Features
                    </Button>
                </div>
            </div>

            {/* Developer Warning Banner */}
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
                <div className="p-4 flex items-start gap-3">
                    <HiExclamationCircle className="text-amber-500 text-xl mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Tenant Feature Assignment Requirements
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            Feature assignments affect tenant application
                            behavior. Changes require careful testing and may
                            need development team coordination for proper
                            implementation.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Stats Row */}
            {selectedTenantId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <div className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                {stats.availableFeatures}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Available Features
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                                {stats.enabledFeatures}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Enabled Features
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                                {stats.totalAssignments}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Total Assignments
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Tenant Selector */}
                <Card className="xl:col-span-1">
                    <TenantSelector
                        selectedTenantId={selectedTenantId}
                        onTenantSelect={handleTenantSelect}
                        loading={loading}
                    />
                </Card>

                {/* Feature Assignment Matrix */}
                <Card className="xl:col-span-2">
                    {selectedTenantId ? (
                        <FeatureAssignmentMatrix
                            tenantId={selectedTenantId}
                            onAssignmentChange={handleAssignmentChange}
                        />
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <HiUsers className="text-4xl mx-auto mb-3 text-gray-400" />
                            <h3 className="text-lg font-medium mb-2">
                                Select a Tenant
                            </h3>
                            <p className="text-sm mb-4">
                                Choose a tenant from the sidebar to view and
                                manage their feature assignments
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                <HiSwitchHorizontal />
                                <span>
                                    Select tenant → Configure features → Save
                                    changes
                                </span>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Feature Assignment Summary */}
            {selectedTenantId && currentTenantFeatures.length > 0 && (
                <Card>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Assignment Summary
                        </h2>

                        <div className="space-y-3">
                            {currentTenantFeatures.map(
                                (tenantFeature: TenantFeatureResponse) => {
                                    const feature = features.find(
                                        (f: FeatureResponse) =>
                                            f.featureId ===
                                            tenantFeature.featureId,
                                    )
                                    if (!feature) return null

                                    return (
                                        <div
                                            key={tenantFeature.featureId}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                        {feature.featureName}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {feature.featureKey}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Badge
                                                    className={
                                                        tenantFeature.enabledAt
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                    }
                                                >
                                                    {tenantFeature.enabledAt
                                                        ? 'Enabled'
                                                        : 'Disabled'}
                                                </Badge>

                                                {tenantFeature.enabledAt && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Since:{' '}
                                                        {new Date(
                                                            tenantFeature.enabledAt,
                                                        ).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                },
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Help Section */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20">
                <div className="p-4">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        How Feature Assignments Work
                    </h3>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <p>
                            • <strong>Select a tenant</strong> from the sidebar
                            to view their current feature assignments
                        </p>
                        <p>
                            • <strong>Toggle features</strong> on or off using
                            the assignment matrix switches
                        </p>
                        <p>
                            • <strong>Bulk operations</strong> allow you to
                            enable/disable multiple features at once
                        </p>
                        <p>
                            • <strong>Save changes</strong> to apply the new
                            feature configuration to the tenant
                        </p>
                        <p>
                            • <strong>Assignment history</strong> is tracked for
                            auditing and rollback purposes
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default TenantFeaturesPage

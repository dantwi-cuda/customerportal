import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import {
    HiPlus,
    HiCog,
    HiUsers,
    HiCollection,
    HiChartBar,
    HiExclamationCircle,
} from 'react-icons/hi'
import {
    useFeatures,
    useTenantFeatures,
    useFeatureManagementUI,
} from '@/store/featureManagementStore'
import { FeatureCard } from './components'
import type { FeatureResponse } from '@/@types/featureManagement'

const FeatureManagementDashboard = () => {
    const navigate = useNavigate()
    const { features, loading: featuresLoading, fetchFeatures } = useFeatures()
    const { tenantFeatures } = useTenantFeatures()
    const { selectedFeatures } = useFeatureManagementUI()

    const [stats, setStats] = useState({
        totalFeatures: 0,
        activeFeatures: 0,
        inactiveFeatures: 0,
        systemFeatures: 0,
        totalTenants: 0,
        tenantsWithFeatures: 0,
    })

    useEffect(() => {
        fetchFeatures()
    }, [fetchFeatures])

    useEffect(() => {
        // Calculate stats
        const totalFeatures = features.length
        const activeFeatures = features.filter(
            (f: FeatureResponse) => f.isActive,
        ).length
        const inactiveFeatures = totalFeatures - activeFeatures

        // Count tenants with features assigned
        const totalTenants = Object.keys(tenantFeatures).length
        const tenantsWithFeatures = Object.values(tenantFeatures).filter(
            (tenantFeatureList: any) => tenantFeatureList.length > 0,
        ).length

        setStats({
            totalFeatures,
            activeFeatures,
            inactiveFeatures,
            systemFeatures: 0, // This would need to be calculated based on feature type
            totalTenants,
            tenantsWithFeatures,
        })
    }, [features, tenantFeatures])

    const recentFeatures = features
        .sort(
            (a: FeatureResponse, b: FeatureResponse) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
        )
        .slice(0, 6)

    const handleCreateFeature = () => {
        // Show developer implementation warning
        alert(
            '⚠️ DEVELOPER IMPLEMENTATION WARNING ⚠️\n\n' +
                'Creating new features requires careful consideration of:\n' +
                '• Database schema updates\n' +
                '• Application code changes\n' +
                '• Permission system integration\n' +
                '• Testing across all tenant environments\n\n' +
                'Please coordinate with the development team before proceeding.',
        )
        navigate('/tenantportal/cs-admin/features/new')
    }

    if (featuresLoading && features.length === 0) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <Spinner size="lg" className="mx-auto mb-4" />
                    <div className="text-gray-500">
                        Loading feature management dashboard...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Feature Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage application features and tenant assignments
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="solid"
                        color="blue"
                        icon={<HiPlus />}
                        onClick={handleCreateFeature}
                    >
                        Create Feature
                    </Button>
                    <Button
                        variant="plain"
                        icon={<HiCog />}
                        onClick={() =>
                            navigate('/tenantportal/cs-admin/features')
                        }
                    >
                        All Features
                    </Button>
                </div>
            </div>

            {/* Developer Warning Banner */}
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
                <div className="p-4 flex items-start gap-3">
                    <HiExclamationCircle className="text-amber-500 text-xl mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Development Integration Required
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            Feature management changes require coordination with
                            development team for proper implementation, testing,
                            and deployment across tenant environments.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                            {stats.totalFeatures}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total Features
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                            {stats.activeFeatures}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Active Features
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-500 dark:text-gray-400 mb-1">
                            {stats.inactiveFeatures}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Inactive Features
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                            {stats.totalTenants}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total Tenants
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                            {stats.tenantsWithFeatures}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Configured Tenants
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="p-4 text-center">
                        <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-1">
                            {selectedFeatures.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Selected Features
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <div
                        className="p-6 text-center"
                        onClick={() =>
                            navigate('/tenantportal/cs-admin/features')
                        }
                    >
                        <HiCollection className="text-4xl text-blue-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Manage All Features
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            View, edit, and organize all application features
                        </p>
                    </div>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <div
                        className="p-6 text-center"
                        onClick={() =>
                            navigate('/tenantportal/cs-admin/tenant-features')
                        }
                    >
                        <HiUsers className="text-4xl text-green-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Tenant Assignments
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Assign features to specific tenants and manage
                            access
                        </p>
                    </div>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <div
                        className="p-6 text-center"
                        onClick={() =>
                            navigate('/tenantportal/cs-admin/feature-analytics')
                        }
                    >
                        <HiChartBar className="text-4xl text-purple-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Usage Analytics
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            View feature usage statistics and adoption rates
                        </p>
                    </div>
                </Card>
            </div>

            {/* Recent Features */}
            <Card>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Recent Features
                        </h2>
                        <Button
                            variant="plain"
                            size="sm"
                            onClick={() =>
                                navigate('/tenantportal/cs-admin/features')
                            }
                        >
                            View All
                        </Button>
                    </div>

                    {recentFeatures.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentFeatures.map((feature: FeatureResponse) => (
                                <FeatureCard
                                    key={feature.featureId}
                                    feature={feature}
                                    onEdit={(f) =>
                                        navigate(
                                            `/tenantportal/cs-admin/features/${f.featureId}/edit`,
                                        )
                                    }
                                    onDelete={(f) =>
                                        console.log(
                                            'Delete feature:',
                                            f.featureId,
                                        )
                                    }
                                    onToggleStatus={(f: FeatureResponse) =>
                                        console.log(
                                            'Toggle active:',
                                            f.featureId,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <HiCollection className="text-4xl mx-auto mb-3 text-gray-400" />
                            <p className="text-lg mb-2">
                                No features created yet
                            </p>
                            <p className="text-sm mb-4">
                                Get started by creating your first feature
                            </p>
                            <Button
                                variant="solid"
                                color="blue"
                                icon={<HiPlus />}
                                onClick={handleCreateFeature}
                            >
                                Create First Feature
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Feature Categories */}
            {features.length > 0 && (
                <Card>
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                            Feature Categories
                        </h2>

                        <div className="flex flex-wrap gap-2">
                            {Array.from(
                                new Set(
                                    features.map(
                                        (f: FeatureResponse) => f.category,
                                    ),
                                ),
                            )
                                .filter(Boolean)
                                .map((category: string) => {
                                    const count = features.filter(
                                        (f: FeatureResponse) =>
                                            f.category === category,
                                    ).length
                                    return (
                                        <Badge
                                            key={category}
                                            className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                                        >
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/tenantportal/cs-admin/features?category=${encodeURIComponent(category)}`,
                                                    )
                                                }
                                                className="hover:underline"
                                            >
                                                {category} ({count})
                                            </button>
                                        </Badge>
                                    )
                                })}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    )
}

export default FeatureManagementDashboard

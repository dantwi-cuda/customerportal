import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Checkbox from '@/components/ui/Checkbox'
import Spinner from '@/components/ui/Spinner'
import { HiCheck, HiX, HiRefresh, HiSave } from 'react-icons/hi'
import { useFeatures, useTenantFeatures } from '@/store/featureManagementStore'
import type {
    FeatureAssignmentMatrixProps,
    FeatureResponse,
    TenantFeatureResponse,
} from '@/@types/featureManagement'

const FeatureAssignmentMatrix = ({
    tenantId,
    onAssignmentChange,
    className = '',
}: FeatureAssignmentMatrixProps) => {
    const { features, loading: featuresLoading, fetchFeatures } = useFeatures()
    const {
        tenantFeatures,
        loading: tenantFeaturesLoading,
        fetchTenantFeatures,
        bulkUpdate,
    } = useTenantFeatures()

    const loading = featuresLoading || tenantFeaturesLoading

    const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
        new Set(),
    )
    const [hasChanges, setHasChanges] = useState(false)
    const [saving, setSaving] = useState(false)
    const [assignmentMatrix, setAssignmentMatrix] = useState<
        Map<string, boolean>
    >(new Map())

    useEffect(() => {
        if (tenantId) {
            fetchFeatures()
            fetchTenantFeatures(tenantId)
        }
    }, [tenantId, fetchFeatures, fetchTenantFeatures])

    useEffect(() => {
        // Initialize matrix with current tenant feature assignments
        const matrix = new Map<string, boolean>()
        features.forEach((feature: FeatureResponse) => {
            const currentTenantFeatures = tenantId
                ? tenantFeatures[tenantId]
                : []
            const tenantFeature = currentTenantFeatures?.find(
                (tf: TenantFeatureResponse) =>
                    tf.featureId === feature.featureId,
            )
            matrix.set(feature.featureId, !!tenantFeature?.enabledAt)
        })
        setAssignmentMatrix(matrix)
    }, [features, tenantFeatures, tenantId])

    const handleFeatureToggle = (featureId: string, enabled: boolean) => {
        const newMatrix = new Map(assignmentMatrix)
        newMatrix.set(featureId, enabled)
        setAssignmentMatrix(newMatrix)
        setHasChanges(true)

        if (onAssignmentChange) {
            const featureIdNum = parseInt(featureId) || 0
            onAssignmentChange(featureIdNum, enabled)
        }
    }

    const handleBulkToggle = (featureIds: string[], enabled: boolean) => {
        const newMatrix = new Map(assignmentMatrix)
        featureIds.forEach((id) => {
            newMatrix.set(id, enabled)
        })
        setAssignmentMatrix(newMatrix)
        setHasChanges(true)
    }

    const handleSelectAll = (checked: boolean) => {
        const visibleFeatureIds = features
            .filter((f: FeatureResponse) => f.isActive)
            .map((f) => f.featureId)
        if (checked) {
            setSelectedFeatures(new Set(visibleFeatureIds))
        } else {
            setSelectedFeatures(new Set())
        }
    }

    const handleFeatureSelect = (featureId: string, checked: boolean) => {
        const newSelection = new Set(selectedFeatures)
        if (checked) {
            newSelection.add(featureId)
        } else {
            newSelection.delete(featureId)
        }
        setSelectedFeatures(newSelection)
    }

    const handleBulkEnable = () => {
        handleBulkToggle(Array.from(selectedFeatures), true)
    }

    const handleBulkDisable = () => {
        handleBulkToggle(Array.from(selectedFeatures), false)
    }

    const handleSaveChanges = async () => {
        if (!tenantId) return

        setSaving(true)
        try {
            const request = {
                featureUpdates: Array.from(assignmentMatrix.entries()).map(
                    ([featureId, enabled]) => ({
                        featureId,
                        isEnabled: enabled,
                    }),
                ),
            }

            await bulkUpdate(tenantId, request)
            setHasChanges(false)
            setSelectedFeatures(new Set())
        } catch (error) {
            console.error('Error saving changes:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleRefresh = () => {
        if (tenantId) {
            fetchFeatures()
            fetchTenantFeatures(tenantId)
            setHasChanges(false)
            setSelectedFeatures(new Set())
        }
    }

    const groupedFeatures = features.reduce(
        (
            groups: Record<string, FeatureResponse[]>,
            feature: FeatureResponse,
        ) => {
            const category = feature.category || 'General'
            if (!groups[category]) {
                groups[category] = []
            }
            groups[category].push(feature)
            return groups
        },
        {},
    )

    const activeFeatures = features.filter((f: FeatureResponse) => f.isActive)
    const selectedCount = selectedFeatures.size
    const allSelected =
        activeFeatures.length > 0 && selectedCount === activeFeatures.length
    const someSelected =
        selectedCount > 0 && selectedCount < activeFeatures.length

    if (loading && features.length === 0) {
        return (
            <Card className={className}>
                <div className="p-8 text-center">
                    <Spinner size="lg" className="mx-auto mb-4" />
                    <div>Loading feature assignments...</div>
                </div>
            </Card>
        )
    }

    if (!tenantId) {
        return (
            <Card className={className}>
                <div className="p-8 text-center text-gray-500">
                    Select a tenant to manage feature assignments
                </div>
            </Card>
        )
    }

    return (
        <Card className={className}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Feature Assignment Matrix
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Manage feature assignments for the selected tenant
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="plain"
                            size="sm"
                            icon={<HiRefresh />}
                            onClick={handleRefresh}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        {hasChanges && (
                            <Button
                                variant="solid"
                                size="sm"
                                icon={<HiSave />}
                                onClick={handleSaveChanges}
                                loading={saving}
                            >
                                Save Changes
                            </Button>
                        )}
                    </div>
                </div>

                {/* Bulk Actions */}
                {activeFeatures.length > 0 && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={allSelected}
                                onChange={handleSelectAll}
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {selectedCount > 0
                                    ? `${selectedCount} selected`
                                    : 'Select all'}
                            </span>
                        </div>

                        {selectedCount > 0 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="solid"
                                    color="emerald"
                                    icon={<HiCheck />}
                                    onClick={handleBulkEnable}
                                >
                                    Enable Selected
                                </Button>
                                <Button
                                    size="sm"
                                    variant="plain"
                                    icon={<HiX />}
                                    onClick={handleBulkDisable}
                                >
                                    Disable Selected
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Feature Matrix */}
            <div className="p-6">
                {Object.entries(groupedFeatures).map(
                    ([category, categoryFeatures]) => (
                        <div key={category} className="mb-8 last:mb-0">
                            <div className="flex items-center gap-2 mb-4">
                                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                                    {category}
                                </h4>
                                <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    {categoryFeatures.length} features
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                {categoryFeatures.map(
                                    (feature: FeatureResponse) => {
                                        const isAssigned =
                                            assignmentMatrix.get(
                                                feature.featureId,
                                            ) || false
                                        const isSelected = selectedFeatures.has(
                                            feature.featureId,
                                        )

                                        return (
                                            <div
                                                key={feature.featureId}
                                                className={`p-4 border rounded-lg transition-all duration-200 ${
                                                    isSelected
                                                        ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                                                        : 'border-gray-200 dark:border-gray-700'
                                                } ${
                                                    !feature.isActive
                                                        ? 'opacity-50 bg-gray-50 dark:bg-gray-800'
                                                        : 'bg-white dark:bg-gray-800'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={(
                                                                checked,
                                                            ) =>
                                                                handleFeatureSelect(
                                                                    feature.featureId,
                                                                    checked,
                                                                )
                                                            }
                                                            disabled={
                                                                !feature.isActive
                                                            }
                                                        />

                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h5 className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {
                                                                        feature.featureName
                                                                    }
                                                                </h5>
                                                                <Badge
                                                                    className={`text-xs ${
                                                                        feature.isActive
                                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                                    }`}
                                                                >
                                                                    {feature.isActive
                                                                        ? 'Active'
                                                                        : 'Inactive'}
                                                                </Badge>
                                                            </div>
                                                            {feature.description && (
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {
                                                                        feature.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {isAssigned
                                                                ? 'Enabled'
                                                                : 'Disabled'}
                                                        </span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    isAssigned
                                                                }
                                                                onChange={(e) =>
                                                                    handleFeatureToggle(
                                                                        feature.featureId,
                                                                        e.target
                                                                            .checked,
                                                                    )
                                                                }
                                                                disabled={
                                                                    !feature.isActive
                                                                }
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    },
                                )}
                            </div>
                        </div>
                    ),
                )}

                {features.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg mb-2">No features available</p>
                        <p className="text-sm">
                            Features will appear here once they are created.
                        </p>
                    </div>
                )}
            </div>

            {/* Changes Indicator */}
            {hasChanges && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                You have unsaved changes
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="plain"
                                onClick={handleRefresh}
                            >
                                Discard
                            </Button>
                            <Button
                                size="sm"
                                variant="solid"
                                color="amber"
                                icon={<HiSave />}
                                onClick={handleSaveChanges}
                                loading={saving}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}

export default FeatureAssignmentMatrix

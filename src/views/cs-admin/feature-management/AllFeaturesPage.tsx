import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import {
    HiPlus,
    HiSearch,
    HiFilter,
    HiDownload,
    HiRefresh,
    HiExclamationCircle,
    HiViewGrid,
    HiViewList,
} from 'react-icons/hi'
import {
    useFeatures,
    useFeatureManagementUI,
} from '@/store/featureManagementStore'
import { FeatureCard, FeatureTable } from './components'
import type { FeatureResponse } from '@/@types/featureManagement'

type ViewMode = 'grid' | 'table'

const AllFeaturesPage = () => {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const { features, loading, fetchFeatures } = useFeatures()
    const {
        searchQuery,
        filters,
        setSearchQuery,
        setFilters,
        selectedFeatures,
        clearFeatureSelection,
    } = useFeatureManagementUI()

    const [viewMode, setViewMode] = useState<ViewMode>('table')

    // Initialize from URL params
    useEffect(() => {
        const category = searchParams.get('category')
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        if (category || status || search) {
            setFilters({
                ...filters,
                category: category || undefined,
                isActive:
                    status === 'active'
                        ? true
                        : status === 'inactive'
                          ? false
                          : undefined,
            })

            if (search) {
                setSearchQuery(search)
            }
        }

        fetchFeatures()
    }, [])

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()

        if (searchQuery) params.set('search', searchQuery)
        if (filters.category) params.set('category', filters.category)
        if (filters.isActive !== undefined) {
            params.set('status', filters.isActive ? 'active' : 'inactive')
        }

        setSearchParams(params, { replace: true })
    }, [searchQuery, filters, setSearchParams])

    // Filter and search features
    const filteredFeatures = useMemo(() => {
        return features.filter((feature: FeatureResponse) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                if (
                    !feature.featureName.toLowerCase().includes(query) &&
                    !feature.featureKey.toLowerCase().includes(query) &&
                    !feature.description.toLowerCase().includes(query) &&
                    !feature.category.toLowerCase().includes(query)
                ) {
                    return false
                }
            }

            // Category filter
            if (filters.category && feature.category !== filters.category) {
                return false
            }

            // Status filter
            if (
                filters.isActive !== undefined &&
                feature.isActive !== filters.isActive
            ) {
                return false
            }

            return true
        })
    }, [features, searchQuery, filters])

    const categories = useMemo(() => {
        const uniqueCategories = Array.from(
            new Set(features.map((f: FeatureResponse) => f.category)),
        )
        return uniqueCategories.filter(Boolean).sort()
    }, [features])

    const categoryOptions = [
        { value: '', label: 'All Categories' },
        ...categories.map((category) => ({ value: category, label: category })),
    ]

    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'active', label: 'Active Only' },
        { value: 'inactive', label: 'Inactive Only' },
    ]

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

    const handleEditFeature = (feature: FeatureResponse) => {
        navigate(`/tenantportal/cs-admin/features/${feature.featureId}/edit`)
    }

    const handleDeleteFeature = (feature: FeatureResponse) => {
        if (
            confirm(
                `Are you sure you want to delete the feature "${feature.featureName}"? This action cannot be undone.`,
            )
        ) {
            // TODO: Implement delete functionality
            console.log('Delete feature:', feature.featureId)
        }
    }

    const handleToggleStatus = (feature: FeatureResponse) => {
        // TODO: Implement toggle active functionality
        console.log('Toggle active:', feature.featureId)
    }

    const handleBulkDelete = () => {
        if (selectedFeatures.length === 0) return

        if (
            confirm(
                `Are you sure you want to delete ${selectedFeatures.length} selected features? This action cannot be undone.`,
            )
        ) {
            // TODO: Implement bulk delete functionality
            console.log('Bulk delete:', selectedFeatures)
            clearFeatureSelection()
        }
    }

    const handleBulkToggleActive = (active: boolean) => {
        if (selectedFeatures.length === 0) return

        // TODO: Implement bulk toggle active functionality
        console.log('Bulk toggle active:', selectedFeatures, active)
        clearFeatureSelection()
    }

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log(
            'Export features:',
            filteredFeatures.map((f) => f.featureId),
        )
    }

    const selectedCount = selectedFeatures.length

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        All Features
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage and organize all application features
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="plain"
                        icon={<HiRefresh />}
                        onClick={fetchFeatures}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="solid"
                        color="blue"
                        icon={<HiPlus />}
                        onClick={handleCreateFeature}
                    >
                        Create Feature
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
                            Feature changes require development team
                            coordination for implementation, testing, and
                            deployment.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Controls */}
            <Card>
                <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search features by name, key, or description..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    prefix={
                                        <HiSearch className="text-gray-400" />
                                    }
                                />
                            </div>

                            <div className="flex gap-2">
                                <Select
                                    placeholder="Category"
                                    value={categoryOptions.find(
                                        (opt) =>
                                            opt.value ===
                                            (filters.category || ''),
                                    )}
                                    onChange={(option: any) =>
                                        setFilters({
                                            ...filters,
                                            category:
                                                option?.value || undefined,
                                        })
                                    }
                                    options={categoryOptions}
                                    className="min-w-[150px]"
                                />

                                <Select
                                    placeholder="Status"
                                    value={statusOptions.find(
                                        (opt) =>
                                            opt.value ===
                                            (filters.isActive === undefined
                                                ? ''
                                                : filters.isActive
                                                  ? 'active'
                                                  : 'inactive'),
                                    )}
                                    onChange={(option: any) => {
                                        const value = option?.value
                                        setFilters({
                                            ...filters,
                                            isActive:
                                                value === 'active'
                                                    ? true
                                                    : value === 'inactive'
                                                      ? false
                                                      : undefined,
                                        })
                                    }}
                                    options={statusOptions}
                                    className="min-w-[130px]"
                                />
                            </div>
                        </div>

                        {/* View Controls */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <Button
                                    size="sm"
                                    variant={
                                        viewMode === 'table' ? 'solid' : 'plain'
                                    }
                                    icon={<HiViewList />}
                                    onClick={() => setViewMode('table')}
                                    className="h-8 w-8"
                                />
                                <Button
                                    size="sm"
                                    variant={
                                        viewMode === 'grid' ? 'solid' : 'plain'
                                    }
                                    icon={<HiViewGrid />}
                                    onClick={() => setViewMode('grid')}
                                    className="h-8 w-8"
                                />
                            </div>

                            <Button
                                variant="plain"
                                icon={<HiDownload />}
                                onClick={handleExport}
                                disabled={filteredFeatures.length === 0}
                            >
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedCount > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    {selectedCount} feature
                                    {selectedCount !== 1 ? 's' : ''} selected
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        color="emerald"
                                        onClick={() =>
                                            handleBulkToggleActive(true)
                                        }
                                    >
                                        Enable
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        onClick={() =>
                                            handleBulkToggleActive(false)
                                        }
                                    >
                                        Disable
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        onClick={handleBulkDelete}
                                    >
                                        Delete
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        onClick={clearFeatureSelection}
                                    >
                                        Clear Selection
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results Summary */}
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <div>
                            Showing {filteredFeatures.length} of{' '}
                            {features.length} features
                            {searchQuery && ` for "${searchQuery}"`}
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {features.filter((f) => f.isActive).length}{' '}
                                Active
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                {features.filter((f) => !f.isActive).length}{' '}
                                Inactive
                            </Badge>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Content */}
            <Card>
                {loading ? (
                    <div className="p-8 text-center">
                        <Spinner size="lg" className="mx-auto mb-4" />
                        <div className="text-gray-500">Loading features...</div>
                    </div>
                ) : filteredFeatures.length > 0 ? (
                    <div className="p-6">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredFeatures.map(
                                    (feature: FeatureResponse) => (
                                        <FeatureCard
                                            key={feature.featureId}
                                            feature={feature}
                                            onEdit={handleEditFeature}
                                            onDelete={handleDeleteFeature}
                                            onToggleStatus={handleToggleStatus}
                                        />
                                    ),
                                )}
                            </div>
                        ) : (
                            <FeatureTable
                                features={filteredFeatures}
                                onEdit={handleEditFeature}
                                onDelete={handleDeleteFeature}
                            />
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        {searchQuery ||
                        filters.category ||
                        filters.isActive !== undefined ? (
                            <>
                                <HiFilter className="text-4xl mx-auto mb-3 text-gray-400" />
                                <p className="text-lg mb-2">
                                    No features match your filters
                                </p>
                                <p className="text-sm mb-4">
                                    Try adjusting your search criteria
                                </p>
                                <Button
                                    variant="plain"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setFilters({
                                            category: undefined,
                                            isActive: undefined,
                                        })
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </>
                        ) : (
                            <>
                                <HiPlus className="text-4xl mx-auto mb-3 text-gray-400" />
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
                            </>
                        )}
                    </div>
                )}
            </Card>
        </div>
    )
}

export default AllFeaturesPage

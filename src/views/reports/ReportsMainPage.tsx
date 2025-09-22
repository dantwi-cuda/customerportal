import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
    Card,
    Input,
    Spinner,
    Button,
    Select,
    Avatar,
    Tag,
    Notification,
    toast,
    Tooltip,
    Badge,
    Drawer,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlineExternalLink,
    HiOutlineDocumentReport,
    HiOutlineViewGrid,
    HiOutlineViewList,
    HiOutlineStar,
    HiStar,
    HiOutlineFilter,
    HiOutlineRefresh,
    HiOutlineChevronDown,
    HiOutlineChevronRight,
    HiOutlineClock,
} from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import useAuth from '@/auth/useAuth'
import ReportService from '@/services/ReportService'
import ReportCard from './components/ReportCard'
import ReportListItem from './components/ReportListItem'
import type { Report, ReportCategory } from '@/@types/report'
import type { SingleValue } from 'react-select'

type SelectOption = {
    value: string
    label: string
}

type ViewMode = 'grid' | 'list'

type FilterMode = 'all' | 'favorites' | 'recent'

type CategoryState = {
    expanded: boolean
    collapsed: boolean
    visibleCount: number
}

type FavoriteReport = Report & {
    isFavorited: boolean
    favoriteNote?: string
}

const ReportsMainPage: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [reports, setReports] = useState<FavoriteReport[]>([])
    const [categories, setCategories] = useState<ReportCategory[]>([])
    const [favoriteReports, setFavoriteReports] = useState<Set<number>>(
        new Set(),
    )
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [filterMode, setFilterMode] = useState<FilterMode>('all')
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [categoryStates, setCategoryStates] = useState<
        Record<string, CategoryState>
    >({})
    const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<
        string | null
    >(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const INITIAL_VISIBLE_COUNT = 5
    const RECENT_REPORTS_LIMIT = 20

    // Permission checks
    const hasViewAccess = user?.authority?.some((role: string) =>
        [
            'CS-Admin',
            'CS-User',
            'Tenant-Admin',
            'Tenant-User',
            'report.read',
            'report.all',
        ].includes(role),
    )

    const hasEditAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'report.edit'].includes(role),
    )

    useEffect(() => {
        console.log('User object:', user) // Debug log
        console.log('User authority:', user?.authority) // Debug log
        console.log('Has view access:', hasViewAccess) // Debug log

        if (hasViewAccess) {
            loadReports()
            loadCategories()
        } else {
            console.log(
                'No view access - user roles do not match required permissions',
            )
        }
    }, [hasViewAccess])

    const loadReports = async () => {
        try {
            setLoading(true)
            console.log('Loading reports...') // Debug log
            const reportsData = await ReportService.getReportsList()
            console.log('Raw reports data:', reportsData) // Debug log

            // Load favorite reports
            let favoriteIds = new Set<number>()
            try {
                const favReports = await ReportService.getFavoriteReports()
                favoriteIds = new Set(favReports.map((r) => parseInt(r.id)))
                setFavoriteReports(favoriteIds)
            } catch (error) {
                console.log('Error loading favorites:', error)
            }

            // For debugging: temporarily show all reports for CS-Admin
            // Later you can add back filtering based on user permissions
            let filteredReports = reportsData

            if (user?.authority?.includes('CS-Admin')) {
                // CS-Admin can see all reports
                filteredReports = reportsData
            } else if (user?.authority?.includes('Tenant-Admin')) {
                // Tenant-Admin can see all reports for their tenant
                filteredReports = reportsData
            } else {
                // End users only see enabled and approved reports
                filteredReports = reportsData.filter(
                    (report: Report) => report.isEnabled && report.isApproved,
                )
            }

            // Convert to FavoriteReport type
            const reportsWithFavorites: FavoriteReport[] = filteredReports.map(
                (report: Report) => ({
                    ...report,
                    isFavorited: favoriteIds.has(parseInt(report.id)),
                }),
            )

            console.log('Filtered reports:', reportsWithFavorites) // Debug log
            console.log(
                'Number of reports after filtering:',
                reportsWithFavorites.length,
            ) // Debug log

            // Debug: Log category information for each report
            reportsWithFavorites.forEach((report, index) => {
                if (index < 3) {
                    // Only log first 3 reports to avoid spam
                    console.log(`Report ${index + 1} category info:`, {
                        name: report.name,
                        reportCategoryId: report.reportCategoryId,
                        tenantReportCategoryId: report.tenantReportCategoryId,
                        categoryName: report.categoryName,
                    })
                }
            })

            setReports(reportsWithFavorites)
        } catch (error) {
            console.error('Error loading reports:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load reports
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const loadCategories = async () => {
        try {
            const categoriesData = await ReportService.getCategories()
            console.log('Categories loaded:', categoriesData)
            setCategories(categoriesData)
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            await Promise.all([loadReports(), loadCategories()])
            toast.push(
                <Notification title="Success" type="success">
                    Reports refreshed successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Error refreshing reports:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to refresh reports
                </Notification>,
            )
        } finally {
            setRefreshing(false)
        }
    }, [])

    const handleLaunchReport = (report: Report) => {
        // Navigate to report viewer using React Router
        navigate(`/app/reports/${report.id}`)
    }

    const handleReportClick = (report: Report) => {
        handleLaunchReport(report)
    }

    const toggleFavorite = useCallback(async (report: FavoriteReport) => {
        try {
            const reportId = parseInt(report.id)
            if (report.isFavorited) {
                await ReportService.removeFromFavorites(reportId)
                setFavoriteReports((prev) => {
                    const newSet = new Set(prev)
                    newSet.delete(reportId)
                    return newSet
                })
                toast.push(
                    <Notification title="Success" type="success">
                        Removed from favorites
                    </Notification>,
                )
            } else {
                await ReportService.addToFavorites(reportId)
                setFavoriteReports((prev) => new Set(prev).add(reportId))
                toast.push(
                    <Notification title="Success" type="success">
                        Added to favorites
                    </Notification>,
                )
            }

            // Update local state
            setReports((prev) =>
                prev.map((r) =>
                    r.id === report.id
                        ? { ...r, isFavorited: !r.isFavorited }
                        : r,
                ),
            )
        } catch (error) {
            console.error('Error toggling favorite:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to update favorites
                </Notification>,
            )
        }
    }, [])

    const toggleCategoryExpansion = useCallback((categoryName: string) => {
        setCategoryStates((prev) => ({
            ...prev,
            [categoryName]: {
                expanded: prev[categoryName]?.expanded || false,
                collapsed: !prev[categoryName]?.collapsed,
                visibleCount:
                    prev[categoryName]?.visibleCount || INITIAL_VISIBLE_COUNT,
            },
        }))
    }, [])

    const showMoreInCategory = useCallback(
        (categoryName: string, totalCount: number) => {
            setCategoryStates((prev) => ({
                ...prev,
                [categoryName]: {
                    ...prev[categoryName],
                    collapsed: false,
                    expanded: true,
                    visibleCount: totalCount,
                },
            }))
        },
        [],
    )

    const toggleShowMoreInCategory = useCallback((categoryName: string) => {
        setCategoryStates((prev) => ({
            ...prev,
            [categoryName]: {
                ...prev[categoryName],
                collapsed: false,
                expanded: !prev[categoryName]?.expanded,
                visibleCount: prev[categoryName]?.expanded
                    ? INITIAL_VISIBLE_COUNT
                    : prev[categoryName]?.visibleCount || INITIAL_VISIBLE_COUNT,
            },
        }))
    }, [])

    // Filter reports based on search text, category, and filter mode
    const filteredReports = useMemo(() => {
        console.log('Filtering reports:', {
            totalReports: reports.length,
            selectedCategory,
            searchText,
            filterMode,
        })

        let filtered = reports.filter((report) => {
            const searchLower = searchText.toLowerCase()
            const matchesSearch =
                report.name.toLowerCase().includes(searchLower) ||
                (report.description?.toLowerCase() || '').includes(
                    searchLower,
                ) ||
                (report.categoryName?.toLowerCase() || '').includes(searchLower)

            // Debug category matching
            const categoryId =
                report.reportCategoryId || report.tenantReportCategoryId
            const matchesCategory =
                selectedCategory === 'all' ||
                categoryId?.toString() === selectedCategory

            // Debug logging for category filtering
            if (selectedCategory !== 'all') {
                console.log('Category filtering debug:', {
                    reportName: report.name,
                    reportCategoryId: report.reportCategoryId,
                    tenantReportCategoryId: report.tenantReportCategoryId,
                    categoryName: report.categoryName,
                    selectedCategory,
                    categoryIdUsed: categoryId,
                    matchesCategory,
                })
            }

            return matchesSearch && matchesCategory
        })

        // Apply filter mode
        switch (filterMode) {
            case 'favorites':
                filtered = filtered.filter((report) => report.isFavorited)
                break
            case 'recent':
                // Sort by lastAccessed or createdAt, show only recent ones
                filtered = filtered
                    .filter((report) => report.lastAccessed || report.createdAt)
                    .sort((a, b) => {
                        const dateA = new Date(
                            a.lastAccessed || a.createdAt,
                        ).getTime()
                        const dateB = new Date(
                            b.lastAccessed || b.createdAt,
                        ).getTime()
                        return dateB - dateA
                    })
                    .slice(0, RECENT_REPORTS_LIMIT)
                break
            default:
                // 'all' - no additional filtering
                break
        }

        return filtered
    }, [reports, searchText, selectedCategory, filterMode])

    // Group reports by category with visibility controls
    const reportsByCategory = useMemo(() => {
        const grouped: Record<
            string,
            {
                reports: FavoriteReport[]
                totalCount: number
                visibleReports: FavoriteReport[]
            }
        > = {}

        filteredReports.forEach((report) => {
            const categoryName = report.categoryName || 'Uncategorized'
            if (!grouped[categoryName]) {
                grouped[categoryName] = {
                    reports: [],
                    totalCount: 0,
                    visibleReports: [],
                }
            }
            grouped[categoryName].reports.push(report)
        })

        // Apply visibility logic for each category
        Object.keys(grouped).forEach((categoryName) => {
            const categoryState = categoryStates[categoryName]
            const isExpanded = categoryState?.expanded || false
            const visibleCount =
                categoryState?.visibleCount || INITIAL_VISIBLE_COUNT

            grouped[categoryName].totalCount =
                grouped[categoryName].reports.length
            grouped[categoryName].visibleReports = isExpanded
                ? grouped[categoryName].reports.slice(0, visibleCount)
                : grouped[categoryName].reports.slice(0, INITIAL_VISIBLE_COUNT)
        })

        return grouped
    }, [filteredReports, categoryStates])

    const categoryOptions: SelectOption[] = [
        { value: 'all', label: 'All Categories' },
        ...categories.map((cat) => ({
            value: cat.id.toString(),
            label: cat.name,
        })),
    ]

    const getReportIcon = (report: Report) => {
        // Return different icons based on report type or use a default
        return (
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <HiOutlineDocumentReport className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
        )
    }

    if (!hasViewAccess) {
        return (
            <div className="p-4">
                <Card className="text-center p-4">
                    <h4 className="mb-2">Access Denied</h4>
                    <p>
                        You don't have permission to view reports. Please
                        contact your administrator.
                    </p>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size={40} />
            </div>
        )
    }

    return (
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header and Controls Card */}
            <Card>
                <div className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                            <h4 className="mb-1">Reports</h4>
                            <p className="text-gray-600 text-sm">
                                Access and view your organization's reports
                            </p>
                        </div>
                        <Button
                            variant="plain"
                            icon={<HiOutlineRefresh />}
                            onClick={handleRefresh}
                            loading={refreshing}
                            className="w-full sm:w-auto"
                        >
                            Refresh
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {/* Search Input */}
                        <div className="w-full">
                            <Input
                                prefix={<HiOutlineSearch className="text-lg" />}
                                placeholder="Search reports..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="w-full sm:w-auto">
                            <Select
                                placeholder="Filter by category"
                                options={categoryOptions}
                                value={categoryOptions.find(
                                    (opt) => opt.value === selectedCategory,
                                )}
                                onChange={(
                                    option: SingleValue<SelectOption>,
                                ) => {
                                    setSelectedCategory(option?.value || 'all')
                                }}
                                className="w-full"
                            />
                        </div>

                        {/* Filter Mode Chips - Responsive */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant={
                                    filterMode === 'all' ? 'solid' : 'plain'
                                }
                                onClick={() => setFilterMode('all')}
                                className="flex-1 sm:flex-none"
                            >
                                All
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    filterMode === 'favorites'
                                        ? 'solid'
                                        : 'plain'
                                }
                                icon={<HiStar />}
                                onClick={() => setFilterMode('favorites')}
                                className="flex-1 sm:flex-none"
                            >
                                <span className="hidden sm:inline">
                                    Favorites
                                </span>
                                <span className="sm:hidden">Fav</span>
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    filterMode === 'recent' ? 'solid' : 'plain'
                                }
                                icon={<HiOutlineClock />}
                                onClick={() => setFilterMode('recent')}
                                className="flex-1 sm:flex-none"
                            >
                                Recent
                            </Button>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex gap-2 justify-center sm:justify-end">
                            <Button
                                size="sm"
                                variant={
                                    viewMode === 'grid' ? 'solid' : 'plain'
                                }
                                icon={<HiOutlineViewGrid />}
                                onClick={() => setViewMode('grid')}
                                className="flex-1 sm:flex-none"
                            >
                                <span className="hidden sm:inline">Grid</span>
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    viewMode === 'list' ? 'solid' : 'plain'
                                }
                                icon={<HiOutlineViewList />}
                                onClick={() => setViewMode('list')}
                                className="flex-1 sm:flex-none"
                            >
                                <span className="hidden sm:inline">List</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Content Card */}
            <Card>
                {/* Reports Content */}
                {Object.keys(reportsByCategory).length === 0 ? (
                    <div className="text-center p-6 sm:p-8">
                        <HiOutlineDocumentReport className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No reports found
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4">
                            {searchText ||
                            selectedCategory !== 'all' ||
                            filterMode !== 'all'
                                ? 'Try adjusting your search criteria or filters.'
                                : 'No reports are currently available for your access level.'}
                        </p>
                    </div>
                ) : (
                    <div className="p-4 space-y-6 sm:space-y-8">
                        {Object.entries(reportsByCategory).map(
                            ([categoryName, categoryData]) => {
                                const {
                                    reports: allReports,
                                    totalCount,
                                    visibleReports,
                                } = categoryData
                                const categoryState =
                                    categoryStates[categoryName]
                                const isExpanded =
                                    categoryState?.expanded || false
                                const hasMore =
                                    totalCount > INITIAL_VISIBLE_COUNT &&
                                    !isExpanded

                                return (
                                    <div key={categoryName}>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
                                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                                <button
                                                    onClick={() =>
                                                        toggleCategoryExpansion(
                                                            categoryName,
                                                        )
                                                    }
                                                    className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 transition-colors"
                                                >
                                                    {categoryState?.collapsed ? (
                                                        <HiOutlineChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    ) : (
                                                        <HiOutlineChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    )}
                                                    <span className="truncate">
                                                        {categoryName}
                                                    </span>
                                                </button>
                                                <Tag className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                                    {totalCount} report
                                                    {totalCount !== 1
                                                        ? 's'
                                                        : ''}
                                                </Tag>
                                                {!categoryState?.collapsed &&
                                                    hasMore && (
                                                        <button
                                                            onClick={() =>
                                                                showMoreInCategory(
                                                                    categoryName,
                                                                    totalCount,
                                                                )
                                                            }
                                                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                        >
                                                            +{' '}
                                                            {totalCount -
                                                                INITIAL_VISIBLE_COUNT}{' '}
                                                            more
                                                        </button>
                                                    )}
                                            </div>

                                            {!categoryState?.collapsed && (
                                                <Button
                                                    size="sm"
                                                    variant="plain"
                                                    onClick={() => {
                                                        setSelectedCategoryDetail(
                                                            categoryName,
                                                        )
                                                        setDrawerOpen(true)
                                                    }}
                                                    className="self-start sm:self-auto"
                                                >
                                                    View All
                                                </Button>
                                            )}
                                        </div>

                                        {!categoryState?.collapsed && (
                                            <>
                                                {viewMode === 'grid' ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                                        {visibleReports.map(
                                                            (
                                                                report: FavoriteReport,
                                                            ) => (
                                                                <ReportCard
                                                                    key={
                                                                        report.id
                                                                    }
                                                                    report={
                                                                        report
                                                                    }
                                                                    onLaunch={
                                                                        handleReportClick
                                                                    }
                                                                    onToggleFavorite={
                                                                        toggleFavorite
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Card>
                                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                            {visibleReports.map(
                                                                (
                                                                    report: FavoriteReport,
                                                                ) => (
                                                                    <ReportListItem
                                                                        key={
                                                                            report.id
                                                                        }
                                                                        report={
                                                                            report
                                                                        }
                                                                        onLaunch={
                                                                            handleReportClick
                                                                        }
                                                                        onToggleFavorite={
                                                                            toggleFavorite
                                                                        }
                                                                    />
                                                                ),
                                                            )}
                                                        </div>
                                                    </Card>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )
                            },
                        )}
                    </div>
                )}
            </Card>

            {/* Category Detail Drawer */}
            <Drawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={`Reports in ${selectedCategoryDetail}`}
                width={window.innerWidth < 768 ? '100%' : 800}
            >
                {selectedCategoryDetail && (
                    <div className="p-3 sm:p-4">
                        <div className="space-y-3 sm:space-y-4">
                            {reportsByCategory[
                                selectedCategoryDetail
                            ]?.reports.map((report: FavoriteReport) => (
                                <Card key={report.id} className="p-3 sm:p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                        <div className="hidden sm:block">
                                            {getReportIcon(report)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
                                                    {report.name}
                                                </h3>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleFavorite(report)
                                                    }}
                                                    className="text-yellow-500 hover:text-yellow-600 transition-colors flex-shrink-0"
                                                >
                                                    {report.isFavorited ? (
                                                        <HiStar className="w-4 h-4" />
                                                    ) : (
                                                        <HiOutlineStar className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                            {report.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                                    {report.description}
                                                </p>
                                            )}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                                                <span className="truncate">
                                                    Workspace:{' '}
                                                    {report.workspaceName}
                                                </span>
                                                {report.lastAccessed && (
                                                    <span className="truncate">
                                                        Last accessed:{' '}
                                                        {new Date(
                                                            report.lastAccessed,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="solid"
                                            icon={<HiOutlineExternalLink />}
                                            onClick={() =>
                                                handleReportClick(report)
                                            }
                                            className="w-full sm:w-auto"
                                        >
                                            <span className="sm:hidden">
                                                Launch Report
                                            </span>
                                            <span className="hidden sm:inline">
                                                Launch
                                            </span>
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    )
}

export default ReportsMainPage

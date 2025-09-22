import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Loading from '@/components/shared/Loading'
import ReportCard from './components/ReportCard'
import { HiSearch, HiFilter, HiAdjustments } from 'react-icons/hi'
import { toast } from '@/components/ui/toast'
import {
    getReportsList,
    getCategories,
    getWorkspaces,
    pinReport,
    unpinReport,
} from '@/services/ReportService'
import { usePermissionStore } from '@/store/permissionStore'
import { PIN_REPORTS } from '@/constants/report-permissions.constant'
import type { Report, ReportCategory, ReportWorkspace } from '@/@types/report'

const Reports = () => {
    const [reports, setReports] = useState<Report[]>([])
    const [categories, setCategories] = useState<ReportCategory[]>([])
    const [workspaces, setWorkspaces] = useState<ReportWorkspace[]>([])

    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>('')

    const { hasPermission } = usePermissionStore()
    const canPinReports = hasPermission(PIN_REPORTS)

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [reportsData, categoriesData, workspacesData] =
                    await Promise.all([
                        getReportsList(),
                        getCategories(),
                        getWorkspaces(),
                    ])

                setReports(reportsData)
                setCategories(categoriesData)
                setWorkspaces(workspacesData)
            } catch (error) {
                console.error('Failed to fetch reports data', error)
                toast.push({
                    type: 'danger',
                    message: 'Failed to load reports',
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Fetch reports with filters
    const fetchReports = async () => {
        setLoading(true)
        try {
            const filters = {
                search: searchQuery,
                categoryId: selectedCategory,
                workspaceId: selectedWorkspace,
            }

            const data = await getReportsList(filters)
            setReports(data)
        } catch (error) {
            console.error('Failed to fetch filtered reports', error)
            toast.push({
                type: 'danger',
                message: 'Failed to filter reports',
            })
        } finally {
            setLoading(false)
        }
    }

    // Handle filters change
    useEffect(() => {
        // Debounce search to avoid too many API calls
        const timer = setTimeout(() => {
            fetchReports()
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery, selectedCategory, selectedWorkspace])

    const handlePinToggle = async (report: Report) => {
        if (!canPinReports) return

        try {
            if (report.isPinned) {
                await unpinReport(report.id)
                toast.push({
                    type: 'success',
                    message: 'Report unpinned successfully',
                })
            } else {
                await pinReport(report.id)
                toast.push({
                    type: 'success',
                    message: 'Report pinned successfully',
                })
            }

            // Update local state
            setReports((prevReports) =>
                prevReports.map((r) =>
                    r.id === report.id ? { ...r, isPinned: !r.isPinned } : r,
                ),
            )
        } catch (error) {
            console.error('Failed to toggle pin status', error)
            toast.push({
                type: 'danger',
                message: `Failed to ${report.isPinned ? 'unpin' : 'pin'} report`,
            })
        }
    }

    const handleClearFilters = () => {
        setSearchQuery('')
        setSelectedCategory('')
        setSelectedWorkspace('')
    }

    const filteredReports = reports

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h3>Reports</h3>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                        placeholder="Search reports..."
                        prefix={<HiSearch className="text-gray-400" />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="min-w-[240px]"
                    />

                    <div className="flex gap-2">
                        <Select
                            placeholder="All Categories"
                            options={categories.map((cat) => ({
                                value: cat.id,
                                label: cat.name,
                            }))}
                            value={selectedCategory}
                            onChange={(val) => setSelectedCategory(val)}
                            prefix={<HiFilter className="text-gray-400" />}
                        />

                        <Select
                            placeholder="All Workspaces"
                            options={workspaces.map((ws) => ({
                                value: ws.id,
                                label: ws.name,
                            }))}
                            value={selectedWorkspace}
                            onChange={(val) => setSelectedWorkspace(val)}
                            prefix={<HiAdjustments className="text-gray-400" />}
                        />

                        {(searchQuery ||
                            selectedCategory ||
                            selectedWorkspace) && (
                            <Button
                                variant="plain"
                                onClick={handleClearFilters}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loading loading={true} size={50} />
                </div>
            ) : filteredReports.length === 0 ? (
                <Card>
                    <div className="p-6 text-center">
                        <h5 className="mb-2">No reports found</h5>
                        <p className="text-gray-500">
                            Try adjusting your filters or search query
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredReports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onPinToggle={() => handlePinToggle(report)}
                            canPinReports={canPinReports}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Reports

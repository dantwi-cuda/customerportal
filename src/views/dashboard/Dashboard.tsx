import { useState, useEffect, ReactNode } from 'react' // Added ReactNode
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/shared'
import {
    HiOutlineOfficeBuilding,
    HiOutlineCash,
    HiOutlineArrowUp,
    HiOutlineDocumentReport,
} from 'react-icons/hi'
import { getDashboardStats } from '@/services/DashboardService'
import SalesTable from './components/SalesTable'
import SalesMap from './components/SalesMap'
import type { DashboardStats } from '@/@types/dashboard'

// Define props type for StatisticCard
interface StatisticCardProps {
    icon: ReactNode
    label: string
    value: string | number
    growth?: number | null
    loading: boolean
}

const StatisticCard = ({
    icon,
    label,
    value,
    growth,
    loading,
}: StatisticCardProps) => {
    return (
        <Card>
            <div className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-primary-100 text-primary-600">
                    {icon}
                </div>
                <div>
                    <h6 className="text-sm text-gray-500">{label}</h6>
                    {loading ? (
                        <Loading loading={true} /> // Removed size prop, as it's not a direct prop of Loading
                    ) : (
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold">{value}</h4>
                            {growth !== undefined && growth !== null && (
                                <span
                                    className={`text-sm flex items-center ${
                                        growth > 0
                                            ? 'text-emerald-600'
                                            : growth < 0
                                              ? 'text-red-600'
                                              : 'text-gray-500'
                                    }`}
                                >
                                    <HiOutlineArrowUp
                                        className={`${growth < 0 ? 'transform rotate-180' : ''}`}
                                    />
                                    {Math.abs(growth)}%
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null) // Use DashboardStats type
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDashboardStats()
                setStats(data)
            } catch (error) {
                console.error('Failed to fetch dashboard data', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        // Set up refresh interval (hourly)
        const intervalId = setInterval(fetchData, 60 * 60 * 1000)

        return () => clearInterval(intervalId)
    }, [])

    return (
        <div className="space-y-6">
            <h3>Dashboard</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {' '}
                {/* Adjusted to 3 columns */}
                <StatisticCard
                    icon={<HiOutlineOfficeBuilding className="text-xl" />}
                    label="Total Shops"
                    value={stats?.totalShops?.value?.toLocaleString() || 0}
                    growth={stats?.totalShops?.growth}
                    loading={loading}
                />
                <StatisticCard
                    icon={<HiOutlineCash className="text-xl" />}
                    label="Total Revenue"
                    value={
                        stats?.totalRevenue?.value
                            ? `$${stats.totalRevenue.value.toLocaleString()}`
                            : '$0'
                    }
                    growth={stats?.totalRevenue?.growth}
                    loading={loading}
                />
                <StatisticCard
                    icon={<HiOutlineDocumentReport className="text-xl" />}
                    label="Total Reports"
                    value={stats?.totalReports?.value?.toLocaleString() || 0}
                    growth={stats?.totalReports?.growth}
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="p-4">
                        <h5 className="mb-4">Sales by Shop</h5>
                        <SalesTable
                            data={stats?.salesByShop || []}
                            loading={loading}
                        />
                    </div>
                </Card>

                <Card>
                    <div className="p-4">
                        <h5 className="mb-4">Sales Distribution</h5>
                        <div className="h-80">
                            {' '}
                            {/* Ensure map has a defined height */}
                            <SalesMap
                                data={stats?.salesByLocation || []} // Ensure this prop is passed if used by SalesMap
                                loading={loading}
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default Dashboard

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Loading, UserRoleDebugger } from '@/components/shared'
import {
    HiOutlineOfficeBuilding,
    HiOutlineUsers,
    HiOutlineCog,
    HiOutlineDocumentReport,
} from 'react-icons/hi'
import { getTenantPortalStats } from '@/services/AdminService'
import AdminHeader from './components/AdminHeader'
import UsersTable from './components/UsersTable'
import TenantsMap from './components/TenantsMap' // Corrected import path

const StatisticCard = ({ icon, label, value, growth, loading }) => {
    return (
        <Card>
            <div className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-full bg-primary-100 text-primary-600">
                    {icon}
                </div>
                <div>
                    <h6 className="text-sm text-gray-500">{label}</h6>
                    {loading ? (
                        <Loading loading={true} size={30} />
                    ) : (
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold">{value}</h4>
                            {growth && (
                                <span
                                    className={`text-sm flex items-center ${
                                        growth > 0
                                            ? 'text-emerald-600'
                                            : 'text-red-600'
                                    }`}
                                >
                                    {growth > 0 ? '+' : ''}
                                    {growth}%
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

const TenantPortalDashboard = () => {
    const [timeRange, setTimeRange] = useState('monthly')
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const data = await getTenantPortalStats(timeRange)
                setStats(data)
            } catch (error) {
                console.error('Error fetching tenant portal stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [timeRange])

    return (
        <div>
            <AdminHeader
                title="Portal Administration Dashboard"
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatisticCard
                    icon={<HiOutlineOfficeBuilding className="text-2xl" />}
                    label="Active Tenants"
                    value={stats?.tenantCount || 0}
                    growth={stats?.tenantGrowth}
                    loading={loading}
                />
                <StatisticCard
                    icon={<HiOutlineUsers className="text-2xl" />}
                    label="Admin Users"
                    value={stats?.adminCount || 0}
                    growth={stats?.adminGrowth}
                    loading={loading}
                />
                <StatisticCard
                    icon={<HiOutlineUsers className="text-2xl" />}
                    label="Total Users"
                    value={stats?.userCount || 0}
                    growth={stats?.userGrowth}
                    loading={loading}
                />
                <StatisticCard
                    icon={<HiOutlineDocumentReport className="text-2xl" />}
                    label="Portal Activity"
                    value={stats?.activityCount || 0}
                    growth={stats?.activityGrowth}
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <div className="p-4">
                        <h5 className="mb-4">Recent Portal Admins</h5>
                        <UsersTable
                            loading={loading}
                            users={stats?.recentUsers || []}
                        />
                    </div>
                </Card>
                <Card>
                    <div className="p-4">
                        <h5 className="mb-4">Tenant Distribution</h5>
                        <TenantsMap
                            loading={loading}
                            tenants={stats?.tenantDistribution || []}
                        />
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default TenantPortalDashboard

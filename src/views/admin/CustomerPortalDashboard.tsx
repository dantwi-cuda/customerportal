import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Loading } from '@/components/shared'
import {
    HiOutlineOfficeBuilding,
    HiOutlineUserGroup,
    HiOutlineTicket,
    HiOutlineDocumentReport,
} from 'react-icons/hi'
// import { getAdminDashboardStats } from '@/services/AdminService'
import AdminHeader from './components/AdminHeader'
import CustomersTable from '../customers/components/CustomersTable'
import RecentActivityTable from '../components/RecentActivityTable'

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

const CustomerPortalDashboard = () => {
    const [timeRange, setTimeRange] = useState('monthly')
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const data = await getAdminDashboardStats(timeRange)
                setStats(data)
            } catch (error) {
                console.error('Error fetching admin dashboard stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [timeRange])

    return (
        <div>
            <AdminHeader
                title="Admin Dashboard"
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatisticCard
                    icon={<HiOutlineOfficeBuilding className="text-2xl" />}
                    label="Active Customers"
                    value={stats?.customerCount || 0}
                    growth={stats?.customerGrowth}
                    loading={loading}
                />
                <StatisticCard
                    icon={<HiOutlineUserGroup className="text-2xl" />}
                    label="Tenant Users"
                    value={stats?.tenantUserCount || 0}
                    growth={stats?.tenantUserGrowth}
                    loading={loading}
                />
                <StatisticCard
                    icon={<HiOutlineTicket className="text-2xl" />}
                    label="Support Tickets"
                    value={stats?.ticketCount || 0}
                    growth={stats?.ticketGrowth}
                    loading={loading}
                />
                <StatisticCard
                    icon={<HiOutlineDocumentReport className="text-2xl" />}
                    label="Reports Generated"
                    value={stats?.reportCount || 0}
                    growth={stats?.reportGrowth}
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="lg:col-span-2">
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h5>Recent Customers</h5>
                            <a
                                href="/admin/customers"
                                className="text-primary-500 text-sm font-medium"
                            >
                                View All
                            </a>
                        </div>
                        <CustomersTable
                            loading={loading}
                            customers={stats?.recentCustomers || []}
                        />
                    </div>
                </Card>
                <Card>
                    <div className="p-4">
                        <h5 className="mb-4">Customer Status</h5>
                        {loading ? (
                            <Loading loading={true} />
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Active</span>
                                    <span className="font-semibold">
                                        {stats?.customerStatus?.active || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pending</span>
                                    <span className="font-semibold">
                                        {stats?.customerStatus?.pending || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Suspended</span>
                                    <span className="font-semibold">
                                        {stats?.customerStatus?.suspended || 0}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <Card>
                <div className="p-4">
                    <h5 className="mb-4">Recent Activities</h5>
                    <RecentActivityTable
                        loading={loading}
                        activities={stats?.recentActivities || []}
                    />
                </div>
            </Card>
        </div>
    )
}

export default CustomerPortalDashboard

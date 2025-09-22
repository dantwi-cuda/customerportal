import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Input,
    Button,
    Table,
    Skeleton,
    Alert,
    Select,
} from '@/components/ui'
import Chart from '@/components/shared/Chart'
import {
    HiOutlineOfficeBuilding,
    HiOutlineCurrencyDollar,
    HiOutlineClock,
    HiOutlineCalendar,
} from 'react-icons/hi'
import { DatePicker } from '@/components/ui'
import * as ShopStatsService from '@/services/ShopStatsService'
import * as ShopService from '@/services/ShopService'
import type {
    DashboardSummaryDto,
    ShopDashboardStatsDto,
} from '@/services/ShopStatsService'
import type { Shop } from '@/@types/shop'
import useAuth from '@/auth/useAuth'
import ShopLocationMap from '@/components/ShopLocationMap'

const TenantDashboardPage = () => {
    const { user } = useAuth()

    // State management
    const [loading, setLoading] = useState(false)
    const [dashboardSummary, setDashboardSummary] =
        useState<DashboardSummaryDto | null>(null)
    const [dashboardShops, setDashboardShops] = useState<
        ShopDashboardStatsDto[]
    >([])
    const [trendData, setTrendData] = useState<any[]>([])

    // Date range state - default to last 30 days
    const [dateRange, setDateRange] = useState<{
        startDate: Date
        endDate: Date
    }>(() => {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        return { startDate, endDate }
    })

    // Permissions
    const hasViewAccess = user?.authority?.some((role: string) =>
        [
            'CS-Admin',
            'CS-User',
            'Tenant-Admin',
            'Tenant-User',
            'dashboard.view',
        ].includes(role),
    )

    // Reload dashboard data when date range changes
    useEffect(() => {
        if (hasViewAccess && dateRange.startDate && dateRange.endDate) {
            loadDashboardData()
        }
    }, [dateRange, hasViewAccess])

    const loadDashboardData = async () => {
        setLoading(true)
        try {
            const startDate = dateRange.startDate.toISOString()
            const endDate = dateRange.endDate.toISOString()

            const [summaryResponse, shops] = await Promise.all([
                ShopStatsService.getDashboardSummary(startDate, endDate),
                ShopStatsService.getDashboardShops(startDate, endDate),
            ])

            setDashboardSummary(summaryResponse.totals)
            setTrendData(summaryResponse.trendData)
            setDashboardShops(shops)
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Top 10 shop revenue data (ordered by highest revenue)
    const topShopRevenue = useMemo(() => {
        return [...dashboardShops]
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 10)
    }, [dashboardShops])

    // Chart configurations
    const monthlyTrendChartOptions = {
        series: [
            {
                name: 'RO Volume',
                data: trendData?.map((item) => item.totalROs) || [],
            },
        ],
        xAxis: {
            categories:
                trendData?.map((item) => `${item.month}/${item.year}`) || [],
        },
        customOptions: {
            title: {
                text: 'Monthly RO Volume Trends',
            },
            yaxis: {
                title: {
                    text: 'Number of ROs',
                },
            },
        },
    }

    if (!hasViewAccess) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to view the tenant dashboard.
                </Alert>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with Date Range Selector */}
            <Card>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h4 className="mb-1">Tenant Dashboard</h4>
                        <p className="text-gray-600">
                            Overview of shop performance and statistics
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <HiOutlineCalendar className="text-gray-500" />
                            <span className="text-sm font-medium">
                                Date Range:
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={
                                    dateRange.startDate
                                        .toISOString()
                                        .split('T')[0]
                                }
                                onChange={(e) =>
                                    setDateRange((prev) => ({
                                        ...prev,
                                        startDate: new Date(e.target.value),
                                    }))
                                }
                                size="sm"
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                                type="date"
                                value={
                                    dateRange.endDate
                                        .toISOString()
                                        .split('T')[0]
                                }
                                onChange={(e) =>
                                    setDateRange((prev) => ({
                                        ...prev,
                                        endDate: new Date(e.target.value),
                                    }))
                                }
                                size="sm"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Key Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <h6 className="text-gray-600 mb-1">Total Shops</h6>
                            {loading ? (
                                <Skeleton width="60px" height="32px" />
                            ) : (
                                <h3 className="text-2xl font-bold">
                                    {dashboardSummary?.totalShops.toLocaleString() ||
                                        0}
                                </h3>
                            )}
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <HiOutlineOfficeBuilding className="text-blue-600 text-xl" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <h6 className="text-gray-600 mb-1">
                                Total Revenue
                            </h6>
                            {loading ? (
                                <Skeleton width="80px" height="32px" />
                            ) : (
                                <h3 className="text-2xl font-bold">
                                    $
                                    {dashboardSummary?.totalRevenue.toLocaleString() ||
                                        0}
                                </h3>
                            )}
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <HiOutlineCurrencyDollar className="text-green-600 text-xl" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <h6 className="text-gray-600 mb-1">Total ROs</h6>
                            {loading ? (
                                <Skeleton width="70px" height="32px" />
                            ) : (
                                <h3 className="text-2xl font-bold">
                                    {dashboardSummary?.totalROs.toLocaleString() ||
                                        0}
                                </h3>
                            )}
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <HiOutlineClock className="text-orange-600 text-xl" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Shop Revenue Table */}
            <Card>
                <div className="mb-4">
                    <h5>Top 10 Shops by Revenue</h5>
                    <p className="text-gray-600 text-sm">
                        Top 10 shops ordered by highest revenue
                    </p>
                </div>
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, index) => (
                            <Skeleton key={index} height="50px" />
                        ))}
                    </div>
                ) : (
                    <>
                        <Table>
                            <Table.THead>
                                <Table.Tr>
                                    <Table.Th>Shop Name</Table.Th>
                                    <Table.Th>Total Revenue</Table.Th>
                                    <Table.Th>Total ROs</Table.Th>
                                    <Table.Th>Average Order Value</Table.Th>
                                </Table.Tr>
                            </Table.THead>
                            <Table.TBody>
                                {topShopRevenue.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td
                                            colSpan={4}
                                            className="text-center py-8"
                                        >
                                            No shop revenue data found for the
                                            selected date range.
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    topShopRevenue.map((shop) => (
                                        <Table.Tr key={shop.shopId}>
                                            <Table.Td>
                                                <span className="font-medium">
                                                    {shop.shopName}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="font-medium text-green-600">
                                                    $
                                                    {shop.totalRevenue.toLocaleString()}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                <span>{shop.totalROs}</span>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="font-medium text-blue-600">
                                                    $
                                                    {shop.averageROValue.toLocaleString()}
                                                </span>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))
                                )}
                            </Table.TBody>
                        </Table>
                    </>
                )}
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly RO Volume Trends */}
                <Card>
                    <div className="mb-4">
                        <h5>Monthly RO Volume Trends</h5>
                        <p className="text-gray-600 text-sm">
                            RO volume over the last 6 months
                        </p>
                    </div>

                    {loading ? (
                        <Skeleton height="300px" />
                    ) : trendData && trendData.length > 0 ? (
                        <Chart
                            type="line"
                            height={300}
                            series={monthlyTrendChartOptions.series}
                            xAxis={monthlyTrendChartOptions.xAxis}
                            customOptions={
                                monthlyTrendChartOptions.customOptions
                            }
                        />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            No trend data available
                        </div>
                    )}
                </Card>

                {/* Shop Location Map */}
                <Card>
                    <div className="mb-4">
                        <h5>Shop Locations</h5>
                        <p className="text-gray-600 text-sm">
                            Number of shops by state and city
                        </p>
                    </div>
                    {loading ? (
                        <Skeleton height="300px" />
                    ) : dashboardShops.length > 0 ? (
                        <ShopLocationMap data={dashboardShops} />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            No shop location data available
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}

export default TenantDashboardPage

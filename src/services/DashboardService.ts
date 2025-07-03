import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type { DashboardStats, SalesByShop, SalesByLocation, DashboardSummary } from '@/@types/dashboard'

// Add this interface based on swagger.json /api/Dashboard/statistics response
interface DashboardStatisticsDto {
    totalCustomers?: number;
    totalRevenue?: number;
    totalReports?: number;
    totalShops?: number;
    totalUsers?: number;
    revenueGrowth?: number;
    customerGrowth?: number;
    shopGrowth?: number;
    reportGrowth?: number;
    userGrowth?: number;
}

export async function getDashboardSummary(params?: { period?: string }) {
    return ApiService.fetchDataWithAxios<DashboardSummary>({
        url: endpointConfig.dashboard.summary,
        method: 'get',
        params,
    })
}

export async function getSalesByShop(params?: { period?: string, limit?: number }) {
    return ApiService.fetchDataWithAxios<SalesByShop[]>({
        url: endpointConfig.dashboard.salesByShop,
        method: 'get',
        params,
    })
}

export async function getSalesByLocation(params?: { period?: string }) {
    return ApiService.fetchDataWithAxios<SalesByLocation[]>({
        url: endpointConfig.dashboard.salesByLocation,
        method: 'get',
        params,
    })
}

export async function getUserStats(params?: { period?: string }) {
    return ApiService.fetchDataWithAxios<{ count: number, previousCount: number }>({
        url: endpointConfig.dashboard.userStats,
        method: 'get',
        params,
    })
}

// New function to resolve the error
export async function getDashboardStats(): Promise<DashboardStats | null> {
    try {
        const response = await ApiService.fetchDataWithAxios<DashboardStatisticsDto>({
            url: '/api/Dashboard/statistics', // Path from swagger.json
            method: 'get',
        });

        if (response) {
            // Assuming DashboardStats expects an object like:
            // {
            //   totalShops: { value: number; growth: number };
            //   totalRevenue: { value: number; growth: number };
            //   totalReports: { value: number; growth: number };
            // }
            // Multiply growth by 100 to convert from decimal (e.g., 0.05) to percentage (e.g., 5)
            return {
                totalShops: {
                    value: response.totalShops || 0,
                    growth: (response.shopGrowth || 0) * 100,
                },
                totalRevenue: {
                    value: response.totalRevenue || 0,
                    growth: (response.revenueGrowth || 0) * 100,
                },
                totalReports: {
                    value: response.totalReports || 0,
                    growth: (response.reportGrowth || 0) * 100,
                },
                // Add other stats here if the DashboardStats type definition includes them
                // and they are used by the Dashboard.tsx component. For example:
                // totalUsers: {
                //    value: response.totalUsers || 0,
                //    growth: (response.userGrowth || 0) * 100,
                // },
                // totalCustomers: {
                //    value: response.totalCustomers || 0,
                //    growth: (response.customerGrowth || 0) * 100,
                // },
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Depending on error handling strategy, you might want to rethrow the error
        // or return a more specific error object.
        return null;
    }
}
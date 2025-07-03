import ApiService from './ApiService';
import type { AxiosRequestConfig } from 'axios';

// Define minimal DTOs based on swagger.json if not centrally available
// Ideally, these would be imported from a types definition file, e.g., '@/@types/api'
interface UserDtoMinimal {
    id: string;
    // Add other relevant fields if needed by the dashboard beyond just count
}

interface CustomerDtoMinimal {
    id: number;
    // Add other relevant fields if needed
}

export interface RecentActivity {
    id: string;
    date: string; 
    name: string; 
    activity: string; 
    status?: string; 
}

export interface AdminDashboardData {
    totalUsers: number;
    totalTenants: number;
    recentActivities: RecentActivity[];
}

/**
 * Fetches statistics for the Tenant Portal Dashboard.
 */
export async function getTenantPortalStats(): Promise<AdminDashboardData> {
    try {
        // Configuration for fetching users
        const usersConfig: AxiosRequestConfig = {
            url: '/api/User',
            method: 'get',
        };
        const usersResponse = await ApiService.fetchDataWithAxios<UserDtoMinimal[]>(usersConfig);

        // Configuration for fetching tenants
        const tenantsConfig: AxiosRequestConfig = {
            url: '/api/CustomerManagement',
            method: 'get',
        };
        const tenantsResponse = await ApiService.fetchDataWithAxios<CustomerDtoMinimal[]>(tenantsConfig);

        const totalUsers = usersResponse?.length || 0;
        const totalTenants = tenantsResponse?.length || 0;
        
        const recentActivities: RecentActivity[] = [
            { 
                id: '1', 
                date: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                name: 'CS Admin (System)', 
                activity: 'System health check performed.', 
                status: 'Success' 
            },
            { 
                id: '2', 
                date: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
                name: 'TenantUser@example.com', 
                activity: 'Accessed Report "Sales Q3 Summary".', 
                status: 'Viewed' 
            },
            { 
                id: '3', 
                date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
                name: 'TenantAdmin@example.com', 
                activity: 'Updated settings for Tenant Alpha.', 
                status: 'Completed' 
            },
            { 
                id: '4', 
                date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                name: 'CSUser@cci.com', 
                activity: 'Resolved support ticket #12345.', 
                status: 'Resolved'
            },
        ];

        return {
            totalUsers,
            totalTenants,
            recentActivities,
        };
    } catch (error) {
        console.error('Error fetching tenant portal stats:', error);
        return {
            totalUsers: 0,
            totalTenants: 0,
            recentActivities: [],
        };
    }
}

// Other AdminService functions can be added below as needed.
// For example:
// export async function getAllUsers(params?: any): Promise<UserDtoMinimal[]> { ... }
// export async function getAllTenants(params?: any): Promise<CustomerDtoMinimal[]> { ... }

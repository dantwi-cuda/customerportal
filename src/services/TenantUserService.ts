import ApiService from './ApiService'

import type { TenantUser } from '@/@types/user'

// Tenant user management functions
export const getTenantUsers = async (): Promise<TenantUser[]> => {
    try {
        // In a real implementation, this would call the tenant-specific endpoint
        const result = await ApiService.fetchDataWithAxios<TenantUser[]>({
            url: 'api/tenant/users',
            method: 'get'
        })
        return result
    } catch (error) {
        console.error('Failed to fetch tenant users:', error)
        // For demo purposes, return mock data
        return [
            {
                id: '1',
                name: 'John Smith',
                email: 'john.smith@tenant.com',
                role: 'Admin',
                status: 'active',
                lastLogin: '2025-05-15T10:30:00',
                createdAt: '2025-01-10T08:15:22'
            },
            {
                id: '2',
                name: 'Sarah Johnson',
                email: 'sarah.johnson@tenant.com',
                role: 'User',
                status: 'active',
                lastLogin: '2025-05-18T14:22:10',
                createdAt: '2025-01-12T11:30:45'
            },
            {
                id: '3',
                name: 'Michael Chen',
                email: 'michael.chen@tenant.com',
                role: 'Manager',
                status: 'active',
                lastLogin: '2025-05-17T09:05:30',
                createdAt: '2025-02-05T13:45:20'
            },
            {
                id: '4',
                name: 'Emma Davis',
                email: 'emma.davis@tenant.com',
                role: 'User',
                status: 'inactive',
                lastLogin: '2025-04-30T15:10:00',
                createdAt: '2025-02-20T09:30:15'
            },
            {
                id: '5',
                name: 'Alex Rodriguez',
                email: 'alex.rodriguez@tenant.com',
                role: 'User',
                status: 'pending',
                createdAt: '2025-05-18T16:20:00'
            }
        ]
    }
}

export const getTenantUser = async (id: string): Promise<TenantUser> => {
    try {
        // In a real implementation, this would call the tenant-specific endpoint
        const result = await ApiService.fetchDataWithAxios<TenantUser>({
            url: `api/tenant/users/${id}`,
            method: 'get'
        })
        return result
    } catch (error) {
        console.error(`Failed to fetch tenant user with ID ${id}:`, error)
        // For demo purposes, return mock data
        return {
            id,
            name: 'John Smith',
            email: 'john.smith@tenant.com',
            role: 'Admin',
            status: 'active',
            lastLogin: '2025-05-15T10:30:00',
            createdAt: '2025-01-10T08:15:22'
        }
    }
}

export const createTenantUser = async (userData: {
    name: string;
    email: string;
    role: string;
    password: string;
}): Promise<TenantUser> => {
    try {
        // In a real implementation, this would call the tenant-specific endpoint
        const result = await ApiService.fetchDataWithAxios<TenantUser>({
            url: 'api/tenant/users',
            method: 'post',
            data: userData
        })
        return result
    } catch (error) {
        console.error('Failed to create tenant user:', error)
        throw error
    }
}

export const updateTenantUser = async (
    id: string,
    userData: {
        name: string;
        email: string;
        role: string;
        status: string;
    }
): Promise<TenantUser> => {
    try {
        // In a real implementation, this would call the tenant-specific endpoint
        const result = await ApiService.fetchDataWithAxios<TenantUser>({
            url: `api/tenant/users/${id}`,
            method: 'put',
            data: userData
        })
        return result
    } catch (error) {
        console.error(`Failed to update tenant user with ID ${id}:`, error)
        throw error
    }
}

export const deleteTenantUser = async (id: string): Promise<void> => {
    try {
        // In a real implementation, this would call the tenant-specific endpoint
        await ApiService.fetchDataWithAxios({
            url: `api/tenant/users/${id}`,
            method: 'delete'
        })
    } catch (error) {
        console.error(`Failed to delete tenant user with ID ${id}:`, error)
        throw error
    }
}

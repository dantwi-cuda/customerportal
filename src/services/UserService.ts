import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type { UserDto, CreateUserRequest, UpdateUserRequest, UserFilterParams, TenantUser } from '@/@types/user'

const UserService = {
    // Get all users (with optional filters)
    getUsers: async (params?: UserFilterParams): Promise<UserDto[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<UserDto[]>({
                url: `User`,
                method: 'get',
                params,
            })
            console.log('getUsers response:', result)
            return result
        } catch (error) {
            console.error('Failed to fetch users:', error)
            throw error
        }
    },
    
    // Search users with the dedicated search endpoint
    searchUsers: async (searchTerm: string): Promise<UserDto[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<UserDto[]>({
                url: `User/search`,
                method: 'get',
                params: { searchTerm },
            })
            console.log('searchUsers response:', result)
            return result
        } catch (error) {
            console.error('Failed to search users:', error)
            throw error
        }
    },
    
    // Get a single user by ID
    getUser: async (id: string): Promise<UserDto> => {
        console.log(`Fetching user with ID: ${id}`)
        try {
            const result = await ApiService.fetchDataWithAxios<UserDto>({
                url: `User/${id}`,
                method: 'get',
            })
            console.log('User API response:', JSON.stringify(result, null, 2))
            console.log('User roles property type:', typeof result.roles, 'Value:', result.roles)
            
            // Ensure roles is always an array for consistent handling
            if (!result.roles) {
                result.roles = [];
                console.log('Initialized empty roles array for consistency')
            }
            
            return result
        } catch (error) {
            console.error('Error in getUser API call:', error)
            throw error
        }
    },

    // Create a new user
    createUser: async (data: CreateUserRequest): Promise<UserDto> => {
        console.log('Creating user with data:', data)
        try {
            const result = await ApiService.fetchDataWithAxios<UserDto, CreateUserRequest>({
                url: `User`,
                method: 'post',
                data,
            })
            console.log('Create user response:', result)
            return result
        } catch (error) {
            console.error('Failed to create user:', error)
            throw error
        }
    },

    // Update an existing user
    updateUser: async (id: string, data: UpdateUserRequest): Promise<UserDto> => {
        console.log(`Updating user ${id} with data:`, data)
        try {
            const result = await ApiService.fetchDataWithAxios<UserDto, UpdateUserRequest>({
                url: `User/${id}`,
                method: 'put',
                data,
            })
            console.log('Update user response:', result)
            return result
        } catch (error) {
            console.error(`Failed to update user ${id}:`, error)
            throw error
        }
    },

    // Delete a user
    deleteUser: async (id: string): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `User/${id}`,
                method: 'delete',
            })
            console.log(`User ${id} deleted successfully`)
        } catch (error) {
            console.error(`Failed to delete user ${id}:`, error)
            throw error
        }
    },

    // Assign a user to a customer
    assignUserToCustomer: async (userId: string, customerId: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `User/${userId}/customers/${customerId}`,
                method: 'post',
            })
            console.log(`User ${userId} assigned to customer ${customerId}`)
        } catch (error) {
            console.error(`Failed to assign user ${userId} to customer ${customerId}:`, error)
            throw error
        }
    },

    // Remove user from a customer
    removeUserFromCustomer: async (userId: string, customerId: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `User/${userId}/customers/${customerId}`,
                method: 'delete',
            })
            console.log(`User ${userId} removed from customer ${customerId}`)
        } catch (error) {
            console.error(`Failed to remove user ${userId} from customer ${customerId}:`, error)
            throw error
        }
    },

    // Reset a user's password
    resetPassword: async (userId: string, newPassword: string): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `Auth/reset-password/${userId}`,
                method: 'post',
                data: { newPassword },
            })
            console.log(`Password reset for user ${userId}`)
        } catch (error) {
            console.error(`Failed to reset password for user ${userId}:`, error)
            throw error
        }
    },

    // Tenant user management functions
    getTenantUsers: async (): Promise<TenantUser[]> => {
        try {
            // In a real implementation, this would call the tenant-specific endpoint
            const result = await ApiService.fetchDataWithAxios<TenantUser[]>({
                url: `${endpointConfig.customerApi.base}/users`,
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
    },

    getTenantUser: async (id: string): Promise<TenantUser> => {
        try {
            // In a real implementation, this would call the tenant-specific endpoint
            const result = await ApiService.fetchDataWithAxios<TenantUser>({
                url: `${endpointConfig.customerApi.base}/users/${id}`,
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
    },

    createTenantUser: async (userData: {
        name: string;
        email: string;
        role: string;
        password: string;
    }): Promise<TenantUser> => {
        try {
            // In a real implementation, this would call the tenant-specific endpoint
            const result = await ApiService.fetchDataWithAxios<TenantUser>({
                url: `${endpointConfig.customerApi.base}/users`,
                method: 'post',
                data: userData
            })
            return result
        } catch (error) {
            console.error('Failed to create tenant user:', error)
            throw error
        }
    },

    updateTenantUser: async (
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
                url: `${endpointConfig.customerApi.base}/users/${id}`,
                method: 'put',
                data: userData
            })
            return result
        } catch (error) {
            console.error(`Failed to update tenant user with ID ${id}:`, error)
            throw error
        }
    },

    deleteTenantUser: async (id: string): Promise<void> => {
        try {
            // In a real implementation, this would call the tenant-specific endpoint
            await ApiService.fetchDataWithAxios({
                url: `${endpointConfig.customerApi.base}/users/${id}`,
                method: 'delete'
            })
        } catch (error) {
            console.error(`Failed to delete tenant user with ID ${id}:`, error)
            throw error
        }
    }
}

export default UserService
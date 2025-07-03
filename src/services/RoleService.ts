import ApiService from './ApiService'
import type { 
    RoleDto, 
    CreateRoleDto, 
    UpdateRoleDto, 
    UpdateRolePermissionsDto, 
    AssignRoleDto 
} from '@/@types/role'

// Export these functions directly for convenient import
export const assignUsersToRole = async (roleId: string, userIds: string[]): Promise<void> => {
    try {
        console.log(`Assigning ${userIds.length} user(s) to role ${roleId}`)
        // Process each user assignment sequentially
        for (const userId of userIds) {
            await ApiService.fetchDataWithAxios<void, AssignRoleDto>({
                url: `Role/${roleId}/assign-user`,
                method: 'post',
                data: { userId },
            })
        }
        console.log(`${userIds.length} users assigned to role ${roleId}`)
    } catch (error) {
        console.error(`Failed to assign users to role ${roleId}:`, error)
        throw error
    }
}

export const removeUsersFromRole = async (roleId: string, userIds: string[]): Promise<void> => {
    try {
        console.log(`Removing ${userIds.length} user(s) from role ${roleId}`)
        // Process each user removal sequentially
        for (const userId of userIds) {
            await ApiService.fetchDataWithAxios<void, AssignRoleDto>({
                url: `Role/${roleId}/remove-user`,
                method: 'post',
                data: { userId },
            })
        }
        console.log(`${userIds.length} users removed from role ${roleId}`)
    } catch (error) {
        console.error(`Failed to remove users from role ${roleId}:`, error)
        throw error
    }
}

const RoleService = {    // Get all roles
    getRoles: async (params?: { tenantId?: number, type?: 'SYSTEM' | 'TENANT' }): Promise<RoleDto[]> => {
        console.log('Fetching roles with params:', params)
        try {
            const result = await ApiService.fetchDataWithAxios<RoleDto[]>({
                url: `Role`,
                method: 'get',
                params: params, // Pass params to the API call
            })
            console.log('Roles API response:', JSON.stringify(result, null, 2))
            console.log(`Retrieved ${result?.length || 0} roles`)
            return result
        } catch (error) {
            console.error('Error in getRoles API call:', error)
            throw error
        }
    },

    // Get a single role by ID
    getRole: async (id: string, tenantId?: number): Promise<RoleDto> => {
        try {
            // The backend should implicitly handle tenant scoping for TENANT_ADMIN based on their token,
            // or explicitly if tenantId is passed and the user is a CS_ADMIN.
            // For now, we assume the backend handles this or we adjust if direct tenantId query param is needed.
            const result = await ApiService.fetchDataWithAxios<RoleDto>({
                url: `Role/${id}`,
                method: 'get',
                // params: tenantId ? { tenantId } : undefined, // Optional: if API supports explicit tenantId query for getRole
            })
            console.log(`Role ${id} data:`, result)
            return result
        } catch (error) {
            console.error(`Failed to get role ${id}:`, error)
            throw error
        }
    },

    // Create a new role
    createRole: async (data: CreateRoleDto): Promise<RoleDto> => {
        try {
            // Ensure tenantId is set for TENANT roles if not already present
            // This might be handled by the backend based on the authenticated user (TENANT_ADMIN)
            // Or, ensure the frontend (TenantRoleCreateForm) correctly sets it.
            // data.type = data.type || 'TENANT'; // Default to TENANT if not specified, or ensure form does this.
            const result = await ApiService.fetchDataWithAxios<RoleDto, CreateRoleDto>({
                url: `Role`,
                method: 'post',
                data,
            })
            console.log('Created role:', result)
            return result
        } catch (error) {
            console.error('Failed to create role:', error)
            throw error
        }
    },

    // Update an existing role
    updateRole: async (id: string, data: UpdateRoleDto, tenantId?: number): Promise<void> => {
        try {
            // Similar to getRole, tenant scoping should be handled by the backend.
            // Or, pass tenantId if the API requires it for disambiguation by CS_ADMIN.
            await ApiService.fetchDataWithAxios<void, UpdateRoleDto>({
                url: `Role/${id}`,
                method: 'put',
                data,
                // params: tenantId ? { tenantId } : undefined, // Optional: if API supports explicit tenantId query for updateRole
            })
            console.log(`Role ${id} updated successfully`)
        } catch (error) {
            console.error(`Failed to update role ${id}:`, error)
            throw error
        }
    },

    // Delete a role
    deleteRole: async (id: string, tenantId?: number): Promise<void> => {
        try {
            // Tenant scoping by backend or explicit param if needed.
            await ApiService.fetchDataWithAxios<void>({
                url: `Role/${id}`,
                method: 'delete',
                // params: tenantId ? { tenantId } : undefined, // Optional: if API supports explicit tenantId query for deleteRole
            })
            console.log(`Role ${id} deleted`)
        } catch (error) {
            console.error(`Failed to delete role ${id}:`, error)
            throw error
        }
    },

    // Assign a user to a role
    assignUserToRole: async (roleId: string, userId: string): Promise<void> => {
        const data: AssignRoleDto = { userId }
        try {
            await ApiService.fetchDataWithAxios<void, AssignRoleDto>({
                url: `Role/${roleId}/assign-user`,
                method: 'post',
                data,
            })
            console.log(`User ${userId} assigned to role ${roleId}`)
        } catch (error) {
            console.error(`Failed to assign user ${userId} to role ${roleId}:`, error)
            throw error
        }
    },    // Remove a user from a role
    removeUserFromRole: async (roleId: string, userId: string): Promise<void> => {
        const data: AssignRoleDto = { userId }
        try {
            await ApiService.fetchDataWithAxios<void, AssignRoleDto>({
                url: `Role/${roleId}/remove-user`,
                method: 'post',
                data,
            })
            console.log(`User ${userId} removed from role ${roleId}`)
        } catch (error) {
            console.error(`Failed to remove user ${userId} from role ${roleId}:`, error)
            throw error
        }
    },

    // Update role permissions
    updateRolePermissions: async (
        roleId: string,
        permissions: string[]
    ): Promise<void> => {
        const data: UpdateRolePermissionsDto = { permissions }
        try {
            await ApiService.fetchDataWithAxios<void, UpdateRolePermissionsDto>({
                url: `Role/${roleId}/permissions`,
                method: 'put',
                data,
            })
            console.log(`Permissions updated for role ${roleId}`)
        } catch (error) {
            console.error(`Failed to update permissions for role ${roleId}:`, error)
            throw error
        }
    },    // Get all available permissions (system-wide)
    getPermissions: async (): Promise<string[]> => {
        try {
            // Use any type for the result since the API response format is unpredictable
            const result = await ApiService.fetchDataWithAxios<any>({
                url: `Role/permissions`,
                method: 'get',
            })
            console.log('Available permissions response:', result)
            
            // If result is array, return it directly
            if (Array.isArray(result)) {
                return result;
            }
            
            // If result is an object, try to extract permission strings
            if (result && typeof result === 'object') {
                // Check if it's a structure with a data property containing permissions
                if (result.data && Array.isArray(result.data)) {
                    return result.data;
                }
                
                // Check if it's an object with string values that look like permissions
                const stringValues = Object.values(result).filter(val => 
                    typeof val === 'string' && val.includes('.')
                );
                
                if (stringValues.length > 0) {
                    return stringValues as string[];
                }
                
                // Look for any arrays in the object that might contain permissions
                for (const key in result) {
                    if (Array.isArray(result[key])) {
                        const possiblePermissions = result[key].filter(
                            (item: any) => typeof item === 'string' && item.includes('.')
                        );
                        if (possiblePermissions.length > 0) {
                            return possiblePermissions;
                        }
                    }
                }
            }
            
            // If we can't find permissions, return empty array
            console.warn('Could not determine permissions format from API response');
            return [];
        } catch (error) {
            console.error('Failed to get permissions:', error)
            // Instead of throwing, return empty array
            return [];
        }
    },
    
    // Get all permissions for a specific role
    getRolePermissions: async (roleId: string): Promise<string[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<string[]>({
                url: `Role/${roleId}/permissions`,
                method: 'get',
            })
            console.log(`Permissions for role ${roleId}:`, result)
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error(`Failed to get permissions for role ${roleId}:`, error)
            return [];
        }
    },
}

export default RoleService
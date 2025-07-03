export interface Permission {
    id: string
    name: string
    description: string
    category: string
}

export interface Role {
    id: string
    name: string
    description: string
    permissions: string[]
    isDefaultRole: boolean
    permissionsCount?: number
    usersCount: number
}

export interface RoleCreateRequest {
    name: string
    description: string
    permissions: string[]
}

export interface RoleUpdateRequest extends RoleCreateRequest {
}

// Type definitions for role management
export interface RoleDto {
    id: string;
    name: string;
    permissions?: string[]; // These would be permission IDs or keys
    userIds?: string[];
    workspaceIds?: string[];
    tenantId?: number | null;
    description?: string | null;
    type?: 'SYSTEM' | 'TENANT'; // Added type field
}

export interface CreateRoleDto {
    name: string;
    permissions: string[]; // Ensure permissions is not optional
    tenantId?: number | null;
    description?: string | null; // Added description
    type?: 'SYSTEM' | 'TENANT'; // Added type field
}

export interface UpdateRoleDto {
    name?: string;
    description?: string | null; // Added description
    permissions: string[]; // Ensure permissions is not optional
    tenantId?: number | null; // Added tenantId
    type?: 'SYSTEM' | 'TENANT'; // Added type field
}

export interface UpdateRolePermissionsDto {
    permissions: string[];
}

export interface AssignRoleDto {
    userId?: string;
    workspaceId?: string;
}
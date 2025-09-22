// Type definitions for user management
export interface UserDto {
    id?: string;
    email: string;
    name: string;
    status?: string; // String status like "Active" or "Inactive"
    isActive?: boolean; // Boolean isActive to match API
    isCustomerUser: boolean;
    isCCIUser: boolean;
    createdAt?: string;
    lastLoginAt?: string;
    roles?: string[]; // Include roles in user object
    tenantId?: string | number; // Allow both string and number for tenantId
}

export interface CreateUserRequest {
    user: UserDto;
    password: string;
    roles?: string[];
}

export interface UpdateUserRequest {
    user: UserDto;
    roles?: string[];
}

export interface UserFilterParams {
    isCustomerUser?: boolean;
    isCCIUser?: boolean;
    searchTerm?: string;
    tenantId?: number; // Added tenantId
    type?: 'SYSTEM' | 'TENANT'; // Added type
}

// Types for tenant user management
export interface TenantUser {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive' | 'pending';
    lastLogin?: string;
    createdAt?: string;
}
import {
    CS_ADMIN,
    CS_USER,
    TENANT_ADMIN,
    END_USER,
    ADMIN,
    USER
} from '@/constants/roles.constant'

/**
 * Determine the highest level role from a user's role array
 * Returns the role with the highest authority level
 * The order of precedence is:
 * 1. CS_ADMIN / ADMIN (highest)
 * 2. CS_USER / USER
 * 3. TENANT_ADMIN
 * 4. END_USER (lowest)
 */
export const getHighestRole = (roles: string[]): string | null => {
    if (!roles || roles.length === 0) {
        console.log('getRoleLevel: No roles provided');
        return null
    }

    console.log('getRoleLevel: Determining highest role from:', roles);

    if (roles.includes(CS_ADMIN)) {
        console.log('getRoleLevel: Found CS_ADMIN role');
        return CS_ADMIN
    }
    
    if (roles.includes(ADMIN)) {
        console.log('getRoleLevel: Found legacy ADMIN role, mapping to CS_ADMIN');
        return CS_ADMIN
    }
    
    if (roles.includes(CS_USER)) {
        console.log('getRoleLevel: Found CS_USER role');
        return CS_USER
    }
    
    if (roles.includes(USER)) {
        console.log('getRoleLevel: Found legacy USER role, mapping to CS_USER');
        return CS_USER
    }
    
    if (roles.includes(TENANT_ADMIN)) {
        console.log('getRoleLevel: Found TENANT_ADMIN role');
        return TENANT_ADMIN
    }
    
    if (roles.includes(END_USER)) {
        console.log('getRoleLevel: Found END_USER role');
        return END_USER
    }
    
    console.log('getRoleLevel: No recognized role found');
    return null
}

/**
 * Check if the user has a specific role
 */
export const hasRole = (userRoles: string[], role: string): boolean => {
    return userRoles.includes(role)
}

/**
 * Get appropriate home path for a user based on their roles
 */
export const getHomePathForRole = (roles: string[]): string => {
    const highestRole = getHighestRole(roles)
    
    switch (highestRole) {
        case CS_ADMIN:
            return '/tenantportal/dashboard'
        case CS_USER:
            return '/admin/dashboard'
        case TENANT_ADMIN:
        case END_USER:
            return '/app/dashboard'
        default:
            return '/home'
    }
}

export default {
    getHighestRole,
    hasRole,
    getHomePathForRole
}

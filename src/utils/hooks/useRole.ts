import { useMemo } from 'react'
import { useAuth } from '@/auth'
import { getHighestRole, hasRole } from '@/utils/getRoleLevel'
import { 
    CS_ADMIN, 
    CS_USER, 
    TENANT_ADMIN, 
    END_USER,
    ADMIN,
    USER
} from '@/constants/roles.constant'

export const useRole = () => {
    const { user } = useAuth()
    const roles = user?.authority || []
    
    return useMemo(() => {
        const highestRole = getHighestRole(roles)
        
        return {
            /**
             * The user's highest level role
             */
            highestRole,
            
            /**
             * Check if the user has admin access (CS_ADMIN or legacy ADMIN)
             */
            isCSAdmin: roles.includes(CS_ADMIN) || roles.includes(ADMIN),
            
            /**
             * Check if the user has CS_USER access 
             */
            isCSUser: roles.includes(CS_USER) || roles.includes(USER),
            
            /**
             * Check if the user is a tenant admin
             */
            isTenantAdmin: roles.includes(TENANT_ADMIN),
            
            /**
             * Check if the user is an end user
             */
            isEndUser: roles.includes(END_USER),
            
            /**
             * Check if the user has any admin role (CS_ADMIN, ADMIN, CS_USER, USER, or TENANT_ADMIN)
             */
            isAnyAdmin: roles.some(role => [CS_ADMIN, ADMIN, CS_USER, USER, TENANT_ADMIN].includes(role)),
            
            /**
             * Check if the user has a specific role
             */
            hasRole: (role: string) => hasRole(roles, role),
            
            /**
             * Check if the user has any of the specified roles
             */
            hasAnyRole: (checkRoles: string[]) => checkRoles.some(role => roles.includes(role)),
            
            /**
             * Get all roles the user has
             */
            roles
        }
    }, [roles])
}

export default useRole

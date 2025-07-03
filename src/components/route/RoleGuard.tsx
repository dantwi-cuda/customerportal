import { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth'

interface RoleGuardProps extends PropsWithChildren {
    allowedRoles: string[]
    fallbackPath?: string
}

/**
 * Role-based guard component for protecting routes
 * Checks if the current user has one of the allowed roles
 * Redirects to fallbackPath or "/access-denied" if the user doesn't have permission
 */
const RoleGuard = ({
    children,
    allowedRoles,
    fallbackPath = '/access-denied',
}: RoleGuardProps) => {
    const { user } = useAuth()

    // If no roles are required, allow access
    if (!allowedRoles || allowedRoles.length === 0) {
        return <>{children}</>
    }

    // Check if user has any of the required roles
    const hasRequiredRole = user?.authority?.some((role) =>
        allowedRoles.includes(role),
    )

    if (!hasRequiredRole) {
        return <Navigate to={fallbackPath} replace />
    }

    return <>{children}</>
}

export default RoleGuard

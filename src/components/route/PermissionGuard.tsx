import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { usePermissionStore } from '@/store/permissionStore'
import Loading from '@/components/shared/Loading'
import { useAuth } from '@/auth'

interface PermissionGuardProps {
    requiredPermissions?: string[]
    requiredRoles?: string[]
    redirectPath?: string
}

/**
 * A component that guards routes based on user permissions or roles
 */
const PermissionGuard = ({
    requiredPermissions = [],
    requiredRoles = [],
    redirectPath = '/access-denied',
}: PermissionGuardProps) => {
    const [loading, setLoading] = useState(true)
    const [hasAccess, setHasAccess] = useState(false)

    const { authenticated } = useAuth()
    const { hasPermission, hasRole, fetchPermissions, loadingPermissions } =
        usePermissionStore()

    useEffect(() => {
        const checkAccess = async () => {
            if (!authenticated) {
                setHasAccess(false)
                setLoading(false)
                return
            }

            // Load permissions if needed
            await fetchPermissions()

            // Check if user has any of the required permissions
            const meetsPermissionRequirements =
                requiredPermissions.length === 0 ||
                requiredPermissions.some((permission) =>
                    hasPermission(permission),
                )

            // Check if user has any of the required roles
            const meetsRoleRequirements =
                requiredRoles.length === 0 ||
                requiredRoles.some((role) => hasRole(role))

            // User has access if they meet either permission or role requirements
            const userHasAccess =
                meetsPermissionRequirements || meetsRoleRequirements

            setHasAccess(userHasAccess)
            setLoading(false)
        }

        checkAccess()
    }, [authenticated, requiredPermissions, requiredRoles])

    // Show loading spinner while checking permissions
    if (loading || loadingPermissions) {
        return <Loading loading={true} />
    }

    // Redirect if user doesn't have required permissions/roles
    if (!hasAccess) {
        return <Navigate to={redirectPath} />
    }

    // Render the child routes if user has required permissions/roles
    return <Outlet />
}

export default PermissionGuard

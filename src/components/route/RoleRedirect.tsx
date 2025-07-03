import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import appConfig from '@/configs/app.config'
import { getHomePathForRole, getHighestRole } from '@/utils/getRoleLevel'
import { Spinner } from '@/components/ui'

interface RoleRedirectProps {
    adminPath?: string
    csUserPath?: string
    tenantAdminPath?: string
    endUserPath?: string
    fallbackPath?: string
    useConfigPaths?: boolean
}

/**
 * Component that redirects users based on their role
 * This is used to automatically direct users to the appropriate dashboard
 */
const RoleRedirect = ({
    adminPath = '/tenantportal/dashboard',
    csUserPath = '/admin/dashboard',
    tenantAdminPath = '/app/dashboard',
    endUserPath = '/app/dashboard',
    fallbackPath = '/access-denied',
    useConfigPaths = true,
}: RoleRedirectProps) => {
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        // Get user roles
        const userRoles = user?.authority || []
        console.log('RoleRedirect - User authority:', userRoles)

        if (useConfigPaths && appConfig.rolePaths) {
            // Use paths from config
            const highestRole = getHighestRole(userRoles)
            console.log('RoleRedirect - Highest role determined:', highestRole)

            if (highestRole === 'CS-Admin') {
                console.log(
                    'Redirecting CS-Admin to:',
                    appConfig.rolePaths.csAdmin,
                )
                navigate(appConfig.rolePaths.csAdmin)
            } else if (highestRole === 'CS-User') {
                console.log(
                    'Redirecting CS-User to:',
                    appConfig.rolePaths.csUser,
                )
                navigate(appConfig.rolePaths.csUser)
            } else if (highestRole === 'Tenant-Admin') {
                console.log(
                    'Redirecting Tenant-Admin to:',
                    appConfig.rolePaths.tenantAdmin,
                )
                navigate(appConfig.rolePaths.tenantAdmin)
            } else if (highestRole === 'End-User') {
                console.log(
                    'Redirecting End-User to:',
                    appConfig.rolePaths.endUser,
                )
                navigate(appConfig.rolePaths.endUser)
            } else {
                console.log(
                    'No matching role found, redirecting to:',
                    fallbackPath,
                )
                navigate(fallbackPath)
            }
        } else {
            // Use provided paths as props
            const homePath = getHomePathForRole(userRoles)
            console.log(
                'Using getHomePathForRole, redirecting to:',
                homePath || fallbackPath,
            )
            navigate(homePath || fallbackPath)
        }
    }, [
        user,
        navigate,
        adminPath,
        csUserPath,
        tenantAdminPath,
        endUserPath,
        fallbackPath,
        useConfigPaths,
    ])

    // Show a loading spinner while redirecting
    return (
        <div className="flex h-full items-center justify-center">
            <Spinner size={40} />
        </div>
    )
}

export default RoleRedirect

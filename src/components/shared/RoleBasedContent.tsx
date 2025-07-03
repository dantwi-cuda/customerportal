import { ReactNode } from 'react'
import useRole from '@/utils/hooks/useRole'

interface RoleBasedContentProps {
    allowedRoles: string[]
    fallback?: ReactNode
    children: ReactNode
}

/**
 * Component that conditionally renders content based on user roles
 * Shows the children if the user has any of the allowed roles,
 * otherwise shows the fallback content (if provided)
 */
const RoleBasedContent = ({
    allowedRoles,
    fallback = null,
    children,
}: RoleBasedContentProps) => {
    const { hasAnyRole } = useRole()

    if (
        !allowedRoles ||
        allowedRoles.length === 0 ||
        hasAnyRole(allowedRoles)
    ) {
        return <>{children}</>
    }

    return <>{fallback}</>
}

export default RoleBasedContent

import { PropsWithChildren } from 'react'
import RoleGuard from './RoleGuard'
import useAuthority from '@/utils/hooks/useAuthority'

type AuthorityGuardProps = PropsWithChildren<{
    userAuthority?: string[]
    authority?: string[]
}>

/**
 * Legacy component that provides backward compatibility with the original authority-based system
 * Now uses RoleGuard underneath for consistent access control
 */
const AuthorityGuard = (props: AuthorityGuardProps) => {
    const { userAuthority = [], authority = [], children } = props

    // This is just for backward compatibility with existing code
    const roleMatched = useAuthority(userAuthority, authority)

    if (!roleMatched) {
        return <RoleGuard allowedRoles={authority}>{children}</RoleGuard>
    }

    return <>{children}</>
}

export default AuthorityGuard

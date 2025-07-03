import { useEffect, useState } from 'react'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/auth'
import { useRole } from '@/utils/hooks/useRole'
import TenantPortalDashboard from './TenantPortalDashboard'
import CustomerPortalDashboard from './CustomerPortalDashboard'
import { Navigate } from 'react-router-dom'

/**
 * Dashboard selector component that renders the appropriate dashboard
 * based on the user's role
 */
const Dashboard = () => {
    const { user } = useAuth()
    const { isCSAdmin, isCSUser } = useRole()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log('Dashboard: User roles:', user?.authority)
        console.log('Dashboard: isCSAdmin:', isCSAdmin, 'isCSUser:', isCSUser)

        // Short timeout to ensure roles are loaded
        const timer = setTimeout(() => {
            setLoading(false)
        }, 500)

        return () => clearTimeout(timer)
    }, [user, isCSAdmin, isCSUser])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner size={40} />
            </div>
        )
    }

    // Route to the correct dashboard based on role
    if (isCSAdmin) {
        console.log('Dashboard: Rendering TenantPortalDashboard for CS-Admin')
        return <TenantPortalDashboard />
    }

    if (isCSUser) {
        console.log('Dashboard: Rendering CustomerPortalDashboard for CS-User')
        return <CustomerPortalDashboard />
    }

    // If neither role matches, redirect to the debug page
    console.log('Dashboard: No matching role found, redirecting to debug')
    return <Navigate to="/debug/roles" />
}

export default Dashboard

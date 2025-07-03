import { Button } from '@/components/ui'
import { HiExclamationCircle } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { getHomePathForRole } from '@/utils/getRoleLevel'
import appConfig from '@/configs/app.config'

const AccessDenied = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    // Determine where to navigate based on user role
    const handleNavigateToHome = () => {
        const userRoles = user?.authority || []
        const homePath = getHomePathForRole(userRoles)
        navigate(homePath || '/')
    }

    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="max-w-md text-center">
                <HiExclamationCircle className="text-red-500 text-6xl inline-block mb-4" />
                <h1 className="font-bold text-3xl mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-6">
                    You don't have permission to access this page. This incident
                    will be reported.
                </p>
                <div className="flex justify-center gap-2">
                    <Button variant="solid" onClick={handleNavigateToHome}>
                        Back to Home
                    </Button>
                    <Button variant="plain" onClick={() => navigate(-1)}>
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default AccessDenied

import { Button } from '@/components/ui'
import { HiOutlineWrenchScrewdriver } from 'react-icons/hi2'
import { useAuth } from '@/auth'

const MaintenancePage = () => {
    const { signOut } = useAuth()

    return (
        <div className="h-full flex items-center justify-center p-5">
            <div className="max-w-md text-center">
                <div className="mb-8 flex justify-center">
                    <HiOutlineWrenchScrewdriver className="text-primary-500 text-6xl" />
                </div>
                <h1 className="mb-4 text-3xl font-bold">System Maintenance</h1>
                <p className="mb-8 text-gray-500">
                    We're currently performing scheduled maintenance on the
                    system. Please check back soon. We apologize for any
                    inconvenience.
                </p>
                <div className="flex flex-col md:flex-row justify-center gap-4">
                    <Button
                        variant="solid"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                    <Button variant="twoTone" onClick={() => signOut()}>
                        Sign Out
                    </Button>
                </div>
                <div className="mt-8 text-sm text-gray-400">
                    Estimated downtime: 30 minutes
                </div>
            </div>
        </div>
    )
}

export default MaintenancePage

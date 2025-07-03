import React, { useEffect } from 'react'
import { useAuth } from '@/auth'
import { useSessionUser } from '@/store/authStore'
import { Card } from '@/components/ui'

const UserRoleDebugger: React.FC = () => {
    const { user: authUser } = useAuth()
    const sessionUser = useSessionUser((state) => state.user)

    useEffect(() => {
        console.log('Auth Context User:', authUser)
        console.log('Session Store User:', sessionUser)
    }, [authUser, sessionUser])

    return (
        <Card className="mb-4 p-4">
            <h2 className="text-lg font-bold mb-2">User Role Debugger</h2>

            <div className="mb-4">
                <h3 className="font-semibold">Auth Context User:</h3>
                <div className="bg-gray-100 p-2 rounded text-sm">
                    <p>
                        <strong>User ID:</strong>{' '}
                        {authUser?.userId || 'Not set'}
                    </p>
                    <p>
                        <strong>Username:</strong>{' '}
                        {authUser?.userName || 'Not set'}
                    </p>
                    <p>
                        <strong>Email:</strong> {authUser?.email || 'Not set'}
                    </p>
                    <p>
                        <strong>Roles:</strong>{' '}
                        {authUser?.authority?.join(', ') || 'None'}
                    </p>
                </div>
            </div>

            <div>
                <h3 className="font-semibold">Session Store User:</h3>
                <div className="bg-gray-100 p-2 rounded text-sm">
                    <p>
                        <strong>Username:</strong>{' '}
                        {sessionUser?.userName || 'Not set'}
                    </p>
                    <p>
                        <strong>Email:</strong>{' '}
                        {sessionUser?.email || 'Not set'}
                    </p>
                    <p>
                        <strong>Roles:</strong>{' '}
                        {sessionUser?.authority?.join(', ') || 'None'}
                    </p>
                </div>
            </div>
        </Card>
    )
}

export default UserRoleDebugger

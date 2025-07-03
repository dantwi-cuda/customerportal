import { useEffect, useState } from 'react'
import { Card, Button } from '@/components/ui'
import { useAuth } from '@/auth'
import { getHomePathForRole, getHighestRole } from '@/utils/getRoleLevel'
import { useNavigate } from 'react-router-dom'
import {
    CS_ADMIN,
    CS_USER,
    TENANT_ADMIN,
    END_USER,
    ADMIN,
    USER,
} from '@/constants/roles.constant'
import appConfig from '@/configs/app.config'

const RoleDebugger = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [userDetails, setUserDetails] = useState<any>(null)

    useEffect(() => {
        if (user) {
            const roles = user.authority || []
            const highestRole = getHighestRole(roles)
            const homePath = getHomePathForRole(roles)

            setUserDetails({
                userId: user.userId,
                userName: user.userName,
                email: user.email,
                customerName: user.customerName,
                customerId: user.customerId,
                authority: roles,
                highestRole,
                expectedPath: homePath,
                configuredPaths: {
                    csAdmin: appConfig.rolePaths.csAdmin,
                    csUser: appConfig.rolePaths.csUser,
                    tenantAdmin: appConfig.rolePaths.tenantAdmin,
                    endUser: appConfig.rolePaths.endUser,
                },
                hasRoles: {
                    csAdmin: roles.includes(CS_ADMIN),
                    admin: roles.includes(ADMIN),
                    csUser: roles.includes(CS_USER),
                    user: roles.includes(USER),
                    tenantAdmin: roles.includes(TENANT_ADMIN),
                    endUser: roles.includes(END_USER),
                },
            })
        }
    }, [user])

    const handleRedirect = (path: string) => {
        navigate(path)
    }

    if (!userDetails) {
        return <div>Loading user details...</div>
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Role Debugger</h1>

            <Card className="mb-6">
                <div className="p-4">
                    <h2 className="text-lg font-semibold mb-4">
                        User Information
                    </h2>
                    <table className="min-w-full">
                        <tbody>
                            <tr>
                                <td className="p-2 font-medium">User ID:</td>
                                <td className="p-2">{userDetails.userId}</td>
                            </tr>
                            <tr>
                                <td className="p-2 font-medium">Username:</td>
                                <td className="p-2">{userDetails.userName}</td>
                            </tr>
                            <tr>
                                <td className="p-2 font-medium">Email:</td>
                                <td className="p-2">{userDetails.email}</td>
                            </tr>
                            {userDetails.customerName && (
                                <tr>
                                    <td className="p-2 font-medium">
                                        Customer:
                                    </td>
                                    <td className="p-2">
                                        {userDetails.customerName} (
                                        {userDetails.customerId})
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card className="mb-6">
                <div className="p-4">
                    <h2 className="text-lg font-semibold mb-4">
                        Role Information
                    </h2>
                    <div className="mb-4">
                        <h3 className="font-medium">Assigned Roles:</h3>
                        <ul className="list-disc pl-5 mt-2">
                            {userDetails.authority.map((role: string) => (
                                <li key={role}>{role}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="mb-4">
                        <h3 className="font-medium">Role Presence:</h3>
                        <table className="min-w-full mt-2">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-2 text-left">Role</th>
                                    <th className="p-2 text-left">Present</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-2">CS-Admin</td>
                                    <td className="p-2">
                                        {userDetails.hasRoles.csAdmin
                                            ? '✓'
                                            : '✕'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-2">admin (legacy)</td>
                                    <td className="p-2">
                                        {userDetails.hasRoles.admin ? '✓' : '✕'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-2">CS-User</td>
                                    <td className="p-2">
                                        {userDetails.hasRoles.csUser
                                            ? '✓'
                                            : '✕'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-2">user (legacy)</td>
                                    <td className="p-2">
                                        {userDetails.hasRoles.user ? '✓' : '✕'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-2">Tenant-Admin</td>
                                    <td className="p-2">
                                        {userDetails.hasRoles.tenantAdmin
                                            ? '✓'
                                            : '✕'}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-2">End-User</td>
                                    <td className="p-2">
                                        {userDetails.hasRoles.endUser
                                            ? '✓'
                                            : '✕'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <h3 className="font-medium">Role Resolution:</h3>
                        <p className="mt-2">
                            Highest Role:{' '}
                            <strong>{userDetails.highestRole || 'None'}</strong>
                        </p>
                        <p>
                            Expected Path:{' '}
                            <strong>
                                {userDetails.expectedPath || 'None'}
                            </strong>
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="mb-6">
                <div className="p-4">
                    <h2 className="text-lg font-semibold mb-4">
                        Path Configuration
                    </h2>
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left">Role</th>
                                <th className="p-2 text-left">
                                    Configured Path
                                </th>
                                <th className="p-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-2">CS-Admin</td>
                                <td className="p-2">
                                    {userDetails.configuredPaths.csAdmin}
                                </td>
                                <td className="p-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            handleRedirect(
                                                userDetails.configuredPaths
                                                    .csAdmin,
                                            )
                                        }
                                    >
                                        Go
                                    </Button>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2">CS-User</td>
                                <td className="p-2">
                                    {userDetails.configuredPaths.csUser}
                                </td>
                                <td className="p-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            handleRedirect(
                                                userDetails.configuredPaths
                                                    .csUser,
                                            )
                                        }
                                    >
                                        Go
                                    </Button>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2">Tenant-Admin</td>
                                <td className="p-2">
                                    {userDetails.configuredPaths.tenantAdmin}
                                </td>
                                <td className="p-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            handleRedirect(
                                                userDetails.configuredPaths
                                                    .tenantAdmin,
                                            )
                                        }
                                    >
                                        Go
                                    </Button>
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2">End-User</td>
                                <td className="p-2">
                                    {userDetails.configuredPaths.endUser}
                                </td>
                                <td className="p-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            handleRedirect(
                                                userDetails.configuredPaths
                                                    .endUser,
                                            )
                                        }
                                    >
                                        Go
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

export default RoleDebugger

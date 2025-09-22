import React from 'react'
import { Card, Tag, Button } from '@/components/ui'
import { useSessionUser } from '@/store/authStore'
import { HiClock, HiUser, HiCog, HiDocumentText } from 'react-icons/hi'
import classNames from '@/utils/classNames'

// Mock data for demonstration
const mockActivityData = [
    {
        id: 1,
        type: 'login',
        description: 'User logged in',
        timestamp: '2024-12-19T10:30:00Z',
        userEmail: 'admin@company.com',
        ipAddress: '192.168.1.100',
        status: 'success',
    },
    {
        id: 2,
        type: 'settings',
        description: 'Updated company branding settings',
        timestamp: '2024-12-19T09:15:00Z',
        userEmail: 'admin@company.com',
        ipAddress: '192.168.1.100',
        status: 'success',
    },
    {
        id: 3,
        type: 'user_management',
        description: 'Added new user: john.doe@company.com',
        timestamp: '2024-12-18T16:45:00Z',
        userEmail: 'admin@company.com',
        ipAddress: '192.168.1.100',
        status: 'success',
    },
    {
        id: 4,
        type: 'failed_login',
        description: 'Failed login attempt',
        timestamp: '2024-12-18T14:20:00Z',
        userEmail: 'unknown@example.com',
        ipAddress: '203.0.113.45',
        status: 'failed',
    },
    {
        id: 5,
        type: 'password_change',
        description: 'Password changed successfully',
        timestamp: '2024-12-17T11:30:00Z',
        userEmail: 'user@company.com',
        ipAddress: '192.168.1.105',
        status: 'success',
    },
]

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'login':
        case 'failed_login':
            return <HiUser className="w-5 h-5" />
        case 'settings':
        case 'password_change':
            return <HiCog className="w-5 h-5" />
        case 'user_management':
            return <HiDocumentText className="w-5 h-5" />
        default:
            return <HiClock className="w-5 h-5" />
    }
}

const activityStatus = {
    success: {
        label: 'Success',
        className: 'bg-green-100 text-green-800 border-green-200',
    },
    failed: {
        label: 'Failed',
        className: 'bg-red-100 text-red-800 border-red-200',
    },
    warning: {
        label: 'Warning',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    info: {
        label: 'Info',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
}

const getActivityBadge = (status: string) => {
    const statusConfig =
        activityStatus[status as keyof typeof activityStatus] ||
        activityStatus.info

    return (
        <Tag
            className={classNames(
                'text-xs px-2 py-1 rounded-full border',
                statusConfig.className,
            )}
        >
            {statusConfig.label}
        </Tag>
    )
}

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

const ActivityLogPage: React.FC = () => {
    const { authority } = useSessionUser((state) => state.user)

    // Check if user is tenant admin
    const isTenantAdmin = authority?.some((role: string) =>
        ['Tenant-Admin'].includes(role),
    )

    if (!isTenantAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Activity Log</h1>
                    <p className="text-gray-600">
                        Access denied. Only tenant administrators can access
                        activity logs.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Activity Log</h1>
                    <p className="text-gray-600">
                        Monitor user activities and system events
                    </p>
                </div>
                <Button variant="solid">Export Log</Button>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="text-sm font-medium">Filter by:</div>
                    <Button variant="plain" size="sm">
                        All Activities
                    </Button>
                    <Button variant="plain" size="sm">
                        Login Events
                    </Button>
                    <Button variant="plain" size="sm">
                        User Management
                    </Button>
                    <Button variant="plain" size="sm">
                        Settings Changes
                    </Button>
                    <Button variant="plain" size="sm">
                        Failed Attempts
                    </Button>
                </div>
            </Card>

            {/* Activity List */}
            <Card>
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Recent Activities</h2>
                </div>

                <div className="divide-y">
                    {mockActivityData.map((activity) => (
                        <div key={activity.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 p-2 bg-gray-100 rounded-lg">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">
                                                {activity.description}
                                            </span>
                                            {getActivityBadge(activity.status)}
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <div>
                                                User: {activity.userEmail}
                                            </div>
                                            <div>
                                                IP Address: {activity.ipAddress}
                                            </div>
                                            <div>
                                                Time:{' '}
                                                {formatTimestamp(
                                                    activity.timestamp,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Implementation Notice */}
            <Card className="p-6 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <HiClock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-2">
                            Development Notice
                        </h3>
                        <p className="text-blue-800 text-sm mb-3">
                            This Activity Log page is currently showing mock
                            data for demonstration purposes. In a production
                            environment, this would display real-time activity
                            logs from your system.
                        </p>
                        <div className="text-blue-800 text-sm">
                            <strong>Features to be implemented:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>Real-time activity tracking</li>
                                <li>Advanced filtering and search</li>
                                <li>Export functionality (CSV, PDF)</li>
                                <li>Activity details and drill-down</li>
                                <li>Retention policies and archiving</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default ActivityLogPage

import React, { useState, useEffect } from 'react'
import { Card, Badge, Button, Notification, toast } from '@/components/ui'
import { HiOutlineRefresh, HiOutlineArrowLeft } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import WorkspaceService from '@/services/WorkspaceService'
import type {
    ReportImportLog,
    ReportImportLogResponse,
} from '@/@types/workspace'

const ImportStatusPage = () => {
    const navigate = useNavigate()
    const [importLogs, setImportLogs] = useState<ReportImportLog[]>([])
    const [loading, setLoading] = useState(false)
    const [pageNumber, setPageNumber] = useState(1)
    const [pageSize] = useState(50) // Fixed page size for now

    useEffect(() => {
        loadImportLogs()
    }, [pageNumber])

    const loadImportLogs = async () => {
        setLoading(true)
        try {
            const response = await WorkspaceService.getReportImportLogs({
                pageNumber,
                pageSize,
            })

            console.log('API Response:', response)

            // Now we know the response structure, extract the logs directly
            setImportLogs(response.importLogs || [])
        } catch (error) {
            console.error('Error fetching import logs:', error)
            setImportLogs([]) // Reset to empty array on error
            toast.push(
                <Notification type="danger" title="Error loading import logs">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (success: boolean, errorCount: number) => {
        if (errorCount > 0) {
            return (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Error
                </Badge>
            )
        } else if (success) {
            return (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Success
                </Badge>
            )
        } else {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Failed
                </Badge>
            )
        }
    }

    const formatResponse = (log: ReportImportLog) => {
        // Show the message if available
        if (log.message) {
            return <div className="text-sm">{log.message}</div>
        }

        // Fallback to summary
        return (
            <div className="text-sm">
                Processed {log.processedReports} reports
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() =>
                            navigate('/tenantportal/tenant/workspaces')
                        }
                    >
                        Back to Workspaces
                    </Button>
                    <h3 className="text-lg font-medium">
                        Report Import Status
                    </h3>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="default"
                        icon={<HiOutlineRefresh />}
                        onClick={loadImportLogs}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <Card>
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : !Array.isArray(importLogs) || importLogs.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                            No import operations found
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Workspace Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Workspace ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Imported By
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Import Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Response
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {importLogs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {log.workspaceName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {log.workspaceID}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {log.importedByUserName}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(
                                                log.success,
                                                log.errorCount,
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(
                                                log.importedAt,
                                            ).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {formatResponse(log)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ImportStatusPage

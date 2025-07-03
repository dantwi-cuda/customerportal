import React, { useState, useEffect } from 'react'
import { Card, Button, Notification, toast, Skeleton } from '@/components/ui'
import { HiOutlineArrowLeft, HiOutlineRefresh } from 'react-icons/hi'
import * as ReportService from '@/services/ReportService'
import { useNavigate, useParams } from 'react-router-dom'
import type { Report, ReportEmbedToken } from '@/@types/report'
import useAuth from '@/auth/useAuth'

const ReportViewerPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    // State management
    const [report, setReport] = useState<Report | null>(null)
    const [embedToken, setEmbedToken] = useState<ReportEmbedToken | null>(null)
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    // Tenant admin check: User must have a tenantId to manage reports
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (isTenantAdmin && id) {
            fetchReportDetails(id)
            fetchEmbedToken(id)
        }
    }, [id, isTenantAdmin])

    const fetchReportDetails = async (reportId: string) => {
        setLoading(true)
        try {
            const data = await ReportService.getReportDetails(reportId)
            setReport(data)
        } catch (error) {
            console.error('Error fetching report details:', error)
            toast.push(
                <Notification type="danger" title="Error fetching report">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
            navigate('/tenantportal/tenant/reports')
        } finally {
            setLoading(false)
        }
    }

    const fetchEmbedToken = async (reportId: string) => {
        try {
            const data = await ReportService.getReportEmbedToken(reportId)
            setEmbedToken(data)
        } catch (error) {
            console.error('Error fetching embed token:', error)
            toast.push(
                <Notification type="danger" title="Error loading report">
                    {error instanceof Error
                        ? error.message
                        : 'Unable to load the report for viewing'}
                </Notification>,
            )
        }
    }

    const handleRefresh = async () => {
        if (!id) return

        setRefreshing(true)
        try {
            await fetchEmbedToken(id)
            toast.push(
                <Notification type="success" title="Report refreshed">
                    Report has been refreshed successfully.
                </Notification>,
            )
        } catch (error) {
            console.error('Error refreshing report:', error)
        } finally {
            setRefreshing(false)
        }
    }

    const handleBack = () => {
        navigate('/tenantportal/tenant/reports')
    }

    if (!isTenantAdmin) {
        return (
            <div className="p-4">
                <Card className="text-center p-4">
                    <h4 className="mb-2">Access Denied</h4>
                    <p>
                        You must be a tenant administrator to access this page.
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-2 sm:p-4">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Button
                    size="sm"
                    icon={<HiOutlineArrowLeft />}
                    onClick={handleBack}
                    variant="plain"
                >
                    Back to Reports
                </Button>

                <div className="flex justify-end">
                    <Button
                        size="sm"
                        icon={<HiOutlineRefresh />}
                        onClick={handleRefresh}
                        loading={refreshing}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {loading ? (
                <Card className="mb-4">
                    <div className="p-4">
                        <Skeleton height={28} width="60%" />
                        <div className="mt-4">
                            <Skeleton height={16} width="40%" />
                        </div>
                    </div>
                </Card>
            ) : (
                <Card className="mb-4">
                    <div className="p-4">
                        <h4>{report?.name}</h4>
                        <p className="text-gray-500 mt-1">
                            {report?.description || 'No description'}
                        </p>
                    </div>
                </Card>
            )}

            <Card className="overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-[600px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="w-full h-[600px] md:h-[700px] lg:h-[800px]">
                        {report?.embedUrl && embedToken ? (
                            <iframe
                                title={report.name}
                                src={`${report.embedUrl}&token=${embedToken.token}`}
                                className="w-full h-full border-0"
                                allowFullScreen
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-6">
                                <div className="text-4xl text-gray-400 mb-4">
                                    <HiOutlineDocumentReport />
                                </div>
                                <h5 className="mb-2">
                                    Report not available for preview
                                </h5>
                                <p className="text-gray-500 text-center">
                                    {!report?.embedUrl
                                        ? 'This report does not have an embed URL configured.'
                                        : !embedToken
                                          ? 'Unable to generate embed token for this report.'
                                          : 'An error occurred while loading the report.'}
                                </p>
                                {!embedToken && report?.embedUrl && (
                                    <Button
                                        className="mt-4"
                                        onClick={handleRefresh}
                                        icon={<HiOutlineRefresh />}
                                    >
                                        Try Again
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ReportViewerPage

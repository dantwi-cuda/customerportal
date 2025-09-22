import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Notification, toast, Skeleton } from '@/components/ui'
import {
    HiOutlineArrowLeft,
    HiOutlineRefresh,
    HiOutlineDocumentReport,
} from 'react-icons/hi'
import * as ReportService from '@/services/ReportService'
import { useNavigate, useParams } from 'react-router-dom'
import type { Report, ReportEmbedToken } from '@/@types/report'
import useAuth from '@/auth/useAuth'
import { models } from 'powerbi-client'
import { PowerBIEmbed } from 'powerbi-client-react'

const ReportViewerPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    // State management
    const [report, setReport] = useState<Report | null>(null)
    const [embedToken, setEmbedToken] = useState<ReportEmbedToken | null>(null)
    const [embedConfigData, setEmbedConfigData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    // Tenant admin check: User must have a tenantId to manage reports
    const isTenantAdmin = !!user?.tenantId

    // PowerBI embed reference
    const reportRef = useRef<any>(null)

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
            console.log('Fetching embed token for report:', reportId)
            const data = await ReportService.getReportEmbedToken(reportId)
            console.log('Embed token response:', {
                reportId: data.reportId,
                hasEmbedToken: !!data.embedToken,
                embedUrl: data.embedUrl,
                expiresInMinutes: data.expiresInMinutes,
                datasetId: data.datasetId,
                isEffectiveIdentityRequired: data.isEffectiveIdentityRequired,
                isEffectiveIdentityRolesRequired:
                    data.isEffectiveIdentityRolesRequired,
            })
            setEmbedToken(data)

            // Create PowerBI embed configuration
            if (data.embedToken && data.embedUrl && data.reportId) {
                const config = {
                    type: 'report',
                    id: data.reportId,
                    embedUrl: data.embedUrl,
                    tokenType: models.TokenType.Embed,
                    accessToken: data.embedToken,
                    permissions: models.Permissions.Read,
                    settings: {
                        panes: {
                            filters: {
                                expanded: false,
                                visible: true,
                            },
                            pageNavigation: {
                                visible: true,
                            },
                        },
                        background: models.BackgroundType.Transparent,
                        bars: {
                            statusBar: {
                                visible: true,
                            },
                        },
                    },
                }

                console.log('PowerBI Embed Configuration created:', config)
                setEmbedConfigData(config)
            }
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
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header and Actions Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<HiOutlineArrowLeft />}
                            onClick={handleBack}
                        >
                            Back to Reports
                        </Button>
                        <div>
                            {loading ? (
                                <Skeleton height={20} width="200px" />
                            ) : (
                                <>
                                    <h4 className="mb-1">{report?.name}</h4>
                                    <p className="text-gray-600 text-sm">
                                        {report?.description ||
                                            'No description'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="default"
                        icon={<HiOutlineRefresh />}
                        onClick={handleRefresh}
                        loading={refreshing}
                        className="w-full sm:w-auto"
                    >
                        Refresh
                    </Button>
                </div>
            </Card>

            {/* Content Card */}
            <Card className="overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-[600px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="w-full h-[600px] md:h-[700px] lg:h-[800px]">
                        {embedConfigData ? (
                            <PowerBIEmbed
                                embedConfig={embedConfigData}
                                cssClassName="h-full w-full"
                                getEmbeddedComponent={(embedObject) => {
                                    console.log(
                                        'PowerBI embed object received:',
                                        embedObject,
                                    )
                                    reportRef.current = embedObject

                                    // Add event listeners for debugging
                                    if (embedObject) {
                                        embedObject.on('loaded', () => {
                                            console.log(
                                                'PowerBI Report loaded successfully',
                                            )
                                        })

                                        embedObject.on('rendered', () => {
                                            console.log(
                                                'PowerBI Report rendered successfully',
                                            )
                                        })

                                        embedObject.on(
                                            'error',
                                            (event: any) => {
                                                console.error(
                                                    'PowerBI Report error:',
                                                    event.detail,
                                                )
                                                toast.push(
                                                    <Notification
                                                        type="danger"
                                                        title="Report Error"
                                                    >
                                                        Failed to load the Power
                                                        BI report. Please try
                                                        refreshing.
                                                    </Notification>,
                                                )
                                            },
                                        )
                                    }
                                }}
                                eventHandlers={
                                    new Map([
                                        [
                                            'loaded',
                                            () =>
                                                console.log(
                                                    'PowerBI event: loaded',
                                                ),
                                        ],
                                        [
                                            'rendered',
                                            () =>
                                                console.log(
                                                    'PowerBI event: rendered',
                                                ),
                                        ],
                                        [
                                            'error',
                                            (event: any) =>
                                                console.error(
                                                    'PowerBI event: error',
                                                    event,
                                                ),
                                        ],
                                    ])
                                }
                            />
                        ) : embedToken && embedToken.embedUrl ? (
                            <iframe
                                title={report?.name || 'Power BI Report'}
                                src={embedToken.embedUrl}
                                className="w-full h-full border-0"
                                allowFullScreen
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
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
                                    {!embedToken
                                        ? 'Unable to generate embed token for this report.'
                                        : !embedToken.embedUrl
                                          ? 'This report does not have a valid embed URL.'
                                          : 'An error occurred while loading the report.'}
                                </p>
                                {!embedToken && (
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

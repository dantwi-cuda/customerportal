import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, Button, Notification, toast } from '@/components/ui'
import Loading from '@/components/shared/Loading'
import { HiArrowLeft, HiStar, HiOutlineStar } from 'react-icons/hi'
import {
    getReportDetails,
    getReportEmbedToken,
    getReportEmbedTokenWithRLS,
    pinReport,
    unpinReport,
} from '@/services/ReportService'
import { usePermissionStore } from '@/store/permissionStore'
import { PIN_REPORTS } from '@/constants/report-permissions.constant'
import { models } from 'powerbi-client'
import { PowerBIEmbed } from 'powerbi-client-react'
import type { Report } from '@/@types/report'

const ReportViewer = () => {
    const { id: reportId } = useParams<{ id: string }>()
    const [report, setReport] = useState<Report | null>(null)
    const [embedConfigData, setEmbedConfigData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [tokenLoading, setTokenLoading] = useState(true)

    const { hasPermission } = usePermissionStore()
    const canPinReports = hasPermission(PIN_REPORTS)

    // Config for PowerBI embed
    const reportRef = useRef<any>(null)

    // Debug logging for initial setup
    useEffect(() => {
        console.group('🔍 ReportViewer Debug - Initial Setup')
        console.log('Report ID from URL params:', reportId)
        console.log('Has pin permission:', canPinReports)
        console.log('Component mounted at:', new Date().toISOString())
        console.groupEnd()
    }, [])

    // Fetch report details
    useEffect(() => {
        const fetchReportDetails = async () => {
            if (!reportId) {
                console.warn(
                    '⚠️ No reportId provided, skipping report details fetch',
                )
                return
            }

            console.group('📋 Fetching Report Details')
            console.log('Report ID:', reportId)
            console.log('Starting fetch at:', new Date().toISOString())

            setLoading(true)
            try {
                console.log('📡 Calling getReportDetails API...')
                const data = await getReportDetails(reportId)
                console.log('✅ Report details received:', data)
                console.log('Report name:', data?.name)
                console.log('Report description:', data?.description)
                console.log('Embed URL:', data?.embedUrl)
                setReport(data)
            } catch (error) {
                console.error('❌ Failed to fetch report details:', error)
                console.error('Error details:', {
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    status: (error as any)?.response?.status,
                    statusText: (error as any)?.response?.statusText,
                    data: (error as any)?.response?.data,
                })
                toast.push(
                    <Notification type="danger" title="Error">
                        Failed to load report details
                    </Notification>,
                )
            } finally {
                setLoading(false)
                console.log(
                    '📋 Report details fetch completed at:',
                    new Date().toISOString(),
                )
                console.groupEnd()
            }
        }

        fetchReportDetails()
    }, [reportId])

    // Fetch embed configuration from API
    useEffect(() => {
        const fetchEmbedConfig = async () => {
            if (!reportId || !report?.embedUrl) {
                console.warn(
                    '⚠️ No reportId or embedUrl, skipping embed config fetch',
                    { reportId, embedUrl: report?.embedUrl },
                )
                return
            }

            console.group('🔐 Fetching Embed Configuration')
            console.log('Report ID:', reportId)
            console.log(
                'Starting embed config fetch at:',
                new Date().toISOString(),
            )

            setTokenLoading(true)
            try {
                console.log('📡 Calling getReportEmbedToken API...')
                let embedData = await getReportEmbedToken(reportId)

                // If RLS is required but we get an error, try requesting RLS token
                if (
                    embedData.isEffectiveIdentityRequired &&
                    embedData.isEffectiveIdentityRolesRequired
                ) {
                    console.warn(
                        '⚠️ RLS is required - attempting to request RLS-enabled token',
                    )

                    try {
                        // Try to get RLS token with current user identity
                        embedData = await getReportEmbedTokenWithRLS(reportId, {
                            username: 'current-user@domain.com', // This should come from your auth context
                            roles: ['ViewerRole'], // This should come from user's roles
                            datasets: [embedData.datasetId],
                        })
                        console.log('✅ RLS token obtained successfully')
                    } catch (rlsError) {
                        console.warn(
                            '⚠️ RLS token request failed, proceeding with regular token',
                        )
                        console.warn(
                            'Backend may need to implement RLS support',
                        )
                    }
                }

                // If RLS is required but failed, show detailed error message
                if (
                    embedData.isEffectiveIdentityRequired &&
                    !embedData.embedToken
                ) {
                    console.error(
                        '❌ RLS is required but no effective identity provided',
                    )
                    throw new Error(
                        'This report requires Row-Level Security (RLS) authentication. Please contact your administrator.',
                    )
                }

                console.log('✅ Embed token data received:', {
                    hasToken: !!embedData.embedToken,
                    tokenLength: embedData.embedToken?.length,
                    reportId: embedData.reportId,
                    embedUrl: embedData.embedUrl,
                    expiration: embedData.expiresInMinutes,
                    datasetId: embedData.datasetId,
                    datasetName: embedData.datasetName,
                    isEffectiveIdentityRequired:
                        embedData.isEffectiveIdentityRequired,
                    isEffectiveIdentityRolesRequired:
                        embedData.isEffectiveIdentityRolesRequired,
                })

                // Check for Row-Level Security (RLS) requirements
                if (embedData.isEffectiveIdentityRequired) {
                    console.warn(
                        '⚠️ Row-Level Security (RLS) is enabled for this report',
                    )
                    console.warn(
                        'The backend should provide effective identity in the embed token',
                    )

                    // Show user-friendly warning
                    toast.push(
                        <Notification type="warning" title="Security Notice">
                            This report uses Row-Level Security. Data may be
                            filtered based on your permissions.
                        </Notification>,
                    )
                }

                if (embedData.isEffectiveIdentityRolesRequired) {
                    console.warn(
                        '⚠️ Row-Level Security (RLS) roles are required for this report',
                    )
                    console.warn(
                        'Effective identity with roles must be provided in the embed token',
                    )
                }

                // Create complete embed configuration using API response
                const config = {
                    type: 'report',
                    id: embedData.reportId, // Use reportId from embed token response
                    embedUrl: embedData.embedUrl, // Use embedUrl from embed token response
                    tokenType: models.TokenType.Embed,
                    accessToken: embedData.embedToken, // Use the correct embedToken property
                    permissions: models.Permissions.All, // Try with All permissions to test dataset access
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
                        // Add dataset refresh and edit capabilities to test permissions
                        bars: {
                            statusBar: {
                                visible: true,
                            },
                        },
                    },
                }

                console.log('🔧 PowerBI Embed Configuration created:', {
                    type: config.type,
                    id: config.id,
                    embedUrl: config.embedUrl,
                    tokenType: config.tokenType,
                    hasAccessToken: !!config.accessToken,
                    permissions: config.permissions,
                    settings: config.settings,
                })

                setEmbedConfigData(config)
                console.log('✅ Embed config state updated successfully')
            } catch (error) {
                console.error('❌ Failed to fetch embed config:', error)
                console.error('Embed config error details:', {
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    status: (error as any)?.response?.status,
                    statusText: (error as any)?.response?.statusText,
                    data: (error as any)?.response?.data,
                })
                toast.push(
                    <Notification type="danger" title="Error">
                        Failed to load report. Please try again later.
                    </Notification>,
                )
            } finally {
                setTokenLoading(false)
                console.log(
                    '🔐 Embed config fetch completed at:',
                    new Date().toISOString(),
                )
                console.groupEnd()
            }
        }

        fetchEmbedConfig()
    }, [reportId, report])

    const handlePinToggle = async () => {
        if (!report || !canPinReports) return

        try {
            if (report.isPinned) {
                await unpinReport(report.id)
                toast.push(
                    <Notification type="success" title="Success">
                        Report unpinned successfully
                    </Notification>,
                )
            } else {
                await pinReport(report.id)
                toast.push(
                    <Notification type="success" title="Success">
                        Report pinned successfully
                    </Notification>,
                )
            }

            // Update local state
            setReport((prev) => {
                if (!prev) return null
                return { ...prev, isPinned: !prev.isPinned }
            })
        } catch (error) {
            console.error('Failed to toggle pin status', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to {report.isPinned ? 'unpin' : 'pin'} report
                </Notification>,
            )
        }
    }

    if (loading) {
        console.log('🔄 Component state: Loading report details...')
        return (
            <div className="flex justify-center py-12">
                <Loading loading={true} />
            </div>
        )
    }

    if (!report) {
        console.log('❌ Component state: No report data found')
        return (
            <Card>
                <div className="p-6 text-center">
                    <h5>Report not found</h5>
                    <p className="text-gray-500 mt-2">
                        The report you're looking for doesn't exist or you don't
                        have permission to view it.
                    </p>
                    <Link to="/reports">
                        <Button className="mt-4">Back to Reports</Button>
                    </Link>
                </div>
            </Card>
        )
    }

    console.group('🎨 Rendering ReportViewer')
    console.log('Report loaded:', !!report)
    console.log('Token loading:', tokenLoading)
    console.log('Embed config ready:', !!embedConfigData)
    console.log('Current render state:', {
        reportName: report.name,
        reportId: report.id,
        hasEmbedConfig: !!embedConfigData,
        isTokenLoading: tokenLoading,
    })
    console.groupEnd()

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center">
                    <Link to="/reports">
                        <Button
                            variant="plain"
                            icon={<HiArrowLeft />}
                            className="mr-3"
                        >
                            Back
                        </Button>
                    </Link>
                    <h3>{report.name}</h3>
                </div>

                {canPinReports && (
                    <Button
                        icon={report.isPinned ? <HiStar /> : <HiOutlineStar />}
                        variant="solid"
                        onClick={handlePinToggle}
                    >
                        {report.isPinned ? 'Pinned' : 'Pin Report'}
                    </Button>
                )}
            </div>

            {report.description && (
                <Card className="p-4">
                    <p className="text-gray-500">{report.description}</p>
                </Card>
            )}

            <Card>
                <div className="p-0 h-[calc(100vh-280px)] min-h-[500px]">
                    {tokenLoading || !embedConfigData ? (
                        <div className="h-full flex justify-center items-center">
                            <div className="text-center">
                                <Loading loading={true} />
                                <p className="mt-2 text-sm text-gray-500">
                                    {tokenLoading
                                        ? 'Loading embed configuration...'
                                        : 'Preparing report...'}
                                </p>
                                {(() => {
                                    console.log(
                                        '🔄 PowerBI embed loading state:',
                                        {
                                            tokenLoading,
                                            hasEmbedConfig: !!embedConfigData,
                                            timestamp: new Date().toISOString(),
                                        },
                                    )
                                    return null
                                })()}
                            </div>
                        </div>
                    ) : (
                        <>
                            {(() => {
                                console.log(
                                    '🚀 Rendering PowerBI Embed Component',
                                )
                                console.log(
                                    'Final embed config being used:',
                                    embedConfigData,
                                )
                                return null
                            })()}
                            <PowerBIEmbed
                                embedConfig={embedConfigData}
                                cssClassName="h-full w-full"
                                getEmbeddedComponent={(embedObject) => {
                                    console.log(
                                        '🔗 PowerBI embed object received:',
                                        embedObject,
                                    )
                                    reportRef.current = embedObject

                                    // Add event listeners for debugging
                                    if (embedObject) {
                                        embedObject.on('loaded', () => {
                                            console.log(
                                                '✅ PowerBI Report loaded successfully',
                                            )
                                        })

                                        embedObject.on('rendered', () => {
                                            console.log(
                                                '🎨 PowerBI Report rendered successfully',
                                            )
                                        })

                                        embedObject.on(
                                            'error',
                                            (event: any) => {
                                                console.error(
                                                    '❌ PowerBI Report error:',
                                                    event.detail,
                                                )

                                                // Check if this is an RLS-related error
                                                const errorMessage =
                                                    event.detail?.message || ''
                                                if (
                                                    errorMessage.includes(
                                                        'FailedToLoadModel',
                                                    ) ||
                                                    errorMessage.includes(
                                                        'ExplorationContainer',
                                                    )
                                                ) {
                                                    console.error(
                                                        '🔒 This appears to be an RLS (Row-Level Security) related error',
                                                    )
                                                    console.error(
                                                        '🔧 Suggested solutions:',
                                                    )
                                                    console.error(
                                                        '  1. Backend should include effective identity in embed token',
                                                    )
                                                    console.error(
                                                        '  2. Service principal needs proper dataset permissions',
                                                    )
                                                    console.error(
                                                        '  3. RLS rules may need to be configured to allow service principal access',
                                                    )

                                                    // Show user-friendly error
                                                    toast.push(
                                                        <Notification
                                                            type="danger"
                                                            title="Report Loading Failed"
                                                        >
                                                            This report requires
                                                            additional security
                                                            permissions. Please
                                                            contact your
                                                            administrator.
                                                        </Notification>,
                                                    )
                                                }
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
                                                    '📊 PowerBI event: loaded',
                                                ),
                                        ],
                                        [
                                            'rendered',
                                            () =>
                                                console.log(
                                                    '📊 PowerBI event: rendered',
                                                ),
                                        ],
                                        [
                                            'error',
                                            (event: any) =>
                                                console.error(
                                                    '📊 PowerBI event: error',
                                                    event,
                                                ),
                                        ],
                                    ])
                                }
                            />
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default ReportViewer

import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/shared/Loading'
import { HiArrowLeft, HiStar, HiOutlineStar } from 'react-icons/hi'
import {
    getReportDetails,
    getReportEmbedToken,
    pinReport,
    unpinReport,
} from '@/services/ReportService'
import { usePermissionStore } from '@/store/permissionStore'
import { toast } from '@/components/ui/toast'
import { models } from 'powerbi-client'
import { PowerBIEmbed } from 'powerbi-client-react'
import type { Report } from '@/@types/report'

const ReportViewer = () => {
    const { reportId } = useParams<{ reportId: string }>()
    const [report, setReport] = useState<Report | null>(null)
    const [embedToken, setEmbedToken] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [tokenLoading, setTokenLoading] = useState(true)

    const { hasPermission } = usePermissionStore()
    const canPinReports = hasPermission('pin_reports')

    // Config for PowerBI embed
    const reportRef = useRef<any>(null)

    // Fetch report details
    useEffect(() => {
        const fetchReportDetails = async () => {
            if (!reportId) return

            setLoading(true)
            try {
                const data = await getReportDetails(reportId)
                setReport(data)
            } catch (error) {
                console.error('Failed to fetch report details', error)
                toast.push({
                    type: 'danger',
                    message: 'Failed to load report details',
                })
            } finally {
                setLoading(false)
            }
        }

        fetchReportDetails()
    }, [reportId])

    // Fetch embed token
    useEffect(() => {
        const fetchEmbedToken = async () => {
            if (!reportId) return

            setTokenLoading(true)
            try {
                const tokenData = await getReportEmbedToken(reportId)
                setEmbedToken(tokenData.token)
            } catch (error) {
                console.error('Failed to fetch embed token', error)
                toast.push({
                    type: 'danger',
                    message: 'Failed to load report. Please try again later.',
                })
            } finally {
                setTokenLoading(false)
            }
        }

        fetchEmbedToken()
    }, [reportId])

    const handlePinToggle = async () => {
        if (!report || !canPinReports) return

        try {
            if (report.isPinned) {
                await unpinReport(report.id)
                toast.push({
                    type: 'success',
                    message: 'Report unpinned successfully',
                })
            } else {
                await pinReport(report.id)
                toast.push({
                    type: 'success',
                    message: 'Report pinned successfully',
                })
            }

            // Update local state
            setReport((prev) => {
                if (!prev) return null
                return { ...prev, isPinned: !prev.isPinned }
            })
        } catch (error) {
            console.error('Failed to toggle pin status', error)
            toast.push({
                type: 'danger',
                message: `Failed to ${report.isPinned ? 'unpin' : 'pin'} report`,
            })
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loading loading={true} size={50} />
            </div>
        )
    }

    if (!report) {
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

    // PowerBI embed configuration
    const embedConfig = {
        type: 'report',
        id: reportId,
        embedUrl: report.embedUrl,
        tokenType: models.TokenType.Embed,
        accessToken: embedToken,
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
        },
    }

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
                        variant="twoTone"
                        color={report.isPinned ? 'warning' : 'gray'}
                        onClick={handlePinToggle}
                    >
                        {report.isPinned ? 'Pinned' : 'Pin Report'}
                    </Button>
                )}
            </div>

            {report.description && (
                <Card bodyClass="p-4">
                    <p className="text-gray-500">{report.description}</p>
                </Card>
            )}

            <Card>
                <div className="p-0 h-[calc(100vh-280px)] min-h-[500px]">
                    {tokenLoading ? (
                        <div className="h-full flex justify-center items-center">
                            <Loading loading={true} size={50} />
                        </div>
                    ) : (
                        <PowerBIEmbed
                            embedConfig={embedConfig}
                            cssClassName="h-full w-full"
                            getEmbeddedComponent={(embedObject) => {
                                reportRef.current = embedObject
                            }}
                        />
                    )}
                </div>
            </Card>
        </div>
    )
}

export default ReportViewer

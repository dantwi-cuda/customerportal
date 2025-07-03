import React, { useState, useEffect } from 'react'
import { Dialog, Button, Select, Notification, toast } from '@/components/ui'
import { Loading } from '@/components/shared'
import { UserDto } from '@/@types/user'
import { Report } from '@/@types/report'
import ReportService from '@/services/ReportService'

interface AssignReportsModalProps {
    isOpen: boolean
    onClose: () => void
    user: UserDto | null
    onSuccess?: () => void
}

interface ReportOption {
    value: number
    label: string
}

const AssignReportsModal: React.FC<AssignReportsModalProps> = ({
    isOpen,
    onClose,
    user,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false)
    const [reports, setReports] = useState<Report[]>([])
    const [selectedReportIds, setSelectedReportIds] = useState<number[]>([])
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchReports()
        }
    }, [isOpen])

    const fetchReports = async () => {
        setLoading(true)
        try {
            const response = await ReportService.getReportsList()
            setReports(response.data || [])
        } catch (error) {
            console.error('Failed to fetch reports:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to fetch reports
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!user?.id || selectedReportIds.length === 0) {
            toast.push(
                <Notification title="Warning" type="warning">
                    Please select at least one report
                </Notification>,
            )
            return
        }

        setSubmitting(true)
        try {
            await ReportService.assignReportsToUser(user.id, selectedReportIds)
            toast.push(
                <Notification title="Success" type="success">
                    Reports assigned successfully
                </Notification>,
            )
            onSuccess?.()
            onClose()
        } catch (error) {
            console.error('Failed to assign reports:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to assign reports
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const reportOptions: ReportOption[] = reports.map((report) => ({
        value: parseInt(report.id), // Convert string ID to number for API
        label: `${report.name} - ${report.categoryName || 'Uncategorized'}`,
    }))

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            width={600}
        >
            <div className="p-6">
                <h4 className="mb-4">
                    Assign Reports to {user?.name || user?.email}
                </h4>

                {loading ? (
                    <Loading loading={true} />
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Select Reports
                            </label>
                            <Select
                                isMulti
                                placeholder="Select reports to assign..."
                                options={reportOptions}
                                value={reportOptions.filter((option) =>
                                    selectedReportIds.includes(option.value),
                                )}
                                onChange={(selectedOptions) => {
                                    const reportIds =
                                        (
                                            selectedOptions as ReportOption[]
                                        )?.map((option) => option.value) || []
                                    setSelectedReportIds(reportIds)
                                }}
                            />
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                variant="plain"
                                onClick={onClose}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                onClick={handleSubmit}
                                loading={submitting}
                                disabled={
                                    submitting || selectedReportIds.length === 0
                                }
                            >
                                Assign Reports
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    )
}

export default AssignReportsModal

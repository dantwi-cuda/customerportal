import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card, Notification, toast } from '@/components/ui'
import { HiEye, HiDownload } from 'react-icons/hi'
import BulkUploadService from '@/services/BulkUploadService'
import type { BulkUploadJob, BulkUploadError } from '@/@types/parts'

interface JobStatusProps {
    jobs: BulkUploadJob[]
    loading?: boolean
    onRefresh?: () => void
}

const JobStatus: React.FC<JobStatusProps> = ({
    jobs,
    loading = false,
    onRefresh,
}) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-100'
            case 'failed':
                return 'text-red-600 bg-red-100'
            case 'processing':
                return 'text-blue-600 bg-blue-100'
            default:
                return 'text-yellow-600 bg-yellow-100'
        }
    }

    const viewJobDetails = async (job: BulkUploadJob) => {
        try {
            const jobDetails = await BulkUploadService.getJob(job.jobId)
            let errors: BulkUploadError[] = []

            if (jobDetails.errorRecords > 0) {
                errors = await BulkUploadService.getJobErrors(job.jobId)
            }

            // For now, log to console. In a real app, you'd show a modal or navigate to a details page
            console.log('Job Details:', jobDetails)
            console.log('Job Errors:', errors)

            toast.push(
                <Notification title="Info" type="info" duration={3000}>
                    Job details and errors logged to console.{' '}
                    {errors.length > 0
                        ? `Found ${errors.length} errors.`
                        : 'No errors found.'}
                </Notification>,
            )
        } catch (error) {
            console.error('Failed to fetch job details:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch job details.
                </Notification>,
            )
        }
    }

    if (jobs.length === 0) {
        return (
            <Card className="p-6">
                <div className="text-center text-gray-500">
                    No upload jobs found.
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Upload Jobs</h3>
                {onRefresh && (
                    <Button
                        variant="plain"
                        size="sm"
                        onClick={onRefresh}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {jobs.map((job) => (
                    <div key={job.jobId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-medium">
                                        {job.fileName}
                                    </span>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}
                                    >
                                        {job.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                    <div>
                                        <span className="font-medium">
                                            Total:
                                        </span>{' '}
                                        {job.totalRecords}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Processed:
                                        </span>{' '}
                                        {job.processedRecords}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Errors:
                                        </span>
                                        <span
                                            className={
                                                job.errorRecords > 0
                                                    ? 'text-red-600 font-medium'
                                                    : ''
                                            }
                                        >
                                            {job.errorRecords}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Created:
                                        </span>{' '}
                                        {new Date(
                                            job.createdAt,
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="plain"
                                    size="sm"
                                    icon={<HiEye />}
                                    onClick={() => viewJobDetails(job)}
                                >
                                    Details
                                </Button>
                            </div>
                        </div>

                        {job.status === 'processing' && (
                            <div className="mt-3">
                                <div className="bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${(job.processedRecords / job.totalRecords) * 100}%`,
                                        }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {Math.round(
                                        (job.processedRecords /
                                            job.totalRecords) *
                                            100,
                                    )}
                                    % complete
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    )
}

export default JobStatus

import React, { useState, useEffect } from 'react'
import BulkUploadService from '@/services/BulkUploadService'
import type { BulkUploadJob } from '@/@types/parts'
import { Card, Table, Progress, Tag, Button } from '@/components/ui'
import { HiRefresh } from 'react-icons/hi'

const { Tr, Th, Td, THead, TBody } = Table

// A custom hook for polling
const useJobPolling = (
    job: BulkUploadJob,
    onUpdate: (updatedJob: BulkUploadJob) => void,
) => {
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null

        const isProcessing =
            job.status === 'Processing' || job.status === 'Pending'

        if (isProcessing) {
            intervalId = setInterval(async () => {
                try {
                    const updatedJob = await BulkUploadService.getJob(job.jobID)
                    onUpdate(updatedJob)
                    // Stop polling if the job is finished
                    if (
                        updatedJob.status === 'Completed' ||
                        updatedJob.status === 'Failed'
                    ) {
                        if (intervalId) clearInterval(intervalId)
                    }
                } catch (error) {
                    console.error(`Failed to poll job ${job.jobID}`, error)
                    if (intervalId) clearInterval(intervalId) // Stop on error
                }
            }, 3000) // Poll every 3 seconds
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId)
            }
        }
    }, [job.jobID, job.status, onUpdate])
}

interface JobStatusRowProps {
    initialJob: BulkUploadJob
}

const JobStatusRow = ({ initialJob }: JobStatusRowProps) => {
    const [job, setJob] = useState(initialJob)

    useJobPolling(job, (updatedJob) => {
        setJob(updatedJob)
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-emerald-500'
            case 'Processing':
                return 'bg-blue-500'
            case 'Failed':
                return 'bg-red-500'
            default:
                return 'bg-gray-500'
        }
    }

    return (
        <Tr>
            <Td>{job.jobID}</Td>
            <Td>{job.fileName}</Td>
            <Td>
                <Tag className={getStatusColor(job.status)}>{job.status}</Tag>
            </Td>
            <Td>
                <div className="flex items-center gap-2">
                    <Progress
                        percent={job.percentageComplete}
                        className="w-40"
                    />
                    <span>{job.percentageComplete.toFixed(0)}%</span>
                </div>
            </Td>
            <Td>{`${job.successfulRecords} / ${job.totalRecords}`}</Td>
            <Td>
                {job.failedRecords > 0 ? (
                    <a
                        href={`/upload-errors/${job.jobID}`}
                        className="text-red-500 hover:underline"
                    >
                        {job.failedRecords}
                    </a>
                ) : (
                    0
                )}
            </Td>
            <Td>{new Date(job.createdAt).toLocaleString()}</Td>
        </Tr>
    )
}

interface UploadJobsStatusProps {
    onRefresh?: () => void
    className?: string
}

const UploadJobsStatus = ({ onRefresh, className }: UploadJobsStatusProps) => {
    const [jobs, setJobs] = useState<BulkUploadJob[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchJobs = async () => {
        try {
            setLoading(true)
            const data = await BulkUploadService.getJobs()
            setJobs(data || [])
        } catch (error) {
            console.error('Failed to fetch jobs', error)
            setJobs([])
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchJobs()
    }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchJobs()
        onRefresh?.()
    }

    if (loading) {
        return (
            <Card className={className}>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading jobs...</span>
                </div>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">
                    Bulk Upload Job Status
                </h4>
                <Button
                    variant="plain"
                    size="sm"
                    icon={<HiRefresh />}
                    onClick={handleRefresh}
                    loading={refreshing}
                >
                    Refresh
                </Button>
            </div>

            {jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>No upload jobs found.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <THead>
                            <Tr>
                                <Th>Job ID</Th>
                                <Th>File Name</Th>
                                <Th>Status</Th>
                                <Th>Progress</Th>
                                <Th>Success</Th>
                                <Th>Failed</Th>
                                <Th>Created At</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {jobs.map((job) => (
                                <JobStatusRow
                                    key={job.jobID}
                                    initialJob={job}
                                />
                            ))}
                        </TBody>
                    </Table>
                </div>
            )}
        </Card>
    )
}

export default UploadJobsStatus

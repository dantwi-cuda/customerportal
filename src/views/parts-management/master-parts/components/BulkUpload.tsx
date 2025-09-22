import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, Notification, toast } from '@/components/ui'
import { HiUpload, HiEye } from 'react-icons/hi'
import BulkUploadService from '@/services/BulkUploadService'
import type { BulkUploadJob, BulkUploadResponse } from '@/@types/parts'

interface BulkUploadProps {
    type: 'masterparts' | 'supplierparts'
    onUploadStart?: () => void
    onUploadComplete?: () => void
}

const BulkUpload: React.FC<BulkUploadProps> = ({
    type,
    onUploadStart,
    onUploadComplete,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadJob, setUploadJob] = useState<BulkUploadJob | null>(null)

    const handleFileSelect = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        if (
            !file.name.toLowerCase().endsWith('.xlsx') &&
            !file.name.toLowerCase().endsWith('.csv')
        ) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Please select a valid Excel (.xlsx) or CSV file.
                </Notification>,
            )
            return
        }

        setUploading(true)
        onUploadStart?.()

        try {
            let uploadResponse: BulkUploadResponse

            if (type === 'masterparts') {
                uploadResponse =
                    await BulkUploadService.bulkUploadMasterParts(file)
            } else {
                uploadResponse =
                    await BulkUploadService.bulkUploadSupplierParts(file)
            }

            if (uploadResponse.jobID) {
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        {uploadResponse.message ||
                            'File uploaded successfully. Processing started.'}
                    </Notification>,
                )

                // Start polling for job status using the jobID from the response
                pollJobStatus(uploadResponse.jobID)
            } else {
                console.error(
                    'No jobID received from upload response:',
                    uploadResponse,
                )
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Upload started but job ID is missing. Please refresh the
                        page to check status.
                    </Notification>,
                )
            }
        } catch (error) {
            console.error('Failed to upload file:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to upload file.
                </Notification>,
            )
        } finally {
            setUploading(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const pollJobStatus = async (jobId: string | number) => {
        if (!jobId) {
            console.error('Cannot poll job status: jobId is undefined')
            return
        }

        const maxAttempts = 60 // Poll for up to 5 minutes
        let attempts = 0

        const poll = async () => {
            try {
                const job = await BulkUploadService.getJob(jobId)
                setUploadJob(job)

                if (job.status === 'Completed' || job.status === 'Failed') {
                    if (job.status === 'Completed') {
                        toast.push(
                            <Notification
                                title="Success"
                                type="success"
                                duration={5000}
                            >
                                Upload completed successfully! Processed{' '}
                                {job.successfulRecords || 0} records.
                            </Notification>,
                        )
                        onUploadComplete?.()
                    } else {
                        toast.push(
                            <Notification
                                title="Error"
                                type="danger"
                                duration={5000}
                            >
                                Upload failed. Please check the errors and try
                                again.
                            </Notification>,
                        )
                    }
                    return
                }

                attempts++
                if (attempts < maxAttempts) {
                    setTimeout(poll, 5000) // Poll every 5 seconds
                }
            } catch (error) {
                console.error('Failed to check job status:', error)
            }
        }

        poll()
    }

    const viewJobDetails = async () => {
        if (!uploadJob || !uploadJob.jobID) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    No job ID available to fetch details.
                </Notification>,
            )
            return
        }

        try {
            const job = await BulkUploadService.getJob(uploadJob.jobID)
            const errors =
                job.failedRecords && job.failedRecords > 0
                    ? await BulkUploadService.getJobErrors(uploadJob.jobID)
                    : []

            // You can implement a modal or navigate to a details page here
            console.log('Job details:', job)
            console.log('Job errors:', errors)

            toast.push(
                <Notification title="Info" type="info" duration={3000}>
                    Job details logged to console. You can implement a detailed
                    view here.
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'text-green-600 bg-green-100'
            case 'Failed':
                return 'text-red-600 bg-red-100'
            case 'Processing':
                return 'text-blue-600 bg-blue-100'
            case 'Pending':
                return 'text-yellow-600 bg-yellow-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    }

    return (
        <Card className="p-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold mb-2">
                        Bulk Upload{' '}
                        {type === 'masterparts'
                            ? 'Master Parts'
                            : 'Supplier Parts'}
                    </h3>
                    <p className="text-gray-600">
                        Upload an Excel (.xlsx) or CSV file to import multiple{' '}
                        {type === 'masterparts'
                            ? 'master parts'
                            : 'supplier parts'}{' '}
                        at once.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="solid"
                        icon={<HiUpload />}
                        onClick={handleFileSelect}
                        loading={uploading}
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Select File'}
                    </Button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                {uploadJob && (
                    <div className="border-t pt-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">
                                    Upload Status:
                                </span>
                                <span
                                    className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(uploadJob.status || 'Pending')}`}
                                >
                                    {(
                                        uploadJob.status || 'Pending'
                                    ).toUpperCase()}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">
                                        Total Records:
                                    </span>
                                    <div className="font-medium">
                                        {uploadJob.totalRecords || 0}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-600">
                                        Processed:
                                    </span>
                                    <div className="font-medium">
                                        {uploadJob.processedRecords || 0}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-600">
                                        Errors:
                                    </span>
                                    <div className="font-medium text-red-600">
                                        {uploadJob.failedRecords || 0}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-gray-600">File:</span>
                                    <div className="font-medium truncate">
                                        {uploadJob.fileName || 'Unknown'}
                                    </div>
                                </div>
                            </div>

                            {(uploadJob.status === 'Completed' ||
                                uploadJob.status === 'Failed') && (
                                <div className="flex justify-end">
                                    <Button
                                        variant="plain"
                                        size="sm"
                                        icon={<HiEye />}
                                        onClick={viewJobDetails}
                                    >
                                        View Details
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

export default BulkUpload

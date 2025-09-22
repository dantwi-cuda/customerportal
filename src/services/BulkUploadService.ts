import ApiService from './ApiService'
import type { 
    BulkUploadJob, 
    BulkUploadError,
    BulkUploadResponse
} from '@/@types/parts'
import type {
    BulkUploadStatusDto,
    BulkUploadJobDto,
    BulkUploadErrorDto
} from '@/@types/accounting'

const BulkUploadService = {
    // Bulk upload master parts
    bulkUploadMasterParts: async (file: File): Promise<BulkUploadResponse> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            
            const result = await ApiService.fetchDataWithAxios<BulkUploadResponse>({
                url: 'BulkUpload/master-parts',
                method: 'post',
                data: formData as unknown as Record<string, unknown>,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            return result
        } catch (error) {
            console.error('Failed to upload master parts file:', error)
            throw error
        }
    },

    // Bulk upload supplier parts
    bulkUploadSupplierParts: async (file: File): Promise<BulkUploadResponse> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            
            const result = await ApiService.fetchDataWithAxios<BulkUploadResponse>({
                url: 'BulkUpload/supplier-parts',
                method: 'post',
                data: formData as unknown as Record<string, unknown>,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            return result
        } catch (error) {
            console.error('Failed to upload supplier parts file:', error)
            throw error
        }
    },

    // Get all upload jobs
    getJobs: async (): Promise<BulkUploadJob[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<BulkUploadJob[]>({
                url: 'BulkUpload/jobs',
                method: 'get',
            })
            return result
        } catch (error) {
            console.error('Failed to fetch upload jobs:', error)
            throw error
        }
    },

    // Get specific job details
    getJob: async (jobId: string | number): Promise<BulkUploadJob> => {
        try {
            const result = await ApiService.fetchDataWithAxios<BulkUploadJob>({
                url: `BulkUpload/status/${jobId}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch job ${jobId}:`, error)
            throw error
        }
    },

    // Get job error details
    getJobErrors: async (jobId: string | number): Promise<BulkUploadError[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<BulkUploadError[]>({
                url: `BulkUpload/errors/${jobId}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch errors for job ${jobId}:`, error)
            throw error
        }
    },

    // Get job status (for async operations)
    getJobStatus: async (jobId: string | number): Promise<BulkUploadStatusDto> => {
        try {
            const result = await ApiService.fetchDataWithAxios<BulkUploadStatusDto>({
                url: `BulkUpload/status/${jobId}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch status for job ${jobId}:`, error)
            throw error
        }
    },

    // Get all bulk upload jobs
    getBulkUploadJobs: async (): Promise<BulkUploadJobDto[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<BulkUploadJobDto[]>({
                url: 'BulkUpload/jobs',
                method: 'get',
            })
            return result
        } catch (error) {
            console.error('Failed to fetch bulk upload jobs:', error)
            throw error
        }
    },

    // Get bulk upload errors by job ID
    getBulkUploadErrors: async (jobId: string | number): Promise<BulkUploadErrorDto[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<BulkUploadErrorDto[]>({
                url: `BulkUpload/errors/${jobId}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch bulk upload errors for job ${jobId}:`, error)
            throw error
        }
    },
}

export default BulkUploadService

import ApiService from './ApiService'
import type { 
    BulkUploadJob, 
    BulkUploadError 
} from '@/@types/parts'

const BulkUploadService = {
    // Bulk upload master parts
    bulkUploadMasterParts: async (file: File): Promise<BulkUploadJob> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            
            const result = await ApiService.fetchDataWithAxios<BulkUploadJob>({
                url: 'bulkupload/masterparts',
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
    bulkUploadSupplierParts: async (file: File): Promise<BulkUploadJob> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            
            const result = await ApiService.fetchDataWithAxios<BulkUploadJob>({
                url: 'bulkupload/supplierparts',
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
                url: 'bulkupload/jobs',
                method: 'get',
            })
            return result
        } catch (error) {
            console.error('Failed to fetch upload jobs:', error)
            throw error
        }
    },

    // Get specific job details
    getJob: async (jobId: string): Promise<BulkUploadJob> => {
        try {
            const result = await ApiService.fetchDataWithAxios<BulkUploadJob>({
                url: `bulkupload/jobs/${jobId}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch job ${jobId}:`, error)
            throw error
        }
    },

    // Get job error details
    getJobErrors: async (jobId: string): Promise<BulkUploadError[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<BulkUploadError[]>({
                url: `bulkupload/jobs/${jobId}/errors`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch errors for job ${jobId}:`, error)
            throw error
        }
    },
}

export default BulkUploadService

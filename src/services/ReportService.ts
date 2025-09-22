import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type { 
    Report, 
    ReportCategory, 
    ReportWorkspace, 
    ReportEmbedToken 
} from '@/@types/report'

// Report APIs
export async function getReportsList(filters?: { 
    workspaceId?: string, 
    categoryId?: string,
    category?: string,
    Category?: string, // Add support for capital C
    search?: string 
}) {
    // Handle both category and Category parameters
    const params = { ...filters }
    if (params.category && !params.Category) {
        params.Category = params.category
        delete params.category
    }
    
    console.log('ReportService.getReportsList called with params:', params)
    
    return ApiService.fetchDataWithAxios<Report[]>({
        url: '/api/Report',
        method: 'get',
        params
    })
}

export async function getReportDetails(reportId: string) {
    return ApiService.fetchDataWithAxios<Report>({
        url: `/api/Report/${reportId}`,
        method: 'get'
    })
}

export async function createReport(report: Partial<Report>) {
    return ApiService.fetchDataWithAxios<Report>({
        url: '/api/Report',
        method: 'post',
        data: report
    })
}

export async function updateReport(reportId: string, report: Partial<Report>) {
    return ApiService.fetchDataWithAxios<Report>({
        url: `/api/Report/${reportId}`,
        method: 'put',
        data: report
    })
}

export async function deleteReport(reportId: string) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/Report/${reportId}`,
        method: 'delete'
    })
}

export async function getReportEmbedToken(reportId: string) {
    return ApiService.fetchDataWithAxios<ReportEmbedToken>({
        url: `/api/Report/${reportId}/embed-config`,
        method: 'get'
    })
}

// Test dataset access for debugging
export async function testDatasetAccess(reportId: string) {
    try {
        console.log('🔍 Testing dataset access for report:', reportId)
        
        // Try to get dataset information through the report
        const response = await ApiService.fetchDataWithAxios({
            url: `/api/Report/${reportId}/dataset-info`,
            method: 'get'
        })
        
        console.log('✅ Dataset access test successful:', response)
        return { hasAccess: true, details: response }
    } catch (error) {
        console.log('❌ Dataset access test failed:', error)
        return { hasAccess: false, error }
    }
}

// Get detailed embed token with dataset permissions
export async function getReportEmbedTokenWithDatasetAccess(reportId: string) {
    try {
        console.log('🔍 Requesting embed token with dataset access for report:', reportId)
        
        const response = await ApiService.fetchDataWithAxios<ReportEmbedToken>({
            url: `/api/Report/${reportId}/embed-config`,
            method: 'get',
            params: {
                includeDatasetAccess: true, // Request dataset access explicitly
                permissions: 'All' // Request all permissions to test
            }
        })
        
        console.log('✅ Embed token with dataset access received:', {
            hasToken: !!response.embedToken,
            tokenLength: response.embedToken?.length,
            reportId: response.reportId,
            embedUrl: response.embedUrl,
            expiration: response.expiresInMinutes,
            datasetId: response.datasetId,
            datasetName: response.datasetName,
            isEffectiveIdentityRequired: response.isEffectiveIdentityRequired,
            isEffectiveIdentityRolesRequired: response.isEffectiveIdentityRolesRequired,
        })
        
        return response
    } catch (error) {
        console.log('❌ Failed to get embed token with dataset access:', error)
        throw error
    }
}

// Get embed token with effective identity for RLS-enabled reports
export async function getReportEmbedTokenWithRLS(reportId: string, effectiveIdentity?: {
    username: string
    roles?: string[]
    datasets: string[]
}) {
    try {
        console.log('🔍 Requesting embed token with RLS identity for report:', reportId)
        
        const response = await ApiService.fetchDataWithAxios<ReportEmbedToken>({
            url: `/api/Report/${reportId}/embed-config`,
            method: 'get',
            params: {
                effectiveIdentity: effectiveIdentity
            }
        })
        
        console.log('✅ Embed token with RLS received:', response)
        return response
    } catch (error) {
        console.log('❌ Failed to get embed token with RLS:', error)
        throw error
    }
}

export async function bulkApproveReports(reportIds: string[]) {
    return ApiService.fetchDataWithAxios<void>({
        url: '/api/Report/bulk/approve',
        method: 'post',
        data: { reportIds }
    })
}

export async function bulkApproveReportsNew(reportIds: number[], isApproved: boolean) {
    return ApiService.fetchDataWithAxios<void>({
        url: '/api/Report/bulk/approve',
        method: 'post',
        data: { reportIds, isApproved }
    })
}

export async function bulkSetReportStatus(reportIds: number[], isEnabled: boolean) {
    return ApiService.fetchDataWithAxios<void>({
        url: '/api/Report/bulk/set-status',
        method: 'post',
        data: { reportIds, isEnabled }
    })
}

export async function bulkChangeReportCategory(reportIds: string[], categoryId: number) {
    return ApiService.fetchDataWithAxios<void>({
        url: '/api/Report/bulk/change-category',
        method: 'post',
        data: { reportIds, categoryId }
    })
}

export async function assignRolesToReport(reportId: string, roleIds: string[]) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/Report/${reportId}/assign-roles`,
        method: 'post',
        data: { roleIds }
    })
}

export async function assignUsersToReport(reportId: string, userIds: string[]) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/Report/${reportId}/assign-users`,
        method: 'post',
        data: { userIds }
    })
}

// Report Categories APIs
export async function getCategories() {
    return ApiService.fetchDataWithAxios<ReportCategory[]>({
        url: '/api/report-categories',
        method: 'get'
    })
}

export async function getCategoryById(categoryId: number) {
    return ApiService.fetchDataWithAxios<ReportCategory>({
        url: `/api/report-categories/${categoryId}`,
        method: 'get'
    })
}

export async function createCategory(category: Partial<ReportCategory>) {
    return ApiService.fetchDataWithAxios<ReportCategory>({
        url: '/api/report-categories',
        method: 'post',
        data: category
    })
}

export async function updateCategory(categoryId: number, category: Partial<ReportCategory>) {
    return ApiService.fetchDataWithAxios<ReportCategory>({
        url: `/api/report-categories/${categoryId}`,
        method: 'put',
        data: category
    })
}

export async function deleteCategory(categoryId: number) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/report-categories/${categoryId}`,
        method: 'delete'
    })
}

export async function setDefaultCategory(categoryId: number) {
    return ApiService.fetchDataWithAxios<ReportCategory>({
        url: `/api/report-categories/${categoryId}/set-default`,
        method: 'put'
    })
}

export async function assignRolesToCategory(categoryId: number, roleIds: string[]) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/report-categories/${categoryId}/assign-roles`,
        method: 'put',
        data: roleIds as unknown as Record<string, unknown>
    })
}

export async function assignUsersToCategory(categoryId: number, userIds: string[]) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/report-categories/${categoryId}/assign-users`,
        method: 'put',
        data: userIds as unknown as Record<string, unknown>
    })
}

// Workspaces APIs
export async function getWorkspaces() {
    return ApiService.fetchDataWithAxios<ReportWorkspace[]>({
        url: '/api/Workspace',
        method: 'get'
    })
}

export async function pinReport(reportId: string) {
    return ApiService.fetchDataWithAxios({
        url: `${endpointConfig.reports.pin}/${reportId}`,
        method: 'post'
    })
}

export async function unpinReport(reportId: string) {
    return ApiService.fetchDataWithAxios({
        url: `${endpointConfig.reports.unpin}/${reportId}`,
        method: 'post'
    })
}

export async function getPinnedReports() {
    return ApiService.fetchDataWithAxios<Report[]>({
        url: endpointConfig.reports.pinned,
        method: 'get'
    })
}

export async function assignReportsToUser(userId: string, reportIds: number[]) {
    return ApiService.fetchDataWithAxios<void>({
        url: '/api/Report/bulk/assign-reports-to-user',
        method: 'post',
        data: {
            userId,
            reportIds
        }
    })
}

// User Report Favorites APIs
export async function addToFavorites(reportId: number, note?: string) {
    return ApiService.fetchDataWithAxios<void>({
        url: '/api/UserReportFavorite',
        method: 'post',
        data: { reportId, note }
    })
}

export async function removeFromFavorites(reportId: number) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/UserReportFavorite/${reportId}`,
        method: 'delete'
    })
}

export async function getFavoriteReports() {
    return ApiService.fetchDataWithAxios<Report[]>({
        url: '/api/UserReportFavorite',
        method: 'get'
    })
}

export async function isReportFavorited(reportId: number) {
    return ApiService.fetchDataWithAxios<{ isFavorited: boolean }>({
        url: `/api/UserReportFavorite/${reportId}/is-favorited`,
        method: 'get'
    })
}

export async function updateFavoriteNote(reportId: number, note: string) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/UserReportFavorite/${reportId}`,
        method: 'put',
        data: { note }
    })
}

// Default export
const ReportService = {
    getReportsList,
    getReports: getReportsList, // Alias for compatibility
    getReportDetails,
    createReport,
    updateReport,
    deleteReport,
    getReportEmbedToken,
    getReportEmbedTokenWithDatasetAccess,
    getReportEmbedTokenWithRLS,
    testDatasetAccess,
    bulkApproveReports,
    bulkApproveReportsNew,
    bulkSetReportStatus,
    bulkChangeReportCategory,
    assignRolesToReport,
    assignUsersToReport,
    assignReportsToUser,
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    setDefaultCategory,
    assignRolesToCategory,
    assignUsersToCategory,
    getWorkspaces,
    pinReport,
    unpinReport,
    getPinnedReports,
    addToFavorites,
    removeFromFavorites,
    getFavoriteReports,
    isReportFavorited,
    updateFavoriteNote,
}

export default ReportService
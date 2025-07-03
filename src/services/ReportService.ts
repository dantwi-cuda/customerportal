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
    search?: string 
}) {
    return ApiService.fetchDataWithAxios<Report[]>({
        url: '/api/Report',
        method: 'get',
        params: filters
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

export async function bulkApproveReports(reportIds: string[]) {
    return ApiService.fetchDataWithAxios<void>({
        url: '/api/Report/bulk/approve',
        method: 'post',
        data: { reportIds }
    })
}

export async function bulkSetReportStatus(reportIds: string[], isEnabled: boolean) {
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

// Default export
const ReportService = {
    getReportsList,
    getReportDetails,
    createReport,
    updateReport,
    deleteReport,
    assignReportsToUser
}

export default ReportService
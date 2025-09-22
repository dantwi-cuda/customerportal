export type Report = {
    id: string
    name: string
    tenantDisplayName?: string
    tenantDescription?: string
    isTenantCustomized?: boolean
    originalName?: string
    description?: string
    powerBiReportId: string
    powerBiReportDescription?: string
    webUrl?: string
    embedUrl?: string
    reportType?: string
    datasetId?: string
    workspaceId: number
    workspaceName?: string
    reportCategoryId?: number
    tenantReportCategoryId?: number | null
    categoryName?: string
    isTenantApproved: boolean
    isTenantEnabled: boolean
    // Legacy fields for backward compatibility
    isApproved?: boolean
    isEnabled?: boolean
    status: string
    thumbnailUrl?: string
    isPinned?: boolean
    lastAccessed?: string
    createdAt: string
    updatedAt?: string
    createdBy?: string | null
    lastUpdatedBy?: string | null
    assignedRoles?: string[] | null
    assignedUsers?: string[]
    assignedUserIds?: string[] | null
    type?: string
    lastUpdated?: string
}

export type ReportData = {
    summary?: string
    columns?: string[]
    rows?: (string | number)[][]
    metrics?: Record<string, number | string>
    lastRefreshed?: string
}

export type ReportCategory = {
    id: number
    name: string
    systemName?: string
    description?: string
    isDefault: boolean
    isActive: boolean
    displayOrder: number
    customerId: number
    customerName?: string
    assignedRoles?: string[]
    assignedUserIds?: string[]
    createdAt?: string
    updatedAt?: string
}

export type ReportWorkspace = {
    id: string
    name: string
    description: string
    reportCount: number
}

export type ReportEmbedToken = {
    embedToken: string
    embedUrl: string
    reportId: string
    expiresInMinutes: number
    datasetId: string
    datasetName?: string | null
    isEffectiveIdentityRequired: boolean
    isEffectiveIdentityRolesRequired: boolean
}
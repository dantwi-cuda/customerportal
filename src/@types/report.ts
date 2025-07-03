export type Report = {
    id: string
    name: string
    originalName: string
    description: string
    powerBiReportId: string
    workspaceId: number
    reportCategoryId: number
    isApproved: boolean
    isEnabled: boolean
    status: string
    embedUrl?: string
    workspaceName?: string
    categoryName?: string
    thumbnailUrl?: string
    isPinned?: boolean
    lastAccessed?: string
    createdAt: string
    updatedAt?: string
    assignedRoles?: string[]
    assignedUsers?: string[]
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
    token: string
    tokenId: string
    expiration: string
}
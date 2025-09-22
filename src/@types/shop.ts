export interface Shop {
    id: number
    name: string
    source: string
    postalCode: string
    city: string
    state: string
    country: string
    isActive: boolean
    businessKey?: string
    parentID?: number | null
    isTenantActive?: boolean
    isTenantDeleted?: boolean
    tenantAssignedAt?: string
    tenantAssignedBy?: string
    programNames: string[]
    assignedUserNames?: string[]
    kpIs: ShopKpi[]
}

export interface ShopPaginatedResponse {
    shops: Shop[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
}

export interface ShopKpi {
    id: number
    shopId: number
    kpiName: string
    kpiValue: number
    kpiTarget: number
    lastUpdated: string
}

export interface ShopKpiRecentViewDto {
    id: number
    shopAttributeId: number
    shopId: number
    kpiYear: number
    kpiMonth: number
    kpiValue: number | null
    kpiGoal: number | null
    kpiThreshold: number | null
    rowModifiedBy: string | null
    rowModifiedOn: string | null
    kpibmsValue: number | null
    attributeName: string | null
    categoryDescription: string | null
    unitType: string | null
}

export interface ShopDto {
    id?: number
    name: string
    source?: string
    postalCode?: string
    city?: string
    state?: string
    country?: string
    isActive: boolean
    programNames?: string[]
    kpIs?: ShopKpi[]
}

export interface ShopFilters {
    searchText?: string
    city?: string
    state?: string
    program?: string
    isActive?: boolean
    startDate?: string
    endDate?: string
}

export interface ShopListParams extends ShopFilters {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface AssignProgramsRequest {
    programIds: number[]
}

export interface AssignUsersRequest {
    userIds: number[]
}

// Shop Attribute Types
export interface ShopAttributeDto {
    id: number
    attributeType: string | null
    sortOrder: number
    attributeCategoryId: number
    attributeCategoryDescription: string | null
    attributeName: string | null
    attributeUnitId: number
    attributeUnitType: string | null
    attributeUnitIsTable: boolean
    validationString: string | null
    rowCreatedDate: string
    rowCreatedBy: string | null
    rowModifiedDate: string | null
    rowModifiedBy: string | null
}

export interface CreateShopAttributeDto {
    attributeType: string | null
    sortOrder: number
    attributeCategoryId: number
    attributeName: string | null
    attributeUnitId: number
    validationString: string | null
}

export interface UpdateShopAttributeDto {
    attributeType: string | null
    sortOrder: number
    attributeCategoryId: number
    attributeName: string | null
    attributeUnitId: number
    validationString: string | null
}

// Attribute Category Types
export interface AttributeCategoryDto {
    id: number
    description: string | null
    rowCreatedDate: string
    rowCreatedBy: string | null
    rowModifiedDate: string | null
    rowModifiedBy: string | null
}

export interface CreateAttributeCategoryDto {
    description: string
}

export interface UpdateAttributeCategoryDto {
    description: string
}

// Attribute Unit Types
export interface AttributeUnitDto {
    id: number
    type: string | null
    isTable: boolean
    rowCreatedDate: string
    rowCreatedBy: string | null
    rowModifiedDate: string | null
    rowModifiedBy: string | null
}

export interface CreateAttributeUnitDto {
    type: string
    isTable: boolean
}

export interface UpdateAttributeUnitDto {
    type: string
    isTable: boolean
}

// List and Filter Types
export interface ShopAttributeFilters {
    searchText?: string
    categoryId?: number
    unitId?: number
    attributeType?: string
}

export interface ShopAttributeListParams extends ShopAttributeFilters {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

// Shop Properties Types
export interface ShopPropertiesDto {
    id: number
    shopAttributeId: number
    shopId: number
    propertyYear: number
    propertyMonth: number
    propertyValue: number | null
    rowModifiedBy: string | null
    rowModifiedOn: string | null
    attributeName: string | null
    attributeCategoryDescription: string | null
    attributeUnitType: string | null
}

export interface CreateShopPropertiesDto {
    shopAttributeId: number
    shopId: number
    propertyYear: number
    propertyMonth: number
    propertyValue: number | null
}

export interface UpdateShopPropertiesDto {
    propertyYear: number
    propertyMonth: number
    propertyValue: number | null
}

export interface ShopPropertyBulkUpdateItem {
    id: number
    propertyValue: number | null
}

export interface BulkUpdateShopPropertiesDto {
    updates: ShopPropertyBulkUpdateItem[]
}

export interface ShopPropertiesFilters {
    shopId?: number
    year?: number
    month?: number
    searchText?: string
    attributeCategoryId?: number
    attributeName?: string
}

export interface ShopPropertiesListParams extends ShopPropertiesFilters {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

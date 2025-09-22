export interface Manufacturer {
    manufacturerID: number
    manufacturerName: string
    contactInfo: string
    address: string
    website: string
    isActive: boolean
}

export interface Brand {
    brandID: number
    brandName: string
    description: string
    isActive: boolean
    manufacturerID: number
    manufacturerName: string
}

export interface Supplier {
    supplierID: number
    supplierName: string
    contactInfo: string
    address: string
    website: string
    isActive: boolean
}

export interface PartCategory {
    partCategoryID: number
    partCategoryName: string
}

export interface MasterPart {
    partID: number
    manufacturerID: number
    manufacturerName: string
    brandID: number
    brandName: string
    partCategoryID: number
    partCategoryName: string
    partNumber: string
    uniqueCode: string
    description: string
    sizeUnitOfSale: string
}

export interface SupplierPart {
    partID: number
    supplierID: number
    supplierName: string
    manufacturerID: number
    manufacturerName: string
    brandID: number
    brandName: string
    partCategoryID: number
    partCategoryName: string
    supplierPartNumber: string
    description: string
    sizeUnitOfSale: string
}

export interface BulkUploadResponse {
    jobID: number
    message: string
}

export interface BulkUploadJob {
    jobID: number
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled'
    percentageComplete: number
    fileName: string
    totalRecords: number
    processedRecords: number
    successfulRecords: number
    failedRecords: number
    createdAt: string
    // ... any other fields
}

export interface BulkUploadError {
    rowNumber: number
    field: string
    message: string
    value: string
}

// Request types for creating/updating
export interface CreateManufacturerRequest {
    manufacturerName: string
    contactInfo: string
    address: string
    website: string
    isActive: boolean
}

export interface UpdateManufacturerRequest extends CreateManufacturerRequest {}

export interface CreateBrandRequest {
    brandName: string
    description: string
    isActive: boolean
    manufacturerID: number
}

export interface UpdateBrandRequest extends CreateBrandRequest {}

export interface CreateSupplierRequest {
    supplierName: string
    contactInfo: string
    address: string
    website: string
    isActive: boolean
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {}

export interface CreatePartCategoryRequest {
    partCategoryName: string
}

export interface UpdatePartCategoryRequest extends CreatePartCategoryRequest {}

export interface CreateMasterPartRequest {
    manufacturerID: number
    brandID: number
    partCategoryID: number
    partNumber: string
    uniqueCode: string
    description: string
    sizeUnitOfSale: string
}

export interface UpdateMasterPartRequest extends CreateMasterPartRequest {}

export interface CreateSupplierPartRequest {
    supplierID: number
    manufacturerID: number
    brandID: number
    partCategoryID: number
    supplierPartNumber: string
    description: string
    sizeUnitOfSale: string
}

export interface UpdateSupplierPartRequest extends CreateSupplierPartRequest {}

// Match Parts - for matching supplier parts to master parts
export interface PartMatch {
    matchID: number
    masterPartID: number
    supplierPartID: number
    matchedBy: string
    matchDate: string
    matchStatus: 'Pending' | 'Approved' | 'Rejected'
    confidenceScore?: number
    notes?: string
    // Master part details
    masterPartNumber: string
    masterPartDescription: string
    masterPartManufacturer: string
    masterPartBrand: string
    // Supplier part details
    supplierPartNumber: string
    supplierPartDescription: string
    supplierName: string
}

export interface CreatePartMatchRequest {
    masterPartID: number
    supplierPartID: number
    notes?: string
}

export interface UpdatePartMatchRequest {
    matchStatus: 'Pending' | 'Approved' | 'Rejected'
    notes?: string
}

export interface SuggestMatchesRequest {
    masterPartID?: number
    supplierPartID?: number
    threshold?: number
}

export interface MatchSuggestion {
    masterPartID: number
    supplierPartID: number
    confidenceScore: number
    matchReasons: string[]
    masterPart: {
        partNumber: string
        description: string
        manufacturer: string
        brand: string
    }
    supplierPart: {
        partNumber: string
        description: string
        supplier: string
    }
}

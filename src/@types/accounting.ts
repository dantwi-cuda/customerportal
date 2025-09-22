export interface PotentialMatch {
    matchingID: number
    masterChartOfAccountID: number
    masterAccountName: string
    masterAccountNumber: string
    masterAccountDescription: string
    matchingConfidence: number
    matchingMethod: string
    matchingStatus: string
    matchingDetails: string
    createdDate: string
    reviewedBy?: string
    reviewedDate?: string
}

export interface ConfirmedMatch {
    matchingID: number
    masterChartOfAccountID: number
    masterAccountName: string
    masterAccountNumber: string
    masterAccountDescription: string
    matchingConfidence: number
    matchingMethod: string
    matchingStatus: string
    matchingDetails: string
    createdDate: string
    reviewedBy?: string
    reviewedDate?: string
}

export interface ChartOfAccount {
    chartOfAccountsID: number
    programID: number
    tenantID?: number
    shopID?: number
    accountName?: string
    accountNumber?: string
    accountDescription?: string
    accountType?: string
    drCrDefault?: string
    lineType?: string
    coASequenceNumber?: number
    indentLevel?: number
    parentCoA?: string
    rowCreatedDate?: string
    rowCreatedBy?: string
    effectiveDate?: string
    expiryDate?: string
    rowModifiedBy?: string
    rowModifiedDate?: string
    isMapped: boolean
    masterChartOfAccountID?: number
    matchingConfidence?: number
    matchingMethod?: string
    matchingStatus?: string
    matchingDetails?: string
    reviewedBy?: string
    reviewedDate?: string
    isActive: boolean
    isMasterAccount: boolean
    programName?: string
    tenantName?: string
    shopName?: string
    masterAccountName?: string
    potentialMatches?: PotentialMatch[]
    confirmedMatch?: ConfirmedMatch
}

export interface ChartOfAccountResponse {
    chartOfAccounts: ChartOfAccount[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
}

export interface CreateChartOfAccountDto {
    programID: number
    shopID?: number
    accountName?: string
    accountNumber?: string
    accountDescription?: string
    accountType?: string
    drCrDefault?: string
    lineType?: string
    coASequenceNumber?: number
    indentLevel?: number
    parentCoA?: string
    effectiveDate?: string
    expiryDate?: string
    isActive?: boolean
}

export interface UpdateChartOfAccountDto {
    accountName?: string
    accountNumber?: string
    accountDescription?: string
    accountType?: string
    drCrDefault?: string
    lineType?: string
    coASequenceNumber?: number
    indentLevel?: number
    parentCoA?: string
    effectiveDate?: string
    expiryDate?: string
    isActive?: boolean
}

export interface BulkUploadResponseDto {
    jobID: number
    message: string | null
    success: boolean
}

export interface BulkUploadStatusDto {
    jobID: number
    status: string | null
    percentageComplete: number
    totalRecords: number
    processedRecords: number
    successfulRecords: number
    failedRecords: number
    errorMessage: string | null
    errors: BulkUploadErrorDto[] | null
}

export interface BulkUploadJobDto {
    jobID: number
    fileName: string
    uploadDate: string
    status: string
    percentageComplete: number
    totalRecords: number
    processedRecords: number
    successfulRecords: number
    failedRecords: number
}

export interface BulkUploadErrorDto {
    errorID: number
    jobID: number
    rowNumber: number
    columnName: string | null
    errorMessage: string
    errorType: string | null
}

// Matching-related types
export interface AccountMatchingDto {
    matchingID: number
    shopChartOfAccountID: number
    masterChartOfAccountID: number
    matchingConfidence: number
    matchingMethod: string
    matchingStatus: string
    matchingDetails?: string
    createdDate: string
    reviewedBy?: string
    reviewedDate?: string
    shopAccountName?: string
    shopAccountNumber?: string
    masterAccountName?: string
    masterAccountNumber?: string
}

export interface AutoMatchResultDto {
    message: string
    matchedAccounts: number
    totalProcessed: number
    highConfidenceMatches: number
    subsetMatches: number
    averageConfidence: number
}

export interface MatchingStatisticsDto {
    totalShopAccounts: number
    matchedAccounts: number
    potentialMatches: number
    unmatchedAccounts: number
    matchRate: number
    highConfidenceMatches: number
    subsetMatches: number
    averageConfidence: number
}

export interface CreateManualMatchRequest {
    shopChartOfAccountID: number
    masterChartOfAccountID: number
    matchingConfidence: number
    matchingMethod: string
    matchingDetails?: string
    matchingStatus?: string
}

export interface ConfirmMatchRequest {
    matchingIDs: number[]
    action: "Confirm" | "Reject"
}

export interface ResetMatchingDto {
    matchingIDs?: number[]
    chartOfAccountIDs?: number[]
}

export interface ExcelColumnInfo {
    columnName: string
    columnType: string
    suggestedMapping?: string
    sampleValues?: string[]
}

export interface MasterChartUploadFilters {
    searchTerm?: string
    programID?: number
    shopID?: number
    accountType?: string
    isActive?: boolean
    isMasterAccount?: boolean
    pageNumber?: number
    pageSize?: number
}

export interface ExcelSheetInfo {
    sheetName: string
    rowCount: number
    columnCount: number
}

export interface ExcelSheetPreview {
    sheetName: string
    headers: string[]
    data: any[][]
    totalRows: number
}

export interface ExcelFileAnalysis {
    fileName: string
    sheets: ExcelSheetInfo[]
    file: File
}

// Shop Chart of Account with Column Mapping Types
export interface StagedDataResponseDto {
    jobID: number
    fileName: string
    totalRows: number
    detectedColumns: DetectedColumn[]
    sampleData: StagedDataRow[]
    status: string
    message: string
}

export interface DetectedColumn {
    columnName: string
    columnIndex: number
    hasHeader: boolean
    suggestedMapping?: string
    sampleValues: string[]
}

export interface StagedDataRow {
    stagingID: number
    rowNumber: number
    columnData: Record<string, any>
    status: string
}

export interface MappingField {
    fieldName: string
    displayName: string
    isRequired: boolean
    description: string
    dataType: string
}

export interface ColumnMapping {
    sourceColumn: string
    targetField: string
    isRequired: boolean
}

export interface ApplyMappingsRequest {
    jobID: number
    columnMappings: ColumnMapping[]
}

export interface ApplyMappingsResponse {
    jobID: number
    success: boolean
    message: string
    mappedRows: number
    failedRows: number
    validationErrors: string[]
}

export interface ApplyMappingsAndImportResponse {
    success: boolean
    message: string
    processedRecords: number
    successfulRecords: number
    failedRecords: number
    chartOfAccounts: ChartOfAccount[]
    errors: string[]
}

export interface ImportMappedResponse {
    jobID: number
    success: boolean
    message: string
    totalProcessed: number
    successfulImports: number
    failedImports: number
    errors: string[]
}

export interface ShopChartUploadFilters {
    searchTerm?: string
    programID?: number
    shopID?: number
    accountType?: string
    isActive?: boolean
    pageNumber?: number
    pageSize?: number
    matchingStatus?: string
}

export interface ProgramAccountType {
    programId: number
    accountType: string
    numOfAccounts: number
}

export interface ProgramAccountTypesResponse {
    accountTypes: ProgramAccountType[]
    totalPrograms: number
    totalAccountTypes: number
}

// General Ledger Types
export interface GeneralLedgerImportFormatDto {
    formatType: string
    description: string
    requiredFields: string[]
}

export interface GeneralLedgerEntry {
    entryId: number
    programId: number
    shopId: number
    accountNumber: string
    accountName?: string
    description: string
    amount: number
    debitAmount?: number
    creditAmount?: number
    transactionDate: string
    periodDate: string
    referenceNumber?: string
    createdDate: string
    createdBy: string
}

export interface ExistingGeneralLedgerResponse {
    entries: GeneralLedgerEntry[]
    totalRecords: number
}

export interface AutoMatchStatisticsDto {
    totalAccounts: number
    matchedAccounts: number
    unmatchedAccounts: number
    matchingPercentage: number
}

export interface StagedGeneralLedgerData {
    jobId: string
    fileName: string
    totalRows: number
    detectedColumns: DetectedColumn[]
    previewData: Record<string, any>[]
    errors?: string[]
    warnings?: string[]
}

export interface GeneralLedgerMappingRequest {
    mappings: ColumnMapping[]
    importDate: string
    periodDate: string
}

export interface GeneralLedgerImportResult {
    success: boolean
    totalRecords: number
    successfulRecords: number
    failedRecords: number
    errors: string[]
    warnings: string[]
}

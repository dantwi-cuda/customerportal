import ApiService from './ApiService'
import type {
    ChartOfAccount,
    ChartOfAccountResponse,
    CreateChartOfAccountDto,
    UpdateChartOfAccountDto,
    BulkUploadResponseDto,
    StagedDataResponseDto,
    MasterChartUploadFilters,
    ShopChartUploadFilters,
    MappingField,
    ApplyMappingsRequest,
    ApplyMappingsResponse,
    ApplyMappingsAndImportResponse,
    ImportMappedResponse,
    ColumnMapping,
    AccountMatchingDto,
    AutoMatchResultDto,
    MatchingStatisticsDto,
    CreateManualMatchRequest,
    ConfirmMatchRequest,
    ResetMatchingDto,
    ExistingGeneralLedgerResponse,
    AutoMatchStatisticsDto,
    GeneralLedgerEntry,
    StagedGeneralLedgerData,
    GeneralLedgerImportFormatDto,
    ProgramAccountTypesResponse,
    GeneralLedgerMappingRequest,
    GeneralLedgerImportResult,
} from '@/@types/accounting'

const AccountingService = {
    // Get master chart of accounts for a program
    getMasterChartOfAccounts: async (
        programId: number,
        filters?: MasterChartUploadFilters,
    ): Promise<ChartOfAccountResponse> => {
        try {
            const params = new URLSearchParams()
            
            if (filters?.searchTerm) params.append('SearchTerm', filters.searchTerm)
            if (filters?.programID) params.append('ProgramID', filters.programID.toString())
            if (filters?.shopID) params.append('ShopID', filters.shopID.toString())
            if (filters?.accountType) params.append('AccountType', filters.accountType)
            if (filters?.isActive !== undefined) params.append('IsActive', filters.isActive.toString())
            if (filters?.isMasterAccount !== undefined) params.append('IsMasterAccount', filters.isMasterAccount.toString())
            if (filters?.pageNumber) params.append('PageNumber', filters.pageNumber.toString())
            if (filters?.pageSize) params.append('PageSize', filters.pageSize.toString())

            const queryString = params.toString()
            const url = `Accounting/programs/${programId}/master-chart-of-accounts${queryString ? `?${queryString}` : ''}`

            const result = await ApiService.fetchDataWithAxios<ChartOfAccountResponse>({
                url,
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error(`Failed to fetch master chart of accounts for program ${programId}:`, error)
            throw error
        }
    },

    // Create a master chart of account for a program
    createMasterChartOfAccount: async (
        programId: number,
        data: CreateChartOfAccountDto,
    ): Promise<ChartOfAccount> => {
        try {
            const result = await ApiService.fetchDataWithAxios<ChartOfAccount>({
                url: `Accounting/programs/${programId}/master-chart-of-accounts`,
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
            
            return result
        } catch (error) {
            console.error(`Failed to create master chart of account for program ${programId}:`, error)
            throw error
        }
    },

    // Import multiple master chart of accounts for a program
    importMasterChartOfAccounts: async (
        programId: number,
        data: CreateChartOfAccountDto[],
    ): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `Accounting/programs/${programId}/master-chart-of-accounts/import`,
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
        } catch (error) {
            console.error(`Failed to import master chart of accounts for program ${programId}:`, error)
            throw error
        }
    },

    // Import Excel file for master chart of accounts
    importExcelMasterChartOfAccounts: async (
        programId: number,
        file: File,
        sheetName?: string,
    ): Promise<BulkUploadResponseDto> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (sheetName) {
                formData.append('sheetName', sheetName)
            }

            const result = await ApiService.fetchDataWithAxios<BulkUploadResponseDto>({
                url: `Accounting/programs/${programId}/master-chart-of-accounts/import-excel`,
                method: 'post',
                data: formData as unknown as Record<string, unknown>,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            
            return result
        } catch (error) {
            console.error(`Failed to import Excel file for program ${programId}:`, error)
            throw error
        }
    },

    // Import Excel file for program chart of accounts
    importExcelChartOfAccounts: async (
        programId: number,
        file: File,
        sheetName?: string,
    ): Promise<BulkUploadResponseDto> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (sheetName) {
                formData.append('sheetName', sheetName)
            }

            const result = await ApiService.fetchDataWithAxios<BulkUploadResponseDto>({
                url: `Accounting/programs/${programId}/chart-of-accounts/import-excel`,
                method: 'post',
                data: formData as unknown as Record<string, unknown>,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            
            return result
        } catch (error) {
            console.error(`Failed to import Excel file for program ${programId} chart of accounts:`, error)
            throw error
        }
    },

    // Stage Excel data for preview before import
    stageExcelData: async (
        file: File,
    ): Promise<StagedDataResponseDto> => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const result = await ApiService.fetchDataWithAxios<StagedDataResponseDto>({
                url: 'Accounting/chart-of-accounts/stage-excel',
                method: 'post',
                data: formData as unknown as Record<string, unknown>,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            
            return result
        } catch (error) {
            console.error('Failed to stage Excel data:', error)
            throw error
        }
    },

    // Update a chart of account
    updateChartOfAccount: async (
        id: number,
        data: UpdateChartOfAccountDto,
    ): Promise<ChartOfAccount> => {
        try {
            const result = await ApiService.fetchDataWithAxios<ChartOfAccount>({
                url: `Accounting/chart-of-accounts/${id}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
            
            return result
        } catch (error) {
            console.error(`Failed to update chart of account ${id}:`, error)
            throw error
        }
    },

    // Delete a chart of account
    deleteChartOfAccount: async (id: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `Accounting/chart-of-accounts/${id}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to delete chart of account ${id}:`, error)
            throw error
        }
    },

    // Download template Excel file
    downloadTemplate: async (): Promise<Blob> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Blob>({
                url: 'Accounting/chart-of-accounts/template',
                method: 'get',
                responseType: 'blob',
            })
            
            return result
        } catch (error) {
            console.error('Failed to download template:', error)
            throw error
        }
    },

    // Update a master chart of account for a program
    updateMasterChartOfAccount: async (
        programId: number,
        accountId: number,
        data: UpdateChartOfAccountDto,
    ): Promise<ChartOfAccount> => {
        try {
            const result = await ApiService.fetchDataWithAxios<ChartOfAccount>({
                url: `Accounting/programs/${programId}/master-chart-of-accounts/${accountId}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
            
            return result
        } catch (error) {
            console.error(`Failed to update master chart of account ${accountId} for program ${programId}:`, error)
            throw error
        }
    },

    // Delete a master chart of account for a program
    deleteMasterChartOfAccount: async (programId: number, accountId: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `Accounting/programs/${programId}/master-chart-of-accounts/${accountId}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to delete master chart of account ${accountId} for program ${programId}:`, error)
            throw error
        }
    },

    // Export chart of accounts to Excel
    exportChartOfAccounts: async (
        programId: number,
        filters?: MasterChartUploadFilters,
    ): Promise<Blob> => {
        try {
            const params = new URLSearchParams()
            
            if (filters?.searchTerm) params.append('SearchTerm', filters.searchTerm)
            if (filters?.accountType) params.append('AccountType', filters.accountType)
            if (filters?.isActive !== undefined) params.append('IsActive', filters.isActive.toString())

            const queryString = params.toString()
            const url = `Accounting/programs/${programId}/master-chart-of-accounts/export${queryString ? `?${queryString}` : ''}`

            const result = await ApiService.fetchDataWithAxios<Blob>({
                url,
                method: 'get',
                responseType: 'blob',
            })
            
            return result
        } catch (error) {
            console.error(`Failed to export chart of accounts for program ${programId}:`, error)
            throw error
        }
    },

    // ============ SHOP CHART OF ACCOUNTS METHODS ============

    // Get chart of accounts for a shop in a program
    getShopChartOfAccounts: async (
        shopId: number,
        programId: number,
        filters?: ShopChartUploadFilters,
    ): Promise<ChartOfAccountResponse> => {
        try {
            const params = new URLSearchParams()
            
            if (filters?.searchTerm) params.append('SearchTerm', filters.searchTerm)
            if (filters?.accountType) params.append('AccountType', filters.accountType)
            if (filters?.isActive !== undefined) params.append('IsActive', filters.isActive.toString())
            if (filters?.pageNumber) params.append('PageNumber', filters.pageNumber.toString())
            if (filters?.pageSize) params.append('PageSize', filters.pageSize.toString())
            if (filters?.matchingStatus) params.append('MatchingStatus', filters.matchingStatus)

            const queryString = params.toString()
            const url = `Accounting/shops/${shopId}/programs/${programId}/chart-of-accounts${queryString ? `?${queryString}` : ''}`

            const result = await ApiService.fetchDataWithAxios<ChartOfAccountResponse>({
                url,
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error(`Failed to fetch chart of accounts for shop ${shopId} program ${programId}:`, error)
            throw error
        }
    },

    // Create a shop chart of account
    createShopChartOfAccount: async (
        shopId: number,
        programId: number,
        data: CreateChartOfAccountDto,
    ): Promise<ChartOfAccount> => {
        try {
            const result = await ApiService.fetchDataWithAxios<ChartOfAccount>({
                url: `Accounting/shops/${shopId}/programs/${programId}/chart-of-accounts`,
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
            
            return result
        } catch (error) {
            console.error(`Failed to create chart of account for shop ${shopId} program ${programId}:`, error)
            throw error
        }
    },

    // Update a shop chart of account
    updateShopChartOfAccount: async (
        shopId: number,
        programId: number,
        accountId: number,
        data: UpdateChartOfAccountDto,
    ): Promise<ChartOfAccount> => {
        try {
            const result = await ApiService.fetchDataWithAxios<ChartOfAccount>({
                url: `Accounting/shops/${shopId}/programs/${programId}/chart-of-accounts/${accountId}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
            
            return result
        } catch (error) {
            console.error(`Failed to update chart of account ${accountId} for shop ${shopId} program ${programId}:`, error)
            throw error
        }
    },

    // Delete a shop chart of account
    deleteShopChartOfAccount: async (
        shopId: number,
        programId: number,
        accountId: number,
    ): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `Accounting/shops/${shopId}/programs/${programId}/chart-of-accounts/${accountId}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to delete chart of account ${accountId} for shop ${shopId} program ${programId}:`, error)
            throw error
        }
    },

    // Stage Excel file for shop chart of accounts (with column mapping)
    stageShopChartOfAccountsFromExcel: async (
        shopId: number,
        programId: number,
        file: File,
        sheetName?: string,
    ): Promise<StagedDataResponseDto> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (sheetName) {
                formData.append('sheetName', sheetName)
            }

            const result = await ApiService.fetchDataWithAxios<StagedDataResponseDto>({
                url: `Accounting/shops/${shopId}/programs/${programId}/chart-of-accounts/stage-excel`,
                method: 'post',
                data: formData as unknown as Record<string, unknown>,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            
            return result
        } catch (error) {
            console.error(`Failed to stage Excel file for shop ${shopId} program ${programId}:`, error)
            throw error
        }
    },

    // Get available mapping fields for column mapping
    getMappingFields: async (): Promise<MappingField[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<MappingField[]>({
                url: 'Accounting/chart-of-accounts/mapping-fields',
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error('Failed to get mapping fields:', error)
            throw error
        }
    },

    // Apply column mappings to staged data
    applyColumnMappings: async (
        request: ApplyMappingsRequest,
    ): Promise<ApplyMappingsResponse> => {
        try {
            const result = await ApiService.fetchDataWithAxios<ApplyMappingsResponse>({
                url: 'Accounting/chart-of-accounts/apply-mappings',
                method: 'post',
                data: request as unknown as Record<string, unknown>,
            })
            
            return result
        } catch (error) {
            console.error('Failed to apply column mappings:', error)
            throw error
        }
    },

    // Apply column mappings and import data in one step
    applyColumnMappingsAndImport: async (
        jobId: number,
        programId: number,
        columnMappings: ColumnMapping[],
    ): Promise<ApplyMappingsAndImportResponse> => {
        try {
            console.log('AccountingService - Sending request to apply-mappings-and-import:', {
                jobId,
                programId,
                columnMappings
            })
            
            const result = await ApiService.fetchDataWithAxios<ApplyMappingsAndImportResponse>({
                url: `Accounting/chart-of-accounts/apply-mappings-and-import/${jobId}/${programId}`,
                method: 'post',
                data: columnMappings as any,
            })
            
            return result
        } catch (error) {
            console.error(`Failed to apply mappings and import for job ${jobId}, program ${programId}:`, error)
            throw error
        }
    },

    // Import mapped data
    importMappedData: async (jobId: number): Promise<ImportMappedResponse> => {
        try {
            const result = await ApiService.fetchDataWithAxios<ImportMappedResponse>({
                url: `Accounting/chart-of-accounts/import-mapped/${jobId}`,
                method: 'post',
            })
            
            return result
        } catch (error) {
            console.error(`Failed to import mapped data for job ${jobId}:`, error)
            throw error
        }
    },

    // Get staged data for preview
    getStagedData: async (jobId: number): Promise<StagedDataResponseDto> => {
        try {
            const result = await ApiService.fetchDataWithAxios<StagedDataResponseDto>({
                url: `Accounting/chart-of-accounts/staged-data/${jobId}`,
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error(`Failed to get staged data for job ${jobId}:`, error)
            throw error
        }
    },

    // Export shop chart of accounts to Excel
    exportShopChartOfAccounts: async (
        shopId: number,
        programId: number,
        filters?: ShopChartUploadFilters,
    ): Promise<Blob> => {
        try {
            const params = new URLSearchParams()
            
            if (filters?.searchTerm) params.append('SearchTerm', filters.searchTerm)
            if (filters?.accountType) params.append('AccountType', filters.accountType)
            if (filters?.isActive !== undefined) params.append('IsActive', filters.isActive.toString())

            const queryString = params.toString()
            const url = `Accounting/shops/${shopId}/programs/${programId}/chart-of-accounts/export${queryString ? `?${queryString}` : ''}`

            const result = await ApiService.fetchDataWithAxios<Blob>({
                url,
                method: 'get',
                responseType: 'blob',
            })
            
            return result
        } catch (error) {
            console.error(`Failed to export chart of accounts for shop ${shopId} program ${programId}:`, error)
            throw error
        }
    },

    // Complete chart of accounts upload with column mappings
    completeShopChartOfAccountsUpload: async (
        stagingId: string,
        columnMappings: ColumnMapping[]
    ): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: 'Accounting/chart-of-accounts/complete-upload',
                method: 'post',
                data: {
                    stagingId,
                    columnMappings
                }
            })
        } catch (error) {
            console.error('Failed to complete chart of accounts upload:', error)
            throw error
        }
    },

    // ============ MATCHING OPERATIONS ============

    // Get matching statistics for a shop and program
    getMatchingStatistics: async (
        shopId: number,
        programId: number,
    ): Promise<MatchingStatisticsDto> => {
        try {
            const result = await ApiService.fetchDataWithAxios<MatchingStatisticsDto>({
                url: `Accounting/shops/${shopId}/programs/${programId}/matching-statistics`,
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error(`Failed to get matching statistics for shop ${shopId} program ${programId}:`, error)
            throw error
        }
    },

    // Perform automatic matching
    performAutoMatch: async (
        shopId?: number,
        programId?: number,
        minConfidence: number = 0.7,
        reviewMode: boolean = false,
    ): Promise<AutoMatchResultDto> => {
        try {
            const requestBody: any = {
                minConfidence,
                reviewMode,
            }
            
            if (shopId) requestBody.shopID = shopId
            if (programId) requestBody.programID = programId

            const result = await ApiService.fetchDataWithAxios<AutoMatchResultDto>({
                url: 'Accounting/account-matchings/auto-match',
                method: 'post',
                data: requestBody,
            })
            
            return result
        } catch (error) {
            console.error('Failed to perform auto match:', error)
            throw error
        }
    },

    // Create manual match
    createManualMatch: async (
        request: CreateManualMatchRequest,
    ): Promise<AccountMatchingDto> => {
        try {
            const result = await ApiService.fetchDataWithAxios<AccountMatchingDto>({
                url: 'Accounting/account-matchings/manual',
                method: 'post',
                data: request as any,
            })
            
            return result
        } catch (error) {
            console.error('Failed to create manual match:', error)
            throw error
        }
    },

    // Confirm or reject matches
    confirmMatches: async (
        matchingIDs: number[],
        action: "Confirm" | "Reject",
    ): Promise<{ message: string }> => {
        try {
            const result = await ApiService.fetchDataWithAxios<{ message: string }>({
                url: 'Accounting/account-matchings/confirm',
                method: 'post',
                data: { matchingIDs, action } as any,
            })
            
            return result
        } catch (error) {
            console.error(`Failed to ${action.toLowerCase()} matches:`, error)
            throw error
        }
    },

    // Confirm a specific potential match
    confirmPotentialMatch: async (matchingID: number): Promise<void> => {
        try {
            const request: ConfirmMatchRequest = {
                matchingIDs: [matchingID],
                action: "Confirm"
            }
            await ApiService.fetchDataWithAxios({
                url: `Accounting/account-matchings/confirm`,
                method: 'post',
                data: request
            })
        } catch (error) {
            console.error('Failed to confirm potential match:', error)
            throw error
        }
    },

    // Reject a specific potential match
    rejectPotentialMatch: async (matchingID: number): Promise<void> => {
        try {
            const request: ConfirmMatchRequest = {
                matchingIDs: [matchingID],
                action: "Reject"
            }
            await ApiService.fetchDataWithAxios({
                url: `Accounting/account-matchings/confirm`,
                method: 'post',
                data: request
            })
        } catch (error) {
            console.error('Failed to reject potential match:', error)
            throw error
        }
    },

    // Reset account matchings back to pending (undo confirm/reject)
    resetMatchingToPending: async (params: { matchingIDs?: number[], chartOfAccountIDs?: number[] }): Promise<void> => {
        try {
            const request: ResetMatchingDto = {
                matchingIDs: params.matchingIDs,
                chartOfAccountIDs: params.chartOfAccountIDs
            }
            await ApiService.fetchDataWithAxios({
                url: `Accounting/account-matchings/reset-to-pending`,
                method: 'post',
                data: request
            })
        } catch (error) {
            console.error('Failed to reset matching to pending:', error)
            throw error
        }
    },

    // Get pending matches
    getPendingMatches: async (
        shopId?: number,
        programId?: number,
    ): Promise<AccountMatchingDto[]> => {
        try {
            const params = new URLSearchParams()
            if (shopId) params.append('shopId', shopId.toString())
            if (programId) params.append('programId', programId.toString())

            const queryString = params.toString()
            const url = `Accounting/account-matchings/pending${queryString ? `?${queryString}` : ''}`

            const result = await ApiService.fetchDataWithAxios<AccountMatchingDto[]>({
                url,
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error('Failed to get pending matches:', error)
            throw error
        }
    },

    // Get all account matchings with filters
    getAccountMatchings: async (
        shopId?: number,
        programId?: number,
        matchingStatus?: string,
        matchingMethod?: string,
        pageNumber: number = 1,
        pageSize: number = 20,
    ): Promise<AccountMatchingDto[]> => {
        try {
            const params = new URLSearchParams()
            if (shopId) params.append('shopID', shopId.toString())
            if (programId) params.append('programID', programId.toString())
            if (matchingStatus) params.append('matchingStatus', matchingStatus)
            if (matchingMethod) params.append('matchingMethod', matchingMethod)
            params.append('pageNumber', pageNumber.toString())
            params.append('pageSize', pageSize.toString())

            const queryString = params.toString()
            const url = `Accounting/account-matchings${queryString ? `?${queryString}` : ''}`

            const result = await ApiService.fetchDataWithAxios<AccountMatchingDto[]>({
                url,
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error('Failed to get account matchings:', error)
            throw error
        }
    },

    // Get account types for a specific program
    getProgramAccountTypes: async (programId: number): Promise<ProgramAccountTypesResponse> => {
        try {
            const result = await ApiService.fetchDataWithAxios<ProgramAccountTypesResponse>({
                url: `Accounting/programs/${programId}/master-account-types`,
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error(`Failed to get account types for program ${programId}:`, error)
            throw error
        }
    },

    // General Ledger Methods

    // Get available import formats for general ledger
    getGeneralLedgerImportFormats: async (): Promise<GeneralLedgerImportFormatDto[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<GeneralLedgerImportFormatDto[]>({
                url: 'Accounting/general-ledger/import-formats',
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error('Failed to get general ledger import formats:', error)
            throw error
        }
    },

    // Check if general ledger exists for given parameters
    checkExistingGeneralLedger: async (
        programId: number,
        shopIds: number[],
        year: number,
        month: number
    ): Promise<boolean> => {
        try {
            const monthStr = month.toString().padStart(2, '0')
            const result = await ApiService.fetchDataWithAxios<{ exists: boolean }>({
                url: `Accounting/general-ledger/exists?programId=${programId}&shopIds=${shopIds.join(',')}&period=${year}-${monthStr}`,
                method: 'get',
            })
            
            return result.exists
        } catch (error) {
            console.error('Failed to check existing general ledger:', error)
            throw error
        }
    },

    // Get general ledger entries
    getGeneralLedgerEntries: async (
        programId: number,
        shopIds: number[],
        year: number,
        month: number
    ): Promise<GeneralLedgerEntry[]> => {
        try {
            const monthStr = month.toString().padStart(2, '0')
            const result = await ApiService.fetchDataWithAxios<GeneralLedgerEntry[]>({
                url: `Accounting/general-ledger?programId=${programId}&shopIds=${shopIds.join(',')}&period=${year}-${monthStr}`,
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error('Failed to get general ledger entries:', error)
            throw error
        }
    },

    // Check shop chart of account status
    checkShopChartOfAccountStatus: async (
        programId: number,
        shopId: number
    ): Promise<{ hasChartOfAccount: boolean; isCompletelyMapped: boolean; message: string }> => {
        try {
            const result = await ApiService.fetchDataWithAxios<{ hasChartOfAccount: boolean; isCompletelyMapped: boolean; message: string }>({
                url: `Accounting/shops/${shopId}/programs/${programId}/chart-of-account/status`,
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error('Failed to check shop chart of account status:', error)
            throw error
        }
    },

    // Stage general ledger Excel file
    stageGeneralLedgerExcel: async (
        shopId: number,
        programId: number,
        file: File,
        importDate: string,
        ledgerDate: string,
        sheetName?: string
    ): Promise<StagedGeneralLedgerData> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('importDate', importDate)
            formData.append('ledgerDate', ledgerDate)
            if (sheetName) {
                formData.append('sheetName', sheetName)
            }

            const result = await ApiService.fetchDataWithAxios<StagedGeneralLedgerData>({
                url: `Accounting/shops/${shopId}/programs/${programId}/general-ledger/stage-excel`,
                method: 'post',
                data: formData as any,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            
            return result
        } catch (error) {
            console.error('Failed to stage general ledger Excel file:', error)
            throw error
        }
    },

    // Get existing general ledger entries for a date range
    getExistingGeneralLedger: async (
        shopId: number,
        fromDate: string,
        toDate: string,
        programId: number
    ): Promise<ExistingGeneralLedgerResponse> => {
        try {
            const result = await ApiService.fetchDataWithAxios<ExistingGeneralLedgerResponse>({
                url: `Accounting/shops/${shopId}/general-ledger?fromDate=${fromDate}&toDate=${toDate}&programId=${programId}`,
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error('Failed to get existing general ledger:', error)
            throw error
        }
    },

    // Stage general ledger Excel file (corrected endpoint without programId)
    stageGeneralLedgerExcelFile: async (
        shopId: number,
        file: File,
        sheetName: string,
        importDate: string,
        ledgerDate: string
    ): Promise<StagedGeneralLedgerData> => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('sheetName', sheetName)
            formData.append('importDate', importDate)
            formData.append('ledgerDate', ledgerDate)

            const result = await ApiService.fetchDataWithAxios<StagedGeneralLedgerData>({
                url: `Accounting/shops/${shopId}/general-ledger/stage-excel`,
                method: 'post',
                data: formData as any,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            
            return result
        } catch (error) {
            console.error('Failed to stage general ledger Excel:', error)
            throw error
        }
    },

    // Get general ledger mapping fields for specific format
    getGeneralLedgerMappingFields: async (formatId: string): Promise<MappingField[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<MappingField[]>({
                url: `Accounting/general-ledger/mapping-fields/${formatId}`,
                method: 'get',
            })
            
            return result
        } catch (error) {
            console.error('Failed to get general ledger mapping fields:', error)
            throw error
        }
    },

    // Apply mappings and import general ledger
    applyMappingsAndImportGeneralLedger: async (
        jobId: string,
        shopId: number,
        programId: number,
        request: GeneralLedgerMappingRequest
    ): Promise<GeneralLedgerImportResult> => {
        try {
            const result = await ApiService.fetchDataWithAxios<GeneralLedgerImportResult>({
                url: `Accounting/general-ledger/apply-mappings-and-import/${jobId}/${shopId}/${programId}`,
                method: 'post',
                data: request as unknown as Record<string, unknown>,
            })
            
            return result
        } catch (error) {
            console.error('Failed to apply mappings and import general ledger:', error)
            throw error
        }
    },
}

export default AccountingService

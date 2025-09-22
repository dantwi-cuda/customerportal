import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Button,
    Badge,
    Spinner,
    Select,
    Alert,
    Table,
    Steps,
    Progress,
    Notification,
    toast,
    Input,
    Tag,
    Checkbox,
} from '@/components/ui'
import { BsUpload, BsDownload, BsTrash } from 'react-icons/bs'
import {
    HiArrowLeft,
    HiOutlineX,
    HiOutlineCheckCircle,
    HiOutlineExclamationCircle,
    HiOutlineSearch,
    HiOutlineCog,
    HiOutlineRefresh,
    HiOutlineCheck,
    HiOutlineBan,
    HiOutlineLink,
    HiOutlineReply,
} from 'react-icons/hi'
import ExcelUploadCard from '@/components/shared/ExcelUploadCard'
import { analyzeExcelFile, getSheetPreview } from '@/utils/excelUtils'
import type {
    ChartOfAccount,
    StagedDataResponseDto,
    DetectedColumn,
    MappingField,
    ColumnMapping,
    ExcelFileAnalysis,
    ExcelSheetInfo,
    ExcelSheetPreview,
    ApplyMappingsAndImportResponse,
    AccountMatchingDto,
    MatchingStatisticsDto,
    CreateManualMatchRequest,
} from '@/@types/accounting'
import type { Program } from '@/@types/program'
import type { Shop } from '@/@types/shop'
import AccountingService from '@/services/AccountingService'
import ProgramService from '@/services/ProgramService'
import ShopService from '@/services/ShopService'

const { Tr, Th, Td, THead, TBody } = Table
const { Item: StepItem } = Steps

const ShopChartOfAccountPage: React.FC = () => {
    // Core state
    const [data, setData] = useState<ChartOfAccount[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [programs, setPrograms] = useState<Program[]>([])
    const [shops, setShops] = useState<Shop[]>([])

    // Selection state
    const [selectedProgramId, setSelectedProgramId] = useState<number | null>(
        null,
    )
    const [selectedShopId, setSelectedShopId] = useState<number | null>(null)

    // Upload state
    const [showExcelUpload, setShowExcelUpload] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
    const [isProcessingUpload, setIsProcessingUpload] = useState(false)

    // Inline status section state
    const [showUploadStatus, setShowUploadStatus] = useState(false)
    const [uploadStatusData, setUploadStatusData] =
        useState<ApplyMappingsAndImportResponse | null>(null)
    const [statusAutoHideTimeout, setStatusAutoHideTimeout] =
        useState<NodeJS.Timeout | null>(null)

    // Steps workflow state
    const [currentStep, setCurrentStep] = useState(0)
    const [excelAnalysis, setExcelAnalysis] =
        useState<ExcelFileAnalysis | null>(null)
    const [selectedSheetName, setSelectedSheetName] = useState<string>('')
    const [sheetPreview, setSheetPreview] = useState<ExcelSheetPreview | null>(
        null,
    )

    // Column mapping state
    const [stagedData, setStagedData] = useState<StagedDataResponseDto | null>(
        null,
    )
    const [mappingFields, setMappingFields] = useState<MappingField[]>([])
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
    const [isLoadingMappingFields, setIsLoadingMappingFields] = useState(false)

    // Matching-related state
    const [matchingStatistics, setMatchingStatistics] =
        useState<MatchingStatisticsDto | null>(null)
    const [pendingMatches, setPendingMatches] = useState<AccountMatchingDto[]>(
        [],
    )
    const [isAutoMatching, setIsAutoMatching] = useState(false)
    const [selectedMasterAccounts, setSelectedMasterAccounts] = useState<
        ChartOfAccount[]
    >([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [showManualMatchForm, setShowManualMatchForm] = useState<
        number | null
    >(null)
    const [minConfidence, setMinConfidence] = useState(0.7)
    const [reviewMode, setReviewMode] = useState(true)

    // Manual matching modal state
    const [showManualMatchModal, setShowManualMatchModal] = useState(false)
    const [selectedAccountForMatching, setSelectedAccountForMatching] =
        useState<ChartOfAccount | null>(null)
    const [selectedMasterAccountId, setSelectedMasterAccountId] = useState<
        number | null
    >(null)
    const [isConfirmedMatch, setIsConfirmedMatch] = useState(true) // Default to checked

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [totalCount, setTotalCount] = useState(0)
    const [isPaginationLoading, setIsPaginationLoading] = useState(false)

    // Load programs on mount
    useEffect(() => {
        loadPrograms()
    }, [])

    // Load shops when program is selected
    useEffect(() => {
        if (selectedProgramId) {
            loadShopsForProgram(selectedProgramId)
        } else {
            setShops([])
            setSelectedShopId(null)
        }
    }, [selectedProgramId])

    // Load chart of accounts when both program and shop are selected
    useEffect(() => {
        if (selectedProgramId && selectedShopId) {
            loadShopChartOfAccounts()
        } else {
            setData([])
            setTotalCount(0)
        }
    }, [
        selectedProgramId,
        selectedShopId,
        searchTerm,
        statusFilter,
        currentPage,
        pageSize,
    ])

    // Reset to first page when search term or status filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (statusAutoHideTimeout) {
                clearTimeout(statusAutoHideTimeout)
            }
        }
    }, [statusAutoHideTimeout])

    const loadPrograms = async () => {
        try {
            setIsLoading(true)
            const programs = await ProgramService.getPrograms()
            // Filter to only show accounting programs
            const accountingPrograms = (programs || []).filter(
                (program) =>
                    program.programTypeName?.toLowerCase() === 'accounting',
            )
            setPrograms(accountingPrograms)
        } catch (error) {
            console.error('Failed to load programs:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadShopsForProgram = async (programId: number) => {
        try {
            // Use the dedicated ShopService endpoint instead of extracting from program data
            const shops = await ShopService.getShopsByProgram(programId)
            setShops(shops || [])
        } catch (error) {
            console.error('Failed to load shops for program:', error)

            // Fallback: try to get shops from program data
            try {
                const program = await ProgramService.getProgram(programId)

                // Extract shops from shopSubscriptions, filtering out invalid entries
                const shops = (program.shopSubscriptions || [])
                    .filter(
                        (subscription) =>
                            subscription.shopId && subscription.shopName,
                    )
                    .map((subscription) => ({
                        id: subscription.shopId,
                        name: subscription.shopName || '',
                        isActive: subscription.isActive,
                        source: '',
                        postalCode: '',
                        city: '',
                        state: '',
                        country: '',
                        businessKey: '',
                        parentID: null,
                        isTenantActive: true,
                        isTenantDeleted: false,
                        tenantAssignedAt: subscription.assignedAt,
                        tenantAssignedBy: subscription.assignedByUserId,
                        programNames: [subscription.programName || ''],
                        assignedUserNames: [],
                        kpIs: [],
                    }))
                setShops(shops)
            } catch (fallbackError) {
                console.error('Fallback method also failed:', fallbackError)
                setShops([])
            }
        }
    }

    const loadShopChartOfAccounts = async () => {
        if (!selectedShopId || !selectedProgramId) return

        try {
            setIsLoading(true)

            // Build filters with pagination
            const filters: any = {}
            if (searchTerm) filters.searchTerm = searchTerm
            if (statusFilter) filters.matchingStatus = statusFilter
            filters.pageNumber = currentPage
            filters.pageSize = pageSize

            const response = await AccountingService.getShopChartOfAccounts(
                selectedShopId,
                selectedProgramId,
                filters,
            )

            setData(response.chartOfAccounts || [])
            setTotalCount(response.totalCount || 0)

            // Also load matching statistics and pending matches
            await Promise.all([loadMatchingStatistics(), loadPendingMatches()])
        } catch (error) {
            console.error('Failed to load shop chart of accounts:', error)
            setData([])
            setTotalCount(0)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load chart of accounts
                </Notification>,
            )
        } finally {
            setIsLoading(false)
        }
    }

    const loadMatchingStatistics = async () => {
        if (!selectedShopId || !selectedProgramId) return

        try {
            const stats = await AccountingService.getMatchingStatistics(
                selectedShopId,
                selectedProgramId,
            )
            setMatchingStatistics(stats)
        } catch (error) {
            console.error('Failed to load matching statistics:', error)
        }
    }

    const loadPendingMatches = async () => {
        if (!selectedShopId || !selectedProgramId) return

        try {
            const matches = await AccountingService.getPendingMatches(
                selectedShopId,
                selectedProgramId,
            )
            setPendingMatches(matches)
        } catch (error) {
            console.error('Failed to load pending matches:', error)
        }
    }

    // Show upload status with auto-hide functionality
    const showUploadStatusSection = (
        result: ApplyMappingsAndImportResponse,
    ) => {
        setUploadStatusData(result)
        setShowUploadStatus(true)

        // Clear any existing timeout
        if (statusAutoHideTimeout) {
            clearTimeout(statusAutoHideTimeout)
        }

        // Auto-hide after 10 seconds if successful
        if (result.success && result.failedRecords === 0) {
            const timeout = setTimeout(() => {
                setShowUploadStatus(false)
                setUploadStatusData(null)
            }, 10000)
            setStatusAutoHideTimeout(timeout)
        }
    }

    // Close upload status section
    const closeUploadStatus = () => {
        setShowUploadStatus(false)
        setUploadStatusData(null)
        if (statusAutoHideTimeout) {
            clearTimeout(statusAutoHideTimeout)
            setStatusAutoHideTimeout(null)
        }
    }

    const handleColumnMappingComplete = async () => {
        if (!stagedData || !selectedShopId || !selectedProgramId) {
            setUploadError('Missing required data for upload completion.')
            return
        }

        try {
            setIsProcessingUpload(true)
            setUploadError(null)

            // Apply column mappings and import using the new combined API endpoint
            // Send just the columnMappings array, not wrapped in ApplyMappingsRequest

            const result = await AccountingService.applyColumnMappingsAndImport(
                stagedData.jobID,
                selectedProgramId,
                columnMappings,
            )

            if (!result.success) {
                setUploadError(
                    result.message ||
                        'Failed to apply column mappings and import. Please try again.',
                )
                return
            }

            // Show inline status section with results
            showUploadStatusSection(result)

            // Show toast notification
            if (result.failedRecords === 0) {
                toast.push(
                    <Notification title="Success" type="success">
                        Upload completed successfully!{' '}
                        {result.successfulRecords} records imported.
                    </Notification>,
                )
            } else {
                toast.push(
                    <Notification title="Warning" type="warning">
                        Upload completed with errors. {result.successfulRecords}{' '}
                        successful, {result.failedRecords} failed.
                    </Notification>,
                )
            }

            // Reload the table data if successful
            if (result.success) {
                await loadShopChartOfAccounts()
            }

            // Reset upload states
            handleCancelUpload()
        } catch (error: any) {
            console.error('Failed to complete upload:', error)
            setUploadError(
                error?.message ||
                    'Failed to complete upload. Please try again.',
            )
        } finally {
            setIsProcessingUpload(false)
        }
    }

    const loadMappingFields = async (): Promise<MappingField[]> => {
        try {
            setIsLoadingMappingFields(true)
            const fields = await AccountingService.getMappingFields()
            setMappingFields(fields)
            return fields
        } catch (error) {
            console.error('Failed to load mapping fields:', error)
            setUploadError('Failed to load field mapping options.')
            return []
        } finally {
            setIsLoadingMappingFields(false)
        }
    }

    const handleFileUpload = async (file: File, sheetName: string) => {
        if (!selectedShopId || !selectedProgramId) {
            setUploadError(
                'Please select both a program and shop before uploading.',
            )
            return
        }

        try {
            setIsProcessingUpload(true)
            setUploadError(null)

            // Stage the Excel file to get column mapping information
            const stagingResponse =
                await AccountingService.stageShopChartOfAccountsFromExcel(
                    selectedShopId,
                    selectedProgramId,
                    file,
                    sheetName,
                )

            setStagedData(stagingResponse)

            // Load mapping fields for column mapping
            const fields = await loadMappingFields()

            // Initialize column mappings with suggested mappings from API
            const initialMappings: ColumnMapping[] = []

            // Process suggested mappings from detected columns
            stagingResponse.detectedColumns.forEach((col: DetectedColumn) => {
                if (col.suggestedMapping) {
                    // Check if the suggested mapping field exists in our mapping fields
                    const targetField = fields.find(
                        (f) => f.fieldName === col.suggestedMapping,
                    )
                    if (targetField) {
                        initialMappings.push({
                            sourceColumn: col.columnName,
                            targetField: col.suggestedMapping,
                            isRequired: targetField.isRequired,
                        })
                    }
                }
            })

            setColumnMappings(initialMappings)
            setCurrentStep(2) // Move to column mapping step
        } catch (error: any) {
            console.error('Failed to upload file:', error)
            setUploadError(
                error?.message ||
                    'Failed to upload Excel file. Please check the format and try again.',
            )
        } finally {
            setIsProcessingUpload(false)
        }
    }

    const handleFileSelection = async (file: File) => {
        try {
            setIsProcessingUpload(true)
            setUploadError(null)

            // Analyze the Excel file to get sheet information
            const analysis = await analyzeExcelFile(file)
            setExcelAnalysis(analysis)
            setSelectedFile(file)

            // If there's only one sheet, select it automatically and move to preview
            if (analysis.sheets.length === 1) {
                const sheetName = analysis.sheets[0].sheetName
                setSelectedSheetName(sheetName)
                await generateSheetPreview(file, sheetName)
                setCurrentStep(1) // Move to confirmation step
            } else {
                setCurrentStep(0) // Stay on sheet selection step
            }

            setShowExcelUpload(true)
        } catch (error: any) {
            console.error('Failed to analyze file:', error)
            setUploadError(error?.message || 'Failed to analyze Excel file.')
        } finally {
            setIsProcessingUpload(false)
        }
    }

    const generateSheetPreview = async (file: File, sheetName: string) => {
        try {
            const preview = await getSheetPreview(file, sheetName, 5)
            setSheetPreview(preview)
        } catch (error) {
            console.error('Failed to generate sheet preview:', error)
            setUploadError('Failed to preview sheet data.')
        }
    }

    const handleSheetSelection = async (sheetName: string) => {
        if (!selectedFile) return

        setSelectedSheetName(sheetName)
        await generateSheetPreview(selectedFile, sheetName)
        setCurrentStep(1) // Move to confirmation step
    }

    const handleConfirmUpload = async () => {
        if (!selectedFile || !selectedSheetName) return
        await handleFileUpload(selectedFile, selectedSheetName)
    }

    const handleCancelUpload = () => {
        setShowExcelUpload(false)
        setSelectedFile(null)
        setUploadError(null)
        setUploadSuccess(null)
        setCurrentStep(0)
        setExcelAnalysis(null)
        setSelectedSheetName('')
        setSheetPreview(null)
        setStagedData(null)
        setColumnMappings([])
        // Also close the status section when canceling upload
        closeUploadStatus()
    }

    const triggerFileInput = () => {
        const fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = '.xlsx,.xls'
        fileInput.onchange = async (event) => {
            const target = event.target as HTMLInputElement
            const file = target.files?.[0]
            if (file) {
                // Validate file type
                if (!file.name.match(/\.(xlsx|xls)$/i)) {
                    setUploadError(
                        'Please select an Excel file (.xlsx or .xls)',
                    )
                    return
                }

                await handleFileSelection(file)
            }
        }
        fileInput.click()
    }

    // Matching operation handlers
    const handleAutoMatch = async () => {
        if (!selectedShopId || !selectedProgramId) return

        try {
            setIsAutoMatching(true)
            await AccountingService.performAutoMatch(
                selectedShopId,
                selectedProgramId,
            )
            await loadShopChartOfAccounts()
            await loadMatchingStatistics()

            toast.push(
                <Notification title="Success" type="success">
                    Auto-matching completed successfully!
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            console.error('Auto-match error:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to perform auto-matching
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsAutoMatching(false)
        }
    }

    const handleConfirmMatch = async (matchingId: number) => {
        try {
            await AccountingService.confirmPotentialMatch(matchingId)
            // Reload current page data and statistics
            await Promise.all([
                loadShopChartOfAccounts(),
                loadMatchingStatistics(),
            ])

            toast.push(
                <Notification title="Success" type="success">
                    Match confirmed successfully!
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            console.error('Confirm match error:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to confirm match
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const handleRejectMatch = async (matchingId: number) => {
        try {
            await AccountingService.rejectPotentialMatch(matchingId)
            // Reload current page data and statistics
            await Promise.all([
                loadShopChartOfAccounts(),
                loadMatchingStatistics(),
            ])

            toast.push(
                <Notification title="Success" type="success">
                    Match rejected successfully!
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            console.error('Reject match error:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to reject match
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const handleUndoMatch = async (params: {
        matchingIDs?: number[]
        chartOfAccountIDs?: number[]
    }) => {
        try {
            await AccountingService.resetMatchingToPending(params)
            // Reload current page data and statistics
            await Promise.all([
                loadShopChartOfAccounts(),
                loadMatchingStatistics(),
            ])

            toast.push(
                <Notification title="Success" type="success">
                    Match reset to pending successfully!
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            console.error('Undo match error:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to undo match
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const loadMasterAccounts = async () => {
        if (!selectedProgramId) return

        try {
            const response = await AccountingService.getMasterChartOfAccounts(
                selectedProgramId,
                {
                    isMasterAccount: true,
                    isActive: true,
                    pageSize: 1000, // Request a large page size to get all master accounts
                    pageNumber: 1,
                    // Do not filter by IsMapped to allow same master account to match multiple shop accounts
                },
            )

            // Debug: Log the response to understand pagination
            console.log('Master Accounts API Response:', {
                totalAccounts: response.chartOfAccounts?.length || 0,
                totalCount: response.totalCount,
                pageSize: response.pageSize,
                currentPage: response.pageNumber,
                totalPages: response.totalPages,
                fullResponse: response,
            })

            setSelectedMasterAccounts(response.chartOfAccounts)
        } catch (error) {
            console.error('Failed to load master accounts:', error)
        }
    }

    const openManualMatchModal = (account: ChartOfAccount) => {
        setSelectedAccountForMatching(account)
        setShowManualMatchModal(true)
        setSelectedMasterAccountId(null)
        if (selectedMasterAccounts.length === 0) {
            loadMasterAccounts()
        }
    }

    const closeManualMatchModal = () => {
        setShowManualMatchModal(false)
        setSelectedAccountForMatching(null)
        setSelectedMasterAccountId(null)
        setIsConfirmedMatch(true) // Reset to default checked state
    }

    const handleCreateManualMatch = async () => {
        if (!selectedAccountForMatching || !selectedMasterAccountId) return

        await handleManualMatch(
            selectedAccountForMatching.chartOfAccountsID,
            selectedMasterAccountId,
        )
        closeManualMatchModal()
    }

    const handleManualMatch = async (
        shopAccountId: number,
        masterAccountId: number,
    ) => {
        try {
            await AccountingService.createManualMatch({
                shopChartOfAccountID: shopAccountId,
                masterChartOfAccountID: masterAccountId,
                matchingConfidence: 1, // Manual matches are 100% confidence
                matchingMethod: 'Manual',
                matchingStatus: isConfirmedMatch
                    ? 'Confirmed'
                    : 'Pending Confirmation',
            })
            await loadShopChartOfAccounts()
            await loadMatchingStatistics()

            toast.push(
                <Notification title="Success" type="success">
                    Manual match created successfully!
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            console.error('Manual match error:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to create manual match
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const handleDeleteAccount = async (id: number) => {
        if (!selectedShopId || !selectedProgramId) return

        try {
            await AccountingService.deleteShopChartOfAccount(
                selectedShopId,
                selectedProgramId,
                id,
            )
            await loadShopChartOfAccounts()
        } catch (error) {
            console.error('Failed to delete account:', error)
        }
    }

    // Pagination handlers
    const handlePageChange = (page: number) => {
        if (page !== currentPage && !isPaginationLoading) {
            setIsPaginationLoading(true)
            setCurrentPage(page)
            // Reset loading state after a brief delay
            setTimeout(() => setIsPaginationLoading(false), 500)
        }
    }

    const handlePageSizeChange = (size: number) => {
        if (!isPaginationLoading) {
            setIsPaginationLoading(true)
            setPageSize(size)
            setCurrentPage(1) // Reset to first page when changing page size
            setTimeout(() => setIsPaginationLoading(false), 500)
        }
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize)
    const startRecord = (currentPage - 1) * pageSize + 1
    const endRecord = Math.min(currentPage * pageSize, totalCount)

    const selectedProgram = useMemo(
        () => programs.find((p) => p.programId === selectedProgramId),
        [programs, selectedProgramId],
    )

    const selectedShop = useMemo(
        () => shops.find((s) => s.id === selectedShopId),
        [shops, selectedShopId],
    )

    const canPerformActions = selectedProgramId && selectedShopId

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <div className="mb-6">
                    <h4 className="mb-2">Shop Chart of Account</h4>
                    <p className="text-gray-600">
                        Manage chart of accounts for individual shops within
                        accounting programs. Upload, view, edit, and download
                        chart of accounts data.
                    </p>
                </div>

                {/* Selection Controls */}
                <div className="mb-6">
                    <h5 className="text-lg font-semibold mb-4">
                        Select Program and Shop
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Program Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Accounting Program *
                            </label>
                            <Select
                                value={
                                    selectedProgramId
                                        ? {
                                              value: selectedProgramId.toString(),
                                              label:
                                                  selectedProgram?.programName ||
                                                  '',
                                          }
                                        : null
                                }
                                placeholder="Select a program"
                                options={programs
                                    .filter(
                                        (program) =>
                                            program.programId &&
                                            program.programName,
                                    )
                                    .map((program) => ({
                                        value: program.programId.toString(),
                                        label: program.programName,
                                    }))}
                                onChange={(option) => {
                                    const programId = option?.value
                                        ? parseInt(option.value)
                                        : null
                                    setSelectedProgramId(programId)
                                }}
                            />
                        </div>

                        {/* Shop Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Shop *
                            </label>
                            <Select
                                value={
                                    selectedShopId
                                        ? {
                                              value: selectedShopId.toString(),
                                              label: selectedShop?.name || '',
                                          }
                                        : null
                                }
                                placeholder={
                                    !selectedProgramId
                                        ? 'Select a program first'
                                        : shops.length === 0
                                          ? 'No shops available'
                                          : 'Select a shop'
                                }
                                options={shops
                                    .filter((shop) => shop.id && shop.name)
                                    .map((shop) => ({
                                        value: shop.id.toString(),
                                        label: shop.name,
                                    }))}
                                onChange={(option) => {
                                    const shopId = option?.value
                                        ? parseInt(option.value)
                                        : null
                                    setSelectedShopId(shopId)
                                }}
                                isDisabled={
                                    !selectedProgramId || shops.length === 0
                                }
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Alerts */}
            {uploadError && (
                <Alert type="danger" className="mb-4">
                    {uploadError}
                </Alert>
            )}

            {uploadSuccess && (
                <Alert type="success" className="mb-4">
                    {uploadSuccess}
                </Alert>
            )}

            {/* Excel Upload Workflow with Steps */}
            {showExcelUpload && (
                <Card>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Upload Chart of Accounts
                            </h3>
                            <Button
                                size="sm"
                                variant="plain"
                                onClick={handleCancelUpload}
                            >
                                <HiArrowLeft className="text-lg" />
                                Cancel Upload
                            </Button>
                        </div>

                        {/* Steps Component */}
                        <div className="mb-8">
                            <Steps current={currentStep}>
                                <StepItem
                                    title="Select Sheet"
                                    description="Choose the Excel sheet to import"
                                />
                                <StepItem
                                    title="Preview Data"
                                    description="Review the data to be imported"
                                />
                                <StepItem
                                    title="Map Columns"
                                    description="Map Excel columns to database fields"
                                />
                            </Steps>
                        </div>

                        {/* Step 0: Sheet Selection */}
                        {currentStep === 0 && excelAnalysis && (
                            <div className="space-y-4">
                                <h4 className="text-md font-semibold">
                                    Select Sheet to Import
                                </h4>
                                <p className="text-sm text-gray-600 mb-4">
                                    Your Excel file contains{' '}
                                    {excelAnalysis.sheets.length} sheet(s).
                                    Please select which sheet you want to
                                    import:
                                </p>

                                <div className="grid gap-3">
                                    {excelAnalysis.sheets.map(
                                        (sheet: ExcelSheetInfo) => (
                                            <div
                                                key={sheet.sheetName}
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                                    selectedSheetName ===
                                                    sheet.sheetName
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() =>
                                                    handleSheetSelection(
                                                        sheet.sheetName,
                                                    )
                                                }
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h5 className="font-medium">
                                                            {sheet.sheetName}
                                                        </h5>
                                                        <p className="text-sm text-gray-500">
                                                            {sheet.rowCount}{' '}
                                                            rows ×{' '}
                                                            {sheet.columnCount}{' '}
                                                            columns
                                                        </p>
                                                    </div>
                                                    {selectedSheetName ===
                                                        sheet.sheetName && (
                                                        <div className="text-blue-500">
                                                            <svg
                                                                className="w-5 h-5"
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 1: Data Preview */}
                        {currentStep === 1 && sheetPreview && (
                            <div className="space-y-4">
                                <h4 className="text-md font-semibold">
                                    Preview: {selectedSheetName}
                                </h4>
                                <p className="text-sm text-gray-600 mb-4">
                                    Here's a preview of the data that will be
                                    imported. Click "Continue" to proceed with
                                    column mapping.
                                </p>

                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {sheetPreview.headers.map(
                                                        (header, index) => (
                                                            <th
                                                                key={index}
                                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                            >
                                                                {header ||
                                                                    `Column ${index + 1}`}
                                                            </th>
                                                        ),
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {sheetPreview.data
                                                    .slice(0, 5)
                                                    .map(
                                                        (
                                                            row: any[],
                                                            rowIndex: number,
                                                        ) => (
                                                            <tr key={rowIndex}>
                                                                {row.map(
                                                                    (
                                                                        cell: any,
                                                                        cellIndex: number,
                                                                    ) => (
                                                                        <td
                                                                            key={
                                                                                cellIndex
                                                                            }
                                                                            className="px-4 py-2 text-sm text-gray-900"
                                                                        >
                                                                            {cell?.toString() ||
                                                                                ''}
                                                                        </td>
                                                                    ),
                                                                )}
                                                            </tr>
                                                        ),
                                                    )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4">
                                    <Button
                                        variant="plain"
                                        onClick={() => setCurrentStep(0)}
                                    >
                                        Back to Sheet Selection
                                    </Button>
                                    <Button
                                        onClick={handleConfirmUpload}
                                        loading={isProcessingUpload}
                                    >
                                        Continue to Column Mapping
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Column Mapping */}
                        {currentStep === 2 && stagedData && (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-md font-semibold">
                                        Map Database Fields to Excel Columns
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Select which Excel column should be used
                                        for each database field. The same Excel
                                        column can be mapped to multiple
                                        database fields:
                                    </p>
                                </div>

                                {/* Database Fields Mapping */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {mappingFields.map((field) => (
                                        <div
                                            key={field.fieldName}
                                            className="p-4 border rounded-lg bg-gray-50"
                                        >
                                            <div className="mb-3">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                    {field.displayName}
                                                    {field.isRequired && (
                                                        <span className="text-red-500 ml-1">
                                                            *
                                                        </span>
                                                    )}
                                                </label>
                                                {field.description && (
                                                    <p className="text-xs text-gray-500 mb-2">
                                                        {field.description}
                                                    </p>
                                                )}
                                            </div>

                                            <Select
                                                size="sm"
                                                value={
                                                    columnMappings.find(
                                                        (m) =>
                                                            m.targetField ===
                                                            field.fieldName,
                                                    )?.sourceColumn
                                                        ? {
                                                              value: columnMappings.find(
                                                                  (m) =>
                                                                      m.targetField ===
                                                                      field.fieldName,
                                                              )?.sourceColumn,
                                                              label: columnMappings.find(
                                                                  (m) =>
                                                                      m.targetField ===
                                                                      field.fieldName,
                                                              )?.sourceColumn,
                                                          }
                                                        : null
                                                }
                                                onChange={(option) => {
                                                    const stringValue =
                                                        option?.value || ''
                                                    setColumnMappings(
                                                        (prev) => {
                                                            // Remove existing mapping for this target field only
                                                            const existing =
                                                                prev.filter(
                                                                    (m) =>
                                                                        m.targetField !==
                                                                        field.fieldName,
                                                                )

                                                            if (
                                                                stringValue ===
                                                                ''
                                                            ) {
                                                                return existing
                                                            } else {
                                                                // Allow the same source column to map to multiple target fields
                                                                return [
                                                                    ...existing,
                                                                    {
                                                                        sourceColumn:
                                                                            stringValue,
                                                                        targetField:
                                                                            field.fieldName,
                                                                        isRequired:
                                                                            field.isRequired,
                                                                    },
                                                                ]
                                                            }
                                                        },
                                                    )
                                                }}
                                                placeholder="Select Excel column..."
                                                options={[
                                                    {
                                                        value: '',
                                                        label: '-- Skip this field --',
                                                    },
                                                    ...stagedData.detectedColumns.map(
                                                        (column) => ({
                                                            value: column.columnName,
                                                            label: column.columnName,
                                                            disabled: false,
                                                        }),
                                                    ),
                                                ]}
                                            />

                                            {/* Show sample values for selected column */}
                                            {(() => {
                                                const mapping =
                                                    columnMappings.find(
                                                        (m) =>
                                                            m.targetField ===
                                                            field.fieldName,
                                                    )
                                                const selectedColumn = mapping
                                                    ? stagedData.detectedColumns.find(
                                                          (c) =>
                                                              c.columnName ===
                                                              mapping.sourceColumn,
                                                      )
                                                    : null

                                                if (
                                                    selectedColumn &&
                                                    selectedColumn.sampleValues
                                                        .length > 0
                                                ) {
                                                    return (
                                                        <div className="mt-2 text-xs text-gray-600">
                                                            <span className="font-medium">
                                                                Sample:{' '}
                                                            </span>
                                                            {selectedColumn.sampleValues
                                                                .slice(0, 2)
                                                                .join(', ')}
                                                            {selectedColumn
                                                                .sampleValues
                                                                .length > 2 &&
                                                                '...'}
                                                        </div>
                                                    )
                                                }
                                                return null
                                            })()}
                                        </div>
                                    ))}
                                </div>

                                {/* Excel Data Preview */}
                                <div className="mt-8">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-3">
                                        Excel Data Preview
                                    </h5>
                                    <div className="border rounded-lg overflow-hidden bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        {stagedData.detectedColumns.map(
                                                            (column, index) => {
                                                                // Find all mappings for this column
                                                                const mappings =
                                                                    columnMappings.filter(
                                                                        (m) =>
                                                                            m.sourceColumn ===
                                                                            column.columnName,
                                                                    )
                                                                const mappedFields =
                                                                    mappings
                                                                        .map(
                                                                            (
                                                                                mapping,
                                                                            ) =>
                                                                                mappingFields.find(
                                                                                    (
                                                                                        f,
                                                                                    ) =>
                                                                                        f.fieldName ===
                                                                                        mapping.targetField,
                                                                                ),
                                                                        )
                                                                        .filter(
                                                                            Boolean,
                                                                        )

                                                                return (
                                                                    <th
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                    >
                                                                        <div>
                                                                            <div className="font-semibold">
                                                                                {
                                                                                    column.columnName
                                                                                }
                                                                            </div>
                                                                            {mappedFields.length >
                                                                                0 && (
                                                                                <div className="text-green-600 font-normal normal-case mt-1">
                                                                                    →{' '}
                                                                                    {mappedFields
                                                                                        .map(
                                                                                            (
                                                                                                field,
                                                                                            ) =>
                                                                                                field?.displayName,
                                                                                        )
                                                                                        .join(
                                                                                            ', ',
                                                                                        )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </th>
                                                                )
                                                            },
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {stagedData.sampleData
                                                        .slice(0, 5)
                                                        .map(
                                                            (
                                                                rowData,
                                                                rowIndex,
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        rowIndex
                                                                    }
                                                                >
                                                                    {stagedData.detectedColumns.map(
                                                                        (
                                                                            column,
                                                                            colIndex,
                                                                        ) => (
                                                                            <td
                                                                                key={
                                                                                    colIndex
                                                                                }
                                                                                className="px-4 py-2 text-sm text-gray-900"
                                                                            >
                                                                                {rowData.columnData[
                                                                                    column
                                                                                        .columnName
                                                                                ]?.toString() ||
                                                                                    ''}
                                                                            </td>
                                                                        ),
                                                                    )}
                                                                </tr>
                                                            ),
                                                        )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Showing first 5 rows of data. Green
                                        arrows show all mapped database fields
                                        for each Excel column.
                                    </p>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t">
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">
                                            {columnMappings.length}
                                        </span>{' '}
                                        field(s) mapped
                                        {(() => {
                                            const requiredFields =
                                                mappingFields.filter(
                                                    (f) => f.isRequired,
                                                )
                                            const mappedRequiredFields =
                                                requiredFields.filter((f) =>
                                                    columnMappings.some(
                                                        (m) =>
                                                            m.targetField ===
                                                            f.fieldName,
                                                    ),
                                                )
                                            const missingRequired =
                                                requiredFields.length -
                                                mappedRequiredFields.length

                                            if (missingRequired > 0) {
                                                return (
                                                    <div className="text-red-600 text-xs mt-1">
                                                        {missingRequired}{' '}
                                                        required field(s) not
                                                        mapped
                                                    </div>
                                                )
                                            }
                                            return null
                                        })()}
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="plain"
                                            onClick={() => setCurrentStep(1)}
                                        >
                                            Back to Preview
                                        </Button>
                                        <Button
                                            onClick={
                                                handleColumnMappingComplete
                                            }
                                            loading={isProcessingUpload}
                                            disabled={(() => {
                                                // Check if all required fields are mapped
                                                const requiredFields =
                                                    mappingFields.filter(
                                                        (f) => f.isRequired,
                                                    )
                                                const mappedRequiredFields =
                                                    requiredFields.filter((f) =>
                                                        columnMappings.some(
                                                            (m) =>
                                                                m.targetField ===
                                                                f.fieldName,
                                                        ),
                                                    )
                                                return (
                                                    mappedRequiredFields.length <
                                                    requiredFields.length
                                                )
                                            })()}
                                        >
                                            Complete Upload
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Actions and Data Table */}
            {canPerformActions && (
                <Card>
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Chart of Accounts
                                {selectedProgram && selectedShop && (
                                    <span className="text-sm font-normal text-gray-600 ml-2">
                                        {selectedProgram.programName} -{' '}
                                        {selectedShop.name}
                                    </span>
                                )}
                            </h2>

                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="solid"
                                    icon={<BsUpload />}
                                    onClick={triggerFileInput}
                                    disabled={showExcelUpload}
                                >
                                    Upload Excel
                                </Button>

                                <Button
                                    variant="default"
                                    icon={<BsDownload />}
                                    onClick={() => {
                                        /* TODO: Export functionality */
                                    }}
                                    disabled={showExcelUpload}
                                >
                                    Export
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Matching Statistics */}
                    {matchingStatistics && (
                        <div className="p-4 border-b bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-white p-3 rounded-lg border">
                                    <div className="text-sm text-gray-600">
                                        Total Accounts
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {matchingStatistics.totalShopAccounts}
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border">
                                    <div className="text-sm text-gray-600">
                                        Matched
                                    </div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {matchingStatistics.matchedAccounts}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {(
                                            matchingStatistics.matchRate * 100
                                        ).toFixed(1)}
                                        % match rate
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border">
                                    <div className="text-sm text-gray-600">
                                        Potential Matches
                                    </div>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {matchingStatistics.potentialMatches}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {
                                            matchingStatistics.highConfidenceMatches
                                        }{' '}
                                        high confidence
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border">
                                    <div className="text-sm text-gray-600">
                                        Unmatched
                                    </div>
                                    <div className="text-2xl font-bold text-red-600">
                                        {matchingStatistics.unmatchedAccounts}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Avg confidence:{' '}
                                        {(
                                            matchingStatistics.averageConfidence *
                                            100
                                        ).toFixed(1)}
                                        %
                                    </div>
                                </div>
                            </div>

                            {/* Matching Controls */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Button
                                        variant="solid"
                                        color="blue"
                                        onClick={handleAutoMatch}
                                        loading={isAutoMatching}
                                        disabled={isAutoMatching}
                                    >
                                        Run Auto Matching
                                    </Button>

                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm font-medium">
                                            Status Filter:
                                        </label>
                                        <Select
                                            value={
                                                statusFilter
                                                    ? {
                                                          value: statusFilter,
                                                          label:
                                                              statusFilter ===
                                                              'Not Matched'
                                                                  ? 'Unmatched'
                                                                  : statusFilter,
                                                      }
                                                    : null
                                            }
                                            placeholder="All Statuses"
                                            options={[
                                                {
                                                    value: 'Matched',
                                                    label: 'Matched',
                                                },
                                                {
                                                    value: 'Not Matched',
                                                    label: 'Unmatched',
                                                },
                                                {
                                                    value: 'Pending Confirmation',
                                                    label: 'Pending Confirmation',
                                                },
                                                {
                                                    value: 'Confirmed',
                                                    label: 'Confirmed',
                                                },
                                                {
                                                    value: 'Rejected',
                                                    label: 'Rejected',
                                                },
                                            ]}
                                            onChange={(option) =>
                                                setStatusFilter(
                                                    option?.value || '',
                                                )
                                            }
                                            isClearable
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm font-medium">
                                            Search:
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Search accounts..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="w-64"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <Table>
                                <THead>
                                    <Tr>
                                        <Th>Account Number</Th>
                                        <Th>Account Name</Th>
                                        <Th>Description</Th>
                                        <Th>Status</Th>
                                        <Th>Matching Status</Th>
                                        <Th>Potential/Confirmed Matches</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {data.length === 0 ? (
                                        <Tr>
                                            <Td
                                                colSpan={7}
                                                className="text-center py-8 text-gray-500"
                                            >
                                                No chart of accounts found for
                                                this shop and program.
                                            </Td>
                                        </Tr>
                                    ) : (
                                        data.map((account) => {
                                            const hasPotentialMatches =
                                                account.potentialMatches &&
                                                account.potentialMatches
                                                    .length > 0
                                            const hasConfirmedMatch =
                                                account.confirmedMatch
                                            const bestMatch =
                                                hasPotentialMatches
                                                    ? account
                                                          .potentialMatches![0]
                                                    : null

                                            return (
                                                <Tr
                                                    key={
                                                        account.chartOfAccountsID
                                                    }
                                                >
                                                    <Td>
                                                        {account.accountNumber}
                                                    </Td>
                                                    <Td>
                                                        {account.accountName}
                                                    </Td>
                                                    <Td>
                                                        {
                                                            account.accountDescription
                                                        }
                                                    </Td>
                                                    <Td>
                                                        <Badge
                                                            className={
                                                                account.isActive
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }
                                                        >
                                                            {account.isActive
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </Badge>
                                                    </Td>

                                                    {/* Matching Status */}
                                                    <Td>
                                                        <Badge
                                                            className={
                                                                account.matchingStatus ===
                                                                'Confirmed'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : account.matchingStatus ===
                                                                        'Pending Confirmation'
                                                                      ? 'bg-yellow-100 text-yellow-800'
                                                                      : account.matchingStatus ===
                                                                          'Rejected'
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : account.matchingStatus ===
                                                                            'Matched'
                                                                          ? 'bg-blue-100 text-blue-800'
                                                                          : 'bg-gray-100 text-gray-800'
                                                            }
                                                        >
                                                            {account.matchingStatus ||
                                                                'Unmatched'}
                                                        </Badge>
                                                        {hasPotentialMatches && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {
                                                                    account
                                                                        .potentialMatches!
                                                                        .length
                                                                }{' '}
                                                                potential match
                                                                {account
                                                                    .potentialMatches!
                                                                    .length > 1
                                                                    ? 'es'
                                                                    : ''}
                                                            </div>
                                                        )}
                                                    </Td>

                                                    {/* Potential/Confirmed Matches */}
                                                    <Td>
                                                        {hasConfirmedMatch ? (
                                                            // Show confirmed match
                                                            <div className="border border-green-200 bg-green-50 p-3 rounded">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div className="font-medium text-green-800">
                                                                            {
                                                                                account
                                                                                    .confirmedMatch!
                                                                                    .masterAccountNumber
                                                                            }{' '}
                                                                            -{' '}
                                                                            {
                                                                                account
                                                                                    .confirmedMatch!
                                                                                    .masterAccountName
                                                                            }
                                                                        </div>
                                                                        <div className="text-sm text-green-600">
                                                                            Confidence:{' '}
                                                                            {Math.round(
                                                                                account
                                                                                    .confirmedMatch!
                                                                                    .matchingConfidence *
                                                                                    100,
                                                                            )}
                                                                            % (
                                                                            {
                                                                                account
                                                                                    .confirmedMatch!
                                                                                    .matchingMethod
                                                                            }
                                                                            )
                                                                        </div>
                                                                    </div>
                                                                    <Badge className="bg-green-100 text-green-800">
                                                                        Confirmed
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ) : hasPotentialMatches ? (
                                                            // Show potential matches
                                                            <div className="space-y-2">
                                                                {account.potentialMatches!.map(
                                                                    (
                                                                        match,
                                                                        index,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                match.matchingID
                                                                            }
                                                                            className={`border p-3 rounded ${
                                                                                index ===
                                                                                0
                                                                                    ? 'border-blue-200 bg-blue-50'
                                                                                    : 'border-gray-200 bg-gray-50'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex-1">
                                                                                    <div className="font-medium">
                                                                                        {
                                                                                            match.masterAccountNumber
                                                                                        }{' '}
                                                                                        -{' '}
                                                                                        {
                                                                                            match.masterAccountName
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-600">
                                                                                        <span
                                                                                            className={`font-medium ${
                                                                                                match.matchingConfidence >=
                                                                                                0.9
                                                                                                    ? 'text-green-600'
                                                                                                    : match.matchingConfidence >=
                                                                                                        0.7
                                                                                                      ? 'text-yellow-600'
                                                                                                      : 'text-red-600'
                                                                                            }`}
                                                                                        >
                                                                                            {Math.round(
                                                                                                match.matchingConfidence *
                                                                                                    100,
                                                                                            )}

                                                                                            %
                                                                                        </span>
                                                                                        <span className="ml-2">
                                                                                            (
                                                                                            {
                                                                                                match.matchingMethod
                                                                                            }

                                                                                            )
                                                                                        </span>
                                                                                        {index ===
                                                                                            0 && (
                                                                                            <Badge className="ml-2 bg-blue-100 text-blue-800">
                                                                                                Best
                                                                                                Match
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                                        {
                                                                                            match.matchingDetails
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-2 ml-3">
                                                                                    <Button
                                                                                        size="xs"
                                                                                        variant="solid"
                                                                                        color="green"
                                                                                        onClick={() =>
                                                                                            handleConfirmMatch(
                                                                                                match.matchingID,
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            showExcelUpload
                                                                                        }
                                                                                    >
                                                                                        Confirm
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="xs"
                                                                                        variant="solid"
                                                                                        color="red"
                                                                                        onClick={() =>
                                                                                            handleRejectMatch(
                                                                                                match.matchingID,
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            showExcelUpload
                                                                                        }
                                                                                    >
                                                                                        Reject
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-400 text-center py-2">
                                                                No matches found
                                                            </div>
                                                        )}
                                                    </Td>

                                                    {/* Actions */}
                                                    <Td>
                                                        <div className="flex items-center space-x-2">
                                                            {/* Conditional Undo button - only for confirmed/rejected matches that are not manual */}
                                                            {(() => {
                                                                // Check if we can undo this match
                                                                let canUndo =
                                                                    false
                                                                let matchingID =
                                                                    null

                                                                if (
                                                                    account.matchingStatus ===
                                                                        'Confirmed' &&
                                                                    account.confirmedMatch
                                                                ) {
                                                                    // For confirmed matches, check if it's not manual
                                                                    canUndo =
                                                                        account
                                                                            .confirmedMatch
                                                                            .matchingStatus !==
                                                                        'Manual'
                                                                    matchingID =
                                                                        account
                                                                            .confirmedMatch
                                                                            .matchingID
                                                                } else if (
                                                                    account.matchingStatus ===
                                                                    'Rejected'
                                                                ) {
                                                                    // For rejected matches, we can always undo using chartOfAccountsID
                                                                    canUndo =
                                                                        true
                                                                    matchingID =
                                                                        account.chartOfAccountsID // Will be used for display only
                                                                }

                                                                if (
                                                                    canUndo &&
                                                                    matchingID
                                                                ) {
                                                                    return (
                                                                        <Button
                                                                            size="xs"
                                                                            variant="plain"
                                                                            icon={
                                                                                <HiOutlineReply />
                                                                            }
                                                                            onClick={() => {
                                                                                // Use appropriate parameters based on match type
                                                                                if (
                                                                                    account.matchingStatus ===
                                                                                    'Confirmed'
                                                                                ) {
                                                                                    handleUndoMatch(
                                                                                        {
                                                                                            matchingIDs:
                                                                                                [
                                                                                                    matchingID!,
                                                                                                ],
                                                                                        },
                                                                                    )
                                                                                } else if (
                                                                                    account.matchingStatus ===
                                                                                    'Rejected'
                                                                                ) {
                                                                                    handleUndoMatch(
                                                                                        {
                                                                                            chartOfAccountIDs:
                                                                                                [
                                                                                                    account.chartOfAccountsID,
                                                                                                ],
                                                                                        },
                                                                                    )
                                                                                }
                                                                            }}
                                                                            disabled={
                                                                                showExcelUpload
                                                                            }
                                                                            title="Undo match"
                                                                        />
                                                                    )
                                                                }
                                                                return null
                                                            })()}

                                                            {/* Delete account */}
                                                            <Button
                                                                size="xs"
                                                                variant="plain"
                                                                icon={
                                                                    <BsTrash />
                                                                }
                                                                onClick={() =>
                                                                    handleDeleteAccount(
                                                                        account.chartOfAccountsID,
                                                                    )
                                                                }
                                                                disabled={
                                                                    showExcelUpload
                                                                }
                                                                title="Delete account"
                                                            />

                                                            {/* Manual matching */}
                                                            <Button
                                                                size="xs"
                                                                variant="solid"
                                                                color="blue"
                                                                onClick={() =>
                                                                    openManualMatchModal(
                                                                        account,
                                                                    )
                                                                }
                                                                disabled={
                                                                    showExcelUpload
                                                                }
                                                            >
                                                                Manual Match
                                                            </Button>
                                                        </div>
                                                    </Td>
                                                </Tr>
                                            )
                                        })
                                    )}
                                </TBody>
                            </Table>
                        )}

                        {/* Pagination Controls */}
                        {!isLoading && data.length > 0 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <div className="flex items-center space-x-4">
                                    <div className="text-sm text-gray-700 flex items-center">
                                        {isPaginationLoading && (
                                            <Spinner
                                                size="xs"
                                                className="mr-2"
                                            />
                                        )}
                                        Showing {startRecord} to {endRecord} of{' '}
                                        {totalCount} entries
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm font-medium">
                                            Show:
                                        </label>
                                        <Select
                                            value={{
                                                value: pageSize.toString(),
                                                label: pageSize.toString(),
                                            }}
                                            options={[
                                                { value: '10', label: '10' },
                                                { value: '20', label: '20' },
                                                { value: '50', label: '50' },
                                                { value: '100', label: '100' },
                                            ]}
                                            onChange={(option) => {
                                                if (option)
                                                    handlePageSizeChange(
                                                        parseInt(option.value),
                                                    )
                                            }}
                                            className="w-20"
                                            isDisabled={isPaginationLoading}
                                        />
                                        <span className="text-sm">
                                            per page
                                        </span>
                                    </div>
                                </div>

                                {/* Pagination Navigation */}
                                <div className="flex items-center space-x-2">
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        onClick={() => handlePageChange(1)}
                                        disabled={
                                            currentPage === 1 ||
                                            isPaginationLoading
                                        }
                                    >
                                        First
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        onClick={() =>
                                            handlePageChange(currentPage - 1)
                                        }
                                        disabled={
                                            currentPage === 1 ||
                                            isPaginationLoading
                                        }
                                    >
                                        Previous
                                    </Button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center space-x-1">
                                        {(() => {
                                            const pages = []
                                            const startPage = Math.max(
                                                1,
                                                currentPage - 2,
                                            )
                                            const endPage = Math.min(
                                                totalPages,
                                                currentPage + 2,
                                            )

                                            for (
                                                let i = startPage;
                                                i <= endPage;
                                                i++
                                            ) {
                                                pages.push(
                                                    <Button
                                                        key={i}
                                                        size="sm"
                                                        variant={
                                                            i === currentPage
                                                                ? 'solid'
                                                                : 'plain'
                                                        }
                                                        onClick={() =>
                                                            handlePageChange(i)
                                                        }
                                                        disabled={
                                                            isPaginationLoading
                                                        }
                                                        className="w-10"
                                                    >
                                                        {i}
                                                    </Button>,
                                                )
                                            }
                                            return pages
                                        })()}
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="plain"
                                        onClick={() =>
                                            handlePageChange(currentPage + 1)
                                        }
                                        disabled={
                                            currentPage === totalPages ||
                                            isPaginationLoading
                                        }
                                    >
                                        Next
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        onClick={() =>
                                            handlePageChange(totalPages)
                                        }
                                        disabled={
                                            currentPage === totalPages ||
                                            isPaginationLoading
                                        }
                                    >
                                        Last
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* No Selection State */}
            {!canPerformActions && (
                <Card>
                    <div className="p-8 text-center">
                        <div className="text-gray-500 mb-4">
                            <BsUpload size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            Select Program and Shop
                        </h3>
                        <p className="text-gray-600">
                            Please select both an accounting program and a shop
                            to view and manage the chart of accounts.
                        </p>
                    </div>
                </Card>
            )}

            {/* Inline Upload Status Section */}
            {showUploadStatus && uploadStatusData && (
                <Card>
                    <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center mb-3">
                                    {uploadStatusData.success &&
                                    uploadStatusData.failedRecords === 0 ? (
                                        <HiOutlineCheckCircle className="text-green-500 text-xl mr-2" />
                                    ) : (
                                        <HiOutlineExclamationCircle className="text-yellow-500 text-xl mr-2" />
                                    )}
                                    <h5 className="text-lg font-semibold">
                                        Upload{' '}
                                        {uploadStatusData.success
                                            ? 'Completed'
                                            : 'Status'}
                                    </h5>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-white p-3 rounded-lg border">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {uploadStatusData.processedRecords}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Processed Records
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border">
                                        <div className="text-2xl font-bold text-green-600">
                                            {uploadStatusData.successfulRecords}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Successful Records
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border">
                                        <div className="text-2xl font-bold text-red-600">
                                            {uploadStatusData.failedRecords}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Failed Records
                                        </div>
                                    </div>
                                </div>

                                {uploadStatusData.message && (
                                    <div className="mb-3">
                                        <p className="text-sm text-gray-700">
                                            {uploadStatusData.message}
                                        </p>
                                    </div>
                                )}

                                {uploadStatusData.errors &&
                                    uploadStatusData.errors.length > 0 && (
                                        <div className="mb-3">
                                            <h6 className="text-red-600 mb-2 font-semibold">
                                                Errors:
                                            </h6>
                                            <div className="max-h-32 overflow-y-auto">
                                                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                                    {uploadStatusData.errors.map(
                                                        (
                                                            error: string,
                                                            index: number,
                                                        ) => (
                                                            <li key={index}>
                                                                {error}
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                {uploadStatusData.success &&
                                    uploadStatusData.failedRecords === 0 && (
                                        <div className="text-sm text-gray-600">
                                            This section will close
                                            automatically in a few seconds.
                                        </div>
                                    )}
                            </div>

                            <Button
                                variant="plain"
                                size="xs"
                                icon={<HiOutlineX />}
                                onClick={closeUploadStatus}
                                className="ml-3"
                            />
                        </div>
                    </div>
                </Card>
            )}

            {/* Manual Matching Modal */}
            {showManualMatchModal && selectedAccountForMatching && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto relative">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                Create Manual Match:{' '}
                                {selectedAccountForMatching.accountName}
                            </h3>
                            <Button
                                variant="plain"
                                size="xs"
                                icon={<HiOutlineX />}
                                onClick={closeManualMatchModal}
                            />
                        </div>

                        <div className="mb-4">
                            <div className="bg-gray-50 p-4 rounded">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div>
                                            <strong>Account Number:</strong>{' '}
                                            {
                                                selectedAccountForMatching.accountNumber
                                            }
                                        </div>
                                        <div>
                                            <strong>Account Name:</strong>{' '}
                                            {
                                                selectedAccountForMatching.accountName
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <div>
                                            <strong>Description:</strong>{' '}
                                            {selectedAccountForMatching.accountDescription ||
                                                'N/A'}
                                        </div>
                                        <div>
                                            <strong>Current Status:</strong>
                                            <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                                                {selectedAccountForMatching.matchingStatus ||
                                                    'Unmatched'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Show existing potential matches if any */}
                        {selectedAccountForMatching.potentialMatches &&
                            selectedAccountForMatching.potentialMatches.length >
                                0 && (
                                <div className="mb-4">
                                    <h4 className="font-medium mb-2">
                                        Existing Potential Matches:
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedAccountForMatching.potentialMatches.map(
                                            (match, index) => (
                                                <div
                                                    key={match.matchingID}
                                                    className="border border-gray-200 bg-gray-50 p-3 rounded"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-medium">
                                                                {
                                                                    match.masterAccountNumber
                                                                }{' '}
                                                                -{' '}
                                                                {
                                                                    match.masterAccountName
                                                                }
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                Confidence:{' '}
                                                                {Math.round(
                                                                    match.matchingConfidence *
                                                                        100,
                                                                )}
                                                                % (
                                                                {
                                                                    match.matchingMethod
                                                                }
                                                                )
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                size="xs"
                                                                variant="solid"
                                                                color="green"
                                                                onClick={() => {
                                                                    handleConfirmMatch(
                                                                        match.matchingID,
                                                                    )
                                                                    closeManualMatchModal()
                                                                }}
                                                            >
                                                                Confirm This
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    <hr className="my-4" />
                                </div>
                            )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Or Select a Different Master Account *
                            </label>
                            <Select
                                value={
                                    selectedMasterAccountId
                                        ? {
                                              value: selectedMasterAccountId.toString(),
                                              label:
                                                  selectedMasterAccounts.find(
                                                      (acc) =>
                                                          acc.chartOfAccountsID ===
                                                          selectedMasterAccountId,
                                                  )?.accountName || '',
                                          }
                                        : null
                                }
                                placeholder="Select a master account"
                                options={selectedMasterAccounts.map(
                                    (account) => ({
                                        value: account.chartOfAccountsID.toString(),
                                        label: `${account.accountNumber} - ${account.accountName}`,
                                    }),
                                )}
                                onChange={(option) => {
                                    setSelectedMasterAccountId(
                                        option ? parseInt(option.value) : null,
                                    )
                                }}
                                isSearchable
                                filterOption={(option, inputValue) => {
                                    // Custom filter to use "contains" instead of "begins with"
                                    if (!inputValue) return true
                                    const searchTerm = inputValue.toLowerCase()
                                    const label = option.label.toLowerCase()
                                    return label.includes(searchTerm)
                                }}
                                maxMenuHeight={300}
                                menuPortalTarget={document.body}
                                styles={{
                                    menuPortal: (base) => ({
                                        ...base,
                                        zIndex: 9999,
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        zIndex: 9999,
                                    }),
                                }}
                                menuPlacement="auto"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {selectedMasterAccounts.length} master accounts
                                available
                            </div>
                        </div>

                        <div className="mb-4">
                            <Checkbox
                                checked={isConfirmedMatch}
                                onChange={(checked) =>
                                    setIsConfirmedMatch(checked)
                                }
                            >
                                Mark as Confirmed
                            </Checkbox>
                            <div className="text-xs text-gray-500 mt-1">
                                When checked, the match will be immediately
                                confirmed. Otherwise, it will be pending
                                confirmation.
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3">
                            <Button
                                variant="plain"
                                onClick={closeManualMatchModal}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                color="blue"
                                onClick={handleCreateManualMatch}
                                disabled={!selectedMasterAccountId}
                            >
                                Create Manual Match
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ShopChartOfAccountPage

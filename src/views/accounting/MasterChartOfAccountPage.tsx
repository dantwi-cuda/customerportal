import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/auth'
import {
    Card,
    Button,
    Input,
    Select,
    Table,
    Pagination,
    Notification,
    toast,
    Skeleton,
    Alert,
    Tag,
    Upload,
    Dialog,
    Progress,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlineDownload,
    HiOutlineUpload,
    HiOutlineDocumentText,
    HiOutlineTrash,
    HiOutlinePencil,
    HiOutlineEye,
    HiOutlinePlus,
    HiOutlineX,
    HiOutlineRefresh,
    HiOutlineExclamationCircle,
    HiOutlineCheckCircle,
} from 'react-icons/hi'
import ProgramService from '@/services/ProgramService'
import AccountingService from '@/services/AccountingService'
import BulkUploadService from '@/services/BulkUploadService'
import ExcelUploadCard from '@/components/shared/ExcelUploadCard'
import { isValidExcelFile } from '@/utils/excelUtils'
import type { Program } from '@/@types/program'
import type {
    ChartOfAccount,
    ChartOfAccountResponse,
    BulkUploadResponseDto,
    BulkUploadStatusDto,
    BulkUploadErrorDto,
    MasterChartUploadFilters,
    CreateChartOfAccountDto,
    UpdateChartOfAccountDto,
} from '@/@types/accounting'

const MasterChartOfAccountPage = () => {
    const { user } = useAuth()
    const [programs, setPrograms] = useState<Program[]>([])
    const [selectedProgramId, setSelectedProgramId] = useState<number | null>(
        null,
    )
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [chartsLoading, setChartsLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [accountTypeFilter, setAccountTypeFilter] = useState('')
    const [accountTypeOptions, setAccountTypeOptions] = useState([
        { value: '', label: 'All Account Types' },
    ])
    const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(
        undefined,
    )
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(20)
    const [totalRecords, setTotalRecords] = useState(0)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [selectedAccount, setSelectedAccount] =
        useState<ChartOfAccount | null>(null)
    const [formData, setFormData] = useState<CreateChartOfAccountDto>({
        programID: 0,
        accountNumber: '',
        accountName: '',
        accountType: '',
        accountDescription: '',
        isActive: true,
    })

    // Excel upload states
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [showExcelUpload, setShowExcelUpload] = useState(false)

    // Async upload tracking states
    const [uploadJobId, setUploadJobId] = useState<number | null>(null)
    const [uploadStatus, setUploadStatus] =
        useState<BulkUploadStatusDto | null>(null)
    const [showUploadProgress, setShowUploadProgress] = useState(false)
    const [uploadErrors, setUploadErrors] = useState<BulkUploadErrorDto[]>([])
    const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(
        null,
    )
    const [hasRefreshedTable, setHasRefreshedTable] = useState(false)
    const [hasShownNotification, setHasShownNotification] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Check if user has tenant admin access
    const hasTenantAdminAccess = user?.authority?.some((role: string) =>
        ['Tenant-Admin'].includes(role),
    )

    useEffect(() => {
        loadPrograms()
    }, [])

    useEffect(() => {
        if (selectedProgramId) {
            loadChartOfAccounts()
        } else {
            setChartOfAccounts([])
            setTotalRecords(0)
        }
    }, [
        selectedProgramId,
        searchTerm,
        accountTypeFilter,
        isActiveFilter,
        currentPage,
    ])

    // Load account types when program changes
    useEffect(() => {
        if (selectedProgramId) {
            loadAccountTypes()
        } else {
            setAccountTypeOptions([{ value: '', label: 'All Account Types' }])
            setAccountTypeFilter('') // Reset filter when program changes
        }
    }, [selectedProgramId])

    // Cleanup polling interval on unmount
    useEffect(() => {
        return () => {
            if (pollInterval) {
                clearInterval(pollInterval)
            }
        }
    }, [pollInterval])

    const loadPrograms = async () => {
        try {
            setLoading(true)
            const allPrograms = await ProgramService.getPrograms()

            // Filter programs by accounting program types
            // You can adjust this filter based on your program type naming convention
            const accountingPrograms = allPrograms.filter(
                (program) =>
                    program.programTypeName
                        ?.toLowerCase()
                        .includes('accounting') ||
                    program.programTypeName
                        ?.toLowerCase()
                        .includes('financial') ||
                    program.programTypeName?.toLowerCase().includes('chart'),
            )

            setPrograms(accountingPrograms)

            // Auto-select first program if there's only one
            if (accountingPrograms.length === 1) {
                setSelectedProgramId(accountingPrograms[0].programId)
            }
        } catch (error) {
            console.error('Error loading programs:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load programs
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const loadAccountTypes = async () => {
        if (!selectedProgramId) {
            setAccountTypeOptions([{ value: '', label: 'All Account Types' }])
            return
        }

        try {
            const response =
                await AccountingService.getProgramAccountTypes(
                    selectedProgramId,
                )
            const options = [
                { value: '', label: 'All Account Types' },
                ...response.accountTypes.map((type) => ({
                    value: type.accountType,
                    label: `${type.accountType} (${type.numOfAccounts})`,
                })),
            ]
            setAccountTypeOptions(options)
        } catch (error) {
            console.error('Error loading account types:', error)
            // Fallback to default option
            setAccountTypeOptions([{ value: '', label: 'All Account Types' }])
        }
    }

    const loadChartOfAccounts = async () => {
        if (!selectedProgramId) return

        try {
            setChartsLoading(true)
            const filters: MasterChartUploadFilters = {
                searchTerm: searchTerm || undefined,
                accountType: accountTypeFilter || undefined,
                isActive: isActiveFilter,
                isMasterAccount: true, // Only show master accounts
                pageNumber: currentPage,
                pageSize,
            }

            const response: ChartOfAccountResponse =
                await AccountingService.getMasterChartOfAccounts(
                    selectedProgramId,
                    filters,
                )

            setChartOfAccounts(response.chartOfAccounts || [])
            setTotalRecords(response.totalCount || 0)
        } catch (error) {
            console.error('Error loading chart of accounts:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load chart of accounts
                </Notification>,
            )
        } finally {
            setChartsLoading(false)
        }
    }

    // Poll upload status
    const pollUploadStatus = async (jobId: number) => {
        try {
            const status = await BulkUploadService.getJobStatus(jobId)
            setUploadStatus(status)

            // Check if upload is complete
            if (
                status.status === 'Completed' ||
                status.status === 'Failed' ||
                status.status === 'Error'
            ) {
                // Stop polling
                if (pollInterval) {
                    clearInterval(pollInterval)
                    setPollInterval(null)
                }

                // Get errors if any
                if (
                    status.failedRecords > 0 ||
                    status.status === 'Failed' ||
                    status.status === 'Error'
                ) {
                    const errors =
                        await BulkUploadService.getBulkUploadErrors(jobId)
                    setUploadErrors(errors)
                }

                // Refresh table only once if successful and not already refreshed
                if (
                    status.status === 'Completed' &&
                    status.successfulRecords > 0 &&
                    !hasRefreshedTable
                ) {
                    setHasRefreshedTable(true)
                    await loadChartOfAccounts()

                    if (!hasShownNotification) {
                        setHasShownNotification(true)
                        toast.push(
                            <Notification title="Success" type="success">
                                Upload completed successfully.{' '}
                                {status.successfulRecords} records imported.
                            </Notification>,
                        )
                    }
                } else if (
                    status.status === 'Completed' &&
                    status.failedRecords > 0 &&
                    !hasRefreshedTable
                ) {
                    setHasRefreshedTable(true)
                    if (status.successfulRecords > 0) {
                        await loadChartOfAccounts()
                    }

                    if (!hasShownNotification) {
                        setHasShownNotification(true)
                        toast.push(
                            <Notification title="Warning" type="warning">
                                Upload completed with errors.{' '}
                                {status.successfulRecords} successful,{' '}
                                {status.failedRecords} failed.
                            </Notification>,
                        )
                    }
                } else if (
                    (status.status === 'Failed' || status.status === 'Error') &&
                    !hasShownNotification
                ) {
                    setHasShownNotification(true)
                    toast.push(
                        <Notification title="Error" type="danger">
                            Upload failed: {status.errorMessage}
                        </Notification>,
                    )
                }
            }
        } catch (error) {
            console.error('Error polling upload status:', error)
        }
    }

    // Start polling for upload status
    const startPolling = (jobId: number) => {
        // Reset refresh and notification flags for new upload
        setHasRefreshedTable(false)
        setHasShownNotification(false)

        // Initial poll
        pollUploadStatus(jobId)

        // Set up interval polling every 2 seconds
        const interval = setInterval(() => {
            pollUploadStatus(jobId)
        }, 2000)

        setPollInterval(interval)
    }

    // Close upload progress section
    const closeUploadProgress = () => {
        setShowUploadProgress(false)
        setUploadJobId(null)
        setUploadStatus(null)
        setUploadErrors([])
        setHasRefreshedTable(false)
        setHasShownNotification(false)
        if (pollInterval) {
            clearInterval(pollInterval)
            setPollInterval(null)
        }
    }

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0 || !selectedProgramId) return

        const file = files[0]

        // Validate file type
        if (!isValidExcelFile(file)) {
            toast.push(
                <Notification title="Error" type="danger">
                    Please select an Excel file (.xlsx, .xls, or .xlsm)
                </Notification>,
            )
            return
        }

        // Store file and show inline upload card
        setSelectedFile(file)
        setShowExcelUpload(true)

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleSheetSelection = async (file: File, sheetName: string) => {
        if (!selectedProgramId) return

        try {
            setUploading(true)

            // Start the async upload
            const result =
                await AccountingService.importExcelMasterChartOfAccounts(
                    selectedProgramId,
                    file,
                    sheetName,
                )

            // Store job ID and start tracking
            setUploadJobId(result.jobID)
            setShowUploadProgress(true)

            // Hide the excel upload card
            setSelectedFile(null)
            setShowExcelUpload(false)

            // Start polling for status
            startPolling(result.jobID)

            toast.push(
                <Notification title="Upload Started" type="info">
                    File upload started. Job ID: {result.jobID}
                </Notification>,
            )
        } catch (error) {
            console.error('Error starting upload:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to start Excel file upload
                </Notification>,
            )
        } finally {
            setUploading(false)
        }
    }

    const handleCancelUpload = () => {
        setSelectedFile(null)
        setShowExcelUpload(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            const blob = await AccountingService.downloadTemplate()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'chart-of-accounts-template.xlsx'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.push(
                <Notification title="Success" type="success">
                    Template downloaded successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Error downloading template:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to download template
                </Notification>,
            )
        }
    }

    const handleExportCharts = async () => {
        if (!selectedProgramId) return

        try {
            const filters: MasterChartUploadFilters = {
                searchTerm: searchTerm || undefined,
                accountType: accountTypeFilter || undefined,
                isActive: isActiveFilter,
            }

            const blob = await AccountingService.exportChartOfAccounts(
                selectedProgramId,
                filters,
            )
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `chart-of-accounts-${selectedProgramId}-${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.push(
                <Notification title="Success" type="success">
                    Chart of accounts exported successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Error exporting charts:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to export chart of accounts
                </Notification>,
            )
        }
    }

    const handleCreateAccount = async () => {
        if (!selectedProgramId) return

        try {
            const createData = {
                ...formData,
                programID: selectedProgramId,
            }
            await AccountingService.createMasterChartOfAccount(
                selectedProgramId,
                createData,
            )
            toast.push(
                <Notification title="Success" type="success">
                    Chart of account created successfully
                </Notification>,
            )
            setCreateDialogOpen(false)
            setFormData({
                programID: 0,
                accountNumber: '',
                accountName: '',
                accountType: '',
                accountDescription: '',
                isActive: true,
            })
            await loadChartOfAccounts()
        } catch (error) {
            console.error('Error creating account:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to create chart of account
                </Notification>,
            )
        }
    }

    const handleEditAccount = async () => {
        if (!selectedProgramId || !selectedAccount) return

        try {
            const updateData: UpdateChartOfAccountDto = {
                accountNumber: formData.accountNumber,
                accountName: formData.accountName,
                accountType: formData.accountType,
                accountDescription: formData.accountDescription,
                isActive: formData.isActive,
            }

            await AccountingService.updateMasterChartOfAccount(
                selectedProgramId,
                selectedAccount.chartOfAccountsID,
                updateData,
            )

            toast.push(
                <Notification title="Success" type="success">
                    Chart of account updated successfully
                </Notification>,
            )
            setEditDialogOpen(false)
            setSelectedAccount(null)
            await loadChartOfAccounts()
        } catch (error) {
            console.error('Error updating account:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to update chart of account
                </Notification>,
            )
        }
    }

    const handleDeleteAccount = async (accountId: number) => {
        if (
            !selectedProgramId ||
            !window.confirm(
                'Are you sure you want to delete this chart of account?',
            )
        ) {
            return
        }

        try {
            await AccountingService.deleteMasterChartOfAccount(
                selectedProgramId,
                accountId,
            )
            toast.push(
                <Notification title="Success" type="success">
                    Chart of account deleted successfully
                </Notification>,
            )
            await loadChartOfAccounts()
        } catch (error) {
            console.error('Error deleting account:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to delete chart of account
                </Notification>,
            )
        }
    }

    const openEditDialog = (account: ChartOfAccount) => {
        setSelectedAccount(account)
        setFormData({
            programID: selectedProgramId!,
            accountNumber: account.accountNumber || '',
            accountName: account.accountName || '',
            accountType: account.accountType || '',
            accountDescription: account.accountDescription || '',
            isActive: account.isActive,
        })
        setEditDialogOpen(true)
    }

    const openCreateDialog = () => {
        setFormData({
            programID: selectedProgramId!,
            accountNumber: '',
            accountName: '',
            accountType: '',
            accountDescription: '',
            isActive: true,
        })
        setCreateDialogOpen(true)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString()
    }

    const isActiveOptions = [
        { value: '', label: 'All Status' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
    ]

    if (!hasTenantAdminAccess) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to access Master Chart of Account
                    management.
                </Alert>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton height="60px" />
                <Skeleton height="400px" />
            </div>
        )
    }

    if (programs.length === 0) {
        return (
            <Card>
                <Alert type="info">
                    No accounting programs found. Master Chart of Account
                    management is only available for accounting program types.
                </Alert>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <div className="mb-6">
                    <h4 className="mb-2">Master Chart of Account</h4>
                    <p className="text-gray-600">
                        Manage master chart of accounts for accounting programs.
                        Upload, view, edit, and download chart of accounts data.
                    </p>
                </div>

                {/* Program Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Select Accounting Program *
                    </label>
                    <Select
                        placeholder="Select an accounting program"
                        value={
                            selectedProgramId
                                ? {
                                      value: selectedProgramId.toString(),
                                      label:
                                          programs.find(
                                              (p) =>
                                                  p.programId ===
                                                  selectedProgramId,
                                          )?.programName || '',
                                  }
                                : null
                        }
                        options={programs.map((program) => ({
                            value: program.programId.toString(),
                            label: program.programName,
                        }))}
                        onChange={(option: any) => {
                            const programId = option
                                ? parseInt(option.value)
                                : null
                            setSelectedProgramId(programId)
                            setCurrentPage(1) // Reset pagination
                        }}
                        className="max-w-md"
                    />
                </div>

                {/* Actions - Only show when program is selected */}
                {selectedProgramId && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiOutlinePlus />}
                            onClick={openCreateDialog}
                        >
                            Create New Account
                        </Button>

                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiOutlineUpload />}
                            onClick={() => fileInputRef.current?.click()}
                            loading={uploading}
                        >
                            Upload Excel
                        </Button>

                        <Button
                            variant="default"
                            size="sm"
                            icon={<HiOutlineDocumentText />}
                            onClick={handleDownloadTemplate}
                        >
                            Download Template
                        </Button>

                        <Button
                            variant="default"
                            size="sm"
                            icon={<HiOutlineDownload />}
                            onClick={handleExportCharts}
                            disabled={chartOfAccounts.length === 0}
                        >
                            Export Current View
                        </Button>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.xlsm"
                            onChange={(e) => handleFileUpload(e.target.files)}
                            style={{ display: 'none' }}
                        />
                    </div>
                )}
            </Card>

            {/* Excel Upload Card - Show when file is selected */}
            {showExcelUpload && selectedFile && (
                <ExcelUploadCard
                    file={selectedFile}
                    onConfirm={handleSheetSelection}
                    onCancel={handleCancelUpload}
                    uploading={uploading}
                />
            )}

            {/* Upload Progress Card - Show when upload is in progress */}
            {showUploadProgress && uploadJobId && (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold">
                            Upload Progress
                        </h5>
                        <Button
                            variant="plain"
                            size="sm"
                            icon={<HiOutlineX />}
                            onClick={closeUploadProgress}
                        />
                    </div>

                    {uploadStatus ? (
                        <div className="space-y-4">
                            {/* Status Header */}
                            <div className="flex items-center space-x-2">
                                {uploadStatus.status === 'Completed' ? (
                                    <HiOutlineCheckCircle className="text-green-500 text-xl" />
                                ) : uploadStatus.status === 'Failed' ||
                                  uploadStatus.status === 'Error' ? (
                                    <HiOutlineExclamationCircle className="text-red-500 text-xl" />
                                ) : (
                                    <HiOutlineRefresh className="text-blue-500 text-xl animate-spin" />
                                )}
                                <span className="font-medium">
                                    Job ID: {uploadJobId} - Status:{' '}
                                    {uploadStatus.status}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Progress</span>
                                    <span>
                                        {uploadStatus.percentageComplete.toFixed(
                                            1,
                                        )}
                                        %
                                    </span>
                                </div>
                                <Progress
                                    percent={uploadStatus.percentageComplete}
                                    className={
                                        uploadStatus.status === 'Failed' ||
                                        uploadStatus.status === 'Error'
                                            ? 'text-red-500'
                                            : 'text-blue-500'
                                    }
                                />
                            </div>

                            {/* Statistics */}
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-lg font-bold text-gray-600">
                                        {uploadStatus.totalRecords}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Total
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded">
                                    <div className="text-lg font-bold text-blue-600">
                                        {uploadStatus.processedRecords}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                        Processed
                                    </div>
                                </div>
                                <div className="bg-green-50 p-3 rounded">
                                    <div className="text-lg font-bold text-green-600">
                                        {uploadStatus.successfulRecords}
                                    </div>
                                    <div className="text-sm text-green-600">
                                        Success
                                    </div>
                                </div>
                                <div className="bg-red-50 p-3 rounded">
                                    <div className="text-lg font-bold text-red-600">
                                        {uploadStatus.failedRecords}
                                    </div>
                                    <div className="text-sm text-red-600">
                                        Failed
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            {uploadStatus.errorMessage && (
                                <Alert type="danger">
                                    {uploadStatus.errorMessage}
                                </Alert>
                            )}

                            {/* Error Details */}
                            {uploadErrors.length > 0 && (
                                <div>
                                    <h6 className="text-red-600 mb-2 font-medium">
                                        Error Details ({uploadErrors.length}{' '}
                                        errors):
                                    </h6>
                                    <div className="max-h-40 overflow-y-auto bg-red-50 p-3 rounded">
                                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                            {uploadErrors
                                                .slice(0, 10)
                                                .map((error, index) => (
                                                    <li key={index}>
                                                        Row {error.rowNumber}:{' '}
                                                        {error.errorMessage}
                                                        {error.columnName &&
                                                            ` (Column: ${error.columnName})`}
                                                    </li>
                                                ))}
                                            {uploadErrors.length > 10 && (
                                                <li>
                                                    ... and{' '}
                                                    {uploadErrors.length - 10}{' '}
                                                    more errors
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <HiOutlineRefresh className="text-blue-500 text-lg animate-spin" />
                            <span>Initializing upload...</span>
                        </div>
                    )}
                </Card>
            )}

            {/* Filters and Data Table - Only show when program is selected */}
            {selectedProgramId && (
                <Card>
                    {/* Filters */}
                    <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Search
                                </label>
                                <Input
                                    placeholder="Search accounts..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    prefix={<HiOutlineSearch />}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Account Type
                                </label>
                                <Select
                                    placeholder="Filter by account type"
                                    value={
                                        accountTypeFilter
                                            ? accountTypeOptions.find(
                                                  (opt) =>
                                                      opt.value ===
                                                      accountTypeFilter,
                                              )
                                            : accountTypeOptions[0]
                                    }
                                    options={accountTypeOptions}
                                    onChange={(option: any) => {
                                        setAccountTypeFilter(
                                            option?.value || '',
                                        )
                                        setCurrentPage(1)
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Status
                                </label>
                                <Select
                                    placeholder="Filter by status"
                                    value={
                                        isActiveFilter !== undefined
                                            ? isActiveOptions.find(
                                                  (opt) =>
                                                      opt.value ===
                                                      isActiveFilter.toString(),
                                              )
                                            : isActiveOptions[0]
                                    }
                                    options={isActiveOptions}
                                    onChange={(option: any) => {
                                        const value = option?.value
                                        setIsActiveFilter(
                                            value === ''
                                                ? undefined
                                                : value === 'true',
                                        )
                                        setCurrentPage(1)
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    {chartsLoading ? (
                        <Skeleton height="400px" />
                    ) : (
                        <>
                            <Table>
                                <Table.THead>
                                    <Table.Tr>
                                        <Table.Th>COA Sequence</Table.Th>
                                        <Table.Th>Indent Level</Table.Th>
                                        <Table.Th>Account Number</Table.Th>
                                        <Table.Th>Account Name</Table.Th>
                                        <Table.Th>Dr/Cr</Table.Th>
                                        <Table.Th>Description</Table.Th>
                                        <Table.Th>Account Type</Table.Th>
                                        <Table.Th>Line Type</Table.Th>
                                        <Table.Th>Parent COA</Table.Th>
                                        <Table.Th>Effective Date</Table.Th>
                                        <Table.Th>Expiry Date</Table.Th>
                                        <Table.Th>Actions</Table.Th>
                                    </Table.Tr>
                                </Table.THead>
                                <Table.TBody>
                                    {chartOfAccounts.length === 0 ? (
                                        <Table.Tr>
                                            <Table.Td
                                                colSpan={12}
                                                className="text-center py-8"
                                            >
                                                <div className="text-gray-500">
                                                    No chart of accounts found.
                                                    {programs.length > 0 && (
                                                        <div className="mt-2">
                                                            <Button
                                                                variant="plain"
                                                                size="sm"
                                                                onClick={() =>
                                                                    fileInputRef.current?.click()
                                                                }
                                                            >
                                                                Upload your
                                                                first chart of
                                                                accounts
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </Table.Td>
                                        </Table.Tr>
                                    ) : (
                                        chartOfAccounts.map((account) => (
                                            <Table.Tr
                                                key={account.chartOfAccountsID}
                                            >
                                                <Table.Td>
                                                    <span className="font-medium">
                                                        {account.coASequenceNumber ||
                                                            'N/A'}
                                                    </span>
                                                </Table.Td>
                                                <Table.Td>
                                                    <span className="font-medium">
                                                        {account.indentLevel ||
                                                            'N/A'}
                                                    </span>
                                                </Table.Td>
                                                <Table.Td>
                                                    <span className="font-medium">
                                                        {account.accountNumber ||
                                                            'N/A'}
                                                    </span>
                                                </Table.Td>
                                                <Table.Td>
                                                    <span className="font-medium">
                                                        {account.accountName ||
                                                            'N/A'}
                                                    </span>
                                                </Table.Td>
                                                <Table.Td>
                                                    <span className="font-medium">
                                                        {account.drCrDefault ||
                                                            'N/A'}
                                                    </span>
                                                </Table.Td>
                                                <Table.Td>
                                                    <span className="text-gray-600 max-w-xs truncate block">
                                                        {account.accountDescription ||
                                                            'N/A'}
                                                    </span>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Tag className="bg-blue-100 text-blue-700">
                                                        {account.accountType ||
                                                            'N/A'}
                                                    </Tag>
                                                </Table.Td>
                                                <Table.Td>
                                                    <span className="font-medium">
                                                        {account.lineType ||
                                                            'N/A'}
                                                    </span>
                                                </Table.Td>
                                                <Table.Td>
                                                    <span className="font-medium">
                                                        {account.parentCoA ||
                                                            'N/A'}
                                                    </span>
                                                </Table.Td>
                                                <Table.Td>
                                                    <span className="text-gray-600">
                                                        {formatDate(
                                                            account.effectiveDate,
                                                        )}
                                                    </span>
                                                </Table.Td>
                                                <Table.Td>
                                                    <span className="text-gray-600">
                                                        {formatDate(
                                                            account.expiryDate,
                                                        )}
                                                    </span>
                                                </Table.Td>
                                                <Table.Td>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="plain"
                                                            size="xs"
                                                            icon={
                                                                <HiOutlinePencil />
                                                            }
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    account,
                                                                )
                                                            }
                                                            title="Edit Account"
                                                        />
                                                        <Button
                                                            variant="plain"
                                                            size="xs"
                                                            icon={
                                                                <HiOutlineTrash />
                                                            }
                                                            onClick={() =>
                                                                handleDeleteAccount(
                                                                    account.chartOfAccountsID,
                                                                )
                                                            }
                                                            title="Delete Account"
                                                            className="text-red-600 hover:text-red-700"
                                                        />
                                                    </div>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))
                                    )}
                                </Table.TBody>
                            </Table>

                            {/* Pagination */}
                            {totalRecords > pageSize && (
                                <div className="mt-6 flex justify-between items-center">
                                    <div className="text-sm text-gray-600">
                                        Showing{' '}
                                        {(currentPage - 1) * pageSize + 1} to{' '}
                                        {Math.min(
                                            currentPage * pageSize,
                                            totalRecords,
                                        )}{' '}
                                        of {totalRecords} results
                                    </div>
                                    <Pagination
                                        total={totalRecords}
                                        pageSize={pageSize}
                                        currentPage={currentPage}
                                        onChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </Card>
            )}

            {/* Create Account Dialog */}
            <Dialog
                isOpen={createDialogOpen}
                width={500}
                onRequestClose={() => setCreateDialogOpen(false)}
            >
                <div className="p-6">
                    <h5 className="mb-4">Create New Chart of Account</h5>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Account Number *
                            </label>
                            <Input
                                value={formData.accountNumber || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        accountNumber: e.target.value,
                                    })
                                }
                                placeholder="Enter account number"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Account Name *
                            </label>
                            <Input
                                value={formData.accountName || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        accountName: e.target.value,
                                    })
                                }
                                placeholder="Enter account name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Account Type *
                            </label>
                            <Select
                                value={
                                    formData.accountType
                                        ? {
                                              value: formData.accountType,
                                              label: formData.accountType,
                                          }
                                        : null
                                }
                                options={[
                                    { value: 'Asset', label: 'Asset' },
                                    { value: 'Liability', label: 'Liability' },
                                    { value: 'Equity', label: 'Equity' },
                                    { value: 'Revenue', label: 'Revenue' },
                                    { value: 'Expense', label: 'Expense' },
                                    {
                                        value: 'Cost of Goods',
                                        label: 'Cost of Goods',
                                    },
                                ]}
                                onChange={(option: any) =>
                                    setFormData({
                                        ...formData,
                                        accountType: option?.value || '',
                                    })
                                }
                                placeholder="Select account type"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Description
                            </label>
                            <Input
                                value={formData.accountDescription || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        accountDescription: e.target.value,
                                    })
                                }
                                placeholder="Enter description (optional)"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        isActive: e.target.checked,
                                    })
                                }
                                className="mr-2"
                            />
                            <label
                                htmlFor="isActive"
                                className="text-sm font-medium"
                            >
                                Active
                            </label>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button
                            variant="plain"
                            onClick={() => setCreateDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            onClick={handleCreateAccount}
                            disabled={
                                !formData.accountNumber ||
                                !formData.accountName ||
                                !formData.accountType
                            }
                        >
                            Create Account
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Edit Account Dialog */}
            <Dialog
                isOpen={editDialogOpen}
                width={500}
                onRequestClose={() => setEditDialogOpen(false)}
            >
                <div className="p-6">
                    <h5 className="mb-4">Edit Chart of Account</h5>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Account Number *
                            </label>
                            <Input
                                value={formData.accountNumber || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        accountNumber: e.target.value,
                                    })
                                }
                                placeholder="Enter account number"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Account Name *
                            </label>
                            <Input
                                value={formData.accountName || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        accountName: e.target.value,
                                    })
                                }
                                placeholder="Enter account name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Account Type *
                            </label>
                            <Select
                                value={
                                    formData.accountType
                                        ? {
                                              value: formData.accountType,
                                              label: formData.accountType,
                                          }
                                        : null
                                }
                                options={[
                                    { value: 'Asset', label: 'Asset' },
                                    { value: 'Liability', label: 'Liability' },
                                    { value: 'Equity', label: 'Equity' },
                                    { value: 'Revenue', label: 'Revenue' },
                                    { value: 'Expense', label: 'Expense' },
                                    {
                                        value: 'Cost of Goods',
                                        label: 'Cost of Goods',
                                    },
                                ]}
                                onChange={(option: any) =>
                                    setFormData({
                                        ...formData,
                                        accountType: option?.value || '',
                                    })
                                }
                                placeholder="Select account type"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Description
                            </label>
                            <Input
                                value={formData.accountDescription || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        accountDescription: e.target.value,
                                    })
                                }
                                placeholder="Enter description (optional)"
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="editIsActive"
                                checked={formData.isActive}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        isActive: e.target.checked,
                                    })
                                }
                                className="mr-2"
                            />
                            <label
                                htmlFor="editIsActive"
                                className="text-sm font-medium"
                            >
                                Active
                            </label>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button
                            variant="plain"
                            onClick={() => setEditDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            onClick={handleEditAccount}
                            disabled={
                                !formData.accountNumber ||
                                !formData.accountName ||
                                !formData.accountType
                            }
                        >
                            Update Account
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default MasterChartOfAccountPage

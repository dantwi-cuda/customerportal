import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/auth'
import { useParams, useNavigate } from 'react-router-dom'
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
    Dialog,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlineDownload,
    HiOutlineUpload,
    HiOutlineDocumentText,
    HiOutlineTrash,
    HiOutlinePencil,
    HiOutlineEye,
    HiOutlineArrowLeft,
    HiOutlinePlus,
} from 'react-icons/hi'
import ProgramService from '@/services/ProgramService'
import AccountingService from '@/services/AccountingService'
import ExcelUploadCard from '@/components/shared/ExcelUploadCard'
import { isValidExcelFile } from '@/utils/excelUtils'
import type { Program } from '@/@types/program'
import type {
    ChartOfAccount,
    ChartOfAccountResponse,
    BulkUploadResponseDto,
    MasterChartUploadFilters,
    CreateChartOfAccountDto,
    UpdateChartOfAccountDto,
} from '@/@types/accounting'

const ProgramChartOfAccountPage = () => {
    const { user } = useAuth()
    const { programId } = useParams<{ programId: string }>()
    const navigate = useNavigate()

    const [program, setProgram] = useState<Program | null>(null)
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [chartsLoading, setChartsLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [accountTypeFilter, setAccountTypeFilter] = useState('')
    const [accountTypeOptions, setAccountTypeOptions] = useState([
        { value: '', label: 'All Types' },
    ])
    const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(
        undefined,
    )
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(20)
    const [totalRecords, setTotalRecords] = useState(0)

    // Dialog states
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [uploadResult, setUploadResult] =
        useState<BulkUploadResponseDto | null>(null)
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

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Check if user has required permissions
    const isTenantAdmin = user?.authority?.some((role: string) =>
        ['Tenant-Admin'].includes(role),
    )

    const isPortalAdmin = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    // Determine the correct programs page URL based on user role
    const getProgramsPageUrl = () => {
        if (isTenantAdmin) {
            return '/app/programs'
        } else if (isPortalAdmin) {
            return '/tenantportal/programs'
        } else {
            return '/app/programs' // fallback
        }
    }

    useEffect(() => {
        if (programId && (isTenantAdmin || isPortalAdmin)) {
            loadProgram()
            loadAccountTypes()
            loadChartOfAccounts()
        }
    }, [programId, isTenantAdmin, isPortalAdmin])

    useEffect(() => {
        if (programId) {
            loadChartOfAccounts()
        }
    }, [searchTerm, accountTypeFilter, isActiveFilter, currentPage])

    const loadProgram = async () => {
        try {
            const programData = await ProgramService.getProgram(
                Number(programId),
            )
            setProgram(programData)
        } catch (error) {
            console.error('Error loading program:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load program details
                </Notification>,
            )
        }
    }

    const loadAccountTypes = async () => {
        if (!programId) {
            setAccountTypeOptions([{ value: '', label: 'All Types' }])
            return
        }

        try {
            const response = await AccountingService.getProgramAccountTypes(
                Number(programId),
            )
            const options = [
                { value: '', label: 'All Types' },
                ...response.accountTypes.map((type) => ({
                    value: type.accountType,
                    label: `${type.accountType} (${type.numOfAccounts})`,
                })),
            ]
            setAccountTypeOptions(options)
        } catch (error) {
            console.error('Error loading account types:', error)
            // Fallback to default option
            setAccountTypeOptions([{ value: '', label: 'All Types' }])
        }
    }

    const loadChartOfAccounts = async () => {
        if (!programId) return

        try {
            setChartsLoading(true)
            const filters: MasterChartUploadFilters = {
                searchTerm: searchTerm || undefined,
                accountType: accountTypeFilter || undefined,
                isActive: isActiveFilter,
                pageNumber: currentPage,
                pageSize: pageSize,
            }

            const response: ChartOfAccountResponse =
                await AccountingService.getMasterChartOfAccounts(
                    Number(programId),
                    filters,
                )

            setChartOfAccounts(response.chartOfAccounts)
            setTotalRecords(response.totalCount)
        } catch (error) {
            console.error('Error loading chart of accounts:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load chart of accounts
                </Notification>,
            )
        } finally {
            setChartsLoading(false)
            setLoading(false)
        }
    }

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0]
        if (!file || !programId) return

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
        if (event.target) {
            event.target.value = ''
        }
    }

    const handleSheetSelection = async (file: File, sheetName: string) => {
        if (!programId) return

        try {
            setUploading(true)

            const result = await AccountingService.importExcelChartOfAccounts(
                Number(programId),
                file,
                sheetName,
            )

            setUploadResult(result)
            setUploadDialogOpen(true)

            if (result.successfulRecords > 0) {
                await loadChartOfAccounts()
                toast.push(
                    <Notification title="Success" type="success">
                        Successfully imported {result.successfulRecords} chart
                        of accounts
                    </Notification>,
                )
            }

            if (result.failedRecords > 0) {
                toast.push(
                    <Notification title="Warning" type="warning">
                        {result.failedRecords} records failed to import. Check
                        upload results for details.
                    </Notification>,
                )
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to upload file
                </Notification>,
            )
        } finally {
            setUploading(false)
            setSelectedFile(null)
            setShowExcelUpload(false)
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
            await AccountingService.downloadTemplate()
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

    const handleExportChartOfAccounts = async () => {
        if (!programId) return

        try {
            await AccountingService.exportChartOfAccounts(Number(programId))
            toast.push(
                <Notification title="Success" type="success">
                    Chart of accounts exported successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Error exporting chart of accounts:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to export chart of accounts
                </Notification>,
            )
        }
    }

    const handleCreateAccount = async () => {
        if (!programId) return

        try {
            await AccountingService.createMasterChartOfAccount(
                Number(programId),
                formData,
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
        if (!programId || !selectedAccount) return

        try {
            const updateData: UpdateChartOfAccountDto = {
                accountNumber: formData.accountNumber,
                accountName: formData.accountName,
                accountType: formData.accountType,
                accountDescription: formData.accountDescription,
                isActive: formData.isActive,
            }

            await AccountingService.updateMasterChartOfAccount(
                Number(programId),
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
            !programId ||
            !window.confirm(
                'Are you sure you want to delete this chart of account?',
            )
        ) {
            return
        }

        try {
            await AccountingService.deleteMasterChartOfAccount(
                Number(programId),
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
            programID: Number(programId)!,
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
            programID: Number(programId)!,
            accountNumber: '',
            accountName: '',
            accountType: '',
            accountDescription: '',
            isActive: true,
        })
        setCreateDialogOpen(true)
    }

    // Access control
    if (!isTenantAdmin && !isPortalAdmin) {
        return (
            <Card>
                <Alert type="danger">
                    You do not have permission to access this page.
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

    if (!program) {
        return (
            <Card>
                <Alert type="info">
                    Program not found or not an accounting program type.
                </Alert>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="plain"
                            icon={<HiOutlineArrowLeft />}
                            onClick={() => navigate(getProgramsPageUrl())}
                        >
                            Back to Programs
                        </Button>
                        <div>
                            <h4 className="mb-1">
                                Chart of Account - {program.programName}
                            </h4>
                            <p className="text-gray-600">
                                Manage chart of accounts for this accounting
                                program
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="solid"
                            icon={<HiOutlineUpload />}
                            onClick={() => fileInputRef.current?.click()}
                            loading={uploading}
                        >
                            Upload Excel File
                        </Button>
                        <Button
                            variant="default"
                            icon={<HiOutlineDocumentText />}
                            onClick={handleDownloadTemplate}
                        >
                            Download Template
                        </Button>
                        <Button
                            variant="default"
                            icon={<HiOutlineDownload />}
                            onClick={handleExportChartOfAccounts}
                            disabled={chartOfAccounts.length === 0}
                        >
                            Export Chart of Accounts
                        </Button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.xlsm"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
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

            {/* Filters and Table */}
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
                                        ? {
                                              value: accountTypeFilter,
                                              label: accountTypeFilter,
                                          }
                                        : null
                                }
                                options={accountTypeOptions}
                                onChange={(option: any) => {
                                    setAccountTypeFilter(option?.value || '')
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
                                        ? {
                                              value: isActiveFilter.toString(),
                                              label: isActiveFilter
                                                  ? 'Active'
                                                  : 'Inactive',
                                          }
                                        : null
                                }
                                options={[
                                    { value: '', label: 'All Statuses' },
                                    { value: 'true', label: 'Active' },
                                    { value: 'false', label: 'Inactive' },
                                ]}
                                onChange={(option: any) => {
                                    setIsActiveFilter(
                                        option?.value === ''
                                            ? undefined
                                            : option?.value === 'true',
                                    )
                                    setCurrentPage(1)
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
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
                                    <Table.Th>Description (optional)</Table.Th>
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
                                                No chart of accounts found for
                                                this program.
                                                {searchTerm ||
                                                accountTypeFilter ||
                                                isActiveFilter !== undefined ? (
                                                    <div className="mt-2">
                                                        <Button
                                                            variant="plain"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSearchTerm(
                                                                    '',
                                                                )
                                                                setAccountTypeFilter(
                                                                    '',
                                                                )
                                                                setIsActiveFilter(
                                                                    undefined,
                                                                )
                                                                setCurrentPage(
                                                                    1,
                                                                )
                                                            }}
                                                        >
                                                            Clear filters
                                                        </Button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    chartOfAccounts.map((account) => (
                                        <Table.Tr
                                            key={account.chartOfAccountsID}
                                        >
                                            <Table.Td>
                                                <span className="text-gray-600">
                                                    {account.coASequenceNumber ||
                                                        'N/A'}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="text-gray-600">
                                                    {account.indentLevel || '0'}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="font-medium">
                                                    {account.accountNumber}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="font-medium">
                                                    {account.accountName}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="text-gray-600">
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
                                                    {account.accountType}
                                                </Tag>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="text-gray-600">
                                                    {account.lineType || 'N/A'}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="text-gray-600">
                                                    {account.parentCoA || 'N/A'}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="text-gray-600">
                                                    {account.effectiveDate
                                                        ? new Date(
                                                              account.effectiveDate,
                                                          ).toLocaleDateString()
                                                        : 'N/A'}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="text-gray-600">
                                                    {account.expiryDate
                                                        ? new Date(
                                                              account.expiryDate,
                                                          ).toLocaleDateString()
                                                        : 'N/A'}
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
                                    {Math.min(
                                        (currentPage - 1) * pageSize + 1,
                                        totalRecords,
                                    )}{' '}
                                    to{' '}
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

            {/* Upload Results Dialog */}
            <Dialog
                isOpen={uploadDialogOpen}
                width={600}
                onRequestClose={() => setUploadDialogOpen(false)}
            >
                <div className="p-6">
                    <h5 className="mb-4">Upload Results</h5>
                    {uploadResult && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-blue-50 p-3 rounded">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {uploadResult.totalRecords}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                        Total Records
                                    </div>
                                </div>
                                <div className="bg-green-50 p-3 rounded">
                                    <div className="text-2xl font-bold text-green-600">
                                        {uploadResult.successfulRecords}
                                    </div>
                                    <div className="text-sm text-green-600">
                                        Successful
                                    </div>
                                </div>
                                <div className="bg-red-50 p-3 rounded">
                                    <div className="text-2xl font-bold text-red-600">
                                        {uploadResult.failedRecords}
                                    </div>
                                    <div className="text-sm text-red-600">
                                        Failed
                                    </div>
                                </div>
                            </div>

                            {uploadResult.errorMessages &&
                                uploadResult.errorMessages.length > 0 && (
                                    <div>
                                        <h6 className="text-red-600 mb-2">
                                            Errors:
                                        </h6>
                                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                                            {uploadResult.errorMessages.map(
                                                (
                                                    error: string,
                                                    index: number,
                                                ) => (
                                                    <li key={index}>{error}</li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                )}

                            {uploadResult.warnings &&
                                uploadResult.warnings.length > 0 && (
                                    <div>
                                        <h6 className="text-yellow-600 mb-2">
                                            Warnings:
                                        </h6>
                                        <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
                                            {uploadResult.warnings.map(
                                                (warning, index) => (
                                                    <li key={index}>
                                                        {warning}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                )}
                        </div>
                    )}
                    <div className="mt-6 flex justify-end">
                        <Button onClick={() => setUploadDialogOpen(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </Dialog>

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
                                value={formData.accountNumber}
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
                                value={formData.accountName}
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
                                options={accountTypeOptions.filter(
                                    (option) => option.value !== '',
                                )}
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
                                value={formData.accountNumber}
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
                                value={formData.accountName}
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
                                options={accountTypeOptions.filter(
                                    (option) => option.value !== '',
                                )}
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

export default ProgramChartOfAccountPage

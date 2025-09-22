import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Button,
    Select,
    Input,
    Alert,
    Table,
    Steps,
    Badge,
    Tag,
    Notification,
    toast,
    Progress,
    Spinner,
} from '@/components/ui'
import {
    HiOutlineUpload,
    HiOutlineRefresh,
    HiOutlineCheck,
    HiOutlineX,
    HiOutlineExclamation,
    HiOutlineDocumentText,
    HiOutlineCalendar,
    HiOutlineOfficeBuilding,
    HiOutlineDatabase,
} from 'react-icons/hi'
import ExcelUploadCard from '@/components/shared/ExcelUploadCard'
import { analyzeExcelFile } from '@/utils/excelUtils'
import AccountingService from '@/services/AccountingService'
import ProgramService from '@/services/ProgramService'
import ShopService from '@/services/ShopService'
import useAuth from '@/auth/useAuth'
import type { Program } from '@/@types/program'
import type { Shop } from '@/@types/shop'
import type {
    GeneralLedgerImportFormatDto,
    GeneralLedgerEntry,
    StagedGeneralLedgerData,
    MappingField,
    ColumnMapping,
} from '@/@types/accounting'

const { Tr, Th, Td, THead, TBody } = Table
const { Item: StepItem } = Steps

interface DateOption {
    value: string
    label: string
    year: number
    month: number
}

interface ShopChartStatus {
    hasChartOfAccount: boolean
    isCompletelyMapped: boolean
    message: string
}

const UploadGeneralLedgerPage: React.FC = () => {
    const { user } = useAuth()

    // Core state
    const [loading, setLoading] = useState(false)
    const [programs, setPrograms] = useState<Program[]>([])
    const [shops, setShops] = useState<Shop[]>([])
    const [importFormats, setImportFormats] = useState<
        GeneralLedgerImportFormatDto[]
    >([])

    // Selection state
    const [selectedProgramId, setSelectedProgramId] = useState<number | null>(
        null,
    )
    const [selectedShopIds, setSelectedShopIds] = useState<number[]>([])
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [selectedImportFormat, setSelectedImportFormat] = useState<string>('')

    // Existing ledger state
    const [existingLedgerData, setExistingLedgerData] = useState<
        GeneralLedgerEntry[]
    >([])
    const [hasExistingLedger, setHasExistingLedger] = useState(false)
    const [shopChartStatus, setShopChartStatus] =
        useState<ShopChartStatus | null>(null)

    // Upload workflow state
    const [currentStep, setCurrentStep] = useState(0)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [stagedData, setStagedData] =
        useState<StagedGeneralLedgerData | null>(null)
    const [mappingFields, setMappingFields] = useState<MappingField[]>([])
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
    const [jobId, setJobId] = useState<string | null>(null)

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Generate date options (current month to 5 years ago)
    const dateOptions = useMemo(() => {
        const options: DateOption[] = []
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1 // 0-based to 1-based

        for (let year = currentYear; year >= currentYear - 5; year--) {
            const maxMonth = year === currentYear ? currentMonth : 12
            for (let month = maxMonth; month >= 1; month--) {
                const monthStr = month.toString().padStart(2, '0')
                const monthNames = [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                ]
                options.push({
                    value: `${year}-${monthStr}`,
                    label: `${year}-${monthNames[month - 1]}`,
                    year,
                    month,
                })
            }
        }
        return options
    }, [])

    const steps = [
        {
            title: 'Select Details',
            description: 'Choose program, shops, and date',
        },
        { title: 'Upload File', description: 'Select and upload Excel file' },
        {
            title: 'Map Columns',
            description: 'Map Excel columns to ledger fields',
        },
        {
            title: 'Review & Import',
            description: 'Review data and complete import',
        },
    ]

    useEffect(() => {
        fetchPrograms()
        fetchImportFormats()
    }, [])

    useEffect(() => {
        if (selectedProgramId) {
            fetchShops(selectedProgramId)
        } else {
            setShops([])
            setSelectedShopIds([])
        }
    }, [selectedProgramId])

    useEffect(() => {
        if (selectedShopIds.length > 0 && selectedDate && selectedProgramId) {
            checkExistingLedger()
            checkShopChartStatus()
        }
    }, [selectedShopIds, selectedDate, selectedProgramId])

    const fetchPrograms = async () => {
        try {
            setLoading(true)
            const data = await ProgramService.getPrograms()
            setPrograms(data)
        } catch (error) {
            console.error('Failed to fetch programs:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load programs
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const fetchShops = async (programId: number) => {
        try {
            const data = await ShopService.getShopsByProgram(programId)
            setShops(data)
        } catch (error) {
            console.error('Failed to fetch shops:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load shops
                </Notification>,
            )
        }
    }

    const fetchImportFormats = async () => {
        try {
            const data = await AccountingService.getGeneralLedgerImportFormats()
            setImportFormats(data)
        } catch (error) {
            console.error('Failed to fetch import formats:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load import formats
                </Notification>,
            )
        }
    }

    const checkExistingLedger = async () => {
        try {
            // Check if general ledger exists for selected program, shops, and date
            const dateObj = parseSelectedDate(selectedDate)
            if (!dateObj) return

            const hasLedger =
                await AccountingService.checkExistingGeneralLedger(
                    selectedProgramId!,
                    selectedShopIds,
                    dateObj.year,
                    dateObj.month,
                )

            setHasExistingLedger(hasLedger)

            if (hasLedger) {
                const ledgerData =
                    await AccountingService.getGeneralLedgerEntries(
                        selectedProgramId!,
                        selectedShopIds,
                        dateObj.year,
                        dateObj.month,
                    )
                setExistingLedgerData(ledgerData)
            } else {
                setExistingLedgerData([])
            }
        } catch (error) {
            console.error('Failed to check existing ledger:', error)
        }
    }

    const checkShopChartStatus = async () => {
        try {
            const status =
                await AccountingService.checkShopChartOfAccountStatus(
                    selectedProgramId!,
                    selectedShopIds[0], // For now, check the first shop
                )
            setShopChartStatus(status)
        } catch (error) {
            console.error('Failed to check shop chart status:', error)
            setShopChartStatus({
                hasChartOfAccount: false,
                isCompletelyMapped: false,
                message: 'Unable to verify chart of account status',
            })
        }
    }

    const parseSelectedDate = (dateStr: string) => {
        if (!dateStr) return null
        const [year, month] = dateStr.split('-').map(Number)
        return { year, month }
    }

    const getLastDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 0).getDate()
    }

    const handleFileUpload = async (file: File) => {
        if (!selectedProgramId || selectedShopIds.length === 0) {
            toast.push(
                <Notification title="Error" type="danger">
                    Please select program and shops first
                </Notification>,
            )
            return
        }

        try {
            setIsProcessing(true)
            setSelectedFile(file)

            // Stage the Excel file
            const result = await AccountingService.stageGeneralLedgerExcel(
                selectedShopIds[0], // Use first shop for staging
                selectedProgramId,
                file,
            )

            setStagedData(result)
            setJobId(result.jobId)
            setCurrentStep(2) // Move to mapping step
        } catch (error) {
            console.error('Failed to stage Excel file:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to process Excel file
                </Notification>,
            )
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSheetSelection = async (file: File, sheetName: string) => {
        // Process file with selected sheet - for now just proceed
        setStep(2)
    }

    const handleFormatSelection = async (formatId: string) => {
        setSelectedImportFormat(formatId)

        try {
            const fields =
                await AccountingService.getGeneralLedgerMappingFields(formatId)
            setMappingFields(fields)
        } catch (error) {
            console.error('Failed to fetch mapping fields:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load mapping fields
                </Notification>,
            )
        }
    }

    const handleColumnMapping = (field: string, excelColumn: string) => {
        setColumnMappings((prev) => {
            const existing = prev.find((m) => m.targetField === field)
            if (existing) {
                return prev.map((m) =>
                    m.targetField === field
                        ? { ...m, sourceColumn: excelColumn }
                        : m,
                )
            } else {
                return [
                    ...prev,
                    {
                        targetField: field,
                        sourceColumn: excelColumn,
                        isRequired:
                            mappingFields.find((f) => f.fieldName === field)
                                ?.isRequired || false,
                    },
                ]
            }
        })
    }

    const handleImport = async () => {
        if (!jobId || !selectedProgramId || selectedShopIds.length === 0) return

        try {
            setIsProcessing(true)

            // Apply mappings and import
            const result =
                await AccountingService.applyMappingsAndImportGeneralLedger(
                    jobId,
                    selectedShopIds[0],
                    selectedProgramId,
                    {
                        mappings: columnMappings,
                        importDate: new Date().toISOString(),
                        periodDate: getFormattedPeriodDate(),
                    },
                )

            toast.push(
                <Notification title="Success" type="success">
                    General ledger imported successfully
                </Notification>,
            )

            // Reset form
            resetForm()
        } catch (error) {
            console.error('Failed to import general ledger:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to import general ledger
                </Notification>,
            )
        } finally {
            setIsProcessing(false)
        }
    }

    const getFormattedPeriodDate = () => {
        const dateObj = parseSelectedDate(selectedDate)
        if (!dateObj) return ''

        const lastDay = getLastDayOfMonth(dateObj.year, dateObj.month)
        return `${dateObj.year}-${dateObj.month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
    }

    const resetForm = () => {
        setCurrentStep(0)
        setSelectedFile(null)
        setStagedData(null)
        setColumnMappings([])
        setJobId(null)
        setHasExistingLedger(false)
        setExistingLedgerData([])
        setShopChartStatus(null)
    }

    const canProceedToUpload = () => {
        if (hasExistingLedger) {
            return true // User can choose to replace
        }
        return (
            shopChartStatus?.hasChartOfAccount &&
            shopChartStatus?.isCompletelyMapped
        )
    }

    const isStep0Valid =
        selectedProgramId && selectedShopIds.length > 0 && selectedDate
    const isStep1Valid = selectedFile && selectedImportFormat
    const isStep2Valid = mappingFields.every((field) =>
        field.isRequired
            ? columnMappings.find(
                  (m) => m.targetField === field.fieldName && m.sourceColumn,
              )
            : true,
    )

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return renderSelectionStep()
            case 1:
                return renderUploadStep()
            case 2:
                return renderMappingStep()
            case 3:
                return renderReviewStep()
            default:
                return null
        }
    }

    const renderSelectionStep = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Program Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Program *
                    </label>
                    <Select
                        placeholder="Select a program"
                        value={
                            selectedProgramId
                                ? programs.find(
                                      (p) => p.programId === selectedProgramId,
                                  )
                                    ? {
                                          value: selectedProgramId,
                                          label:
                                              programs.find(
                                                  (p) =>
                                                      p.programId ===
                                                      selectedProgramId,
                                              )?.programName || '',
                                      }
                                    : null
                                : null
                        }
                        onChange={(option: any) =>
                            setSelectedProgramId(option?.value || null)
                        }
                        options={programs.map((program) => ({
                            value: program.programId,
                            label: program.programName,
                        }))}
                        isLoading={loading}
                    />
                </div>

                {/* Date Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Period (YYYY-MMM) *
                    </label>
                    <Select
                        placeholder="Select period"
                        value={
                            selectedDate
                                ? dateOptions.find(
                                      (d) => d.value === selectedDate,
                                  )
                                    ? {
                                          value: selectedDate,
                                          label:
                                              dateOptions.find(
                                                  (d) =>
                                                      d.value === selectedDate,
                                              )?.label || '',
                                      }
                                    : null
                                : null
                        }
                        onChange={(option: any) =>
                            setSelectedDate(option?.value || '')
                        }
                        options={dateOptions}
                    />
                </div>
            </div>

            {/* Shop Selection */}
            {selectedProgramId && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shops *
                    </label>
                    <Select
                        placeholder="Select shops"
                        isMulti
                        value={selectedShopIds
                            .map((id) => {
                                const shop = shops.find((s) => s.id === id)
                                return shop
                                    ? { value: id, label: shop.name }
                                    : null
                            })
                            .filter(Boolean)}
                        onChange={(options: any) => {
                            setSelectedShopIds(
                                options
                                    ? options.map((opt: any) => opt.value)
                                    : [],
                            )
                        }}
                        options={shops.map((shop) => ({
                            value: shop.id,
                            label: shop.name,
                        }))}
                    />
                </div>
            )}

            {/* Status Display */}
            {selectedShopIds.length > 0 && selectedDate && (
                <div className="space-y-4">
                    {/* Existing Ledger Status */}
                    {hasExistingLedger && (
                        <Alert type="warning" showIcon>
                            <div>
                                <h4 className="font-medium">
                                    Existing General Ledger Found
                                </h4>
                                <p className="mt-1">
                                    A general ledger already exists for the
                                    selected period. You can continue to replace
                                    it with a new upload.
                                </p>
                                <div className="mt-3">
                                    <div className="text-sm font-medium mb-2">
                                        Existing entries:{' '}
                                        {existingLedgerData.length}
                                    </div>
                                    {existingLedgerData.length > 0 && (
                                        <div className="max-h-32 overflow-y-auto">
                                            <Table compact>
                                                <THead>
                                                    <Tr>
                                                        <Th>Account</Th>
                                                        <Th>Description</Th>
                                                        <Th>Amount</Th>
                                                    </Tr>
                                                </THead>
                                                <TBody>
                                                    {existingLedgerData
                                                        .slice(0, 5)
                                                        .map((entry, index) => (
                                                            <Tr key={index}>
                                                                <Td>
                                                                    {
                                                                        entry.accountNumber
                                                                    }
                                                                </Td>
                                                                <Td>
                                                                    {
                                                                        entry.description
                                                                    }
                                                                </Td>
                                                                <Td>
                                                                    {
                                                                        entry.amount
                                                                    }
                                                                </Td>
                                                            </Tr>
                                                        ))}
                                                </TBody>
                                            </Table>
                                            {existingLedgerData.length > 5 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    ... and{' '}
                                                    {existingLedgerData.length -
                                                        5}{' '}
                                                    more entries
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Alert>
                    )}

                    {/* Chart of Account Status */}
                    {!hasExistingLedger && shopChartStatus && (
                        <Alert
                            type={
                                shopChartStatus.hasChartOfAccount &&
                                shopChartStatus.isCompletelyMapped
                                    ? 'success'
                                    : 'danger'
                            }
                            showIcon
                        >
                            <div>
                                <h4 className="font-medium">
                                    Chart of Account Status
                                </h4>
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2">
                                        {shopChartStatus.hasChartOfAccount ? (
                                            <HiOutlineCheck className="text-green-500" />
                                        ) : (
                                            <HiOutlineX className="text-red-500" />
                                        )}
                                        <span className="text-sm">
                                            Chart of Account{' '}
                                            {shopChartStatus.hasChartOfAccount
                                                ? 'exists'
                                                : 'not found'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {shopChartStatus.isCompletelyMapped ? (
                                            <HiOutlineCheck className="text-green-500" />
                                        ) : (
                                            <HiOutlineX className="text-red-500" />
                                        )}
                                        <span className="text-sm">
                                            Chart of Account{' '}
                                            {shopChartStatus.isCompletelyMapped
                                                ? 'completely mapped'
                                                : 'not completely mapped'}
                                        </span>
                                    </div>
                                </div>
                                {shopChartStatus.message && (
                                    <p className="mt-2 text-sm">
                                        {shopChartStatus.message}
                                    </p>
                                )}
                            </div>
                        </Alert>
                    )}
                </div>
            )}
        </div>
    )

    const renderUploadStep = () => (
        <div className="space-y-6">
            {/* Import Format Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Import Format *
                </label>
                <Select
                    placeholder="Select import format"
                    value={
                        selectedImportFormat
                            ? importFormats.find(
                                  (f) => f.formatId === selectedImportFormat,
                              )
                                ? {
                                      value: selectedImportFormat,
                                      label:
                                          importFormats.find(
                                              (f) =>
                                                  f.formatId ===
                                                  selectedImportFormat,
                                          )?.formatName || '',
                                  }
                                : null
                            : null
                    }
                    onChange={(option: any) =>
                        handleFormatSelection(option?.value || '')
                    }
                    options={importFormats.map((format) => ({
                        value: format.formatId,
                        label: format.formatName,
                    }))}
                />
                {selectedImportFormat && (
                    <div className="mt-2 text-sm text-gray-600">
                        {
                            importFormats.find(
                                (f) => f.formatId === selectedImportFormat,
                            )?.description
                        }
                    </div>
                )}
            </div>

            {/* File Upload */}
            {selectedImportFormat && (
                <div>
                    {!selectedFile ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <div className="mx-auto h-12 w-12 text-gray-400">
                                <svg
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <div className="mt-4">
                                <label className="cursor-pointer">
                                    <span className="mt-2 block text-sm font-medium text-gray-900">
                                        Select Excel file to upload
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".xls,.xlsx,.xlsm"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                handleFileUpload(file)
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                Supported formats: .xls, .xlsx, .xlsm (max 10MB)
                            </p>
                        </div>
                    ) : (
                        <ExcelUploadCard
                            file={selectedFile}
                            onConfirm={(file, sheetName) =>
                                handleSheetSelection(file, sheetName)
                            }
                            onCancel={() => setSelectedFile(null)}
                            uploading={isProcessing}
                        />
                    )}
                    {isProcessing && (
                        <div className="mt-4">
                            <Progress percent={uploadProgress} />
                            <div className="text-sm text-gray-600 mt-2">
                                Processing Excel file...
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )

    const renderMappingStep = () => (
        <div className="space-y-6">
            {stagedData && (
                <>
                    <Alert type="info" showIcon>
                        <div>
                            <h4 className="font-medium">Excel File Analyzed</h4>
                            <p className="mt-1">
                                Found {stagedData.totalRows} rows with{' '}
                                {stagedData.detectedColumns.length} columns.
                                Please map the required columns below.
                            </p>
                        </div>
                    </Alert>

                    <div className="space-y-4">
                        <h4 className="font-medium">Column Mapping</h4>
                        {mappingFields.map((field) => (
                            <div
                                key={field.name}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 border rounded-lg"
                            >
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        {field.displayName}
                                        {field.isRequired && (
                                            <Tag color="red">Required</Tag>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {field.description}
                                    </div>
                                </div>
                                <div>
                                    <Select
                                        placeholder="Select Excel column"
                                        value={
                                            columnMappings.find(
                                                (m) => m.field === field.name,
                                            )?.excelColumn
                                                ? {
                                                      value: columnMappings.find(
                                                          (m) =>
                                                              m.field ===
                                                              field.name,
                                                      )?.excelColumn,
                                                      label: columnMappings.find(
                                                          (m) =>
                                                              m.field ===
                                                              field.name,
                                                      )?.excelColumn,
                                                  }
                                                : null
                                        }
                                        onChange={(option: any) =>
                                            handleColumnMapping(
                                                field.name,
                                                option?.value || '',
                                            )
                                        }
                                        options={stagedData.detectedColumns.map(
                                            (col) => ({
                                                value: col.name,
                                                label: `${col.name} (${col.dataType})`,
                                            }),
                                        )}
                                        isClearable
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Preview */}
                    {stagedData.previewData && (
                        <div>
                            <h4 className="font-medium mb-4">Data Preview</h4>
                            <div className="overflow-x-auto max-h-64">
                                <Table compact>
                                    <THead>
                                        <Tr>
                                            {stagedData.detectedColumns.map(
                                                (col) => (
                                                    <Th key={col.name}>
                                                        {col.name}
                                                    </Th>
                                                ),
                                            )}
                                        </Tr>
                                    </THead>
                                    <TBody>
                                        {stagedData.previewData
                                            .slice(0, 10)
                                            .map((row, index) => (
                                                <Tr key={index}>
                                                    {stagedData.detectedColumns.map(
                                                        (col) => (
                                                            <Td key={col.name}>
                                                                {row[col.name]}
                                                            </Td>
                                                        ),
                                                    )}
                                                </Tr>
                                            ))}
                                    </TBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )

    const renderReviewStep = () => (
        <div className="space-y-6">
            <Alert type="info" showIcon>
                <div>
                    <h4 className="font-medium">Ready to Import</h4>
                    <p className="mt-1">
                        Please review the details below and click "Import" to
                        complete the process.
                    </p>
                </div>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h5 className="font-medium mb-3">Import Details</h5>
                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="font-medium">Program:</span>{' '}
                            {
                                programs.find(
                                    (p) => p.programID === selectedProgramId,
                                )?.programName
                            }
                        </div>
                        <div>
                            <span className="font-medium">Shops:</span>{' '}
                            {selectedShopIds
                                .map(
                                    (id) =>
                                        shops.find((s) => s.id === id)?.name,
                                )
                                .join(', ')}
                        </div>
                        <div>
                            <span className="font-medium">Period:</span>{' '}
                            {
                                dateOptions.find(
                                    (d) => d.value === selectedDate,
                                )?.label
                            }
                        </div>
                        <div>
                            <span className="font-medium">Format:</span>{' '}
                            {
                                importFormats.find(
                                    (f) => f.formatId === selectedImportFormat,
                                )?.formatName
                            }
                        </div>
                        <div>
                            <span className="font-medium">File:</span>{' '}
                            {selectedFile?.name}
                        </div>
                        <div>
                            <span className="font-medium">Total Rows:</span>{' '}
                            {stagedData?.totalRows}
                        </div>
                    </div>
                </div>

                <div>
                    <h5 className="font-medium mb-3">Column Mappings</h5>
                    <div className="space-y-2 text-sm">
                        {columnMappings.map((mapping) => (
                            <div
                                key={mapping.field}
                                className="flex justify-between"
                            >
                                <span>
                                    {
                                        mappingFields.find(
                                            (f) => f.name === mapping.field,
                                        )?.displayName
                                    }
                                </span>
                                <span className="font-mono">
                                    {mapping.excelColumn}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h4 className="mb-1">Upload General Ledger</h4>
                        <p className="text-gray-600">
                            Upload and import general ledger data from Excel
                            files
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="plain"
                            icon={<HiOutlineRefresh />}
                            onClick={resetForm}
                            disabled={isProcessing}
                            className="w-full sm:w-auto"
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Content Card */}
            <Card>
                <div className="p-6">
                    {/* Steps */}
                    <div className="mb-8">
                        <Steps current={currentStep}>
                            {steps.map((step, index) => (
                                <StepItem
                                    key={index}
                                    title={step.title}
                                    description={step.description}
                                />
                            ))}
                        </Steps>
                    </div>

                    {/* Step Content */}
                    <div className="min-h-[400px]">{renderStepContent()}</div>

                    {/* Navigation */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-6 border-t gap-4">
                        <div className="order-2 sm:order-1">
                            {currentStep > 0 && (
                                <Button
                                    variant="plain"
                                    onClick={() =>
                                        setCurrentStep((prev) => prev - 1)
                                    }
                                    disabled={isProcessing}
                                    className="w-full sm:w-auto"
                                >
                                    Previous
                                </Button>
                            )}
                        </div>

                        <div className="order-1 sm:order-2">
                            {currentStep < steps.length - 1 ? (
                                <Button
                                    variant="solid"
                                    onClick={() =>
                                        setCurrentStep((prev) => prev + 1)
                                    }
                                    disabled={
                                        isProcessing ||
                                        (currentStep === 0 &&
                                            (!isStep0Valid ||
                                                !canProceedToUpload())) ||
                                        (currentStep === 1 && !isStep1Valid) ||
                                        (currentStep === 2 && !isStep2Valid)
                                    }
                                    className="w-full sm:w-auto"
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    variant="solid"
                                    icon={<HiOutlineCheck />}
                                    onClick={handleImport}
                                    disabled={isProcessing || !isStep2Valid}
                                    loading={isProcessing}
                                    className="w-full sm:w-auto"
                                >
                                    Import General Ledger
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default UploadGeneralLedgerPage

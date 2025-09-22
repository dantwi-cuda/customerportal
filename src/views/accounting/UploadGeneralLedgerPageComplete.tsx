import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Card,
    Button,
    Select,
    Steps,
    Notification,
    toast,
    Tag,
    Table,
    Avatar,
    Alert,
} from '@/components/ui'
import {
    HiOutlineArrowLeft,
    HiOutlineUpload,
    HiOutlineCheck,
    HiOutlineX,
} from 'react-icons/hi'
import AccountingService from '@/services/AccountingService'
import ProgramService from '@/services/ProgramService'
import ShopService from '@/services/ShopService'
import ExcelUploadCard from '@/components/shared/ExcelUploadCard'
import { analyzeExcelFile, getSheetPreview } from '@/utils/excelUtils'
import type { Program } from '@/@types/program'
import type { Shop } from '@/@types/shop'
import type {
    GeneralLedgerImportFormatDto,
    MappingField,
    ColumnMapping,
    DetectedColumn,
    StagedGeneralLedgerData,
    ExistingGeneralLedgerResponse,
    AutoMatchStatisticsDto,
    MatchingStatisticsDto,
    GeneralLedgerEntry,
    ExcelFileAnalysis,
    ExcelSheetInfo,
    ExcelSheetPreview,
} from '@/@types/accounting'

const { Th, Tr, Td, THead, TBody } = Table

const UploadGeneralLedgerPageComplete = () => {
    const navigate = useNavigate()

    // State management
    const [currentStep, setCurrentStep] = useState(0)
    const [selectedProgramId, setSelectedProgramId] = useState<number | null>(
        null,
    )
    const [selectedShopIds, setSelectedShopIds] = useState<number[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [programs, setPrograms] = useState<Program[]>([])
    const [shops, setShops] = useState<Shop[]>([])

    // Existing GL and COA status
    const [existingGL, setExistingGL] =
        useState<ExistingGeneralLedgerResponse | null>(null)
    const [coaStatus, setCoaStatus] = useState<MatchingStatisticsDto | null>(
        null,
    )
    const [canProceed, setCanProceed] = useState(false)

    // File upload states
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [fileAnalysis, setFileAnalysis] = useState<ExcelFileAnalysis | null>(
        null,
    )
    const [selectedSheetName, setSelectedSheetName] = useState<string>('')
    const [sheetPreview, setSheetPreview] = useState<ExcelSheetPreview | null>(
        null,
    )

    // Staging and mapping states
    const [stagedData, setStagedData] =
        useState<StagedGeneralLedgerData | null>(null)
    const [importFormats, setImportFormats] = useState<
        GeneralLedgerImportFormatDto[]
    >([])
    const [selectedImportFormat, setSelectedImportFormat] = useState<string>('')
    const [mappingFields, setMappingFields] = useState<MappingField[]>([])
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])

    // Loading states
    const [loading, setLoading] = useState(false)
    const [stagingFile, setStagingFile] = useState(false)

    // Generate date options (last 5 years)
    const generateDateOptions = () => {
        const options: { value: string; label: string }[] = []
        const currentYear = new Date().getFullYear()

        for (let year = currentYear; year >= currentYear - 5; year--) {
            for (let month = 12; month >= 1; month--) {
                const date = new Date(year, month - 1, 1)
                const value = `${year}-${month.toString().padStart(2, '0')}`
                const label = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                })
                options.push({ value, label })
            }
        }
        return options
    }

    const dateOptions = generateDateOptions()

    useEffect(() => {
        fetchPrograms()
        fetchImportFormats()
    }, [])

    useEffect(() => {
        if (selectedProgramId) {
            fetchShops()
        } else {
            setShops([])
            setSelectedShopIds([])
        }
    }, [selectedProgramId])

    useEffect(() => {
        if (selectedProgramId && selectedShopIds.length > 0 && selectedDate) {
            checkExistingGLAndCOAStatus()
        }
    }, [selectedProgramId, selectedShopIds, selectedDate])

    const fetchPrograms = async () => {
        try {
            const programs = await ProgramService.getPrograms()
            setPrograms(programs || [])
        } catch (error) {
            console.error('Failed to fetch programs:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load programs
                </Notification>,
            )
        }
    }

    const fetchShops = async () => {
        if (!selectedProgramId) return

        try {
            const shops = await ShopService.getShopsByProgram(selectedProgramId)
            setShops(shops || [])
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
            const formats =
                await AccountingService.getGeneralLedgerImportFormats()
            setImportFormats(formats || [])
        } catch (error) {
            console.error('Failed to fetch import formats:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load import formats
                </Notification>,
            )
        }
    }

    const checkExistingGLAndCOAStatus = async () => {
        if (!selectedProgramId || selectedShopIds.length === 0 || !selectedDate)
            return

        setLoading(true)
        try {
            const shopId = selectedShopIds[0] // Use first selected shop

            // Transform YYYY-MM date to start and end date
            const year = selectedDate.getFullYear()
            const month = selectedDate.getMonth()
            const fromDate = new Date(year, month, 1).toISOString()
            const toDate = new Date(year, month + 1, 0).toISOString()

            // Check existing general ledger
            const existingGLResponse =
                await AccountingService.getExistingGeneralLedger(
                    shopId,
                    fromDate,
                    toDate,
                    selectedProgramId,
                )
            setExistingGL(existingGLResponse)

            // Check chart of accounts status
            const coaStatsResponse =
                await AccountingService.getMatchingStatistics(
                    shopId,
                    selectedProgramId,
                )
            setCoaStatus(coaStatsResponse)

            // Determine if user can proceed
            const hasValidCOA =
                coaStatsResponse.totalShopAccounts > 0 &&
                coaStatsResponse.unmatchedAccounts === 0 &&
                coaStatsResponse.matchedAccounts ===
                    coaStatsResponse.totalShopAccounts
            setCanProceed(hasValidCOA)
        } catch (error) {
            console.error('Failed to check GL and COA status:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to check existing data status
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelection = (file: File) => {
        setSelectedFile(file)
        analyzeFile(file)
    }

    const analyzeFile = async (file: File) => {
        try {
            setLoading(true)

            // Analyze the Excel file to get sheet information
            const analysis = await analyzeExcelFile(file)
            setFileAnalysis(analysis)

            // If there's only one sheet, select it automatically and move to preview
            if (analysis.sheets.length === 1) {
                const sheetName = analysis.sheets[0].sheetName
                setSelectedSheetName(sheetName)
                await generateSheetPreview(file, sheetName)
            }
        } catch (error) {
            console.error('Failed to analyze Excel file:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to analyze Excel file
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const generateSheetPreview = async (file: File, sheetName: string) => {
        try {
            const preview = await getSheetPreview(file, sheetName, 10)
            setSheetPreview(preview)
        } catch (error) {
            console.error('Failed to generate sheet preview:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to generate sheet preview
                </Notification>,
            )
        }
    }

    const handleSheetSelection = async (file: File, sheetName: string) => {
        setSelectedSheetName(sheetName)
        await generateSheetPreview(file, sheetName)
        await stageExcelFile(file, sheetName)
    }

    const stageExcelFile = async (file: File, sheetName: string) => {
        if (!selectedShopIds.length || !selectedDate || !selectedProgramId)
            return

        setStagingFile(true)
        try {
            const shopId = selectedShopIds[0]
            const importDate = new Date().toISOString()
            const ledgerDate = selectedDate.toISOString()

            const result = await AccountingService.stageGeneralLedgerExcel(
                shopId,
                selectedProgramId,
                file,
                importDate,
                ledgerDate,
                sheetName,
            )

            console.log('Staged data received:', result)
            console.log('Detected columns:', result.detectedColumns)
            console.log('Preview data:', result.previewData)
            console.log(
                'Preview data length:',
                result.previewData ? result.previewData.length : 'undefined',
            )
            setStagedData(result)
            setCurrentStep(2) // Move to mapping step

            toast.push(
                <Notification title="Success" type="success">
                    Excel file staged successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Failed to stage Excel file:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to stage Excel file
                </Notification>,
            )
        } finally {
            setStagingFile(false)
        }
    }

    const handleImportFormatSelection = async (formatType: string) => {
        setSelectedImportFormat(formatType)

        try {
            const fields =
                await AccountingService.getGeneralLedgerMappingFields(
                    formatType,
                )
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

    const handleColumnMapping = (targetField: string, sourceColumn: string) => {
        setColumnMappings((prev) => {
            const existing = prev.find((m) => m.targetField === targetField)
            if (existing) {
                return prev.map((m) =>
                    m.targetField === targetField ? { ...m, sourceColumn } : m,
                )
            } else {
                const fieldInfo = mappingFields.find(
                    (f) => f.fieldName === targetField,
                )
                return [
                    ...prev,
                    {
                        targetField,
                        sourceColumn,
                        isRequired: fieldInfo?.isRequired || false,
                    },
                ]
            }
        })
    }

    const handleImport = async () => {
        if (!stagedData || !selectedShopIds.length || !selectedProgramId) return

        setLoading(true)
        try {
            const shopId = selectedShopIds[0]

            // Apply mappings and import
            await AccountingService.applyMappingsAndImportGeneralLedger(
                stagedData.jobId,
                shopId,
                selectedProgramId,
                {
                    mappings: columnMappings,
                    importDate: new Date().toISOString(),
                    periodDate: selectedDate?.toISOString() || '',
                },
            )

            toast.push(
                <Notification title="Success" type="success">
                    General Ledger imported successfully
                </Notification>,
            )

            navigate('/accounting')
        } catch (error) {
            console.error('Failed to import general ledger:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to import general ledger
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleNext = () => {
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const steps = [
        { title: 'Select Program & Date' },
        { title: 'Upload Excel File' },
        { title: 'Column Mapping & Import' },
    ]

    const isStep0Valid =
        selectedProgramId &&
        selectedShopIds.length > 0 &&
        selectedDate &&
        canProceed
    const isStep1Valid = selectedFile && selectedSheetName && stagedData
    const isStep2Valid =
        selectedImportFormat &&
        mappingFields.every((field) =>
            field.isRequired
                ? columnMappings.find(
                      (m) =>
                          m.targetField === field.fieldName && m.sourceColumn,
                  )
                : true,
        )

    return (
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header Card */}
            <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<HiOutlineArrowLeft />}
                            onClick={() => navigate('/accounting')}
                        >
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Upload General Ledger
                        </h1>
                    </div>
                </div>

                <div className="mt-6">
                    <Steps current={currentStep}>
                        {steps.map((step, index) => (
                            <Steps.Item key={index} title={step.title} />
                        ))}
                    </Steps>
                </div>
            </Card>

            {/* Main Content Card */}
            <Card className="p-4 sm:p-6">
                {/* Step 0: Program and Shop Selection */}
                {currentStep === 0 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-medium">
                            Select Program, Shops and Date
                        </h2>

                        {/* Program Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Program <span className="text-red-500">*</span>
                            </label>
                            <Select
                                placeholder="Select Program"
                                value={
                                    selectedProgramId
                                        ? programs.find(
                                              (p) =>
                                                  p.programId ===
                                                  selectedProgramId,
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
                            />
                        </div>

                        {/* Shop Selection */}
                        {shops.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Shops{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    placeholder="Select Shops"
                                    isMulti
                                    value={selectedShopIds
                                        .map((id) => {
                                            const shop = shops.find(
                                                (s) => s.id === id,
                                            )
                                            return shop
                                                ? {
                                                      value: id,
                                                      label: shop.name,
                                                  }
                                                : null
                                        })
                                        .filter(Boolean)}
                                    onChange={(options: any) => {
                                        setSelectedShopIds(
                                            options
                                                ? options.map(
                                                      (opt: any) => opt.value,
                                                  )
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

                        {/* Date Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ledger Date{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Select
                                placeholder="Select Ledger Date"
                                value={
                                    selectedDate
                                        ? {
                                              value: `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}`,
                                              label: selectedDate.toLocaleDateString(
                                                  'en-US',
                                                  {
                                                      year: 'numeric',
                                                      month: 'long',
                                                  },
                                              ),
                                          }
                                        : null
                                }
                                onChange={(option: any) => {
                                    if (option?.value) {
                                        const [year, month] =
                                            option.value.split('-')
                                        setSelectedDate(
                                            new Date(
                                                parseInt(year),
                                                parseInt(month) - 1,
                                                1,
                                            ),
                                        )
                                    }
                                }}
                                options={dateOptions}
                            />
                        </div>

                        {/* Existing GL Check Results */}
                        {selectedProgramId &&
                            selectedShopIds.length > 0 &&
                            selectedDate && (
                                <div className="space-y-4">
                                    {existingGL &&
                                        existingGL.entries.length > 0 && (
                                            <Alert
                                                showIcon
                                                type="warning"
                                                title="Existing General Ledger Found"
                                            >
                                                <p>
                                                    General ledger entries
                                                    already exist for this
                                                    period. Uploading new data
                                                    will replace existing
                                                    entries.
                                                </p>
                                                <div className="mt-4">
                                                    <Table compact>
                                                        <THead>
                                                            <Tr>
                                                                <Th>
                                                                    Account
                                                                    Number
                                                                </Th>
                                                                <Th>
                                                                    Description
                                                                </Th>
                                                                <Th>Amount</Th>
                                                                <Th>Date</Th>
                                                            </Tr>
                                                        </THead>
                                                        <TBody>
                                                            {existingGL.entries
                                                                .slice(0, 5)
                                                                .map(
                                                                    (
                                                                        entry: GeneralLedgerEntry,
                                                                    ) => (
                                                                        <Tr
                                                                            key={
                                                                                entry.entryId
                                                                            }
                                                                        >
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
                                                                                $
                                                                                {entry.amount.toLocaleString()}
                                                                            </Td>
                                                                            <Td>
                                                                                {new Date(
                                                                                    entry.transactionDate,
                                                                                ).toLocaleDateString()}
                                                                            </Td>
                                                                        </Tr>
                                                                    ),
                                                                )}
                                                        </TBody>
                                                    </Table>
                                                    {existingGL.totalRecords >
                                                        5 && (
                                                        <p className="text-sm text-gray-500 mt-2">
                                                            Showing 5 of{' '}
                                                            {
                                                                existingGL.totalRecords
                                                            }{' '}
                                                            entries
                                                        </p>
                                                    )}
                                                </div>
                                            </Alert>
                                        )}

                                    {/* COA Status */}
                                    {coaStatus && (
                                        <Alert
                                            showIcon
                                            type={
                                                coaStatus.totalShopAccounts >
                                                    0 &&
                                                coaStatus.unmatchedAccounts ===
                                                    0 &&
                                                coaStatus.matchedAccounts ===
                                                    coaStatus.totalShopAccounts
                                                    ? 'success'
                                                    : 'warning'
                                            }
                                            title="Chart of Accounts Status"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <span>Total Accounts:</span>
                                                    <Tag
                                                        className={
                                                            coaStatus.totalShopAccounts >
                                                            0
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                        }
                                                    >
                                                        {
                                                            coaStatus.totalShopAccounts
                                                        }
                                                    </Tag>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span>
                                                        Unmatched Accounts:
                                                    </span>
                                                    <Tag
                                                        className={
                                                            coaStatus.unmatchedAccounts ===
                                                            0
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                        }
                                                    >
                                                        {
                                                            coaStatus.unmatchedAccounts
                                                        }
                                                    </Tag>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span>Match Rate:</span>
                                                    <Tag
                                                        className={
                                                            coaStatus.matchRate ===
                                                            1.0
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                        }
                                                    >
                                                        {(
                                                            coaStatus.matchRate *
                                                            100
                                                        ).toFixed(1)}
                                                        %
                                                    </Tag>
                                                </div>
                                            </div>
                                        </Alert>
                                    )}

                                    {!canProceed && coaStatus && (
                                        <Alert
                                            showIcon
                                            type="danger"
                                            title="Cannot Proceed"
                                        >
                                            <p>
                                                Chart of accounts must be set up
                                                and fully mapped before
                                                uploading general ledger data.
                                            </p>
                                        </Alert>
                                    )}
                                </div>
                            )}

                        <div className="flex justify-end">
                            <Button
                                variant="solid"
                                onClick={handleNext}
                                disabled={!isStep0Valid}
                                loading={loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 1: File Upload */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-medium">
                            Upload Excel File
                        </h2>

                        {!selectedFile ? (
                            <div>
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
                                    onClick={() =>
                                        document
                                            .getElementById('file-input')
                                            ?.click()
                                    }
                                >
                                    <HiOutlineUpload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-4">
                                        <p className="text-lg">
                                            Click to select Excel file to upload
                                        </p>
                                        <p className="mt-2 text-sm text-gray-500">
                                            Supported formats: .xls, .xlsx,
                                            .xlsm (max 10MB)
                                        </p>
                                    </div>
                                </div>
                                <input
                                    id="file-input"
                                    type="file"
                                    className="hidden"
                                    accept=".xls,.xlsx,.xlsm"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            handleFileSelection(file)
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <ExcelUploadCard
                                    file={selectedFile}
                                    onConfirm={handleSheetSelection}
                                    onCancel={() => {
                                        setSelectedFile(null)
                                        setFileAnalysis(null)
                                        setSelectedSheetName('')
                                        setSheetPreview(null)
                                        setStagedData(null)
                                    }}
                                    uploading={stagingFile}
                                />
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="default" onClick={handlePrevious}>
                                Previous
                            </Button>
                            <Button
                                variant="solid"
                                onClick={handleNext}
                                disabled={!isStep1Valid}
                                loading={stagingFile}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Column Mapping and Import */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-medium">
                            Column Mapping and Import
                        </h2>

                        {/* Import Format Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Import Format{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Select
                                placeholder="Select Import Format"
                                value={
                                    selectedImportFormat
                                        ? {
                                              value: selectedImportFormat,
                                              label:
                                                  importFormats.find(
                                                      (f) =>
                                                          f.formatType ===
                                                          selectedImportFormat,
                                                  )?.description || '',
                                          }
                                        : null
                                }
                                onChange={(option: any) =>
                                    handleImportFormatSelection(
                                        option?.value || '',
                                    )
                                }
                                options={importFormats.map((format) => ({
                                    value: format.formatType,
                                    label: format.description,
                                }))}
                            />
                        </div>

                        {/* Column Mapping */}
                        {mappingFields.length > 0 && stagedData && (
                            <div className="space-y-4">
                                <h3 className="text-md font-medium">
                                    Map Excel Columns to Target Fields
                                </h3>

                                {/* Excel Preview for Reference */}
                                {stagedData.detectedColumns &&
                                    stagedData.detectedColumns.length > 0 && (
                                        <Card className="p-4 bg-blue-50 border-blue-200">
                                            <h4 className="text-sm font-medium mb-3 text-blue-800">
                                                Excel Data Preview (First 5
                                                rows)
                                            </h4>

                                            <div className="overflow-x-auto max-h-64 border rounded bg-white">
                                                <Table compact>
                                                    <THead>
                                                        <Tr>
                                                            {stagedData.detectedColumns.map(
                                                                (
                                                                    col,
                                                                    index,
                                                                ) => (
                                                                    <Th
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="min-w-32 bg-gray-50"
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium">
                                                                                {
                                                                                    col.columnName
                                                                                }
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                Index:{' '}
                                                                                {
                                                                                    col.columnIndex
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </Th>
                                                                ),
                                                            )}
                                                        </Tr>
                                                    </THead>
                                                    <TBody>
                                                        {(() => {
                                                            // Try previewData first (StagedGeneralLedgerData format)
                                                            if (
                                                                stagedData.previewData &&
                                                                stagedData
                                                                    .previewData
                                                                    .length > 0
                                                            ) {
                                                                return stagedData.previewData
                                                                    .slice(0, 5)
                                                                    .map(
                                                                        (
                                                                            row,
                                                                            rowIndex,
                                                                        ) => (
                                                                            <Tr
                                                                                key={
                                                                                    rowIndex
                                                                                }
                                                                            >
                                                                                {stagedData.detectedColumns.map(
                                                                                    (
                                                                                        col,
                                                                                        colIndex,
                                                                                    ) => (
                                                                                        <Td
                                                                                            key={
                                                                                                colIndex
                                                                                            }
                                                                                            className="max-w-40 truncate"
                                                                                        >
                                                                                            {row[
                                                                                                col
                                                                                                    .columnName
                                                                                            ]?.toString() ||
                                                                                                ''}
                                                                                        </Td>
                                                                                    ),
                                                                                )}
                                                                            </Tr>
                                                                        ),
                                                                    )
                                                            }

                                                            // Try sampleData (StagedDataResponseDto format)
                                                            const sampleData = (
                                                                stagedData as any
                                                            ).sampleData
                                                            if (
                                                                sampleData &&
                                                                sampleData.length >
                                                                    0
                                                            ) {
                                                                return sampleData
                                                                    .slice(0, 5)
                                                                    .map(
                                                                        (
                                                                            row: any,
                                                                            rowIndex: number,
                                                                        ) => (
                                                                            <Tr
                                                                                key={
                                                                                    rowIndex
                                                                                }
                                                                            >
                                                                                {stagedData.detectedColumns.map(
                                                                                    (
                                                                                        col,
                                                                                        colIndex,
                                                                                    ) => (
                                                                                        <Td
                                                                                            key={
                                                                                                colIndex
                                                                                            }
                                                                                            className="max-w-40 truncate"
                                                                                        >
                                                                                            {row.columnData
                                                                                                ? row.columnData[
                                                                                                      col
                                                                                                          .columnName
                                                                                                  ]?.toString() ||
                                                                                                  ''
                                                                                                : ''}
                                                                                        </Td>
                                                                                    ),
                                                                                )}
                                                                            </Tr>
                                                                        ),
                                                                    )
                                                            }

                                                            // No data available
                                                            return (
                                                                <Tr>
                                                                    <Td
                                                                        colSpan={
                                                                            stagedData
                                                                                .detectedColumns
                                                                                .length
                                                                        }
                                                                        className="text-center py-4 text-gray-500"
                                                                    >
                                                                        No
                                                                        preview
                                                                        data
                                                                        available
                                                                    </Td>
                                                                </Tr>
                                                            )
                                                        })()}
                                                    </TBody>
                                                </Table>
                                            </div>
                                            <div className="mt-2 text-xs text-blue-600">
                                                <strong>Total Columns:</strong>{' '}
                                                {
                                                    stagedData.detectedColumns
                                                        .length
                                                }{' '}
                                                | <strong>Total Rows:</strong>{' '}
                                                {stagedData.totalRows}
                                            </div>
                                        </Card>
                                    )}

                                {mappingFields.map((field) => (
                                    <div
                                        key={field.fieldName}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 border rounded-lg"
                                    >
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">
                                                    {field.displayName}
                                                </span>
                                                {field.isRequired && (
                                                    <Tag className="bg-red-100 text-red-800">
                                                        Required
                                                    </Tag>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {field.description}
                                            </p>
                                        </div>

                                        <div>
                                            <Select
                                                placeholder="Select Excel Column"
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
                                                onChange={(option: any) =>
                                                    handleColumnMapping(
                                                        field.fieldName,
                                                        option?.value || '',
                                                    )
                                                }
                                                options={
                                                    stagedData.detectedColumns
                                                        ? stagedData.detectedColumns.map(
                                                              (col) => ({
                                                                  value: col.columnName,
                                                                  label: `${col.columnName} (Index: ${col.columnIndex}${col.sampleValues && col.sampleValues.length > 0 ? ` - Sample: ${col.sampleValues.slice(0, 2).join(', ')}` : ''})`,
                                                              }),
                                                          )
                                                        : []
                                                }
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Review */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <h3 className="font-medium">Import Summary</h3>
                            <div>
                                <span className="font-medium">Program:</span>{' '}
                                {
                                    programs.find(
                                        (p) =>
                                            p.programId === selectedProgramId,
                                    )?.programName
                                }
                            </div>
                            <div>
                                <span className="font-medium">Shops:</span>{' '}
                                {selectedShopIds
                                    .map(
                                        (id) =>
                                            shops.find((s) => s.id === id)
                                                ?.name,
                                    )
                                    .join(', ')}
                            </div>
                            <div>
                                <span className="font-medium">
                                    Ledger Date:
                                </span>{' '}
                                {selectedDate?.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                })}
                            </div>
                            <div>
                                <span className="font-medium">File:</span>{' '}
                                {selectedFile?.name}
                            </div>
                            <div>
                                <span className="font-medium">Sheet:</span>{' '}
                                {selectedSheetName}
                            </div>
                            {selectedImportFormat && (
                                <div>
                                    <span className="font-medium">
                                        Import Format:
                                    </span>{' '}
                                    {
                                        importFormats.find(
                                            (f) =>
                                                f.formatType ===
                                                selectedImportFormat,
                                        )?.description
                                    }
                                </div>
                            )}
                            {stagedData && (
                                <div>
                                    <span className="font-medium">
                                        Total Rows:
                                    </span>{' '}
                                    {stagedData.totalRows}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between">
                            <Button variant="default" onClick={handlePrevious}>
                                Previous
                            </Button>
                            <Button
                                variant="solid"
                                onClick={handleImport}
                                disabled={!isStep2Valid}
                                loading={loading}
                            >
                                Import General Ledger
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default UploadGeneralLedgerPageComplete

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Card,
    Button,
    Select,
    DatePicker,
    Steps,
    Notification,
    toast,
    Tag,
} from '@/components/ui'
import { HiOutlineArrowLeft, HiOutlineUpload } from 'react-icons/hi'
import AccountingService from '@/services/AccountingService'
import ProgramService from '@/services/ProgramService'
import ShopService from '@/services/ShopService'
import type { Program } from '@/@types/program'
import type { Shop } from '@/@types/shop'
import type {
    GeneralLedgerImportFormatDto,
    MappingField,
    ColumnMapping,
    DetectedColumn,
} from '@/@types/accounting'

const UploadGeneralLedgerPageSimple = () => {
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
    const [importFormats, setImportFormats] = useState<
        GeneralLedgerImportFormatDto[]
    >([])
    const [selectedImportFormat, setSelectedImportFormat] = useState<string>('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

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
            const response =
                await ShopService.getShopsByProgram(selectedProgramId)
            setShops(response || [])
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

    const handleSubmit = async () => {
        if (
            !selectedFile ||
            !selectedProgramId ||
            selectedShopIds.length === 0 ||
            !selectedImportFormat ||
            !selectedDate
        ) {
            toast.push(
                <Notification title="Error" type="danger">
                    Please complete all required fields
                </Notification>,
            )
            return
        }

        setLoading(true)
        try {
            // Format dates for API
            const importDate = new Date().toISOString()
            const ledgerDate = selectedDate.toISOString()

            // Stage the Excel file (this will analyze columns)
            const stageResult = await AccountingService.stageGeneralLedgerExcel(
                selectedShopIds[0], // Use first shop
                selectedProgramId,
                selectedFile,
                importDate,
                ledgerDate,
                // No sheetName for now - could add sheet selection later
            )

            // Get mapping fields based on import format
            const mappingFields =
                await AccountingService.getGeneralLedgerMappingFields(
                    selectedImportFormat,
                )

            // For now, just show success - in a full implementation you'd show column mapping
            toast.push(
                <Notification title="Success" type="success">
                    File staged successfully. Column mapping would be shown
                    here.
                </Notification>,
            )
        } catch (error) {
            console.error('Failed to stage general ledger:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to stage general ledger file
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const steps = [
        { title: 'Select Program & Shops' },
        { title: 'Upload Excel File' },
        { title: 'Column Mapping & Import' },
    ]

    const isStep0Valid =
        selectedProgramId && selectedShopIds.length > 0 && selectedDate
    const isStep1Valid = selectedFile
    const isStep2Valid = selectedFile && selectedImportFormat

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
                            Select Program and Shops
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
                                Period Date{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Select
                                placeholder="Select Period Date"
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

                        <div className="flex justify-end">
                            <Button
                                variant="solid"
                                onClick={handleNext}
                                disabled={!isStep0Valid}
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

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Excel File{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <HiOutlineUpload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-4">
                                    <label className="cursor-pointer">
                                        <span className="text-lg text-blue-600 hover:text-blue-500">
                                            Click to upload Excel file
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".xls,.xlsx,.xlsm"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    setSelectedFile(file)
                                                    toast.push(
                                                        <Notification
                                                            title="Success"
                                                            type="success"
                                                        >
                                                            File selected
                                                            successfully
                                                        </Notification>,
                                                    )
                                                }
                                            }}
                                        />
                                    </label>
                                    <p className="mt-2 text-sm text-gray-500">
                                        or drag and drop
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Supported formats: .xls, .xlsx, .xlsm
                                        (max 10MB)
                                    </p>
                                </div>
                            </div>

                            {selectedFile && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                                    <div className="flex items-center">
                                        <span className="text-green-600 font-medium">
                                            File selected:{' '}
                                        </span>
                                        <span className="ml-2">
                                            {selectedFile.name}
                                        </span>
                                        <span className="ml-2 text-sm text-gray-500">
                                            (
                                            {(
                                                selectedFile.size /
                                                (1024 * 1024)
                                            ).toFixed(2)}{' '}
                                            MB)
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between">
                            <Button variant="default" onClick={handlePrevious}>
                                Previous
                            </Button>
                            <Button
                                variant="solid"
                                onClick={handleNext}
                                disabled={!isStep1Valid}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Review and Import */}
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
                                    setSelectedImportFormat(option?.value || '')
                                }
                                options={importFormats.map((format) => ({
                                    value: format.formatType,
                                    label: format.description,
                                }))}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Select the format that matches your Excel file
                                structure for proper column mapping.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
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
                                    Period Date:
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
                        </div>

                        <div className="flex justify-between">
                            <Button variant="default" onClick={handlePrevious}>
                                Previous
                            </Button>
                            <Button
                                variant="solid"
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={!isStep2Valid}
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

export default UploadGeneralLedgerPageSimple

import { useState, useEffect } from 'react'
import {
    Button,
    Table,
    Select,
    Skeleton,
    Alert,
    Card,
    Notification,
    toast,
} from '@/components/ui'
import {
    HiOutlineDocumentText,
    HiOutlineEye,
    HiOutlineX,
    HiOutlineChevronUp,
    HiOutlineChevronDown,
    HiOutlineUpload,
    HiOutlineCheck,
} from 'react-icons/hi'
import type { ExcelFileAnalysis, ExcelSheetPreview } from '@/@types/accounting'
import { analyzeExcelFile, getSheetPreview } from '@/utils/excelUtils'

interface ExcelUploadCardProps {
    file: File | null
    onConfirm: (file: File, sheetName: string) => void
    onCancel: () => void
    uploading?: boolean
    className?: string
}

const ExcelUploadCard = ({
    file,
    onConfirm,
    onCancel,
    uploading = false,
    className = '',
}: ExcelUploadCardProps) => {
    const [analysis, setAnalysis] = useState<ExcelFileAnalysis | null>(null)
    const [selectedSheet, setSelectedSheet] = useState<string>('')
    const [preview, setPreview] = useState<ExcelSheetPreview | null>(null)
    const [loading, setLoading] = useState(false)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [error, setError] = useState<string>('')
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        if (file) {
            analyzeFile()
        } else {
            resetState()
        }
    }, [file])

    useEffect(() => {
        if (selectedSheet && file) {
            loadPreview()
        }
    }, [selectedSheet])

    const resetState = () => {
        setAnalysis(null)
        setSelectedSheet('')
        setPreview(null)
        setError('')
        setIsCollapsed(false)
    }

    const analyzeFile = async () => {
        if (!file) return

        try {
            setLoading(true)
            setError('')
            const result = await analyzeExcelFile(file)
            setAnalysis(result)

            // Auto-select first sheet if there's only one
            if (result.sheets.length === 1) {
                setSelectedSheet(result.sheets[0].sheetName)
            } else if (result.sheets.length > 1) {
                // Try to find a sheet that looks like it contains chart of accounts data
                const suggestedSheet = result.sheets.find(
                    (sheet) =>
                        sheet.sheetName.toLowerCase().includes('chart') ||
                        sheet.sheetName.toLowerCase().includes('account') ||
                        sheet.sheetName.toLowerCase().includes('coa') ||
                        sheet.sheetName === 'Sheet1',
                )
                if (suggestedSheet) {
                    setSelectedSheet(suggestedSheet.sheetName)
                }
            }
        } catch (err) {
            setError((err as Error).message)
            toast.push(
                <Notification title="Error" type="danger">
                    {(err as Error).message}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const loadPreview = async () => {
        if (!file || !selectedSheet) return

        try {
            setPreviewLoading(true)
            const previewData = await getSheetPreview(file, selectedSheet, 5)
            setPreview(previewData)
        } catch (err) {
            setError((err as Error).message)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to preview sheet: {(err as Error).message}
                </Notification>,
            )
        } finally {
            setPreviewLoading(false)
        }
    }

    const handleConfirm = () => {
        if (file && selectedSheet) {
            onConfirm(file, selectedSheet)
        }
    }

    const handleCancel = () => {
        resetState()
        onCancel()
    }

    if (!file) {
        return null
    }

    return (
        <Card className={`border-l-4 border-l-blue-500 ${className}`}>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <HiOutlineDocumentText className="text-xl text-blue-600" />
                            <h5 className="text-lg font-semibold">
                                Excel File Upload
                            </h5>
                        </div>
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
                            Processing
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="plain"
                            size="xs"
                            icon={
                                isCollapsed ? (
                                    <HiOutlineChevronDown />
                                ) : (
                                    <HiOutlineChevronUp />
                                )
                            }
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            title={isCollapsed ? 'Expand' : 'Collapse'}
                        />
                        <Button
                            variant="plain"
                            size="xs"
                            icon={<HiOutlineX />}
                            onClick={handleCancel}
                            disabled={uploading}
                            title="Cancel Upload"
                            className="text-gray-500 hover:text-red-600"
                        />
                    </div>
                </div>

                {error && (
                    <Alert type="danger" className="mb-4">
                        {error}
                    </Alert>
                )}

                {!isCollapsed && (
                    <>
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton height="60px" />
                                <Skeleton height="200px" />
                            </div>
                        ) : (
                            analysis && (
                                <div className="space-y-6">
                                    {/* File Info */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h6 className="text-sm font-medium mb-2 text-gray-700">
                                            File Information
                                        </h6>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">
                                                    File:
                                                </span>
                                                <span className="ml-2 font-medium">
                                                    {analysis.fileName}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">
                                                    Sheets:
                                                </span>
                                                <span className="ml-2 font-medium">
                                                    {analysis.sheets.length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sheet Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Select Sheet to Import *
                                        </label>
                                        <Select
                                            placeholder="Choose a sheet"
                                            value={
                                                selectedSheet
                                                    ? {
                                                          value: selectedSheet,
                                                          label: `${selectedSheet} (${
                                                              analysis.sheets.find(
                                                                  (s) =>
                                                                      s.sheetName ===
                                                                      selectedSheet,
                                                              )?.rowCount || 0
                                                          } rows)`,
                                                      }
                                                    : null
                                            }
                                            options={analysis.sheets.map(
                                                (sheet) => ({
                                                    value: sheet.sheetName,
                                                    label: `${sheet.sheetName} (${sheet.rowCount} rows)`,
                                                }),
                                            )}
                                            onChange={(option: any) =>
                                                setSelectedSheet(
                                                    option?.value || '',
                                                )
                                            }
                                            isDisabled={uploading}
                                        />
                                    </div>

                                    {/* Sheet Preview */}
                                    {selectedSheet && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <HiOutlineEye className="text-lg text-gray-600" />
                                                <h6 className="font-medium">
                                                    Data Preview
                                                </h6>
                                                <span className="text-sm text-gray-500">
                                                    (First 5 rows)
                                                </span>
                                            </div>

                                            {previewLoading ? (
                                                <Skeleton height="200px" />
                                            ) : preview ? (
                                                <div className="border rounded-lg overflow-hidden bg-white">
                                                    <div className="bg-gray-50 px-4 py-2 border-b">
                                                        <div className="text-sm text-gray-600">
                                                            <strong>
                                                                Sheet:
                                                            </strong>{' '}
                                                            {preview.sheetName}{' '}
                                                            |{' '}
                                                            <strong>
                                                                Total Rows:
                                                            </strong>{' '}
                                                            {preview.totalRows}{' '}
                                                            |{' '}
                                                            <strong>
                                                                Columns:
                                                            </strong>{' '}
                                                            {
                                                                preview.headers
                                                                    .length
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="overflow-x-auto max-h-64">
                                                        <Table>
                                                            <Table.THead>
                                                                <Table.Tr>
                                                                    {preview.headers.map(
                                                                        (
                                                                            header,
                                                                            index,
                                                                        ) => (
                                                                            <Table.Th
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="min-w-32"
                                                                            >
                                                                                {header ||
                                                                                    `Column ${index + 1}`}
                                                                            </Table.Th>
                                                                        ),
                                                                    )}
                                                                </Table.Tr>
                                                            </Table.THead>
                                                            <Table.TBody>
                                                                {preview.data
                                                                    .length ===
                                                                0 ? (
                                                                    <Table.Tr>
                                                                        <Table.Td
                                                                            colSpan={
                                                                                preview
                                                                                    .headers
                                                                                    .length
                                                                            }
                                                                            className="text-center py-4 text-gray-500"
                                                                        >
                                                                            No
                                                                            data
                                                                            rows
                                                                            found
                                                                        </Table.Td>
                                                                    </Table.Tr>
                                                                ) : (
                                                                    preview.data.map(
                                                                        (
                                                                            row,
                                                                            index,
                                                                        ) => (
                                                                            <Table.Tr
                                                                                key={
                                                                                    index
                                                                                }
                                                                            >
                                                                                {preview.headers.map(
                                                                                    (
                                                                                        _,
                                                                                        colIndex,
                                                                                    ) => (
                                                                                        <Table.Td
                                                                                            key={
                                                                                                colIndex
                                                                                            }
                                                                                            className="max-w-40 truncate"
                                                                                        >
                                                                                            {row[
                                                                                                colIndex
                                                                                            ]?.toString() ||
                                                                                                ''}
                                                                                        </Table.Td>
                                                                                    ),
                                                                                )}
                                                                            </Table.Tr>
                                                                        ),
                                                                    )
                                                                )}
                                                            </Table.TBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            )
                        )}

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button
                                variant="plain"
                                onClick={handleCancel}
                                disabled={uploading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                icon={
                                    uploading ? undefined : <HiOutlineUpload />
                                }
                                onClick={handleConfirm}
                                disabled={
                                    !selectedSheet ||
                                    loading ||
                                    previewLoading ||
                                    !!error
                                }
                                loading={uploading}
                            >
                                {uploading
                                    ? 'Uploading...'
                                    : 'Upload Selected Sheet'}
                            </Button>
                        </div>
                    </>
                )}

                {/* Collapsed State Summary */}
                {isCollapsed && analysis && (
                    <div className="flex items-center justify-between py-2">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">
                                {analysis.fileName}
                            </span>
                            {selectedSheet && (
                                <>
                                    <span className="mx-2">•</span>
                                    <span>Sheet: {selectedSheet}</span>
                                </>
                            )}
                        </div>
                        {selectedSheet && !uploading && (
                            <Button
                                variant="solid"
                                size="xs"
                                icon={<HiOutlineCheck />}
                                onClick={handleConfirm}
                                disabled={loading || previewLoading || !!error}
                            >
                                Upload
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    )
}

export default ExcelUploadCard

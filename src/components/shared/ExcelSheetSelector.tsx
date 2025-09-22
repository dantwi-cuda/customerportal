import { useState, useEffect } from 'react'
import {
    Dialog,
    Button,
    Table,
    Select,
    Skeleton,
    Alert,
    Card,
    Notification,
    toast,
} from '@/components/ui'
import { HiOutlineDocumentText, HiOutlineEye } from 'react-icons/hi'
import type { ExcelFileAnalysis, ExcelSheetPreview } from '@/@types/accounting'
import { analyzeExcelFile, getSheetPreview } from '@/utils/excelUtils'

interface ExcelSheetSelectorProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (file: File, sheetName: string) => void
    file: File | null
}

const ExcelSheetSelector = ({
    isOpen,
    onClose,
    onConfirm,
    file,
}: ExcelSheetSelectorProps) => {
    const [analysis, setAnalysis] = useState<ExcelFileAnalysis | null>(null)
    const [selectedSheet, setSelectedSheet] = useState<string>('')
    const [preview, setPreview] = useState<ExcelSheetPreview | null>(null)
    const [loading, setLoading] = useState(false)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        if (file && isOpen) {
            analyzeFile()
        } else {
            resetState()
        }
    }, [file, isOpen])

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

    const handleClose = () => {
        resetState()
        onClose()
    }

    return (
        <Dialog
            isOpen={isOpen}
            width={800}
            onRequestClose={handleClose}
            closable={false}
        >
            <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <HiOutlineDocumentText className="text-xl text-blue-600" />
                    <h5>Excel Sheet Selection</h5>
                </div>

                {error && (
                    <Alert type="danger" className="mb-4">
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton height="60px" />
                        <Skeleton height="200px" />
                    </div>
                ) : (
                    analysis && (
                        <div className="space-y-6">
                            {/* File Info */}
                            <Card>
                                <div className="p-4">
                                    <h6 className="mb-2">File Information</h6>
                                    <div className="text-sm text-gray-600">
                                        <div>
                                            <strong>File:</strong>{' '}
                                            {analysis.fileName}
                                        </div>
                                        <div>
                                            <strong>Sheets:</strong>{' '}
                                            {analysis.sheets.length}
                                        </div>
                                    </div>
                                </div>
                            </Card>

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
                                    options={analysis.sheets.map((sheet) => ({
                                        value: sheet.sheetName,
                                        label: `${sheet.sheetName} (${sheet.rowCount} rows)`,
                                    }))}
                                    onChange={(option: any) =>
                                        setSelectedSheet(option?.value || '')
                                    }
                                />
                            </div>

                            {/* Sheet Preview */}
                            {selectedSheet && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <HiOutlineEye className="text-lg" />
                                        <h6>Data Preview</h6>
                                        <span className="text-sm text-gray-500">
                                            (First 5 rows)
                                        </span>
                                    </div>

                                    {previewLoading ? (
                                        <Skeleton height="200px" />
                                    ) : preview ? (
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-2 border-b">
                                                <div className="text-sm text-gray-600">
                                                    <strong>Sheet:</strong>{' '}
                                                    {preview.sheetName} |{' '}
                                                    <strong>Total Rows:</strong>{' '}
                                                    {preview.totalRows} |{' '}
                                                    <strong>Columns:</strong>{' '}
                                                    {preview.headers.length}
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
                                                                            `Column ${
                                                                                index +
                                                                                1
                                                                            }`}
                                                                    </Table.Th>
                                                                ),
                                                            )}
                                                        </Table.Tr>
                                                    </Table.THead>
                                                    <Table.TBody>
                                                        {preview.data.length ===
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
                                                                    No data rows
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
                <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="plain" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        onClick={handleConfirm}
                        disabled={
                            !selectedSheet ||
                            loading ||
                            previewLoading ||
                            !!error
                        }
                    >
                        Upload Selected Sheet
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default ExcelSheetSelector

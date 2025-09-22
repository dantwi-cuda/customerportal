import * as XLSX from 'xlsx'
import type { ExcelSheetInfo, ExcelSheetPreview, ExcelFileAnalysis } from '@/@types/accounting'

/**
 * Analyzes an Excel file and extracts sheet information
 */
export const analyzeExcelFile = async (file: File): Promise<ExcelFileAnalysis> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                
                const sheets: ExcelSheetInfo[] = workbook.SheetNames.map(sheetName => {
                    const worksheet = workbook.Sheets[sheetName]
                    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
                    
                    return {
                        sheetName,
                        rowCount: range.e.r + 1,
                        columnCount: range.e.c + 1
                    }
                })
                
                resolve({
                    fileName: file.name,
                    sheets,
                    file
                })
            } catch (error) {
                reject(new Error('Failed to read Excel file: ' + (error as Error).message))
            }
        }
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }
        
        reader.readAsArrayBuffer(file)
    })
}

/**
 * Generates a preview of a specific sheet from an Excel file
 */
export const getSheetPreview = async (file: File, sheetName: string, maxRows: number = 10): Promise<ExcelSheetPreview> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                
                if (!workbook.SheetNames.includes(sheetName)) {
                    reject(new Error(`Sheet "${sheetName}" not found`))
                    return
                }
                
                const worksheet = workbook.Sheets[sheetName]
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
                const totalRows = range.e.r + 1
                const totalCols = range.e.c + 1
                
                // Convert the entire sheet to JSON to get all data, ensuring all columns are preserved
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1,
                    range: 0, // Start from row 0
                    defval: '' // Use empty string for empty cells to preserve column structure
                }) as any[][]
                
                // Extract headers (first row) and ensure we have headers for all columns
                let headers = jsonData[0] || []
                
                // Ensure headers array has the correct length and fill missing headers
                const paddedHeaders = []
                for (let i = 0; i < totalCols; i++) {
                    const headerValue = headers[i]
                    if (headerValue && headerValue.toString().trim() !== '') {
                        paddedHeaders.push(headerValue.toString().trim())
                    } else {
                        paddedHeaders.push(`Column ${i + 1}`)
                    }
                }
                
                // Extract preview data (limiting to maxRows) and ensure consistent column count
                const previewData = jsonData.slice(1, Math.min(maxRows + 1, jsonData.length))
                    .map(row => {
                        // Ensure each row has the same number of columns as headers
                        const paddedRow = []
                        for (let i = 0; i < totalCols; i++) {
                            paddedRow.push(row[i] || '')
                        }
                        return paddedRow
                    })
                
                resolve({
                    sheetName,
                    headers: paddedHeaders,
                    data: previewData,
                    totalRows: totalRows
                })
            } catch (error) {
                reject(new Error('Failed to preview sheet: ' + (error as Error).message))
            }
        }
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }
        
        reader.readAsArrayBuffer(file)
    })
}

/**
 * Validates if a file is a valid Excel file
 */
export const isValidExcelFile = (file: File): boolean => {
    const validExtensions = ['.xlsx', '.xls', '.xlsm']
    const fileName = file.name.toLowerCase()
    return validExtensions.some(ext => fileName.endsWith(ext))
}

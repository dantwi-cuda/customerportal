import React, { useState, useRef, useCallback } from 'react'
import {
    HiUpload as Upload,
    HiX as X,
    HiExclamationCircle as AlertCircle,
    HiCheckCircle as CheckCircle,
} from 'react-icons/hi'
import { VscLoading as Loader2 } from 'react-icons/vsc'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Notification, toast } from '@/components/ui'

export interface ImageUploadResponse {
    url: string
    fileName: string
    originalFileName: string
    contentType: string
    sizeInBytes: number
    width?: number
    height?: number
    uploadedAt: string
}

export interface ImageUploadProps {
    label: string
    description?: string
    currentImageUrl?: string
    onUpload: (file: File) => Promise<ImageUploadResponse>
    onDelete?: () => Promise<void>
    accept?: string
    maxSizeInMB?: number
    maxWidth?: number
    maxHeight?: number
    minWidth?: number
    minHeight?: number
    aspectRatio?: string // e.g., "16:9", "1:1", "4:3"
    className?: string
    disabled?: boolean
    required?: boolean
}

interface ValidationResult {
    isValid: boolean
    errors: string[]
}

export const ImageUploadComponent: React.FC<ImageUploadProps> = ({
    label,
    description,
    currentImageUrl,
    onUpload,
    onDelete,
    accept = 'image/*',
    maxSizeInMB = 5,
    maxWidth,
    maxHeight,
    minWidth,
    minHeight,
    aspectRatio,
    className = '',
    disabled = false,
    required = false,
}) => {
    const [isUploading, setIsUploading] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validateFile = useCallback(
        async (file: File): Promise<ValidationResult> => {
            const errors: string[] = []

            // File type validation
            if (!file.type.startsWith('image/')) {
                errors.push('Please select a valid image file')
            }

            // File size validation
            const fileSizeInMB = file.size / (1024 * 1024)
            if (fileSizeInMB > maxSizeInMB) {
                errors.push(`File size must be less than ${maxSizeInMB}MB`)
            }

            // Image dimension validation
            if (maxWidth || maxHeight || minWidth || minHeight || aspectRatio) {
                try {
                    const dimensions = await getImageDimensions(file)

                    if (minWidth && dimensions.width < minWidth) {
                        errors.push(
                            `Image width must be at least ${minWidth}px`,
                        )
                    }
                    if (minHeight && dimensions.height < minHeight) {
                        errors.push(
                            `Image height must be at least ${minHeight}px`,
                        )
                    }
                    if (maxWidth && dimensions.width > maxWidth) {
                        errors.push(
                            `Image width must be less than ${maxWidth}px`,
                        )
                    }
                    if (maxHeight && dimensions.height > maxHeight) {
                        errors.push(
                            `Image height must be less than ${maxHeight}px`,
                        )
                    }

                    if (aspectRatio) {
                        const [targetWidth, targetHeight] = aspectRatio
                            .split(':')
                            .map(Number)
                        const targetRatio = targetWidth / targetHeight
                        const actualRatio = dimensions.width / dimensions.height
                        const tolerance = 0.1 // 10% tolerance

                        if (Math.abs(actualRatio - targetRatio) > tolerance) {
                            errors.push(
                                `Image must have aspect ratio of ${aspectRatio}`,
                            )
                        }
                    }
                } catch (error) {
                    errors.push('Unable to validate image dimensions')
                }
            }

            return {
                isValid: errors.length === 0,
                errors,
            }
        },
        [maxSizeInMB, maxWidth, maxHeight, minWidth, minHeight, aspectRatio],
    )

    const getImageDimensions = (
        file: File,
    ): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
                resolve({ width: img.naturalWidth, height: img.naturalHeight })
            }
            img.onerror = reject
            img.src = URL.createObjectURL(file)
        })
    }

    const handleFileSelect = async (file: File) => {
        if (disabled) return

        setValidationErrors([])

        const validation = await validateFile(file)
        if (!validation.isValid) {
            setValidationErrors(validation.errors)
            return
        }

        const fileUrl = URL.createObjectURL(file)
        setPreviewUrl(fileUrl)

        try {
            setIsUploading(true)
            const response = await onUpload(file)

            toast.push(
                <Notification title="Success" type="success">
                    Image uploaded successfully
                </Notification>,
            )

            // Clean up preview URL after successful upload
            URL.revokeObjectURL(fileUrl)
            setPreviewUrl(null)
        } catch (error) {
            console.error('Upload failed:', error)
            setValidationErrors(['Upload failed. Please try again.'])

            toast.push(
                <Notification title="Upload Failed" type="danger">
                    {error instanceof Error
                        ? error.message
                        : 'Please try again'}
                </Notification>,
            )
        } finally {
            setIsUploading(false)
        }
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            handleFileSelect(files[0])
        }
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }, [])

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            handleFileSelect(files[0])
        }
    }

    const handleDeleteImage = async () => {
        if (!onDelete || disabled) return

        try {
            await onDelete()
            toast.push(
                <Notification title="Success" type="success">
                    Image deleted successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Delete failed:', error)
            toast.push(
                <Notification title="Delete Failed" type="danger">
                    {error instanceof Error
                        ? error.message
                        : 'Please try again'}
                </Notification>,
            )
        }
    }

    const openFileDialog = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    const displayImageUrl = previewUrl || currentImageUrl
    const hasImage = Boolean(displayImageUrl)

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Label and Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {description && (
                    <p className="text-sm text-gray-500">{description}</p>
                )}
            </div>

            {/* Upload Area */}
            <Card className="p-0 overflow-hidden">
                {hasImage ? (
                    /* Image Preview */
                    <div className="relative group">
                        <div className="aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
                            <img
                                src={displayImageUrl}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            <Button
                                size="sm"
                                variant="plain"
                                onClick={openFileDialog}
                                disabled={disabled || isUploading}
                                className="bg-white text-gray-900 hover:bg-gray-100"
                            >
                                <Upload className="w-4 h-4 mr-1" />
                                Replace
                            </Button>

                            {onDelete && (
                                <Button
                                    size="sm"
                                    variant="solid"
                                    onClick={handleDeleteImage}
                                    disabled={disabled || isUploading}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                            )}
                        </div>

                        {isUploading && (
                            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                                <div className="flex items-center space-x-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    <span className="text-sm font-medium">
                                        Uploading...
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Upload Drop Zone */
                    <div
                        className={`p-8 border-2 border-dashed transition-colors ${
                            isDragOver
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={openFileDialog}
                    >
                        <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <div className="text-lg font-medium text-gray-900 mb-2">
                                Drop your image here, or click to browse
                            </div>
                            <div className="text-sm text-gray-500 space-y-1">
                                <p>Supports: JPG, PNG, GIF, WebP</p>
                                <p>Max size: {maxSizeInMB}MB</p>
                                {(minWidth ||
                                    minHeight ||
                                    maxWidth ||
                                    maxHeight) && (
                                    <p>
                                        Dimensions:
                                        {minWidth && ` min ${minWidth}px width`}
                                        {minHeight &&
                                            ` min ${minHeight}px height`}
                                        {maxWidth && ` max ${maxWidth}px width`}
                                        {maxHeight &&
                                            ` max ${maxHeight}px height`}
                                    </p>
                                )}
                                {aspectRatio && (
                                    <p>Aspect ratio: {aspectRatio}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="space-y-2">
                    {validationErrors.map((error, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-2 text-red-600 text-sm"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileInputChange}
                className="hidden"
                disabled={disabled}
            />
        </div>
    )
}

export default ImageUploadComponent

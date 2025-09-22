import React, { useState, useRef } from 'react'
import { Button, Badge } from '@/components/ui'
import {
    HiStar,
    HiOutlineStar,
    HiExternalLink,
    HiDocumentReport,
    HiClock,
} from 'react-icons/hi'
import type { Report } from '@/@types/report'

type FavoriteReport = Report & {
    isFavorited: boolean
    favoriteNote?: string
}

interface ReportListItemProps {
    report: FavoriteReport
    onLaunch: (report: FavoriteReport) => void
    onToggleFavorite: (report: FavoriteReport) => void
}

const ReportListItem: React.FC<ReportListItemProps> = ({
    report,
    onLaunch,
    onToggleFavorite,
}) => {
    const [imageLoaded, setImageLoaded] = useState(false)
    const [imageError, setImageError] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    const handleImageLoad = () => {
        setImageLoaded(true)
    }

    const handleImageError = () => {
        setImageError(true)
    }

    const getReportIcon = () => {
        if (report.thumbnailUrl && !imageError) {
            return (
                <div className="w-12 h-12 rounded-lg overflow-hidden relative">
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <div className="animate-pulse w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                    )}
                    <img
                        ref={imgRef}
                        src={report.thumbnailUrl}
                        alt={report.name}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        loading="lazy"
                    />
                </div>
            )
        }
        return (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                <HiDocumentReport className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
        )
    }

    return (
        <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-4 group">
            {getReportIcon()}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3
                        className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
                        onClick={() => onLaunch(report)}
                    >
                        {report.name}
                    </h3>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleFavorite(report)
                        }}
                        className="text-yellow-500 hover:text-yellow-600 transition-colors"
                    >
                        {report.isFavorited ? (
                            <HiStar className="w-4 h-4" />
                        ) : (
                            <HiOutlineStar className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {report.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {report.description}
                    </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                    {report.categoryName && (
                        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {report.categoryName}
                        </Badge>
                    )}

                    {report.workspaceName && (
                        <span>Workspace: {report.workspaceName}</span>
                    )}

                    {report.lastAccessed && (
                        <span className="flex items-center gap-1">
                            <HiClock className="w-3 h-3" />
                            Last accessed: {formatDate(report.lastAccessed)}
                        </span>
                    )}
                </div>
            </div>

            <Button
                size="sm"
                variant="solid"
                icon={<HiExternalLink />}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation()
                    onLaunch(report)
                }}
            >
                Launch
            </Button>
        </div>
    )
}

export default ReportListItem

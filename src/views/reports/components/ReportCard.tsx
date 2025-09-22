import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
    HiStar,
    HiOutlineStar,
    HiExternalLink,
    HiDocumentReport,
    HiClock,
} from 'react-icons/hi'
import { useState, useRef } from 'react'
import type { Report } from '@/@types/report'

type FavoriteReport = Report & {
    isFavorited: boolean
    favoriteNote?: string
}

interface ReportCardProps {
    report: FavoriteReport
    onLaunch: (report: FavoriteReport) => void
    onToggleFavorite: (report: FavoriteReport) => void
}

const ReportCard = ({
    report,
    onLaunch,
    onToggleFavorite,
}: ReportCardProps) => {
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

    return (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="relative">
                <div
                    className="h-40 bg-gray-100 dark:bg-gray-800 rounded-t-lg group-hover:opacity-90 transition-opacity overflow-hidden"
                    onClick={() => onLaunch(report)}
                >
                    {report.thumbnailUrl && !imageError ? (
                        <div className="relative w-full h-full">
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                    <div className="animate-pulse w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
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
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                            <HiDocumentReport className="w-12 h-12 text-blue-400 dark:text-blue-300" />
                        </div>
                    )}
                </div>

                <Button
                    icon={report.isFavorited ? <HiStar /> : <HiOutlineStar />}
                    size="xs"
                    variant={report.isFavorited ? 'solid' : 'plain'}
                    color={report.isFavorited ? 'yellow' : 'gray'}
                    shape="circle"
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite(report)
                    }}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white/100 transition-colors shadow-sm"
                />
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div
                        className="hover:text-primary-600 transition-colors cursor-pointer flex-1"
                        onClick={() => onLaunch(report)}
                    >
                        <h5 className="font-semibold line-clamp-2 text-gray-900 dark:text-gray-100">
                            {report.name}
                        </h5>
                    </div>
                </div>

                <p className="text-sm line-clamp-2 mb-4 text-gray-500 dark:text-gray-400 h-10">
                    {report.description || 'No description available'}
                </p>

                <div className="space-y-3">
                    <div className="space-y-2">
                        <Badge
                            className="mr-2"
                            innerClass="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        >
                            {report.categoryName || 'Uncategorized'}
                        </Badge>

                        <div className="space-y-1">
                            {report.lastAccessed && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <HiClock className="w-3 h-3" />
                                    Last accessed:{' '}
                                    {formatDate(report.lastAccessed)}
                                </div>
                            )}

                            {report.workspaceName && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    Workspace: {report.workspaceName}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            variant="solid"
                            size="xs"
                            icon={<HiExternalLink />}
                            onClick={(e) => {
                                e.stopPropagation()
                                onLaunch(report)
                            }}
                        >
                            Launch
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}

export default ReportCard

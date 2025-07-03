import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { HiStar, HiOutlineStar, HiExternalLink } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import type { Report } from '@/@types/report'

interface ReportCardProps {
    report: Report
    onPinToggle: () => void
    canPinReports: boolean
}

const ReportCard = ({
    report,
    onPinToggle,
    canPinReports,
}: ReportCardProps) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <div className="relative">
                <Link to={`/reports/${report.id}`}>
                    <div
                        className="h-40 bg-cover bg-center rounded-t"
                        style={{
                            backgroundImage: `url(${report.thumbnailUrl || '/img/others/img-1.jpg'})`,
                        }}
                    />
                </Link>

                {canPinReports && (
                    <Button
                        icon={report.isPinned ? <HiStar /> : <HiOutlineStar />}
                        size="xs"
                        variant="twoTone"
                        color={report.isPinned ? 'warning' : 'gray'}
                        shape="circle"
                        onClick={onPinToggle}
                        className="absolute top-2 right-2"
                    />
                )}
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <Link
                        to={`/reports/${report.id}`}
                        className="hover:text-primary-600 transition-colors"
                    >
                        <h5 className="font-semibold truncate">
                            {report.name}
                        </h5>
                    </Link>
                </div>

                <p className="text-sm line-clamp-2 mb-4 text-gray-500 h-10">
                    {report.description || 'No description available'}
                </p>

                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Badge
                            className="mr-2"
                            innerClass="bg-gray-100 text-gray-600"
                        >
                            {report.categoryName}
                        </Badge>

                        {report.lastAccessed && (
                            <div className="text-xs text-gray-500">
                                Accessed: {formatDate(report.lastAccessed)}
                            </div>
                        )}
                    </div>

                    <Link to={`/reports/${report.id}`}>
                        <Button
                            variant="twoTone"
                            size="sm"
                            icon={<HiExternalLink />}
                        >
                            View
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    )
}

export default ReportCard

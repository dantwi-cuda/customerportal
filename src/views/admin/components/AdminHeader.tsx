import { Select } from '@/components/ui'
import { useAuth } from '@/auth'
import { format } from 'date-fns'

interface AdminHeaderProps {
    title: string
    timeRange: string
    onTimeRangeChange: (value: string) => void
}

const timeRangeOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
]

const AdminHeader = ({
    title,
    timeRange,
    onTimeRangeChange,
}: AdminHeaderProps) => {
    const { user } = useAuth()
    const currentDate = new Date()

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
                <h3 className="mb-1">{title}</h3>
                <p className="text-gray-500 text-sm">
                    {user?.userName
                        ? `Welcome back, ${user.userName}`
                        : 'Welcome back'}
                    <span className="mx-1">•</span>
                    <span>{format(currentDate, 'MMMM d, yyyy')}</span>
                </p>
            </div>
            <div className="mt-4 md:mt-0">
                <Select
                    size="sm"
                    className="min-w-[120px]"
                    options={timeRangeOptions}
                    value={timeRange}
                    onChange={(e) => onTimeRangeChange(e.target.value)}
                />
            </div>
        </div>
    )
}

export default AdminHeader

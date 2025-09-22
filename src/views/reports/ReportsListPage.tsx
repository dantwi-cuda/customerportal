import { useState, useEffect } from 'react'
import { Card, Input, Button, Select, Table } from '@/components/ui'
import { HiSearch, HiFilter } from 'react-icons/hi'
import ReportService from '@/services/ReportService'
import { useNavigate } from 'react-router-dom'
import type { Report } from '@/@types/report'

const { Tr, Th, Td, THead, TBody } = Table

const ReportsListPage = () => {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [searchText, setSearchText] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const navigate = useNavigate()

    useEffect(() => {
        const fetchReports = async () => {
            console.group('📋 Fetching Reports List')
            console.log('Starting reports fetch at:', new Date().toISOString())

            try {
                setLoading(true)
                console.log('📡 Calling ReportService.getReports API...')
                const data = await ReportService.getReports()
                console.log('✅ Reports data received:', {
                    count: data?.length || 0,
                    reports:
                        data?.map((r: any) => ({ id: r.id, name: r.name })) ||
                        [],
                })
                setReports(data)
            } catch (error) {
                console.error('❌ Failed to fetch reports:', error)
                console.error('Reports fetch error details:', {
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    status: (error as any)?.response?.status,
                    statusText: (error as any)?.response?.statusText,
                    data: (error as any)?.response?.data,
                })
                // In a real app, show an error notification
            } finally {
                setLoading(false)
                console.log(
                    '📋 Reports fetch completed at:',
                    new Date().toISOString(),
                )
                console.groupEnd()
            }
        }

        fetchReports()
    }, [])

    // Apply filters
    const filteredReports = reports.filter((report) => {
        const matchesSearch =
            report.name.toLowerCase().includes(searchText.toLowerCase()) ||
            (report.description?.toLowerCase() || '').includes(
                searchText.toLowerCase(),
            )

        const matchesType = typeFilter === 'all' || report.type === typeFilter

        return matchesSearch && matchesType
    })

    const handleViewReport = (id: string, event?: React.MouseEvent) => {
        // Prevent any default behavior that might cause new window opening
        if (event) {
            event.preventDefault()
            event.stopPropagation()
        }

        console.group('🚀 Launching Report')
        console.log('Report ID:', id)
        console.log('Navigation target:', `/app/reports/${id}`)
        console.log('Navigation method: React Router navigate (same window)')
        console.log('Timestamp:', new Date().toISOString())
        console.groupEnd()

        // Use navigate with replace: false to ensure same-window navigation
        navigate(`/app/reports/${id}`, { replace: false })
    }

    return (
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header and Filters Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h4 className="mb-1">Reports</h4>
                        <p className="text-gray-600 text-sm">
                            View and analyze your data through various reports
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <Input
                            prefix={<HiSearch className="text-lg" />}
                            placeholder="Search reports..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full sm:w-64"
                        />
                        <div className="flex gap-2 items-center">
                            <HiFilter className="text-lg text-gray-400" />
                            <Select
                                size="sm"
                                value={typeFilter}
                                onChange={(value) =>
                                    setTypeFilter(value as string)
                                }
                                className="min-w-[140px]"
                            >
                                <option value="all">All Types</option>
                                <option value="analytics">Analytics</option>
                                <option value="financial">Financial</option>
                                <option value="performance">Performance</option>
                                <option value="custom">Custom</option>
                            </Select>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Content Card */}
            <Card>
                <div className="p-4">
                    <Table>
                        <THead>
                            <Tr>
                                <Th>Report Name</Th>
                                <Th>Description</Th>
                                <Th>Type</Th>
                                <Th>Last Updated</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {loading ? (
                                <Tr>
                                    <Td
                                        colSpan={5}
                                        className="text-center py-5"
                                    >
                                        Loading reports...
                                    </Td>
                                </Tr>
                            ) : filteredReports.length > 0 ? (
                                filteredReports.map((report) => (
                                    <Tr key={report.id}>
                                        <Td>{report.name}</Td>
                                        <Td>{report.description}</Td>
                                        <Td>{report.type}</Td>
                                        <Td>
                                            {report.lastUpdated
                                                ? new Date(
                                                      report.lastUpdated,
                                                  ).toLocaleDateString()
                                                : 'N/A'}
                                        </Td>
                                        <Td>
                                            <Button
                                                size="xs"
                                                onClick={(e) =>
                                                    handleViewReport(
                                                        report.id,
                                                        e,
                                                    )
                                                }
                                            >
                                                Launch
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))
                            ) : (
                                <Tr>
                                    <Td
                                        colSpan={5}
                                        className="text-center py-5"
                                    >
                                        No reports found matching your criteria
                                    </Td>
                                </Tr>
                            )}
                        </TBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}

export default ReportsListPage

import { useState, useEffect } from 'react'
import { Card, Input, Button, Select, Table } from '@/components/ui'
import { HiSearch, HiFilter } from 'react-icons/hi'
import { getReports } from '@/services/ReportService'
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
            try {
                setLoading(true)
                const data = await getReports()
                setReports(data)
            } catch (error) {
                console.error('Failed to fetch reports:', error)
                // In a real app, show an error notification
            } finally {
                setLoading(false)
            }
        }

        fetchReports()
    }, [])

    // Apply filters
    const filteredReports = reports.filter((report) => {
        const matchesSearch =
            report.name.toLowerCase().includes(searchText.toLowerCase()) ||
            report.description.toLowerCase().includes(searchText.toLowerCase())

        const matchesType = typeFilter === 'all' || report.type === typeFilter

        return matchesSearch && matchesType
    })

    const handleViewReport = (id: string) => {
        navigate(`/app/reports/${id}`)
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Reports</h1>
                <p className="text-gray-500">
                    View and analyze your data through various reports
                </p>
            </div>

            <Card>
                <div className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <Input
                            prefix={<HiSearch className="text-lg" />}
                            placeholder="Search reports..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="md:w-64"
                        />
                        <div className="flex gap-3 items-center ml-0 md:ml-auto">
                            <HiFilter className="text-lg text-gray-400" />
                            <Select
                                size="sm"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
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
                                            {new Date(
                                                report.lastUpdated,
                                            ).toLocaleDateString()}
                                        </Td>
                                        <Td>
                                            <Button
                                                size="xs"
                                                onClick={() =>
                                                    handleViewReport(report.id)
                                                }
                                            >
                                                View
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

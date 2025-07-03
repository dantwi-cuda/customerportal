import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Button,
    Notification,
    toast,
    Card,
    Table,
    Input,
    Pagination,
} from '@/components/ui'
import { Loading } from '@/components/shared'
import { UserDto } from '@/@types/user'
import { Report } from '@/@types/report'
import ReportService from '@/services/ReportService'
import UserService from '@/services/UserService'
import { HiOutlineSearch } from 'react-icons/hi'

const { Tr, Th, Td, THead, TBody, Sorter } = Table

const AssignReportsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>()
    const navigate = useNavigate()
    const selectAllRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<UserDto | null>(null)
    const [reports, setReports] = useState<Report[]>([])
    const [selectedReportIds, setSelectedReportIds] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const pageSize = 10

    // Filter and sort reports based on search term and sort order
    const filteredAndSortedReports = useMemo(() => {
        let filtered = reports.filter(
            (report) =>
                report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                report.categoryName
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()),
        )

        filtered.sort((a, b) => {
            const nameA = a.name.toLowerCase()
            const nameB = b.name.toLowerCase()
            return sortOrder === 'asc'
                ? nameA.localeCompare(nameB)
                : nameB.localeCompare(nameA)
        })

        return filtered
    }, [reports, searchTerm, sortOrder])
    // Paginate the filtered reports
    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        return filteredAndSortedReports.slice(startIndex, startIndex + pageSize)
    }, [filteredAndSortedReports, currentPage, pageSize])

    const totalPages = Math.ceil(filteredAndSortedReports.length / pageSize)

    useEffect(() => {
        if (userId) {
            fetchUserAndReports()
        } else {
            navigate('/tenantportal/tenant/users')
        }
    }, [userId, navigate])

    const fetchUserAndReports = async () => {
        setLoading(true)
        try {
            // Fetch user details and reports in parallel
            const [userResponse, reportsResponse] = await Promise.all([
                UserService.getUser(userId!),
                ReportService.getReportsList(),
            ])

            setUser(userResponse)
            setReports(reportsResponse || [])

            // Set currently assigned reports if any (this would need to come from a separate endpoint)
            // For now, initialize as empty array
            setSelectedReportIds([])
        } catch (error) {
            console.error('Failed to fetch data:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load user or reports data
                </Notification>,
            )
            navigate('/tenantportal/tenant/users')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!user) return

        setSubmitting(true)
        try {
            // Convert string IDs to numbers as required by the service
            const reportIds = selectedReportIds.map((id) => parseInt(id))
            await ReportService.assignReportsToUser(user.id!, reportIds)

            toast.push(
                <Notification title="Success" type="success">
                    Reports assigned successfully
                </Notification>,
            )
            navigate('/tenantportal/tenant/users')
        } catch (error) {
            console.error('Failed to assign reports:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to assign reports. Please try again.
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleReportToggle = (reportId: string) => {
        const isSelected = selectedReportIds.includes(reportId)
        if (isSelected) {
            setSelectedReportIds((prev) => prev.filter((id) => id !== reportId))
        } else {
            setSelectedReportIds((prev) => [...prev, reportId])
        }
    }

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1) // Reset to first page when searching

        // Update select all checkbox state
        setTimeout(() => {
            updateSelectAllCheckbox()
        }, 0)
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedReportIds(
                filteredAndSortedReports.map((report) => report.id),
            )
        } else {
            setSelectedReportIds([])
        }
    }

    const updateSelectAllCheckbox = () => {
        if (selectAllRef.current) {
            const isAllSelected =
                filteredAndSortedReports.length > 0 &&
                filteredAndSortedReports.every((report) =>
                    selectedReportIds.includes(report.id),
                )
            const isIndeterminate =
                selectedReportIds.length > 0 &&
                filteredAndSortedReports.some((report) =>
                    selectedReportIds.includes(report.id),
                ) &&
                !isAllSelected

            selectAllRef.current.checked = isAllSelected
            selectAllRef.current.indeterminate = isIndeterminate
        }
    }

    // Update checkbox state when selection changes
    useEffect(() => {
        updateSelectAllCheckbox()
    }, [selectedReportIds, filteredAndSortedReports])

    const handleSort = () => {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    }

    if (loading) {
        return (
            <div className="h-full flex flex-auto flex-col justify-center items-center">
                <Loading loading={true} />
            </div>
        )
    }

    const isAllSelected =
        filteredAndSortedReports.length > 0 &&
        filteredAndSortedReports.every((report) =>
            selectedReportIds.includes(report.id),
        )
    const isIndeterminate =
        selectedReportIds.length > 0 &&
        filteredAndSortedReports.some((report) =>
            selectedReportIds.includes(report.id),
        ) &&
        !isAllSelected

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="mb-1">Assign Reports to User</h3>
                    <p className="text-gray-600">
                        {user?.name
                            ? `Assign reports to ${user.name}`
                            : 'Assign reports to user'}
                    </p>
                </div>
                <Button
                    variant="plain"
                    onClick={() => navigate('/tenantportal/tenant/users')}
                >
                    Back to Users
                </Button>
            </div>

            <Card>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search reports by name, description, or category..."
                                value={searchTerm}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                prefix={<HiOutlineSearch className="text-lg" />}
                            />
                        </div>
                        <div className="text-sm text-gray-600">
                            {filteredAndSortedReports.length} reports found
                        </div>
                    </div>

                    <div>
                        <Table>
                            <THead>
                                <Tr>
                                    <Th className="w-12">
                                        <input
                                            type="checkbox"
                                            ref={selectAllRef}
                                            checked={isAllSelected}
                                            onChange={(e) =>
                                                handleSelectAll(
                                                    e.target.checked,
                                                )
                                            }
                                            aria-label="Select all reports"
                                            className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500"
                                        />
                                    </Th>
                                    <Th>
                                        <div
                                            className="flex items-center gap-2 cursor-pointer select-none"
                                            onClick={handleSort}
                                        >
                                            <span>Report Name</span>
                                            <Sorter sort={sortOrder} />
                                        </div>
                                    </Th>
                                    <Th>Description</Th>
                                    <Th>Category</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {paginatedReports.map((report) => (
                                    <Tr key={report.id}>
                                        <Td>
                                            <input
                                                type="checkbox"
                                                checked={selectedReportIds.includes(
                                                    report.id,
                                                )}
                                                onChange={() =>
                                                    handleReportToggle(
                                                        report.id,
                                                    )
                                                }
                                                aria-label={`Select ${report.name}`}
                                                className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500"
                                            />
                                        </Td>
                                        <Td>
                                            <div className="font-medium">
                                                {report.name}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="text-sm text-gray-600">
                                                {report.description ||
                                                    'No description'}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="text-sm">
                                                {report.categoryName ||
                                                    'Uncategorized'}
                                            </div>
                                        </Td>
                                    </Tr>
                                ))}
                            </TBody>
                        </Table>

                        {paginatedReports.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                {searchTerm
                                    ? 'No reports found matching your search'
                                    : 'No reports available'}
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center">
                            <Pagination
                                currentPage={currentPage}
                                total={filteredAndSortedReports.length}
                                pageSize={pageSize}
                                onChange={setCurrentPage}
                            />
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-gray-600">
                            {selectedReportIds.length > 0 && (
                                <span>
                                    {selectedReportIds.length} of{' '}
                                    {filteredAndSortedReports.length} reports
                                    selected
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="plain"
                                onClick={() =>
                                    navigate('/tenantportal/tenant/users')
                                }
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                onClick={handleSubmit}
                                loading={submitting}
                                disabled={selectedReportIds.length === 0}
                            >
                                Assign Reports ({selectedReportIds.length})
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default AssignReportsPage

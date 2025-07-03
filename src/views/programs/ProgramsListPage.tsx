import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Input,
    Button,
    Table,
    Alert,
    Notification,
    Skeleton,
    Select,
    Pagination,
    Badge,
    Avatar,
    Dropdown,
} from '@/components/ui'
import { toast } from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineUserGroup,
    HiOutlineOfficeBuilding,
    HiOutlineEye,
    HiOutlineDotsVertical,
} from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import type { Program } from '@/@types/program'
import ProgramService from '@/services/ProgramService'
import useAuth from '@/auth/useAuth'

const ProgramsListPage: React.FC = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [programs, setPrograms] = useState<Program[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)

    // Permissions
    const hasViewAccess = user?.authority?.some((role: string) =>
        [
            'CS-Admin',
            'CS-User',
            'Tenant-Admin',
            'Tenant-User',
            'program.view',
            'program.edit',
        ].includes(role),
    )

    const hasEditAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'program.edit'].includes(role),
    )

    const hasCreateAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'program.create'].includes(role),
    )

    const hasDeleteAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'program.delete'].includes(role),
    )

    const hasAssignAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'Tenant-User', 'program.assign'].includes(
            role,
        ),
    )

    const isPortalAdmin = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const isTenant = user?.authority?.some((role: string) =>
        ['Tenant-Admin', 'Tenant-User'].includes(role),
    )

    useEffect(() => {
        if (hasViewAccess) {
            loadPrograms()
        }
    }, [hasViewAccess])

    const loadPrograms = async () => {
        try {
            setLoading(true)
            const programsData = await ProgramService.getPrograms()
            setPrograms(programsData)
        } catch (error) {
            console.error('Error loading programs:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load programs
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (programId: number) => {
        if (!window.confirm('Are you sure you want to delete this program?')) {
            return
        }

        try {
            await ProgramService.deleteProgram(programId)
            toast.push(
                <Notification title="Success" type="success">
                    Program deleted successfully
                </Notification>,
            )
            await loadPrograms()
        } catch (error) {
            console.error('Error deleting program:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to delete program
                </Notification>,
            )
        }
    }

    // Filter programs based on search text and status
    const filteredPrograms = useMemo(() => {
        return programs.filter((program) => {
            const searchLower = searchText.toLowerCase()
            const matchesSearch =
                program.name.toLowerCase().includes(searchLower) ||
                (program.description?.toLowerCase() || '').includes(
                    searchLower,
                ) ||
                (program.programTypeName?.toLowerCase() || '').includes(
                    searchLower,
                ) ||
                (program.manufacturerName?.toLowerCase() || '').includes(
                    searchLower,
                ) ||
                (program.createdByCustomerName?.toLowerCase() || '').includes(
                    searchLower,
                )

            let matchesStatus = true
            if (statusFilter === 'active') {
                const now = new Date()
                const startDate = program.startDate
                    ? new Date(program.startDate)
                    : null
                const endDate = program.endDate
                    ? new Date(program.endDate)
                    : null
                matchesStatus =
                    program.isActive &&
                    (!startDate || startDate <= now) &&
                    (!endDate || endDate >= now)
            } else if (statusFilter === 'inactive') {
                matchesStatus = !program.isActive
            } else if (statusFilter === 'scheduled') {
                const now = new Date()
                const startDate = program.startDate
                    ? new Date(program.startDate)
                    : null
                matchesStatus =
                    program.isActive && Boolean(startDate && startDate > now)
            } else if (statusFilter === 'expired') {
                const now = new Date()
                const endDate = program.endDate
                    ? new Date(program.endDate)
                    : null
                matchesStatus = Boolean(endDate && endDate < now)
            }

            return matchesSearch && matchesStatus
        })
    }, [programs, searchText, statusFilter])

    // Paginated programs
    const paginatedPrograms = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        return filteredPrograms.slice(startIndex, endIndex)
    }, [filteredPrograms, currentPage, pageSize])

    const getStatusBadge = (program: Program) => {
        if (!program.isActive) {
            return (
                <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-200">
                    Inactive
                </Badge>
            )
        }

        const now = new Date()
        const startDate = program.startDate ? new Date(program.startDate) : null
        const endDate = program.endDate ? new Date(program.endDate) : null

        if (startDate && startDate > now) {
            return (
                <Badge className="bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-200">
                    Scheduled
                </Badge>
            )
        }

        if (endDate && endDate < now) {
            return (
                <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-200">
                    Expired
                </Badge>
            )
        }

        return (
            <Badge className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200">
                Active
            </Badge>
        )
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString()
    }

    if (!hasViewAccess) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to view programs.
                </Alert>
            </Card>
        )
    }

    const totalPages = Math.ceil(filteredPrograms.length / pageSize)

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div>
                        <h4 className="mb-1">Programs / Network</h4>
                        <p className="text-gray-600">
                            Manage programs and their assignments
                        </p>
                    </div>
                    {hasCreateAccess && (
                        <Button
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={() =>
                                navigate(
                                    isPortalAdmin
                                        ? '/tenantportal/programs/add'
                                        : '/app/programs/add',
                                )
                            }
                        >
                            Add New Program
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Search
                        </label>
                        <Input
                            placeholder="Search by name, type, manufacturer..."
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value)
                                setCurrentPage(1)
                            }}
                            prefix={<HiOutlineSearch />}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Status
                        </label>
                        <Select
                            placeholder="All statuses"
                            value={
                                statusFilter
                                    ? {
                                          value: statusFilter,
                                          label:
                                              statusFilter === 'all'
                                                  ? 'All statuses'
                                                  : statusFilter === 'active'
                                                    ? 'Active'
                                                    : statusFilter ===
                                                        'inactive'
                                                      ? 'Inactive'
                                                      : statusFilter ===
                                                          'scheduled'
                                                        ? 'Scheduled'
                                                        : statusFilter ===
                                                            'expired'
                                                          ? 'Expired'
                                                          : statusFilter,
                                      }
                                    : null
                            }
                            options={[
                                { value: 'all', label: 'All statuses' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                                { value: 'scheduled', label: 'Scheduled' },
                                { value: 'expired', label: 'Expired' },
                            ]}
                            onChange={(option: any) => {
                                setStatusFilter(option?.value || 'all')
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, index) => (
                            <Skeleton key={index} height="50px" />
                        ))}
                    </div>
                ) : (
                    <>
                        <Table>
                            <Table.THead>
                                <Table.Tr>
                                    <Table.Th>Program Name</Table.Th>
                                    <Table.Th>Type</Table.Th>
                                    {isPortalAdmin && (
                                        <Table.Th>Created By</Table.Th>
                                    )}
                                    <Table.Th>Manufacturer</Table.Th>
                                    <Table.Th>Contact</Table.Th>
                                    <Table.Th>Start Date</Table.Th>
                                    <Table.Th>End Date</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                    <Table.Th></Table.Th>
                                </Table.Tr>
                            </Table.THead>
                            <Table.TBody>
                                {paginatedPrograms.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td
                                            colSpan={isPortalAdmin ? 9 : 8}
                                            className="text-center py-8"
                                        >
                                            No programs found
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    paginatedPrograms.map((program) => (
                                        <Table.Tr key={program.programId}>
                                            <Table.Td>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        size="sm"
                                                        shape="circle"
                                                    >
                                                        {program.name.charAt(0)}
                                                    </Avatar>
                                                    <div>
                                                        <span className="font-medium">
                                                            {program.name}
                                                        </span>
                                                        {program.description && (
                                                            <p className="text-sm text-gray-600 truncate max-w-xs">
                                                                {
                                                                    program.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="text-blue-600 font-medium">
                                                    {program.programTypeName ||
                                                        'N/A'}
                                                </span>
                                            </Table.Td>
                                            {isPortalAdmin && (
                                                <Table.Td>
                                                    <span className="text-gray-600">
                                                        {program.createdByCustomerName ||
                                                            'System'}
                                                    </span>
                                                </Table.Td>
                                            )}
                                            <Table.Td>
                                                <span>
                                                    {program.manufacturerName ||
                                                        'N/A'}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                <div className="text-sm">
                                                    <div>
                                                        {program.contactName ||
                                                            'N/A'}
                                                    </div>
                                                    {program.contactPhone && (
                                                        <div className="text-gray-600">
                                                            {
                                                                program.contactPhone
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="text-gray-600">
                                                    {formatDate(
                                                        program.startDate,
                                                    )}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                <span className="text-gray-600">
                                                    {formatDate(
                                                        program.endDate,
                                                    )}
                                                </span>
                                            </Table.Td>
                                            <Table.Td>
                                                {getStatusBadge(program)}
                                            </Table.Td>
                                            <Table.Td>
                                                <Dropdown
                                                    renderTitle={
                                                        <Button
                                                            variant="plain"
                                                            size="xs"
                                                            icon={
                                                                <HiOutlineDotsVertical />
                                                            }
                                                        />
                                                    }
                                                    placement="bottom-end"
                                                >
                                                    <Dropdown.Item
                                                        eventKey="view"
                                                        onClick={() =>
                                                            navigate(
                                                                isPortalAdmin
                                                                    ? `/tenantportal/programs/${program.programId}/assignments`
                                                                    : `/app/programs/${program.programId}/assignments`,
                                                            )
                                                        }
                                                    >
                                                        <HiOutlineEye className="mr-2" />
                                                        View Assignments
                                                    </Dropdown.Item>

                                                    {hasEditAccess && (
                                                        <Dropdown.Item
                                                            eventKey="edit"
                                                            onClick={() =>
                                                                navigate(
                                                                    isPortalAdmin
                                                                        ? `/tenantportal/programs/edit/${program.programId}`
                                                                        : `/app/programs/edit/${program.programId}`,
                                                                )
                                                            }
                                                        >
                                                            <HiOutlinePencil className="mr-2" />
                                                            Edit Program
                                                        </Dropdown.Item>
                                                    )}

                                                    {hasAssignAccess &&
                                                        isPortalAdmin && (
                                                            <Dropdown.Item
                                                                eventKey="assign-customers"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/tenantportal/programs/${program.programId}/assign-customers`,
                                                                    )
                                                                }
                                                            >
                                                                <HiOutlineUserGroup className="mr-2" />
                                                                Assign to
                                                                Customers
                                                            </Dropdown.Item>
                                                        )}

                                                    {hasAssignAccess &&
                                                        isTenant && (
                                                            <Dropdown.Item
                                                                eventKey="assign-shops"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/app/programs/${program.programId}/assign-shops`,
                                                                    )
                                                                }
                                                            >
                                                                <HiOutlineOfficeBuilding className="mr-2" />
                                                                Assign to Shops
                                                            </Dropdown.Item>
                                                        )}

                                                    {hasDeleteAccess && (
                                                        <>
                                                            <div className="my-1 border-b border-gray-200 dark:border-gray-600" />
                                                            <Dropdown.Item
                                                                eventKey="delete"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        program.programId,
                                                                    )
                                                                }
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                <HiOutlineTrash className="mr-2" />
                                                                Delete Program
                                                            </Dropdown.Item>
                                                        </>
                                                    )}
                                                </Dropdown>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))
                                )}
                            </Table.TBody>
                        </Table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-6">
                                <Pagination
                                    total={filteredPrograms.length}
                                    pageSize={pageSize}
                                    currentPage={currentPage}
                                    onChange={(page) => setCurrentPage(page)}
                                />
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    )
}

export default ProgramsListPage

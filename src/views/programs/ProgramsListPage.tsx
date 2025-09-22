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
    Tag,
    Avatar,
    Dropdown,
    Switcher,
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
    HiOutlineCog,
    HiOutlineClipboardList,
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
    const [pageSize] = useState(10) // Permissions
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

    const isTenantAdmin = user?.authority?.some((role: string) =>
        ['Tenant-Admin'].includes(role),
    )

    // Check if we're in tenant portal based on current path
    const isInTenantPortal =
        window.location.pathname.startsWith('/tenantportal')

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

    const handleToggleActive = async (programId: number, isActive: boolean) => {
        try {
            await ProgramService.toggleProgramActiveStatus(programId, isActive)
            toast.push(
                <Notification title="Success" type="success">
                    Program status updated successfully
                </Notification>,
            )
            // Update the local state immediately for better UX
            setPrograms((prevPrograms) =>
                prevPrograms.map((program) =>
                    program.programId === programId
                        ? { ...program, isActive }
                        : program,
                ),
            )
        } catch (error) {
            console.error('Error updating program status:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to update program status
                </Notification>,
            )
        }
    }

    // Helper function to check if a program is accounting type
    const isAccountingProgram = (program: Program): boolean => {
        return (
            program.programTypeName?.toLowerCase().includes('accounting') ||
            false
        )
    }

    // Helper function to navigate to program details page
    const handleViewProgram = (program: Program) => {
        // Navigate to program details page instead of opening dialog
        if (isPortalAdmin) {
            navigate(`/tenantportal/programs/${program.programId}/details`)
        } else {
            navigate(`/app/programs/${program.programId}/details`)
        }
    }

    // Helper function to navigate to chart of accounts
    const handleChartOfAccount = (program: Program) => {
        navigate(`/tenantportal/programs/${program.programId}/chart-of-account`)
    }

    // Filter programs based on search text and status
    const filteredPrograms = useMemo(() => {
        return programs.filter((program) => {
            const searchLower = searchText.toLowerCase()
            const matchesSearch =
                (program.programName || '')
                    .toLowerCase()
                    .includes(searchLower) ||
                (program.programDescription || '')
                    .toLowerCase()
                    .includes(searchLower) ||
                (program.programTypeName || '')
                    .toLowerCase()
                    .includes(searchLower) ||
                (program.contactName || '')
                    .toLowerCase()
                    .includes(searchLower) ||
                (program.contactPhone || '')
                    .toLowerCase()
                    .includes(searchLower) ||
                (program.contactEmail || '')
                    .toLowerCase()
                    .includes(searchLower) ||
                (program.createdByCustomerName || '')
                    .toLowerCase()
                    .includes(searchLower)

            let matchesStatus = true
            if (statusFilter === 'active') {
                matchesStatus = program.isActive
            } else if (statusFilter === 'inactive') {
                matchesStatus = !program.isActive
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h4 className="mb-1">Programs / Network</h4>
                        <p className="text-gray-600">
                            Manage programs and their assignments
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {isPortalAdmin && (
                            <>
                                <Button
                                    variant="plain"
                                    icon={<HiOutlineCog />}
                                    onClick={() =>
                                        navigate(
                                            isInTenantPortal
                                                ? '/tenantportal/program-categories'
                                                : '/app/program-categories',
                                        )
                                    }
                                    className="w-full sm:w-auto"
                                >
                                    Program Categories
                                </Button>
                                <Button
                                    variant="plain"
                                    icon={<HiOutlineCog />}
                                    onClick={() =>
                                        navigate(
                                            isInTenantPortal
                                                ? '/tenantportal/program-types'
                                                : '/app/program-types',
                                        )
                                    }
                                    className="w-full sm:w-auto"
                                >
                                    Manage Program Types
                                </Button>
                            </>
                        )}
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
                                className="w-full sm:w-auto"
                            >
                                Add New Program
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium mb-2">
                            Search
                        </label>
                        <Input
                            placeholder="Search by name, type, contact..."
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
                                                      : statusFilter,
                                      }
                                    : null
                            }
                            options={[
                                { value: 'all', label: 'All statuses' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                            onChange={(option: any) => {
                                setStatusFilter(option?.value || 'all')
                                setCurrentPage(1)
                            }}
                        />
                    </div>
                </div>

                {/* Desktop Table - Hidden on mobile */}
                <div className="hidden lg:block">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, index) => (
                                <Skeleton key={index} height="50px" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <Table.THead>
                                        <Table.Tr>
                                            <Table.Th>Program Name</Table.Th>
                                            <Table.Th>Type</Table.Th>
                                            {isPortalAdmin && (
                                                <Table.Th>Created By</Table.Th>
                                            )}
                                            <Table.Th>Contact Name</Table.Th>
                                            <Table.Th>Contact Phone</Table.Th>
                                            <Table.Th>Contact Email</Table.Th>
                                            <Table.Th># of Shops</Table.Th>
                                            <Table.Th>Start Date</Table.Th>
                                            <Table.Th>End Date</Table.Th>
                                            <Table.Th>Is Active</Table.Th>
                                            <Table.Th></Table.Th>
                                        </Table.Tr>
                                    </Table.THead>
                                    <Table.TBody>
                                        {paginatedPrograms.length === 0 ? (
                                            <Table.Tr>
                                                <Table.Td
                                                    colSpan={
                                                        isPortalAdmin ? 11 : 10
                                                    }
                                                    className="text-center py-8"
                                                >
                                                    No programs found
                                                </Table.Td>
                                            </Table.Tr>
                                        ) : (
                                            paginatedPrograms.map((program) => (
                                                <Table.Tr
                                                    key={program.programId}
                                                >
                                                    <Table.Td>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar
                                                                size="sm"
                                                                shape="circle"
                                                            >
                                                                {(
                                                                    program.programName ||
                                                                    'P'
                                                                ).charAt(0)}
                                                            </Avatar>
                                                            <div>
                                                                <span className="font-medium">
                                                                    {program.programName ||
                                                                        'Unnamed Program'}
                                                                </span>
                                                                {program.programDescription && (
                                                                    <p className="text-sm text-gray-600 truncate max-w-xs">
                                                                        {
                                                                            program.programDescription
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
                                                            {program.contactName ||
                                                                'N/A'}
                                                        </span>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <span>
                                                            {program.contactPhone ||
                                                                'N/A'}
                                                        </span>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <span>
                                                            {program.contactEmail ||
                                                                'N/A'}
                                                        </span>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <button
                                                            onClick={() =>
                                                                navigate(
                                                                    isPortalAdmin
                                                                        ? `/tenantportal/programs/${program.programId}/assignments`
                                                                        : `/app/programs/${program.programId}/assignments`,
                                                                )
                                                            }
                                                            className="group flex items-center gap-2 hover:bg-blue-50 rounded-lg px-2 py-1 transition-colors"
                                                        >
                                                            <div className="bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full text-sm group-hover:bg-blue-200 transition-colors">
                                                                {program.shopSubscriptions?.filter(
                                                                    (sub) =>
                                                                        sub.isActive,
                                                                ).length || 0}
                                                            </div>
                                                            <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                                                                shop
                                                                {(program.shopSubscriptions?.filter(
                                                                    (sub) =>
                                                                        sub.isActive,
                                                                ).length ||
                                                                    0) !== 1
                                                                    ? 's'
                                                                    : ''}
                                                            </span>
                                                            <HiOutlineEye className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                        </button>
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
                                                        <Switcher
                                                            checked={
                                                                program.isActive
                                                            }
                                                            onChange={(
                                                                isActive,
                                                            ) =>
                                                                handleToggleActive(
                                                                    program.programId,
                                                                    isActive,
                                                                )
                                                            }
                                                            disabled={
                                                                !hasEditAccess
                                                            }
                                                        />
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

                                                            <Dropdown.Item
                                                                eventKey="view-program"
                                                                onClick={() =>
                                                                    handleViewProgram(
                                                                        program,
                                                                    )
                                                                }
                                                            >
                                                                <HiOutlineEye className="mr-2" />
                                                                View Program
                                                            </Dropdown.Item>

                                                            {isAccountingProgram(
                                                                program,
                                                            ) &&
                                                                isTenantAdmin &&
                                                                !isPortalAdmin && (
                                                                    <Dropdown.Item
                                                                        eventKey="chart-of-account"
                                                                        onClick={() =>
                                                                            handleChartOfAccount(
                                                                                program,
                                                                            )
                                                                        }
                                                                    >
                                                                        <HiOutlineClipboardList className="mr-2" />
                                                                        Chart of
                                                                        Account
                                                                    </Dropdown.Item>
                                                                )}

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
                                                                        Assign
                                                                        to
                                                                        Customers
                                                                    </Dropdown.Item>
                                                                )}

                                                            {hasAssignAccess &&
                                                                isTenant && (
                                                                    <Dropdown.Item
                                                                        eventKey="assign-shops"
                                                                        onClick={() => {
                                                                            console.log(
                                                                                '🏪 Assign Shops clicked for program:',
                                                                                {
                                                                                    programId:
                                                                                        program.programId,
                                                                                    programID:
                                                                                        (
                                                                                            program as any
                                                                                        )
                                                                                            .programID,
                                                                                    programName:
                                                                                        program.programName,
                                                                                    program:
                                                                                        program,
                                                                                },
                                                                            )
                                                                            navigate(
                                                                                `/app/programs/${program.programId}/assign-shops`,
                                                                                {
                                                                                    state: {
                                                                                        program:
                                                                                            program,
                                                                                        currentAssignments:
                                                                                            program.shopSubscriptions?.filter(
                                                                                                (
                                                                                                    sub,
                                                                                                ) =>
                                                                                                    sub.isActive,
                                                                                            ) ||
                                                                                            [],
                                                                                    },
                                                                                },
                                                                            )
                                                                        }}
                                                                    >
                                                                        <HiOutlineOfficeBuilding className="mr-2" />
                                                                        Assign
                                                                        to Shops
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
                                                                        Delete
                                                                        Program
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
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination
                                        total={filteredPrograms.length}
                                        pageSize={pageSize}
                                        currentPage={currentPage}
                                        onChange={(page) =>
                                            setCurrentPage(page)
                                        }
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Mobile Cards - Hidden on desktop */}
                <div className="lg:hidden">
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, index) => (
                                <Skeleton key={index} height="120px" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {paginatedPrograms.length === 0 ? (
                                <Card className="text-center py-8">
                                    <p className="text-gray-600">
                                        No programs found
                                    </p>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {paginatedPrograms.map((program) => (
                                        <Card
                                            key={program.programId}
                                            className="p-4"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Avatar
                                                        size="sm"
                                                        shape="circle"
                                                    >
                                                        {(
                                                            program.programName ||
                                                            'P'
                                                        ).charAt(0)}
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-medium truncate">
                                                            {program.programName ||
                                                                'Unnamed Program'}
                                                        </h5>
                                                        <p className="text-sm text-blue-600">
                                                            {program.programTypeName ||
                                                                'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="text-xs text-gray-500">
                                                            Active
                                                        </span>
                                                        <Switcher
                                                            checked={
                                                                program.isActive
                                                            }
                                                            onChange={(
                                                                isActive,
                                                            ) =>
                                                                handleToggleActive(
                                                                    program.programId,
                                                                    isActive,
                                                                )
                                                            }
                                                            disabled={
                                                                !hasEditAccess
                                                            }
                                                        />
                                                    </div>
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

                                                        <Dropdown.Item
                                                            eventKey="view-program"
                                                            onClick={() =>
                                                                handleViewProgram(
                                                                    program,
                                                                )
                                                            }
                                                        >
                                                            <HiOutlineEye className="mr-2" />
                                                            View Program
                                                        </Dropdown.Item>

                                                        {isAccountingProgram(
                                                            program,
                                                        ) &&
                                                            isTenantAdmin &&
                                                            !isPortalAdmin && (
                                                                <Dropdown.Item
                                                                    eventKey="chart-of-account"
                                                                    onClick={() =>
                                                                        handleChartOfAccount(
                                                                            program,
                                                                        )
                                                                    }
                                                                >
                                                                    <HiOutlineClipboardList className="mr-2" />
                                                                    Chart of
                                                                    Account
                                                                </Dropdown.Item>
                                                            )}

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
                                                                    onClick={() => {
                                                                        console.log(
                                                                            '🏪 Mobile Assign Shops clicked for program:',
                                                                            {
                                                                                programId:
                                                                                    program.programId,
                                                                                programID:
                                                                                    (
                                                                                        program as any
                                                                                    )
                                                                                        .programID,
                                                                                programName:
                                                                                    program.programName,
                                                                                program:
                                                                                    program,
                                                                            },
                                                                        )
                                                                        navigate(
                                                                            `/app/programs/${program.programId}/assign-shops`,
                                                                            {
                                                                                state: {
                                                                                    program:
                                                                                        program,
                                                                                    currentAssignments:
                                                                                        program.shopSubscriptions?.filter(
                                                                                            (
                                                                                                sub,
                                                                                            ) =>
                                                                                                sub.isActive,
                                                                                        ) ||
                                                                                        [],
                                                                                },
                                                                            },
                                                                        )
                                                                    }}
                                                                >
                                                                    <HiOutlineOfficeBuilding className="mr-2" />
                                                                    Assign to
                                                                    Shops
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
                                                                    Delete
                                                                    Program
                                                                </Dropdown.Item>
                                                            </>
                                                        )}
                                                    </Dropdown>
                                                </div>
                                            </div>

                                            {program.programDescription && (
                                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                    {program.programDescription}
                                                </p>
                                            )}

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">
                                                        Contact Name:
                                                    </span>
                                                    <span>
                                                        {program.contactName ||
                                                            'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">
                                                        Contact Phone:
                                                    </span>
                                                    <span>
                                                        {program.contactPhone ||
                                                            'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">
                                                        Contact Email:
                                                    </span>
                                                    <span>
                                                        {program.contactEmail ||
                                                            'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">
                                                        # of Shops:
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                isPortalAdmin
                                                                    ? `/tenantportal/programs/${program.programId}/assignments`
                                                                    : `/app/programs/${program.programId}/assignments`,
                                                            )
                                                        }
                                                        className="group flex items-center gap-1 hover:bg-blue-50 rounded px-1 py-0.5 transition-colors"
                                                    >
                                                        <div className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full text-xs group-hover:bg-blue-200 transition-colors">
                                                            {program.shopSubscriptions?.filter(
                                                                (sub) =>
                                                                    sub.isActive,
                                                            ).length || 0}
                                                        </div>
                                                        <HiOutlineEye className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                    </button>
                                                </div>
                                                {isPortalAdmin && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">
                                                            Created By:
                                                        </span>
                                                        <span>
                                                            {program.createdByCustomerName ||
                                                                'System'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">
                                                        Period:
                                                    </span>
                                                    <span>
                                                        {formatDate(
                                                            program.startDate,
                                                        )}{' '}
                                                        -{' '}
                                                        {formatDate(
                                                            program.endDate,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Mobile Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination
                                        total={filteredPrograms.length}
                                        pageSize={pageSize}
                                        currentPage={currentPage}
                                        onChange={(page) =>
                                            setCurrentPage(page)
                                        }
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default ProgramsListPage

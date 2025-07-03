import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Table,
    Alert,
    Notification,
    Skeleton,
    Badge,
    Avatar,
    Tabs,
} from '@/components/ui'
import { toast } from '@/components/ui'
import { HiOutlineArrowLeft, HiOutlineTrash } from 'react-icons/hi'
import { useParams, useNavigate } from 'react-router-dom'
import type {
    Program,
    ProgramAssignment,
    ProgramShopAssignment,
} from '@/@types/program'
import ProgramService from '@/services/ProgramService'
import useAuth from '@/auth/useAuth'

const ProgramAssignmentsPage: React.FC = () => {
    const { programId } = useParams<{ programId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [program, setProgram] = useState<Program | null>(null)
    const [customerAssignments, setCustomerAssignments] = useState<
        ProgramAssignment[]
    >([])
    const [shopAssignments, setShopAssignments] = useState<
        ProgramShopAssignment[]
    >([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('customers')

    const hasViewAccess = user?.authority?.some((role: string) =>
        [
            'CS-Admin',
            'CS-User',
            'Tenant-Admin',
            'Tenant-User',
            'program.view',
            'program.edit',
            'program.assign',
        ].includes(role),
    )

    const hasDeleteAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'program.assign'].includes(role),
    )

    const isPortalAdmin = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const getBackPath = () => {
        return isPortalAdmin ? '/tenantportal/programs' : '/app/programs'
    }

    useEffect(() => {
        if (programId && hasViewAccess) {
            loadData()
        }
    }, [programId, hasViewAccess])

    const loadData = async () => {
        try {
            setLoading(true)
            const [programData, customerAssignmentsData, shopAssignmentsData] =
                await Promise.all([
                    ProgramService.getProgram(parseInt(programId!)),
                    ProgramService.getProgramCustomerAssignments(
                        parseInt(programId!),
                    ),
                    ProgramService.getProgramShopAssignments(
                        parseInt(programId!),
                    ),
                ])
            setProgram(programData)
            setCustomerAssignments(customerAssignmentsData)
            setShopAssignments(shopAssignmentsData)
        } catch (error) {
            console.error('Error loading data:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load program assignments
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteCustomerAssignment = async (assignmentId: number) => {
        if (
            !window.confirm(
                'Are you sure you want to remove this customer assignment?',
            )
        ) {
            return
        }

        try {
            await ProgramService.removeProgramAssignment(assignmentId)
            toast.push(
                <Notification title="Success" type="success">
                    Customer assignment removed successfully
                </Notification>,
            )
            await loadData()
        } catch (error) {
            console.error('Error deleting assignment:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to remove customer assignment
                </Notification>,
            )
        }
    }

    const handleDeleteShopAssignment = async (assignmentId: number) => {
        if (
            !window.confirm(
                'Are you sure you want to remove this shop assignment?',
            )
        ) {
            return
        }

        try {
            await ProgramService.removeProgramAssignment(assignmentId)
            toast.push(
                <Notification title="Success" type="success">
                    Shop assignment removed successfully
                </Notification>,
            )
            await loadData()
        } catch (error) {
            console.error('Error deleting assignment:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to remove shop assignment
                </Notification>,
            )
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString()
    }

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleString()
    }

    if (!hasViewAccess) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to view program assignments.
                </Alert>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton height="60px" />
                <Skeleton height="400px" />
            </div>
        )
    }

    if (!program) {
        return (
            <Card>
                <Alert type="danger">Program not found.</Alert>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="plain"
                        size="sm"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate(getBackPath())}
                    >
                        Back to Programs
                    </Button>
                    <div>
                        <h4 className="mb-1">Program Assignments</h4>
                        <p className="text-gray-600">
                            View assignments for "{program.name}"
                        </p>
                    </div>
                </div>

                {/* Program Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <span className="text-sm text-gray-600">
                                Program Name
                            </span>
                            <p className="font-medium">{program.name}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">Type</span>
                            <p className="font-medium">
                                {program.programTypeName || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">
                                Status
                            </span>
                            <Badge
                                className={
                                    program.isActive
                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-200'
                                }
                            >
                                {program.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Assignments Tabs */}
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.TabList>
                        {isPortalAdmin && (
                            <Tabs.TabNav value="customers">
                                Customer Assignments (
                                {customerAssignments.length})
                            </Tabs.TabNav>
                        )}
                        <Tabs.TabNav value="shops">
                            Shop Assignments ({shopAssignments.length})
                        </Tabs.TabNav>
                    </Tabs.TabList>

                    <div className="mt-6">
                        {isPortalAdmin && (
                            <Tabs.TabContent value="customers">
                                <Card>
                                    <h5 className="mb-4">
                                        Customer Assignments
                                    </h5>
                                    <Table>
                                        <Table.THead>
                                            <Table.Tr>
                                                <Table.Th>Customer</Table.Th>
                                                <Table.Th>
                                                    Assigned Date
                                                </Table.Th>
                                                <Table.Th>Assigned By</Table.Th>
                                                <Table.Th>Start Date</Table.Th>
                                                <Table.Th>End Date</Table.Th>
                                                <Table.Th>Status</Table.Th>
                                                {hasDeleteAccess && (
                                                    <Table.Th>Actions</Table.Th>
                                                )}
                                            </Table.Tr>
                                        </Table.THead>
                                        <Table.TBody>
                                            {customerAssignments.length ===
                                            0 ? (
                                                <Table.Tr>
                                                    <Table.Td
                                                        colSpan={
                                                            hasDeleteAccess
                                                                ? 7
                                                                : 6
                                                        }
                                                        className="text-center py-8"
                                                    >
                                                        No customer assignments
                                                        found
                                                    </Table.Td>
                                                </Table.Tr>
                                            ) : (
                                                customerAssignments.map(
                                                    (assignment) => (
                                                        <Table.Tr
                                                            key={
                                                                assignment.assignmentId
                                                            }
                                                        >
                                                            <Table.Td>
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar
                                                                        size="sm"
                                                                        shape="circle"
                                                                    >
                                                                        {(
                                                                            assignment.customerName ||
                                                                            'C'
                                                                        ).charAt(
                                                                            0,
                                                                        )}
                                                                    </Avatar>
                                                                    <span className="font-medium">
                                                                        {assignment.customerName ||
                                                                            'Unknown Customer'}
                                                                    </span>
                                                                </div>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <span className="text-gray-600">
                                                                    {formatDateTime(
                                                                        assignment.assignedAt,
                                                                    )}
                                                                </span>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <span className="text-gray-600">
                                                                    {assignment.assignedByUserName ||
                                                                        'System'}
                                                                </span>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <span className="text-gray-600">
                                                                    {formatDate(
                                                                        assignment.startDate,
                                                                    )}
                                                                </span>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <span className="text-gray-600">
                                                                    {formatDate(
                                                                        assignment.endDate,
                                                                    )}
                                                                </span>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Badge
                                                                    className={
                                                                        assignment.isActive
                                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-200'
                                                                    }
                                                                >
                                                                    {assignment.isActive
                                                                        ? 'Active'
                                                                        : 'Inactive'}
                                                                </Badge>
                                                            </Table.Td>
                                                            {hasDeleteAccess && (
                                                                <Table.Td>
                                                                    <Button
                                                                        variant="plain"
                                                                        size="xs"
                                                                        icon={
                                                                            <HiOutlineTrash />
                                                                        }
                                                                        onClick={() =>
                                                                            handleDeleteCustomerAssignment(
                                                                                assignment.assignmentId,
                                                                            )
                                                                        }
                                                                        className="text-red-600 hover:text-red-800"
                                                                    />
                                                                </Table.Td>
                                                            )}
                                                        </Table.Tr>
                                                    ),
                                                )
                                            )}
                                        </Table.TBody>
                                    </Table>
                                </Card>
                            </Tabs.TabContent>
                        )}

                        <Tabs.TabContent value="shops">
                            <Card>
                                <h5 className="mb-4">Shop Assignments</h5>
                                <Table>
                                    <Table.THead>
                                        <Table.Tr>
                                            <Table.Th>Shop</Table.Th>
                                            <Table.Th>Assigned Date</Table.Th>
                                            <Table.Th>Assigned By</Table.Th>
                                            <Table.Th>
                                                Retroactive Days
                                            </Table.Th>
                                            <Table.Th>
                                                Min Warranty Sales
                                            </Table.Th>
                                            <Table.Th>Status</Table.Th>
                                            {hasDeleteAccess && (
                                                <Table.Th>Actions</Table.Th>
                                            )}
                                        </Table.Tr>
                                    </Table.THead>
                                    <Table.TBody>
                                        {shopAssignments.length === 0 ? (
                                            <Table.Tr>
                                                <Table.Td
                                                    colSpan={
                                                        hasDeleteAccess ? 7 : 6
                                                    }
                                                    className="text-center py-8"
                                                >
                                                    No shop assignments found
                                                </Table.Td>
                                            </Table.Tr>
                                        ) : (
                                            shopAssignments.map(
                                                (assignment) => (
                                                    <Table.Tr
                                                        key={
                                                            assignment.assignmentId
                                                        }
                                                    >
                                                        <Table.Td>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar
                                                                    size="sm"
                                                                    shape="circle"
                                                                >
                                                                    {(
                                                                        assignment.shopName ||
                                                                        'S'
                                                                    ).charAt(0)}
                                                                </Avatar>
                                                                <span className="font-medium">
                                                                    {assignment.shopName ||
                                                                        'Unknown Shop'}
                                                                </span>
                                                            </div>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <span className="text-gray-600">
                                                                {formatDateTime(
                                                                    assignment.assignedAt,
                                                                )}
                                                            </span>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <span className="text-gray-600">
                                                                {assignment.assignedByUserName ||
                                                                    'System'}
                                                            </span>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <span className="font-medium">
                                                                {
                                                                    assignment.retroactiveDays
                                                                }{' '}
                                                                days
                                                            </span>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <span className="font-medium">
                                                                $
                                                                {assignment.minWarrantySalesDollars.toFixed(
                                                                    2,
                                                                )}
                                                            </span>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Badge
                                                                className={
                                                                    assignment.isActive
                                                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-200'
                                                                }
                                                            >
                                                                {assignment.isActive
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </Badge>
                                                        </Table.Td>
                                                        {hasDeleteAccess && (
                                                            <Table.Td>
                                                                <Button
                                                                    variant="plain"
                                                                    size="xs"
                                                                    icon={
                                                                        <HiOutlineTrash />
                                                                    }
                                                                    onClick={() =>
                                                                        handleDeleteShopAssignment(
                                                                            assignment.assignmentId,
                                                                        )
                                                                    }
                                                                    className="text-red-600 hover:text-red-800"
                                                                />
                                                            </Table.Td>
                                                        )}
                                                    </Table.Tr>
                                                ),
                                            )
                                        )}
                                    </Table.TBody>
                                </Table>
                            </Card>
                        </Tabs.TabContent>
                    </div>
                </Tabs>
            </Card>
        </div>
    )
}

export default ProgramAssignmentsPage

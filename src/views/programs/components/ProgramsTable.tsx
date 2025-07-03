import React from 'react'
import { Table, Button, Badge, Avatar } from '@/components/ui'
import {
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineUserGroup,
    HiOutlineOfficeBuilding,
    HiOutlineEye,
} from 'react-icons/hi'
import type { Program } from '@/@types/program'
import useAuth from '@/auth/useAuth'

interface ProgramsTableProps {
    programs: Program[]
    loading?: boolean
    onEdit?: (program: Program) => void
    onDelete?: (programId: number) => void
    onAssignCustomers?: (program: Program) => void
    onAssignShops?: (program: Program) => void
    onViewAssignments?: (program: Program) => void
    showCustomerColumn?: boolean
}

const ProgramsTable: React.FC<ProgramsTableProps> = ({
    programs,
    loading = false,
    onEdit,
    onDelete,
    onAssignCustomers,
    onAssignShops,
    onViewAssignments,
    showCustomerColumn = false,
}) => {
    const { user } = useAuth()

    const hasEditAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'program.edit'].includes(role),
    )

    const hasDeleteAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'program.delete'].includes(role),
    )

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString()
    }

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

    return (
        <Table>
            <Table.THead>
                <Table.Tr>
                    <Table.Th>Program Name</Table.Th>
                    <Table.Th>Type</Table.Th>
                    {showCustomerColumn && <Table.Th>Created By</Table.Th>}
                    <Table.Th>Manufacturer</Table.Th>
                    <Table.Th>Contact</Table.Th>
                    <Table.Th>Start Date</Table.Th>
                    <Table.Th>End Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                </Table.Tr>
            </Table.THead>
            <Table.TBody>
                {loading ? (
                    <Table.Tr>
                        <Table.Td
                            colSpan={showCustomerColumn ? 9 : 8}
                            className="text-center py-8"
                        >
                            Loading programs...
                        </Table.Td>
                    </Table.Tr>
                ) : programs.length === 0 ? (
                    <Table.Tr>
                        <Table.Td
                            colSpan={showCustomerColumn ? 9 : 8}
                            className="text-center py-8"
                        >
                            No programs found.
                        </Table.Td>
                    </Table.Tr>
                ) : (
                    programs.map((program) => (
                        <Table.Tr key={program.programId}>
                            <Table.Td>
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {program.name}
                                    </div>
                                    {program.description && (
                                        <div className="text-sm text-gray-500 mt-1">
                                            {program.description}
                                        </div>
                                    )}
                                </div>
                            </Table.Td>
                            <Table.Td>
                                <span className="font-medium">
                                    {program.programTypeName || 'N/A'}
                                </span>
                            </Table.Td>
                            {showCustomerColumn && (
                                <Table.Td>
                                    <div className="flex items-center space-x-2">
                                        <Avatar
                                            size="sm"
                                            className="bg-blue-100 text-blue-600"
                                        >
                                            {program.createdByCustomerName?.charAt(
                                                0,
                                            ) || 'A'}
                                        </Avatar>
                                        <span className="text-sm">
                                            {program.createdByCustomerName ||
                                                'Portal Admin'}
                                        </span>
                                    </div>
                                </Table.Td>
                            )}
                            <Table.Td>
                                <span className="text-sm text-gray-600">
                                    {program.manufacturerName || 'N/A'}
                                </span>
                            </Table.Td>
                            <Table.Td>
                                <div className="text-sm">
                                    {program.contactName && (
                                        <div className="font-medium">
                                            {program.contactName}
                                        </div>
                                    )}
                                    {program.contactPhone && (
                                        <div className="text-gray-500">
                                            {program.contactPhone}
                                        </div>
                                    )}
                                    {!program.contactName &&
                                        !program.contactPhone && (
                                            <span className="text-gray-400">
                                                N/A
                                            </span>
                                        )}
                                </div>
                            </Table.Td>
                            <Table.Td>
                                <span className="text-sm text-gray-600">
                                    {formatDate(program.startDate)}
                                </span>
                            </Table.Td>
                            <Table.Td>
                                <span className="text-sm text-gray-600">
                                    {formatDate(program.endDate)}
                                </span>
                            </Table.Td>
                            <Table.Td>{getStatusBadge(program)}</Table.Td>
                            <Table.Td>
                                <div className="flex items-center space-x-2">
                                    {onViewAssignments && (
                                        <Button
                                            variant="plain"
                                            size="sm"
                                            icon={<HiOutlineEye />}
                                            onClick={() =>
                                                onViewAssignments(program)
                                            }
                                            title="View assignments"
                                        />
                                    )}
                                    {onAssignCustomers && (
                                        <Button
                                            variant="plain"
                                            size="sm"
                                            icon={<HiOutlineUserGroup />}
                                            onClick={() =>
                                                onAssignCustomers(program)
                                            }
                                            title="Assign to customers"
                                        />
                                    )}
                                    {onAssignShops && (
                                        <Button
                                            variant="plain"
                                            size="sm"
                                            icon={<HiOutlineOfficeBuilding />}
                                            onClick={() =>
                                                onAssignShops(program)
                                            }
                                            title="Assign to shops"
                                        />
                                    )}
                                    {hasEditAccess && onEdit && (
                                        <Button
                                            variant="plain"
                                            size="sm"
                                            icon={<HiOutlinePencil />}
                                            onClick={() => onEdit(program)}
                                            title="Edit program"
                                        />
                                    )}
                                    {hasDeleteAccess && onDelete && (
                                        <Button
                                            variant="plain"
                                            size="sm"
                                            color="red"
                                            icon={<HiOutlineTrash />}
                                            onClick={() =>
                                                onDelete(program.programId)
                                            }
                                            title="Delete program"
                                        />
                                    )}
                                </div>
                            </Table.Td>
                        </Table.Tr>
                    ))
                )}
            </Table.TBody>
        </Table>
    )
}

export default ProgramsTable

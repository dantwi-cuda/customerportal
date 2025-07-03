import React, { useRef } from 'react'
import { Table } from '@/components/ui'
import Dropdown from '@/components/ui/Dropdown'
import EllipsisButton from '@/components/shared/EllipsisButton'
import { HiPencil, HiTrash } from 'react-icons/hi'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/shared'
import type { Supplier } from '@/@types/parts'
import type { DropdownRef } from '@/components/ui/Dropdown'
import type { MouseEvent, SyntheticEvent } from 'react'

interface SuppliersTableProps {
    suppliers: Supplier[]
    loading?: boolean
    onEdit: (supplier: Supplier) => void
    onDelete: (supplierId: number) => void
}

const SuppliersTable: React.FC<SuppliersTableProps> = ({
    suppliers,
    loading = false,
    onEdit,
    onDelete,
}) => {
    if (loading) {
        return <Loading loading={true} />
    }

    if (suppliers.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No suppliers found.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <Table.THead>
                    <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Contact Info</Table.Th>
                        <Table.Th>Address</Table.Th>
                        <Table.Th>Website</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.THead>
                <Table.TBody>
                    {suppliers.map((supplier) => (
                        <Table.Tr key={supplier.supplierID}>
                            <Table.Td className="font-medium">
                                {supplier.supplierName}
                            </Table.Td>
                            <Table.Td>{supplier.contactInfo || 'N/A'}</Table.Td>
                            <Table.Td>{supplier.address || 'N/A'}</Table.Td>
                            <Table.Td>
                                {supplier.website ? (
                                    <a
                                        href={supplier.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                        {supplier.website}
                                    </a>
                                ) : (
                                    'N/A'
                                )}
                            </Table.Td>
                            <Table.Td>
                                <Badge
                                    className={
                                        supplier.isActive
                                            ? 'bg-emerald-500'
                                            : 'bg-red-500'
                                    }
                                >
                                    {supplier.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </Table.Td>
                            <Table.Td className="whitespace-nowrap">
                                <SupplierActionsDropdown
                                    supplier={supplier}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.TBody>
            </Table>
        </div>
    )
}

// Supplier Actions Dropdown Component
interface SupplierActionsDropdownProps {
    supplier: Supplier
    onEdit: (supplier: Supplier) => void
    onDelete: (supplierId: number) => void
}

const SupplierActionsDropdown: React.FC<SupplierActionsDropdownProps> = ({
    supplier,
    onEdit,
    onDelete,
}) => {
    const dropdownRef = useRef<DropdownRef>(null)

    const handleDropdownClick = (e: MouseEvent) => {
        e.stopPropagation()
        dropdownRef.current?.handleDropdownOpen()
    }

    const handleDropdownItemClick = (
        e: SyntheticEvent,
        callback?: () => void,
    ) => {
        e.stopPropagation()
        callback?.()
    }

    return (
        <Dropdown
            ref={dropdownRef}
            renderTitle={<EllipsisButton onClick={handleDropdownClick} />}
            placement="bottom-end"
        >
            <Dropdown.Item
                eventKey="edit"
                onClick={(e) =>
                    handleDropdownItemClick(e, () => onEdit(supplier))
                }
            >
                <HiPencil className="text-lg" />
                <span>Edit</span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="delete"
                onClick={(e) =>
                    handleDropdownItemClick(e, () =>
                        onDelete(supplier.supplierID),
                    )
                }
            >
                <HiTrash className="text-lg" />
                <span>Delete</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

export default SuppliersTable

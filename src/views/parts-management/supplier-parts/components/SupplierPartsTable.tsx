import React, { useRef } from 'react'
import { Table } from '@/components/ui'
import Dropdown from '@/components/ui/Dropdown'
import EllipsisButton from '@/components/shared/EllipsisButton'
import { HiPencil, HiTrash } from 'react-icons/hi'
import { Loading } from '@/components/shared'
import type { SupplierPart } from '@/@types/parts'
import type { DropdownRef } from '@/components/ui/Dropdown'
import type { MouseEvent, SyntheticEvent } from 'react'

interface SupplierPartsTableProps {
    supplierParts: SupplierPart[]
    loading?: boolean
    onEdit: (supplierPart: SupplierPart) => void
    onDelete: (supplierPartId: number) => void
}

const SupplierPartsTable: React.FC<SupplierPartsTableProps> = ({
    supplierParts,
    loading = false,
    onEdit,
    onDelete,
}) => {
    if (loading) {
        return <Loading loading={true} />
    }

    if (supplierParts.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No supplier parts found.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <Table.THead>
                    <Table.Tr>
                        <Table.Th>Supplier Part Number</Table.Th>
                        <Table.Th>Description</Table.Th>
                        <Table.Th>Supplier</Table.Th>
                        <Table.Th>Manufacturer</Table.Th>
                        <Table.Th>Brand</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th>Size/Unit</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.THead>
                <Table.TBody>
                    {supplierParts.map((supplierPart) => (
                        <Table.Tr key={supplierPart.partID}>
                            <Table.Td className="font-medium">
                                {supplierPart.supplierPartNumber}
                            </Table.Td>
                            <Table.Td>
                                {supplierPart.description || 'N/A'}
                            </Table.Td>
                            <Table.Td>
                                {supplierPart.supplierName || 'N/A'}
                            </Table.Td>
                            <Table.Td>
                                {supplierPart.manufacturerName || 'N/A'}
                            </Table.Td>
                            <Table.Td>
                                {supplierPart.brandName || 'N/A'}
                            </Table.Td>
                            <Table.Td>
                                {supplierPart.partCategoryName || 'N/A'}
                            </Table.Td>
                            <Table.Td>
                                {supplierPart.sizeUnitOfSale || 'N/A'}
                            </Table.Td>
                            <Table.Td className="whitespace-nowrap">
                                <SupplierPartActionsDropdown
                                    supplierPart={supplierPart}
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

// Supplier Part Actions Dropdown Component
interface SupplierPartActionsDropdownProps {
    supplierPart: SupplierPart
    onEdit: (supplierPart: SupplierPart) => void
    onDelete: (supplierPartId: number) => void
}

const SupplierPartActionsDropdown: React.FC<
    SupplierPartActionsDropdownProps
> = ({ supplierPart, onEdit, onDelete }) => {
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
                    handleDropdownItemClick(e, () => onEdit(supplierPart))
                }
            >
                <HiPencil className="text-lg" />
                <span>Edit</span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="delete"
                onClick={(e) =>
                    handleDropdownItemClick(e, () =>
                        onDelete(supplierPart.partID),
                    )
                }
            >
                <HiTrash className="text-lg" />
                <span>Delete</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

export default SupplierPartsTable

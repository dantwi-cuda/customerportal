import React, { useRef } from 'react'
import { Table } from '@/components/ui'
import Dropdown from '@/components/ui/Dropdown'
import EllipsisButton from '@/components/shared/EllipsisButton'
import { HiPencil, HiTrash } from 'react-icons/hi'
import { Loading } from '@/components/shared'
import type { MasterPart } from '@/@types/parts'
import type { DropdownRef } from '@/components/ui/Dropdown'
import type { MouseEvent, SyntheticEvent } from 'react'

interface MasterPartsTableProps {
    masterParts: MasterPart[]
    loading?: boolean
    onEdit: (masterPart: MasterPart) => void
    onDelete: (masterPartId: number) => void
}

const MasterPartsTable: React.FC<MasterPartsTableProps> = ({
    masterParts,
    loading = false,
    onEdit,
    onDelete,
}) => {
    if (loading) {
        return <Loading loading={true} />
    }

    if (masterParts.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No master parts found.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <Table.THead>
                    <Table.Tr>
                        <Table.Th>Part Number</Table.Th>
                        <Table.Th>Unique Code</Table.Th>
                        <Table.Th>Description</Table.Th>
                        <Table.Th>Manufacturer</Table.Th>
                        <Table.Th>Brand</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th>Size/Unit</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.THead>
                <Table.TBody>
                    {masterParts.map((masterPart) => (
                        <Table.Tr key={masterPart.partID}>
                            <Table.Td className="font-medium">
                                {masterPart.partNumber}
                            </Table.Td>
                            <Table.Td>{masterPart.uniqueCode}</Table.Td>
                            <Table.Td>
                                {masterPart.description || 'N/A'}
                            </Table.Td>
                            <Table.Td>
                                {masterPart.manufacturerName || 'N/A'}
                            </Table.Td>
                            <Table.Td>{masterPart.brandName || 'N/A'}</Table.Td>
                            <Table.Td>
                                {masterPart.partCategoryName || 'N/A'}
                            </Table.Td>
                            <Table.Td>
                                {masterPart.sizeUnitOfSale || 'N/A'}
                            </Table.Td>
                            <Table.Td className="whitespace-nowrap">
                                <MasterPartActionsDropdown
                                    masterPart={masterPart}
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

// Master Part Actions Dropdown Component
interface MasterPartActionsDropdownProps {
    masterPart: MasterPart
    onEdit: (masterPart: MasterPart) => void
    onDelete: (masterPartId: number) => void
}

const MasterPartActionsDropdown: React.FC<MasterPartActionsDropdownProps> = ({
    masterPart,
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
                    handleDropdownItemClick(e, () => onEdit(masterPart))
                }
            >
                <HiPencil className="text-lg" />
                <span>Edit</span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="delete"
                onClick={(e) =>
                    handleDropdownItemClick(e, () =>
                        onDelete(masterPart.partID),
                    )
                }
            >
                <HiTrash className="text-lg" />
                <span>Delete</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

export default MasterPartsTable

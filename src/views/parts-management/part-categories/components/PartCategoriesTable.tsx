import React, { useRef } from 'react'
import { Table } from '@/components/ui'
import Dropdown from '@/components/ui/Dropdown'
import EllipsisButton from '@/components/shared/EllipsisButton'
import { HiPencil, HiTrash } from 'react-icons/hi'
import { Loading } from '@/components/shared'
import type { PartCategory } from '@/@types/parts'
import type { DropdownRef } from '@/components/ui/Dropdown'
import type { MouseEvent, SyntheticEvent } from 'react'

interface PartCategoriesTableProps {
    partCategories: PartCategory[]
    loading?: boolean
    onEdit: (partCategory: PartCategory) => void
    onDelete: (partCategoryId: number) => void
}

const PartCategoriesTable: React.FC<PartCategoriesTableProps> = ({
    partCategories,
    loading = false,
    onEdit,
    onDelete,
}) => {
    if (loading) {
        return <Loading loading={true} />
    }

    if (partCategories.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No part categories found.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <Table.THead>
                    <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Category Name</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.THead>
                <Table.TBody>
                    {partCategories.map((partCategory) => (
                        <Table.Tr key={partCategory.partCategoryID}>
                            <Table.Td>{partCategory.partCategoryID}</Table.Td>
                            <Table.Td className="font-medium">
                                {partCategory.partCategoryName}
                            </Table.Td>
                            <Table.Td className="whitespace-nowrap">
                                <PartCategoryActionsDropdown
                                    partCategory={partCategory}
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

// Part Category Actions Dropdown Component
interface PartCategoryActionsDropdownProps {
    partCategory: PartCategory
    onEdit: (partCategory: PartCategory) => void
    onDelete: (partCategoryId: number) => void
}

const PartCategoryActionsDropdown: React.FC<
    PartCategoryActionsDropdownProps
> = ({ partCategory, onEdit, onDelete }) => {
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
                    handleDropdownItemClick(e, () => onEdit(partCategory))
                }
            >
                <HiPencil className="text-lg" />
                <span>Edit</span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="delete"
                onClick={(e) =>
                    handleDropdownItemClick(e, () =>
                        onDelete(partCategory.partCategoryID),
                    )
                }
            >
                <HiTrash className="text-lg" />
                <span>Delete</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

export default PartCategoriesTable

import React, { useRef } from 'react'
import { Table } from '@/components/ui'
import Dropdown from '@/components/ui/Dropdown'
import Tag from '@/components/ui/Tag'
import EllipsisButton from '@/components/shared/EllipsisButton'
import { HiPencil, HiTrash } from 'react-icons/hi'
import { Loading } from '@/components/shared'
import type { Manufacturer } from '@/@types/parts'
import type { DropdownRef } from '@/components/ui/Dropdown'
import type { MouseEvent, SyntheticEvent } from 'react'
import classNames from '@/utils/classNames'

interface ManufacturersTableProps {
    manufacturers: Manufacturer[]
    loading?: boolean
    onEdit: (manufacturer: Manufacturer) => void
    onDelete: (manufacturerId: number) => void
}

const manufacturerStatus: Record<string, { label: string; className: string }> =
    {
        active: { label: 'Active', className: 'bg-emerald-200' },
        inactive: { label: 'Inactive', className: 'bg-red-200' },
    }

const ManufacturersTable: React.FC<ManufacturersTableProps> = ({
    manufacturers,
    loading = false,
    onEdit,
    onDelete,
}) => {
    if (loading) {
        return <Loading loading={true} />
    }

    if (manufacturers.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No manufacturers found.</p>
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
                    {manufacturers.map((manufacturer) => (
                        <Table.Tr key={manufacturer.manufacturerID}>
                            <Table.Td className="font-medium">
                                {manufacturer.manufacturerName}
                            </Table.Td>
                            <Table.Td>
                                {manufacturer.contactInfo || 'N/A'}
                            </Table.Td>
                            <Table.Td>{manufacturer.address || 'N/A'}</Table.Td>
                            <Table.Td>
                                {manufacturer.website ? (
                                    <a
                                        href={manufacturer.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                        {manufacturer.website}
                                    </a>
                                ) : (
                                    'N/A'
                                )}
                            </Table.Td>
                            <Table.Td>
                                <Tag
                                    className={classNames(
                                        manufacturer.isActive
                                            ? manufacturerStatus.active
                                                  .className
                                            : manufacturerStatus.inactive
                                                  .className,
                                    )}
                                >
                                    {manufacturer.isActive
                                        ? manufacturerStatus.active.label
                                        : manufacturerStatus.inactive.label}
                                </Tag>
                            </Table.Td>
                            <Table.Td className="whitespace-nowrap">
                                <ManufacturerActionsDropdown
                                    manufacturer={manufacturer}
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

// Manufacturer Actions Dropdown Component
interface ManufacturerActionsDropdownProps {
    manufacturer: Manufacturer
    onEdit: (manufacturer: Manufacturer) => void
    onDelete: (manufacturerId: number) => void
}

const ManufacturerActionsDropdown: React.FC<
    ManufacturerActionsDropdownProps
> = ({ manufacturer, onEdit, onDelete }) => {
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
                    handleDropdownItemClick(e, () => onEdit(manufacturer))
                }
            >
                <HiPencil className="text-lg" />
                <span>Edit</span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="delete"
                onClick={(e) =>
                    handleDropdownItemClick(e, () =>
                        onDelete(manufacturer.manufacturerID),
                    )
                }
            >
                <HiTrash className="text-lg" />
                <span>Delete</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

export default ManufacturersTable

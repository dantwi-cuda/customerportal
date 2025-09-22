import React, { useRef } from 'react'
import { Table } from '@/components/ui'
import Dropdown from '@/components/ui/Dropdown'
import Tag from '@/components/ui/Tag'
import EllipsisButton from '@/components/shared/EllipsisButton'
import { HiPencil, HiTrash } from 'react-icons/hi'
import { Loading } from '@/components/shared'
import type { Brand } from '@/@types/parts'
import type { DropdownRef } from '@/components/ui/Dropdown'
import type { MouseEvent, SyntheticEvent } from 'react'
import classNames from '@/utils/classNames'

interface BrandsTableProps {
    brands: Brand[]
    loading?: boolean
    onEdit: (brand: Brand) => void
    onDelete: (brandId: number) => void
}

const brandStatus: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-emerald-200' },
    inactive: { label: 'Inactive', className: 'bg-red-200' },
}

const BrandsTable: React.FC<BrandsTableProps> = ({
    brands,
    loading = false,
    onEdit,
    onDelete,
}) => {
    if (loading) {
        return <Loading loading={true} />
    }

    if (brands.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No brands found.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <Table.THead>
                    <Table.Tr>
                        <Table.Th>Brand Name</Table.Th>
                        <Table.Th>Description</Table.Th>
                        <Table.Th>Manufacturer</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.THead>
                <Table.TBody>
                    {brands.map((brand) => (
                        <Table.Tr key={brand.brandID}>
                            <Table.Td className="font-medium">
                                {brand.brandName}
                            </Table.Td>
                            <Table.Td>{brand.description || 'N/A'}</Table.Td>
                            <Table.Td>
                                {brand.manufacturerName || 'N/A'}
                            </Table.Td>
                            <Table.Td>
                                <Tag
                                    className={classNames(
                                        brand.isActive
                                            ? brandStatus.active.className
                                            : brandStatus.inactive.className,
                                    )}
                                >
                                    {brand.isActive
                                        ? brandStatus.active.label
                                        : brandStatus.inactive.label}
                                </Tag>
                            </Table.Td>
                            <Table.Td className="whitespace-nowrap">
                                <BrandActionsDropdown
                                    brand={brand}
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

// Brand Actions Dropdown Component
interface BrandActionsDropdownProps {
    brand: Brand
    onEdit: (brand: Brand) => void
    onDelete: (brandId: number) => void
}

const BrandActionsDropdown: React.FC<BrandActionsDropdownProps> = ({
    brand,
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
                onClick={(e) => handleDropdownItemClick(e, () => onEdit(brand))}
            >
                <HiPencil className="text-lg" />
                <span>Edit</span>
            </Dropdown.Item>
            <Dropdown.Item
                eventKey="delete"
                onClick={(e) =>
                    handleDropdownItemClick(e, () => onDelete(brand.brandID))
                }
            >
                <HiTrash className="text-lg" />
                <span>Delete</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

export default BrandsTable

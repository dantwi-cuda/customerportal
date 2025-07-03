import React from 'react'
import { Table, Button } from '@/components/ui'
import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'
import { RoleDto } from '@/@types/role' // Assuming RoleDto exists

const { Tr, Th, Td, THead, TBody } = Table

interface TenantRolesTableProps {
    roles: RoleDto[]
    onEdit: (role: RoleDto) => void
    onDelete: (roleId: string) => void
}

const TenantRolesTable: React.FC<TenantRolesTableProps> = ({
    roles,
    onEdit,
    onDelete,
}) => {
    return (
        <Table>
            <THead>
                <Tr>
                    <Th>Role Name</Th>
                    <Th>Description</Th>
                    <Th>Actions</Th>
                </Tr>
            </THead>
            <TBody>
                {roles.length === 0 && (
                    <Tr>
                        <Td colSpan={3} className="text-center">
                            No roles found.
                        </Td>
                    </Tr>
                )}
                {roles.map((role) => (
                    <Tr key={role.id}>
                        <Td>{role.name}</Td>
                        <Td>{role.description || '-'}</Td>
                        <Td>
                            <Button
                                shape="circle"
                                size="sm"
                                variant="plain"
                                icon={<HiOutlinePencil />}
                                onClick={() => onEdit(role)}
                                className="mr-2"
                                aria-label="Edit Role"
                            />
                            <Button
                                shape="circle"
                                size="sm"
                                variant="plain"
                                icon={<HiOutlineTrash />}
                                onClick={() => onDelete(role.id)}
                                aria-label="Delete Role"
                            />
                        </Td>
                    </Tr>
                ))}
            </TBody>
        </Table>
    )
}

export default TenantRolesTable

import React, { useRef } from 'react'
import { Table } from '@/components/ui'
import Dropdown from '@/components/ui/Dropdown'
import Tag from '@/components/ui/Tag'
import EllipsisButton from '@/components/shared/EllipsisButton'
import {
    HiPencil,
    HiTrash,
    HiOfficeBuilding,
    HiDocumentReport,
} from 'react-icons/hi'
import { UserDto } from '@/@types/user'
import { Loading } from '@/components/shared'
import type { DropdownRef } from '@/components/ui/Dropdown'
import type { MouseEvent, SyntheticEvent } from 'react'
import classNames from '@/utils/classNames'

interface TenantUsersTableProps {
    users: UserDto[]
    onEdit: (user: UserDto) => void
    onDelete: (userId: string) => void
    onAssignShops?: (user: UserDto) => void
    onAssignReports?: (user: UserDto) => void
    // onStatusChange: (userId: string, newStatus: string) => void; // Future enhancement
}

const userStatus: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-emerald-200' },
    inactive: { label: 'Inactive', className: 'bg-red-200' },
    pending: { label: 'Pending', className: 'bg-amber-200' },
    default: { label: 'Unknown', className: 'bg-gray-200' },
}

const TenantUsersTable: React.FC<TenantUsersTableProps> = ({
    users,
    onEdit,
    onDelete,
    onAssignShops,
    onAssignReports,
}) => {
    if (!users) {
        return <Loading loading={true} /> // Or some other loading indicator
    }

    if (users.length === 0) {
        return <p>No users found for this tenant.</p>
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <Table.THead>
                    <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Roles</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Last Login</Table.Th>
                        <Table.Th>Created At</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.THead>
                <Table.TBody>
                    {users.map((user) => (
                        <Table.Tr key={user.id}>
                            <Table.Td>{user.name || 'N/A'}</Table.Td>
                            <Table.Td>{user.email || 'N/A'}</Table.Td>
                            <Table.Td>
                                {user.roles?.join(', ') || 'No roles assigned'}
                            </Table.Td>
                            <Table.Td>
                                <Tag
                                    className={classNames(
                                        userStatus[
                                            user.status?.toLowerCase() ||
                                                'default'
                                        ]?.className ||
                                            userStatus.default.className,
                                    )}
                                >
                                    {userStatus[
                                        user.status?.toLowerCase() || 'default'
                                    ]?.label || userStatus.default.label}
                                </Tag>
                            </Table.Td>
                            <Table.Td>
                                {user.lastLoginAt
                                    ? new Date(
                                          user.lastLoginAt,
                                      ).toLocaleDateString()
                                    : 'N/A'}
                            </Table.Td>
                            <Table.Td>
                                {user.createdAt
                                    ? new Date(
                                          user.createdAt,
                                      ).toLocaleDateString()
                                    : 'N/A'}
                            </Table.Td>
                            <Table.Td className="whitespace-nowrap">
                                <UserActionsDropdown
                                    user={user}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onAssignShops={onAssignShops}
                                    onAssignReports={onAssignReports}
                                />
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.TBody>
            </Table>
        </div>
    )
}

// User Actions Dropdown Component
interface UserActionsDropdownProps {
    user: UserDto
    onEdit: (user: UserDto) => void
    onDelete: (userId: string) => void
    onAssignShops?: (user: UserDto) => void
    onAssignReports?: (user: UserDto) => void
}

const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({
    user,
    onEdit,
    onDelete,
    onAssignShops,
    onAssignReports,
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
                onClick={(e) => handleDropdownItemClick(e, () => onEdit(user))}
            >
                <HiPencil className="text-lg" />
                <span>Edit</span>
            </Dropdown.Item>
            {onAssignShops && (
                <Dropdown.Item
                    eventKey="assign-shops"
                    onClick={(e) =>
                        handleDropdownItemClick(e, () => onAssignShops(user))
                    }
                >
                    <HiOfficeBuilding className="text-lg" />
                    <span>Assign Shops</span>
                </Dropdown.Item>
            )}
            {onAssignReports && (
                <Dropdown.Item
                    eventKey="assign-reports"
                    onClick={(e) =>
                        handleDropdownItemClick(e, () => onAssignReports(user))
                    }
                >
                    <HiDocumentReport className="text-lg" />
                    <span>Assign Reports</span>
                </Dropdown.Item>
            )}
            <Dropdown.Item
                eventKey="delete"
                onClick={(e) =>
                    handleDropdownItemClick(e, () => onDelete(user.id!))
                }
            >
                <HiTrash className="text-lg" />
                <span>Delete</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

export default TenantUsersTable

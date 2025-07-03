import React from 'react'
import { Table, Button, Dropdown } from '@/components/ui'
import { HiOutlinePencil, HiOutlineTrash, HiDotsVertical } from 'react-icons/hi'
import { Workspace } from '@/@types/workspace' // Assuming this exists

const { Tr, Th, Td, THead, TBody } = Table

interface WorkspacesTableProps {
    workspaces: Workspace[]
    onEdit: (workspaceId: string) => void
    onDelete: (workspaceId: string) => void
    // TODO: Add props for assignment actions/viewing later
}

const WorkspacesTable: React.FC<WorkspacesTableProps> = ({
    workspaces,
    onEdit,
    onDelete,
}) => {
    const columns = [
        { Header: 'Name', accessor: 'name' },
        { Header: 'Description', accessor: 'description' },
        { Header: 'Is Active', accessor: 'isActive' },
        { Header: 'Is Validated', accessor: 'isValidated' },
        {
            Header: 'Created At',
            accessor: 'createdAt',
            Cell: ({ value }: { value: string }) =>
                new Date(value).toLocaleDateString(),
        },
        {
            Header: 'Updated At',
            accessor: 'updatedAt',
            Cell: ({ value }: { value: string }) =>
                new Date(value).toLocaleDateString(),
        },
        { Header: 'Actions', accessor: 'actions' },
    ]

    return (
        <Table>
            <THead>
                <Tr>
                    {columns.map((column) => (
                        <Th key={column.Header}>{column.Header}</Th>
                    ))}
                </Tr>
            </THead>
            <TBody>
                {workspaces.length === 0 ? (
                    <Tr>
                        <Td colSpan={columns.length} className="text-center">
                            No workspaces found.
                        </Td>
                    </Tr>
                ) : (
                    workspaces.map((workspace) => (
                        <Tr key={workspace.id}>
                            <Td>{workspace.name}</Td>
                            <Td>{workspace.description || '-'}</Td>
                            <Td>{workspace.isActive ? 'Yes' : 'No'}</Td>
                            <Td>{workspace.isValidated ? 'Yes' : 'No'}</Td>
                            <Td>
                                {workspace.createdAt
                                    ? new Date(
                                          workspace.createdAt,
                                      ).toLocaleDateString()
                                    : '-'}
                            </Td>
                            <Td>
                                {workspace.updatedAt
                                    ? new Date(
                                          workspace.updatedAt,
                                      ).toLocaleDateString()
                                    : '-'}
                            </Td>
                            <Td>
                                <Dropdown
                                    placement="bottom-end"
                                    renderTitle={
                                        <Button
                                            shape="circle"
                                            variant="plain"
                                            icon={<HiDotsVertical />}
                                        />
                                    }
                                >
                                    <Dropdown.Item
                                        eventKey="edit"
                                        onClick={() => onEdit(workspace.id)}
                                    >
                                        <div className="flex items-center">
                                            <HiOutlinePencil className="mr-2" />
                                            <span>Edit</span>
                                        </div>
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        eventKey="delete"
                                        onClick={() => onDelete(workspace.id)}
                                    >
                                        <div className="flex items-center">
                                            <HiOutlineTrash className="mr-2" />
                                            <span>Delete</span>
                                        </div>
                                    </Dropdown.Item>
                                    {/* TODO: Add "Manage Assignments" or similar later */}
                                </Dropdown>
                            </Td>
                        </Tr>
                    ))
                )}
            </TBody>
        </Table>
    )
}

export default WorkspacesTable

import React, { useState, useEffect, useMemo } from 'react'
import { HiOutlinePlusCircle, HiOutlineLink } from 'react-icons/hi'
import {
    Button,
    Card,
    Input,
    Notification,
    Pagination,
    Select,
    Spinner,
    toast,
} from '@/components/ui'
import WorkspacesTable from './WorkspacesTable' // Assuming this will be created
import WorkspaceService from '@/services/WorkspaceService' // Assuming this exists
import { Workspace } from '@/@types/workspace' // Assuming this exists
import { useNavigate } from 'react-router-dom'
import useDebounce from '@/utils/hooks/useDebounce' // Assuming a debounce hook

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [
    { value: 5, label: '5 / page' },
    { value: 10, label: '10 / page' },
    { value: 20, label: '20 / page' },
    { value: 50, label: '50 / page' },
]

const WorkspaceManagementPage = () => {
    const navigate = useNavigate()
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('') // Changed how debouncedSearchTerm is managed
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalWorkspaces, setTotalWorkspaces] = useState(0)

    // const debouncedSearchTerm = useDebounce(searchTerm, 300) // Removed incorrect usage

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 300)

        return () => {
            clearTimeout(handler)
        }
    }, [searchTerm])

    const fetchWorkspaces = async () => {
        setLoading(true)
        try {
            // TODO: Adjust WorkspaceService.getWorkspaces to support pagination and search if backend supports it
            // For now, fetching all and filtering client-side
            const fetchedWorkspaces = await WorkspaceService.getWorkspaces()
            if (fetchedWorkspaces) {
                setWorkspaces(fetchedWorkspaces)
                setTotalWorkspaces(fetchedWorkspaces.length) // Update based on actual data length
            } else {
                toast.push(
                    <Notification
                        title="Error fetching workspaces"
                        type="danger"
                    >
                        {'Could not retrieve workspaces.'}
                    </Notification>,
                )
                setWorkspaces([])
                setTotalWorkspaces(0)
            }
        } catch (error: any) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error.message || 'An unexpected error occurred.'}
                </Notification>,
            )
            setWorkspaces([])
            setTotalWorkspaces(0)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchWorkspaces()
    }, [])

    const filteredWorkspaces = useMemo(() => {
        if (!debouncedSearchTerm) {
            return workspaces
        }
        return workspaces.filter(
            (ws) =>
                ws.name
                    .toLowerCase()
                    .includes(debouncedSearchTerm.toLowerCase()) ||
                (ws.description &&
                    ws.description
                        .toLowerCase()
                        .includes(debouncedSearchTerm.toLowerCase())),
        )
    }, [workspaces, debouncedSearchTerm])

    useEffect(() => {
        setTotalWorkspaces(filteredWorkspaces.length)
        setCurrentPage(1) // Reset to first page on search
    }, [filteredWorkspaces])

    const paginatedWorkspaces = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return filteredWorkspaces.slice(start, end)
    }, [filteredWorkspaces, currentPage, pageSize])

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handlePageSizeChange = (selectedOption: any) => {
        setPageSize(selectedOption.value)
        setCurrentPage(1) // Reset to first page
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    }

    const handleAddWorkspace = () => {
        navigate('/tenantportal/workspaces/create') // Or your designated create route
    }

    const handleManageAssignments = () => {
        navigate('/tenantportal/workspaces/assignments')
    }

    // Placeholder for delete and edit handlers, to be passed to WorkspacesTable
    const handleDeleteWorkspace = async (workspaceId: string) => {
        setLoading(true)
        try {
            await WorkspaceService.deleteWorkspace(workspaceId)
            toast.push(
                <Notification title="Workspace Deleted" type="success">
                    Workspace successfully deleted.
                </Notification>,
            )
            fetchWorkspaces() // Refresh list
        } catch (error: any) {
            toast.push(
                <Notification title="Error Deleting Workspace" type="danger">
                    {error.message || 'Failed to delete workspace.'}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleEditWorkspace = (workspaceId: string) => {
        navigate(`/tenantportal/workspaces/edit/${workspaceId}`) // Or your designated edit route
    }

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2>Workspace Management</h2>
                <div className="space-x-2">
                    <Button
                        variant="default"
                        color="blue-600"
                        icon={<HiOutlineLink />}
                        onClick={handleManageAssignments}
                    >
                        Manage Assignments
                    </Button>
                    <Button
                        variant="solid"
                        color="blue-600"
                        icon={<HiOutlinePlusCircle />}
                        onClick={handleAddWorkspace}
                    >
                        Add Workspace
                    </Button>
                </div>
            </div>
            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Search workspaces..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>
            {loading ? (
                <div className="flex justify-center">
                    <Spinner size="large" />
                </div>
            ) : (
                <>
                    <WorkspacesTable
                        workspaces={paginatedWorkspaces}
                        onEdit={handleEditWorkspace}
                        onDelete={handleDeleteWorkspace}
                        // TODO: Add props for assignment viewing/management later
                    />
                    <div className="flex justify-between items-center mt-4">
                        <Pagination
                            currentPage={currentPage}
                            pageSize={pageSize}
                            total={totalWorkspaces}
                            onChange={handlePageChange}
                        />
                        <div style={{ minWidth: 120 }}>
                            <Select
                                size="sm"
                                options={PAGE_SIZE_OPTIONS}
                                value={PAGE_SIZE_OPTIONS.find(
                                    (option) => option.value === pageSize,
                                )}
                                onChange={handlePageSizeChange}
                            />
                        </div>
                    </div>
                </>
            )}
        </Card>
    )
}

export default WorkspaceManagementPage

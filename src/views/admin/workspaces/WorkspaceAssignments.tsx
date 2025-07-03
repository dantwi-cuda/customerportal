import React, { useState, useEffect } from 'react'
import {
    Card,
    Table,
    Button,
    Input,
    Select,
    Spinner,
    Alert,
    Notification,
    toast,
    Pagination,
    Badge,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiPlus,
    HiTrash,
    HiInformationCircle,
} from 'react-icons/hi'
import WorkspaceService from '@/services/WorkspaceService'
import * as CustomerService from '@/services/CustomerService' // Changed import
import { WorkspaceCustomerAssignment, Workspace } from '@/@types/workspace'
import { CustomerDetailsResponse } from '@/@types/customer'
import { useNavigate } from 'react-router-dom'

const { Tr, Th, Td, THead, TBody } = Table

const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [
    { value: 5, label: '5 / page' },
    { value: 10, label: '10 / page' },
    { value: 20, label: '20 / page' },
    { value: 50, label: '50 / page' },
]

const WorkspaceAssignments: React.FC = () => {
    const navigate = useNavigate()
    const [assignments, setAssignments] = useState<
        WorkspaceCustomerAssignment[]
    >([])
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [customers, setCustomers] = useState<CustomerDetailsResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>('')
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
    const [isAssigning, setIsAssigning] = useState(false)

    // Fetch all assignments
    const fetchAssignments = async () => {
        setLoading(true)
        try {
            const data =
                await WorkspaceService.getAllWorkspaceCustomerAssignments()
            setAssignments(data)
        } catch (error: any) {
            setError(error.message || 'Error loading workspace assignments')
            toast.push(
                <Notification title="Error" type="danger">
                    {error.message || 'Error loading workspace assignments'}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    // Fetch workspaces and customers for the dropdowns
    const fetchData = async () => {
        try {
            const [fetchedWorkspaces, fetchedCustomers] = await Promise.all([
                WorkspaceService.getWorkspaces(),
                CustomerService.getCustomers(),
            ])
            setWorkspaces(fetchedWorkspaces)
            setCustomers(fetchedCustomers)
        } catch (error: any) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error.message ||
                        'Error loading data for assignment options'}
                </Notification>,
            )
        }
    }

    useEffect(() => {
        fetchAssignments()
        fetchData()
    }, [])

    // Filter assignments by search term
    const filteredAssignments = assignments.filter(
        (assignment) =>
            assignment.workspaceName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            assignment.customerName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    )

    // Paginate assignments
    const paginatedAssignments = filteredAssignments.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    )

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handlePageSizeChange = (option: any) => {
        setPageSize(option.value)
        setCurrentPage(1)
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1)
    }

    const handleWorkspaceChange = (option: any) => {
        setSelectedWorkspace(option.value)
    }

    const handleCustomersChange = (options: any) => {
        setSelectedCustomers(options?.map((option: any) => option.value) || [])
    }

    // Assign workspace to multiple customers
    const handleAssign = async () => {
        if (!selectedWorkspace || selectedCustomers.length === 0) {
            toast.push(
                <Notification title="Error" type="danger">
                    Please select a workspace and at least one customer
                </Notification>,
            )
            return
        }

        setIsAssigning(true)
        try {
            const workspaceName = getWorkspaceName(selectedWorkspace)
            await WorkspaceService.assignWorkspaceToMultipleCustomers(
                selectedWorkspace,
                selectedCustomers,
                workspaceName,
            )

            toast.push(
                <Notification title="Success" type="success">
                    Workspace assigned to {selectedCustomers.length} customer
                    {selectedCustomers.length > 1 ? 's' : ''} successfully
                </Notification>,
            )
            fetchAssignments() // Refresh the list
            setSelectedWorkspace('')
            setSelectedCustomers([])
        } catch (error: any) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error.message || 'Failed to assign workspace to customers'}
                </Notification>,
            )
        } finally {
            setIsAssigning(false)
        }
    }

    // Remove assignment
    const handleRemove = async (workspaceId: string, customerId: string) => {
        try {
            await WorkspaceService.unassignWorkspaceFromCustomer(
                workspaceId,
                customerId,
            )
            toast.push(
                <Notification title="Success" type="success">
                    Workspace unassigned from customer successfully
                </Notification>,
            )
            fetchAssignments() // Refresh the list
        } catch (error: any) {
            toast.push(
                <Notification title="Error" type="danger">
                    {error.message ||
                        'Failed to unassign workspace from customer'}
                </Notification>,
            )
        }
    }

    const workspaceOptions = workspaces.map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
    }))

    const customerOptions = customers.map((customer) => ({
        value: customer.id,
        label: customer.name,
    }))

    // Get workspace name by ID
    const getWorkspaceName = (workspaceId: string): string => {
        const workspace = workspaces.find((ws) => ws.id === workspaceId)
        return workspace?.name || 'Unknown'
    }

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h4>Workspace Assignments</h4>
                </div>

                {/* Assignment Form */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
                    <div className="flex items-center mb-2">
                        <HiInformationCircle className="text-blue-600 mr-2" />
                        <h5>Assign a Workspace to Customers</h5>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label
                                htmlFor="workspace-select"
                                className="block text-sm font-medium mb-1"
                            >
                                Select a Workspace
                            </label>
                            <Select
                                id="workspace-select"
                                placeholder="Select Workspace"
                                options={workspaceOptions}
                                value={workspaceOptions.find(
                                    (option) =>
                                        option.value === selectedWorkspace,
                                )}
                                onChange={handleWorkspaceChange}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="customer-select"
                                className="block text-sm font-medium mb-1"
                            >
                                Select Customers
                                {selectedCustomers.length > 0 && (
                                    <Badge className="ml-2 bg-blue-500">
                                        {selectedCustomers.length} selected
                                    </Badge>
                                )}
                            </label>
                            <Select
                                id="customer-select"
                                placeholder="Select Customers"
                                options={customerOptions}
                                isMulti
                                value={customerOptions.filter((option) =>
                                    selectedCustomers.includes(
                                        option.value || '',
                                    ),
                                )}
                                onChange={handleCustomersChange}
                            />
                        </div>
                    </div>

                    {selectedWorkspace && selectedCustomers.length > 0 && (
                        <div className="bg-blue-50 dark:bg-gray-800 p-3 rounded mb-4 text-sm">
                            <p className="font-medium">
                                Assigning workspace:{' '}
                                <span className="text-blue-600">
                                    {getWorkspaceName(selectedWorkspace)}
                                </span>
                            </p>
                            <p>
                                To {selectedCustomers.length} customer
                                {selectedCustomers.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            variant="solid"
                            color="blue-600"
                            icon={<HiPlus />}
                            onClick={handleAssign}
                            loading={isAssigning}
                            disabled={
                                isAssigning ||
                                !selectedWorkspace ||
                                selectedCustomers.length === 0
                            }
                        >
                            Assign Workspace to Customers
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <Input
                        prefix={<HiOutlineSearch className="text-lg" />}
                        placeholder="Search assignments by workspace or customer name..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>

                {error && (
                    <Alert type="danger" showIcon className="mb-4">
                        {error}
                    </Alert>
                )}

                {/* Assignments Table */}
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Spinner size={40} />
                    </div>
                ) : (
                    <>
                        <Table>
                            <THead>
                                <Tr>
                                    <Th>Workspace</Th>
                                    <Th>Customer</Th>
                                    <Th>Assigned At</Th>
                                    <Th>Actions</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {paginatedAssignments.length === 0 ? (
                                    <Tr>
                                        <Td colSpan={4} className="text-center">
                                            No assignments found
                                        </Td>
                                    </Tr>
                                ) : (
                                    paginatedAssignments.map(
                                        (assignment, index) => (
                                            <Tr
                                                key={`${assignment.workspaceId}-${assignment.customerId}-${index}`}
                                            >
                                                <Td>
                                                    {assignment.workspaceName}
                                                </Td>
                                                <Td>
                                                    {assignment.customerName}
                                                </Td>
                                                <Td>
                                                    {new Date(
                                                        assignment.assignedAt,
                                                    ).toLocaleString()}
                                                </Td>
                                                <Td>
                                                    <Button
                                                        variant="plain"
                                                        size="sm"
                                                        icon={<HiTrash />}
                                                        onClick={() =>
                                                            handleRemove(
                                                                assignment.workspaceId,
                                                                assignment.customerId,
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </Button>
                                                </Td>
                                            </Tr>
                                        ),
                                    )
                                )}
                            </TBody>
                        </Table>
                        <div className="flex justify-between items-center mt-4">
                            <Pagination
                                currentPage={currentPage}
                                pageSize={pageSize}
                                total={filteredAssignments.length}
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
        </div>
    )
}

export default WorkspaceAssignments

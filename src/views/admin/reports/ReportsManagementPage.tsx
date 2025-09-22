import React, { useState, useEffect, useCallback } from 'react'
import {
    Card,
    Input,
    Button,
    Tag,
    Dropdown,
    Menu,
    Dialog,
    Notification,
    toast,
    Pagination,
    Select,
    FormContainer,
    FormItem,
    Checkbox,
} from '@/components/ui'
import Table from '@/components/ui/Table'
import {
    HiOutlineSearch,
    HiOutlinePencilAlt,
    HiOutlineTrash,
    HiOutlineDotsVertical,
    HiOutlinePlus,
    HiOutlineEye,
    HiOutlineCheck,
    HiOutlineX,
    HiOutlineDocumentDuplicate,
    HiOutlineUser,
    HiOutlineUserGroup,
    HiOutlineClipboardList,
    HiOutlineExclamation,
    HiOutlineAdjustments,
} from 'react-icons/hi'
import * as ReportService from '@/services/ReportService'
import RoleService from '@/services/RoleService'
import UserService from '@/services/UserService'
import { useNavigate } from 'react-router-dom'
import type { Report, ReportCategory, ReportWorkspace } from '@/@types/report'
import type { RoleDto } from '@/@types/role'
import type { UserDto } from '@/@types/user'
import useAuth from '@/auth/useAuth'
import { ADMIN } from '@/constants/roles.constant'

// Simple Space component
const Space = ({ children }: { children: React.ReactNode }) => {
    return <div className="flex items-center gap-2">{children}</div>
}

interface ReportFormData {
    name: string
    description: string
    reportCategoryId: number | undefined
}

interface BulkActionState {
    selectedReportIds: string[]
    action:
        | 'approve'
        | 'enable'
        | 'disable'
        | 'change-category'
        | 'assign-roles'
        | 'assign-users'
        | null
    categoryId: number | null
}

const ReportsPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [categories, setCategories] = useState<ReportCategory[]>([])
    const [workspaces, setWorkspaces] = useState<ReportWorkspace[]>([])

    // Filters
    const [categoryFilter, setCategoryFilter] = useState<number | null>(null)
    const [workspaceFilter, setWorkspaceFilter] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [approvedFilter, setApprovedFilter] = useState<boolean | null>(null) // Edit report
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [reportToEdit, setReportToEdit] = useState<Report | null>(null)
    const [formData, setFormData] = useState<ReportFormData>({
        name: '',
        description: '',
        reportCategoryId: undefined,
    })

    // Bulk actions
    const [bulkState, setBulkState] = useState<BulkActionState>({
        selectedReportIds: [],
        action: null,
        categoryId: null,
    })
    const [bulkModalVisible, setBulkModalVisible] = useState(false)

    // Assignment
    const [availableRoles, setAvailableRoles] = useState<RoleDto[]>([])
    const [availableUsers, setAvailableUsers] = useState<UserDto[]>([])
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [assignmentModalVisible, setAssignmentModalVisible] = useState(false)
    const [reportToAssign, setReportToAssign] = useState<Report | null>(null)
    const [assignmentType, setAssignmentType] = useState<'roles' | 'users'>(
        'roles',
    )

    // Delete report
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const [reportToDelete, setReportToDelete] = useState<Report | null>(null)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10) // Default items per page

    // Check if current user has admin permission
    const hasAdminPermission = user?.authority?.includes(ADMIN)

    // Apply all filters to reports
    const filteredReports = reports.filter((report) => {
        // Text search
        const matchesSearch =
            !searchText ||
            report.name.toLowerCase().includes(searchText.toLowerCase()) ||
            report.originalName
                ?.toLowerCase()
                .includes(searchText.toLowerCase())

        // Category filter
        const matchesCategory =
            !categoryFilter || report.reportCategoryId === categoryFilter

        // Workspace filter
        const matchesWorkspace =
            !workspaceFilter ||
            report.workspaceId.toString() === workspaceFilter

        // Status filter
        const matchesStatus =
            !statusFilter ||
            (statusFilter === 'active' && report.isEnabled) ||
            (statusFilter === 'inactive' && !report.isEnabled)

        // Approved filter
        const matchesApproved =
            approvedFilter === null || report.isApproved === approvedFilter

        return (
            matchesSearch &&
            matchesCategory &&
            matchesWorkspace &&
            matchesStatus &&
            matchesApproved
        )
    })

    // Calculate pagination
    const totalReports = filteredReports.length
    const totalPages = Math.ceil(totalReports / pageSize)

    // Get current page data
    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    )

    // Fetch reports and related data
    useEffect(() => {
        Promise.all([
            fetchReports(),
            fetchCategories(),
            fetchWorkspaces(),
            fetchRoles(),
            fetchUsers(),
        ]).catch((error) => {
            console.error('Error initializing page data:', error)
        })
    }, [])

    const fetchReports = async () => {
        try {
            setLoading(true)
            const data = await ReportService.getReportsList()
            setReports(data)
        } catch (error) {
            console.error('Error fetching reports:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to fetch reports
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const data = await ReportService.getCategories()
            setCategories(data)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const fetchWorkspaces = async () => {
        try {
            const data = await ReportService.getWorkspaces()
            setWorkspaces(data)
        } catch (error) {
            console.error('Error fetching workspaces:', error)
        }
    }

    const fetchRoles = async () => {
        try {
            const data = await RoleService.getRoles()
            setAvailableRoles(data)
        } catch (error) {
            console.error('Error fetching roles:', error)
        }
    }

    const fetchUsers = async () => {
        try {
            const data = await UserService.getUsers()
            setAvailableUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const refreshData = async () => {
        await fetchReports()
        toast.push(
            <Notification title="Success" type="success">
                Reports data refreshed
            </Notification>,
        )
    }

    // Filter handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value)
        setCurrentPage(1) // Reset to first page on new search
    }

    const handleFilter = (type: string, value: any) => {
        switch (type) {
            case 'category':
                setCategoryFilter(value ? Number(value) : null)
                break
            case 'workspace':
                setWorkspaceFilter(value)
                break
            case 'status':
                setStatusFilter(value)
                break
            case 'approved':
                setApprovedFilter(value)
                break
            default:
                break
        }
        setCurrentPage(1) // Reset to first page on filter change
    }

    const clearFilters = () => {
        setSearchText('')
        setCategoryFilter(null)
        setWorkspaceFilter(null)
        setStatusFilter(null)
        setApprovedFilter(null)
        setCurrentPage(1)
    }

    // Pagination handlers
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber)
    }

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setCurrentPage(1) // Reset to first page when changing page size
    }

    // Report management handlers
    const handleEditReport = (report: Report) => {
        setReportToEdit(report)
        setFormData({
            name: report.name,
            description: report.description || '',
            reportCategoryId: report.reportCategoryId,
        })
        setEditModalVisible(true)
    }

    const handleSaveReport = async () => {
        if (!reportToEdit) return

        try {
            await ReportService.updateReport(reportToEdit.id, formData)
            toast.push(
                <Notification title="Success" type="success">
                    Report updated successfully
                </Notification>,
            )
            setEditModalVisible(false)
            fetchReports()
        } catch (error) {
            console.error('Error updating report:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to update report
                </Notification>,
            )
        }
    }

    const confirmDeleteReport = (report: Report) => {
        setReportToDelete(report)
        setDeleteModalVisible(true)
    }

    const handleDeleteReport = async () => {
        if (!reportToDelete?.id) return

        try {
            await ReportService.deleteReport(reportToDelete.id)
            toast.push(
                <Notification title="Success" type="success">
                    Report deleted successfully
                </Notification>,
            )
            fetchReports()
        } catch (error) {
            console.error('Error deleting report:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to delete report
                </Notification>,
            )
        } finally {
            setDeleteModalVisible(false)
            setReportToDelete(null)
        }
    }

    // Bulk action handlers
    const handleSelectReport = (reportId: string, isSelected: boolean) => {
        setBulkState((prev) => ({
            ...prev,
            selectedReportIds: isSelected
                ? [...prev.selectedReportIds, reportId]
                : prev.selectedReportIds.filter((id) => id !== reportId),
        }))
    }

    const handleSelectAllReports = (isSelected: boolean) => {
        setBulkState((prev) => ({
            ...prev,
            selectedReportIds: isSelected
                ? paginatedReports.map((report) => report.id)
                : [],
        }))
    }

    const handleBulkAction = (action: BulkActionState['action']) => {
        if (bulkState.selectedReportIds.length === 0) {
            toast.push(
                <Notification title="Warning" type="warning">
                    Please select reports first
                </Notification>,
            )
            return
        }

        setBulkState((prev) => ({ ...prev, action }))
        setBulkModalVisible(true)
    }

    const executeBulkAction = async () => {
        try {
            const { selectedReportIds, action, categoryId } = bulkState

            switch (action) {
                case 'approve':
                    await ReportService.bulkApproveReports(selectedReportIds)
                    break
                case 'enable':
                    await ReportService.bulkSetReportStatus(
                        selectedReportIds.map((id) => parseInt(id, 10)),
                        true,
                    )
                    break
                case 'disable':
                    await ReportService.bulkSetReportStatus(
                        selectedReportIds.map((id) => parseInt(id, 10)),
                        false,
                    )
                    break
                case 'change-category':
                    if (!categoryId) throw new Error('Category ID is required')
                    await ReportService.bulkChangeReportCategory(
                        selectedReportIds,
                        categoryId,
                    )
                    break
                default:
                    throw new Error('Invalid action')
            }

            toast.push(
                <Notification title="Success" type="success">
                    Bulk action completed successfully
                </Notification>,
            )
            fetchReports()
        } catch (error) {
            console.error('Error executing bulk action:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to execute bulk action
                </Notification>,
            )
        } finally {
            setBulkModalVisible(false)
            setBulkState({
                selectedReportIds: [],
                action: null,
                categoryId: null,
            })
        }
    }

    // Assignment handlers
    const handleAssignment = (report: Report, type: 'roles' | 'users') => {
        setReportToAssign(report)
        setAssignmentType(type)

        // Set selected roles/users based on what's already assigned to the report
        if (type === 'roles') {
            setSelectedRoles(report.assignedRoles || [])
        } else {
            setSelectedUsers(report.assignedUsers || [])
        }

        setAssignmentModalVisible(true)
    }

    const handleSubmitAssignment = async () => {
        if (!reportToAssign?.id) return

        try {
            if (assignmentType === 'roles') {
                await ReportService.assignRolesToReport(
                    reportToAssign.id,
                    selectedRoles,
                )
            } else {
                await ReportService.assignUsersToReport(
                    reportToAssign.id,
                    selectedUsers,
                )
            }

            toast.push(
                <Notification title="Success" type="success">
                    Assignment updated successfully
                </Notification>,
            )
            fetchReports()
        } catch (error) {
            console.error('Error updating assignment:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to update assignment
                </Notification>,
            )
        } finally {
            setAssignmentModalVisible(false)
            setReportToAssign(null)
        }
    }

    // Table columns definition
    const columns = [
        {
            key: 'selection',
            width: 50,
            title: '',
            render: (_: any, record: Report) => (
                <Checkbox
                    checked={bulkState.selectedReportIds.includes(record.id)}
                    onChange={(checked) =>
                        handleSelectReport(record.id, checked)
                    }
                />
            ),
        },
        {
            key: 'name',
            dataIndex: 'name',
            title: 'Display Name',
            render: (_: any, record: Report) => (
                <>
                    <div className="font-semibold">{record.name}</div>
                    {record.originalName &&
                        record.originalName !== record.name && (
                            <div className="text-xs text-gray-500">
                                {record.originalName}
                            </div>
                        )}
                </>
            ),
        },
        {
            key: 'workspace',
            dataIndex: 'workspaceId',
            title: 'Workspace',
            render: (_: any, record: Report) => {
                const workspace = workspaces.find(
                    (ws) => ws.id === record.workspaceId.toString(),
                )
                return <span>{workspace?.name || record.workspaceId}</span>
            },
        },
        {
            key: 'category',
            dataIndex: 'reportCategoryId',
            title: 'Category',
            render: (_: any, record: Report) => {
                const category = categories.find(
                    (cat) => cat.id === record.reportCategoryId,
                )
                return <span>{category?.name || 'Uncategorized'}</span>
            },
        },
        {
            key: 'approved',
            dataIndex: 'isApproved',
            title: 'Approved',
            render: (_: any, record: Report) =>
                record.isApproved ? (
                    <Tag className="bg-green-500">
                        <Space>
                            <HiOutlineCheck />
                            <span>Approved</span>
                        </Space>
                    </Tag>
                ) : (
                    <Tag className="bg-orange-500">
                        <Space>
                            <HiOutlineExclamation />
                            <span>Pending</span>
                        </Space>
                    </Tag>
                ),
        },
        {
            key: 'status',
            dataIndex: 'isEnabled',
            title: 'Status',
            render: (_: any, record: Report) => (
                <Tag
                    className={
                        record.isEnabled ? 'bg-emerald-500' : 'bg-red-500'
                    }
                >
                    {record.isEnabled ? 'Enabled' : 'Disabled'}
                </Tag>
            ),
        },
        {
            key: 'actions',
            dataIndex: 'id',
            title: 'Actions',
            render: (_: any, record: Report) => (
                <div className="flex justify-end">
                    <Dropdown
                        placement="bottom-end"
                        renderTitle={
                            <Button
                                variant="plain"
                                icon={<HiOutlineDotsVertical />}
                            />
                        }
                    >
                        <Menu
                            onSelect={(key) => {
                                if (key === 'edit') {
                                    handleEditReport(record)
                                } else if (key === 'delete') {
                                    confirmDeleteReport(record)
                                } else if (key === 'view') {
                                    navigate(`/reports/view/${record.id}`)
                                } else if (key === 'assign-roles') {
                                    handleAssignment(record, 'roles')
                                } else if (key === 'assign-users') {
                                    handleAssignment(record, 'users')
                                }
                            }}
                        >
                            <Menu.MenuItem eventKey="view">
                                <Space>
                                    <HiOutlineEye />
                                    <span>View Report</span>
                                </Space>
                            </Menu.MenuItem>
                            <Menu.MenuItem eventKey="edit">
                                <Space>
                                    <HiOutlinePencilAlt />
                                    <span>Edit</span>
                                </Space>
                            </Menu.MenuItem>
                            <Menu.MenuItem eventKey="assign-roles">
                                <Space>
                                    <HiOutlineUserGroup />
                                    <span>Assign Roles</span>
                                </Space>
                            </Menu.MenuItem>
                            <Menu.MenuItem eventKey="assign-users">
                                <Space>
                                    <HiOutlineUser />
                                    <span>Assign Users</span>
                                </Space>
                            </Menu.MenuItem>
                            {hasAdminPermission && (
                                <Menu.MenuItem eventKey="delete">
                                    <Space>
                                        <HiOutlineTrash />
                                        <span>Delete</span>
                                    </Space>
                                </Menu.MenuItem>
                            )}
                        </Menu>
                    </Dropdown>
                </div>
            ),
        },
    ]

    return (
        <div>
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3>Reports Management</h3>
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiOutlinePlus />}
                        onClick={() => navigate('/admin/report-categories')}
                    >
                        Manage Categories
                    </Button>
                </div>

                <Card className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Input
                            placeholder="Search reports..."
                            prefix={<HiOutlineSearch className="text-lg" />}
                            onChange={handleSearch}
                            value={searchText}
                        />

                        <Select
                            placeholder="Filter by Category"
                            options={[
                                { value: '', label: 'All Categories' },
                                ...categories.map((cat) => ({
                                    value: cat.id.toString(),
                                    label: cat.name,
                                })),
                            ]}
                            value={
                                categoryFilter
                                    ? {
                                          value: categoryFilter.toString(),
                                          label:
                                              categories.find(
                                                  (cat) =>
                                                      cat.id === categoryFilter,
                                              )?.name || 'Unknown',
                                      }
                                    : { value: '', label: 'All Categories' }
                            }
                            onChange={(option: any) =>
                                handleFilter('category', option.value)
                            }
                        />

                        <Select
                            placeholder="Filter by Workspace"
                            options={[
                                { value: '', label: 'All Workspaces' },
                                ...workspaces.map((ws) => ({
                                    value: ws.id.toString(),
                                    label: ws.name,
                                })),
                            ]}
                            value={
                                workspaceFilter
                                    ? {
                                          value: workspaceFilter,
                                          label:
                                              workspaces.find(
                                                  (ws) =>
                                                      ws.id === workspaceFilter,
                                              )?.name || 'Unknown',
                                      }
                                    : { value: '', label: 'All Workspaces' }
                            }
                            onChange={(option: any) =>
                                handleFilter('workspace', option.value)
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Select
                            placeholder="Filter by Status"
                            options={[
                                { value: '', label: 'All Statuses' },
                                { value: 'active', label: 'Enabled' },
                                { value: 'inactive', label: 'Disabled' },
                            ]}
                            value={
                                statusFilter
                                    ? {
                                          value: statusFilter,
                                          label:
                                              statusFilter === 'active'
                                                  ? 'Enabled'
                                                  : 'Disabled',
                                      }
                                    : { value: '', label: 'All Statuses' }
                            }
                            onChange={(option: any) =>
                                handleFilter('status', option.value)
                            }
                        />

                        <Select
                            placeholder="Filter by Approval"
                            options={[
                                { value: '', label: 'All Reports' },
                                { value: 'true', label: 'Approved' },
                                { value: 'false', label: 'Pending Approval' },
                            ]}
                            value={
                                approvedFilter !== null
                                    ? {
                                          value: String(approvedFilter),
                                          label: approvedFilter
                                              ? 'Approved'
                                              : 'Pending Approval',
                                      }
                                    : { value: '', label: 'All Reports' }
                            }
                            onChange={(option: any) => {
                                const value =
                                    option.value === ''
                                        ? null
                                        : option.value === 'true'
                                          ? true
                                          : false
                                handleFilter('approved', value)
                            }}
                        />

                        <div className="flex justify-end gap-2">
                            {' '}
                            <Button
                                size="sm"
                                variant="solid"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </Button>{' '}
                            <Button
                                size="sm"
                                variant="solid"
                                color="green"
                                onClick={refreshData}
                                icon={<HiOutlineClipboardList />}
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="self-center font-bold">
                            Bulk Actions:
                        </span>{' '}
                        <Button
                            size="sm"
                            variant="solid"
                            color="green"
                            icon={<HiOutlineCheck />}
                            onClick={() => handleBulkAction('approve')}
                        >
                            Approve
                        </Button>{' '}
                        <Button
                            size="sm"
                            variant="solid"
                            color="green"
                            onClick={() => handleBulkAction('enable')}
                        >
                            Enable
                        </Button>{' '}
                        <Button
                            size="sm"
                            variant="solid"
                            color="red"
                            onClick={() => handleBulkAction('disable')}
                        >
                            Disable
                        </Button>{' '}
                        <Button
                            size="sm"
                            variant="solid"
                            color="blue"
                            onClick={() => handleBulkAction('change-category')}
                        >
                            Change Category
                        </Button>
                        <div className="ml-auto">
                            {bulkState.selectedReportIds.length > 0 && (
                                <span>
                                    {bulkState.selectedReportIds.length} reports
                                    selected
                                </span>
                            )}
                        </div>
                    </div>

                    {filteredReports.length === 0 && !loading && (
                        <div className="p-4 text-center text-gray-500">
                            No reports found.
                        </div>
                    )}

                    <Table
                        loading={loading}
                        columns={columns}
                        dataSource={paginatedReports}
                        rowKey="id"
                    />

                    {totalReports > 0 && (
                        <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center">
                                <span className="mr-2">Items per page:</span>
                                <Select
                                    size="sm"
                                    options={[
                                        { value: '5', label: '5' },
                                        { value: '10', label: '10' },
                                        { value: '20', label: '20' },
                                        { value: '50', label: '50' },
                                    ]}
                                    value={{
                                        value: pageSize.toString(),
                                        label: pageSize.toString(),
                                    }}
                                    onChange={(option: any) =>
                                        handlePageSizeChange(
                                            Number(option.value),
                                        )
                                    }
                                    menuPlacement="top"
                                    className="min-w-[80px]"
                                />
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                total={totalReports}
                                pageSize={pageSize}
                                onChange={handlePageChange}
                                displayTotal={true}
                            />
                        </div>
                    )}
                </Card>
            </div>

            {/* Edit Report Modal */}
            <Dialog
                isOpen={editModalVisible}
                onClose={() => setEditModalVisible(false)}
            >
                <h5 className="mb-4">Edit Report</h5>
                <FormContainer>
                    <FormItem label="Display Name">
                        <Input
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Description">
                        <Input
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Category">
                        <Select
                            options={categories.map((cat) => ({
                                value: cat.id.toString(),
                                label: cat.name,
                            }))}
                            value={
                                formData.reportCategoryId
                                    ? {
                                          value: formData.reportCategoryId.toString(),
                                          label:
                                              categories.find(
                                                  (c) =>
                                                      c.id ===
                                                      formData.reportCategoryId,
                                              )?.name || 'Unknown',
                                      }
                                    : null
                            }
                            onChange={(option: any) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    reportCategoryId: option
                                        ? Number(option.value)
                                        : undefined,
                                }))
                            }
                        />
                    </FormItem>
                    <div className="text-right mt-6">
                        <Button
                            className="mr-2"
                            variant="plain"
                            onClick={() => setEditModalVisible(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="solid" onClick={handleSaveReport}>
                            Save
                        </Button>
                    </div>
                </FormContainer>
            </Dialog>

            {/* Delete Report Modal */}
            <Dialog
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
            >
                <h5 className="mb-4">Delete Report</h5>
                <p>
                    Are you sure you want to delete the report{' '}
                    <strong>{reportToDelete?.name}</strong>? This action cannot
                    be undone.
                </p>
                <div className="text-right mt-6">
                    <Button
                        className="mr-2"
                        variant="plain"
                        onClick={() => setDeleteModalVisible(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        color="red"
                        onClick={handleDeleteReport}
                    >
                        Delete
                    </Button>
                </div>
            </Dialog>

            {/* Bulk Action Modal */}
            <Dialog
                isOpen={bulkModalVisible}
                onClose={() => setBulkModalVisible(false)}
            >
                <h5 className="mb-4">
                    {bulkState.action === 'approve' && 'Approve Reports'}
                    {bulkState.action === 'enable' && 'Enable Reports'}
                    {bulkState.action === 'disable' && 'Disable Reports'}
                    {bulkState.action === 'change-category' &&
                        'Change Reports Category'}
                </h5>
                <p>
                    You are about to {bulkState.action}{' '}
                    {bulkState.selectedReportIds.length} report(s).
                    {bulkState.action === 'disable' &&
                        ' This action will be logged in the audit trail.'}
                </p>

                {bulkState.action === 'change-category' && (
                    <FormItem label="Select Target Category" className="mt-4">
                        <Select
                            options={categories.map((cat) => ({
                                value: cat.id.toString(),
                                label: cat.name,
                            }))}
                            value={
                                bulkState.categoryId
                                    ? {
                                          value: bulkState.categoryId.toString(),
                                          label:
                                              categories.find(
                                                  (c) =>
                                                      c.id ===
                                                      bulkState.categoryId,
                                              )?.name || 'Unknown',
                                      }
                                    : null
                            }
                            onChange={(option: any) =>
                                setBulkState((prev) => ({
                                    ...prev,
                                    categoryId: option
                                        ? Number(option.value)
                                        : null,
                                }))
                            }
                        />
                    </FormItem>
                )}

                <div className="text-right mt-6">
                    <Button
                        className="mr-2"
                        variant="plain"
                        onClick={() => setBulkModalVisible(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        color={bulkState.action === 'disable' ? 'red' : 'green'}
                        onClick={executeBulkAction}
                        disabled={
                            bulkState.action === 'change-category' &&
                            !bulkState.categoryId
                        }
                    >
                        Confirm
                    </Button>
                </div>
            </Dialog>

            {/* Role/User Assignment Modal */}
            <Dialog
                isOpen={assignmentModalVisible}
                onClose={() => setAssignmentModalVisible(false)}
            >
                <h5 className="mb-4">
                    {assignmentType === 'roles'
                        ? 'Assign Roles'
                        : 'Assign Users'}{' '}
                    to {reportToAssign?.name}
                </h5>
                <div className="mb-4">
                    <p>
                        {assignmentType === 'roles'
                            ? 'Select which roles have access to this report:'
                            : 'Select which users have access to this report:'}
                    </p>
                </div>
                <FormContainer>
                    <FormItem>
                        <Select
                            isMulti
                            placeholder={`Select ${assignmentType}`}
                            options={
                                assignmentType === 'roles'
                                    ? availableRoles.map((role) => ({
                                          value: role.id,
                                          label: role.name,
                                      }))
                                    : availableUsers.map((user) => ({
                                          value: user.id,
                                          label: user.name,
                                      }))
                            }
                            value={
                                assignmentType === 'roles'
                                    ? selectedRoles.map((id) => ({
                                          value: id,
                                          label:
                                              availableRoles.find(
                                                  (role) => role.id === id,
                                              )?.name || id,
                                      }))
                                    : selectedUsers.map((id) => ({
                                          value: id,
                                          label:
                                              availableUsers.find(
                                                  (user) => user.id === id,
                                              )?.name || id,
                                      }))
                            }
                            onChange={(selectedOptions: any) => {
                                const selectedIds = selectedOptions
                                    ? selectedOptions.map(
                                          (option: any) => option.value,
                                      )
                                    : []
                                assignmentType === 'roles'
                                    ? setSelectedRoles(selectedIds)
                                    : setSelectedUsers(selectedIds)
                            }}
                        />
                    </FormItem>
                    <div className="text-right mt-6">
                        <Button
                            className="mr-2"
                            variant="plain"
                            onClick={() => setAssignmentModalVisible(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            onClick={handleSubmitAssignment}
                        >
                            Save
                        </Button>
                    </div>
                </FormContainer>
            </Dialog>
        </div>
    )
}

export default ReportsPage

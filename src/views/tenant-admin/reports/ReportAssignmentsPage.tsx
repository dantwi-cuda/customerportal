import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Notification,
    toast,
    Tabs,
    Checkbox,
    Table,
} from '@/components/ui'
import {
    HiOutlineArrowLeft,
    HiOutlineSearch,
    HiOutlineSave,
} from 'react-icons/hi'
import * as ReportService from '@/services/ReportService'
import * as RoleService from '@/services/RoleService'
import * as UserService from '@/services/TenantUserService'
import { useNavigate, useParams } from 'react-router-dom'
import type { Report } from '@/@types/report'
import type { User } from '@/@types/user'
import type { Role } from '@/@types/role'
import useAuth from '@/auth/useAuth'

interface TabItem {
    value: string
    label: string
}

const { Tr, Th, Td, THead, TBody } = Table

const ReportAssignmentsPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()

    // State management
    const [report, setReport] = useState<Report | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('users')
    const [searchTerm, setSearchTerm] = useState('')

    // Tenant admin check: User must have a tenantId to manage reports
    const isTenantAdmin = !!currentUser?.tenantId

    useEffect(() => {
        if (isTenantAdmin && id) {
            fetchReportDetails(id)
            fetchUsers()
            fetchRoles()
        }
    }, [id, isTenantAdmin])

    const fetchReportDetails = async (reportId: string) => {
        setLoading(true)
        try {
            const data = await ReportService.getReportDetails(reportId)
            setReport(data)

            // Set initial selections based on report data
            if (data.assignedUsers) {
                setSelectedUserIds(data.assignedUsers)
            }
            if (data.assignedRoles) {
                setSelectedRoleIds(data.assignedRoles)
            }
        } catch (error) {
            console.error('Error fetching report details:', error)
            toast.push(
                <Notification type="danger" title="Error fetching report">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
            navigate('/tenantportal/tenant/reports')
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const data = await UserService.getTenantUsers()
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const fetchRoles = async () => {
        try {
            const data = await RoleService.getTenantRoles()
            setRoles(data)
        } catch (error) {
            console.error('Error fetching roles:', error)
        }
    }

    const handleUserCheckboxChange = (userId: string) => {
        setSelectedUserIds((prevSelected) =>
            prevSelected.includes(userId)
                ? prevSelected.filter((id) => id !== userId)
                : [...prevSelected, userId],
        )
    }

    const handleRoleCheckboxChange = (roleId: string) => {
        setSelectedRoleIds((prevSelected) =>
            prevSelected.includes(roleId)
                ? prevSelected.filter((id) => id !== roleId)
                : [...prevSelected, roleId],
        )
    }

    const handleSave = async () => {
        if (!id) return

        setSaving(true)
        try {
            // Save user assignments
            await ReportService.assignUsersToReport(id, selectedUserIds)

            // Save role assignments
            await ReportService.assignRolesToReport(id, selectedRoleIds)

            toast.push(
                <Notification type="success" title="Assignments saved">
                    Report assignments have been saved successfully.
                </Notification>,
            )

            // Refresh report data
            await fetchReportDetails(id)
        } catch (error) {
            console.error('Error saving assignments:', error)
            toast.push(
                <Notification type="danger" title="Error saving assignments">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleBack = () => {
        navigate('/tenantportal/tenant/reports')
    }

    // Filter users or roles based on search term
    const filteredUsers = users.filter(
        (user) =>
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const filteredRoles = roles.filter((role) =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Define tabs
    const tabs: TabItem[] = [
        { value: 'users', label: 'Users' },
        { value: 'roles', label: 'Roles' },
    ]

    // Tab content based on active tab
    const tabContent = () => {
        if (activeTab === 'users') {
            return (
                <div className="mt-4">
                    <Table>
                        <THead>
                            <Tr>
                                <Th className="w-16">Select</Th>
                                <Th>Name</Th>
                                <Th>Email</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {filteredUsers.length === 0 ? (
                                <Tr>
                                    <Td colSpan={3} className="text-center">
                                        No users found
                                    </Td>
                                </Tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <Tr key={user.id}>
                                        <Td>
                                            <Checkbox
                                                checked={selectedUserIds.includes(
                                                    user.id,
                                                )}
                                                onChange={() =>
                                                    handleUserCheckboxChange(
                                                        user.id,
                                                    )
                                                }
                                            />
                                        </Td>
                                        <Td>{user.name || 'N/A'}</Td>
                                        <Td>{user.email}</Td>
                                    </Tr>
                                ))
                            )}
                        </TBody>
                    </Table>
                </div>
            )
        }

        return (
            <div className="mt-4">
                <Table>
                    <THead>
                        <Tr>
                            <Th className="w-16">Select</Th>
                            <Th>Name</Th>
                            <Th>Description</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {filteredRoles.length === 0 ? (
                            <Tr>
                                <Td colSpan={3} className="text-center">
                                    No roles found
                                </Td>
                            </Tr>
                        ) : (
                            filteredRoles.map((role) => (
                                <Tr key={role.id}>
                                    <Td>
                                        <Checkbox
                                            checked={selectedRoleIds.includes(
                                                role.id,
                                            )}
                                            onChange={() =>
                                                handleRoleCheckboxChange(
                                                    role.id,
                                                )
                                            }
                                        />
                                    </Td>
                                    <Td>{role.name}</Td>
                                    <Td>
                                        {role.description || 'No description'}
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </TBody>
                </Table>
            </div>
        )
    }

    if (!isTenantAdmin) {
        return (
            <div className="p-4">
                <Card className="text-center p-4">
                    <h4 className="mb-2">Access Denied</h4>
                    <p>
                        You must be a tenant administrator to access this page.
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header and Actions Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<HiOutlineArrowLeft />}
                            onClick={handleBack}
                        >
                            Back to Reports
                        </Button>
                        <div>
                            <h4 className="mb-1">Assign Report</h4>
                            <p className="text-gray-600 text-sm">
                                Assign {report?.name} to users or roles to grant access permissions
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiOutlineSave />}
                        onClick={handleSave}
                        loading={saving}
                        className="w-full sm:w-auto"
                    >
                        Save Assignments
                    </Button>
                </div>
            </Card>

            {/* Content Card */}
            <Card>
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                            <div className="relative w-full sm:w-64">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <HiOutlineSearch className="text-gray-500" />
                                </span>
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                                    placeholder={`Search ${activeTab}...`}
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>
                        </div>
                                className="w-full sm:w-auto"
                            >
                                Save Assignments
                            </Button>
                        </div>

                        <Tabs
                            value={activeTab}
                            onChange={(val) => setActiveTab(val as string)}
                        >
                            <Tabs.TabList className="flex flex-wrap">
                                {tabs.map((tab) => (
                                    <Tabs.TabNav
                                        key={tab.value}
                                        value={tab.value}
                                        className="px-4 py-2 mb-2 sm:mb-0"
                                    >
                                        {tab.label}
                                    </Tabs.TabNav>
                                ))}
                            </Tabs.TabList>
                        </Tabs>

                        <div className="overflow-x-auto">{tabContent()}</div>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ReportAssignmentsPage

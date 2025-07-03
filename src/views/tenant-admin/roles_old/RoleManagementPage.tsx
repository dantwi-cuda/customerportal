import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, Notification, toast, Pagination, Select } from '@/components/ui' // Added Select
import { HiPlusCircle, HiOutlineSearch } from 'react-icons/hi'
import TenantRolesTable from './components/TenantRolesTable'
import RoleService from '@/services/RoleService'
import { RoleDto } from '@/@types/role'
import { Loading } from '@/components/shared'
import useAuth from '@/auth/useAuth'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'

const DEFAULT_PAGE_SIZE = 10 // Define default page size
const PAGE_SIZE_OPTIONS = [
    { value: 10, label: '10 / page' },
    { value: 20, label: '20 / page' },
    { value: 50, label: '50 / page' },
    { value: 100, label: '100 / page' },
]

const RoleManagementPage = () => {
    const [loading, setLoading] = useState(true)
    const [roles, setRoles] = useState<RoleDto[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('') // Added for debouncing
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const { user } = useAuth()
    const navigate = useNavigate()

    const tenantId = user?.tenantId // Updated to use optional chaining with the updated User type

    // Effect for debouncing search term
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 300) // 300ms delay

        return () => {
            clearTimeout(timerId)
        }
    }, [searchTerm])

    const fetchRoles = useCallback(async () => {
        if (!tenantId) {
            setLoading(false)
            setRoles([])
            toast.push(
                <Notification title="Warning" type="warning" duration={3000}>
                    Tenant ID is not available, cannot fetch roles.
                </Notification>,
            )
            return
        }
        setLoading(true)
        try {
            const numericTenantId = parseInt(tenantId, 10)
            if (isNaN(numericTenantId)) {
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Invalid Tenant ID format.
                    </Notification>,
                )
                setRoles([])
                setLoading(false)
                return
            }
            const fetchedRoles = await RoleService.getRoles({
                tenantId: numericTenantId, // Pass numericTenantId
                type: 'TENANT',
            })
            setRoles(fetchedRoles)
        } catch (error) {
            console.error('Failed to fetch roles:', error)
            setRoles([])
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch roles.
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [tenantId])

    useEffect(() => {
        if (tenantId) {
            fetchRoles()
        } else {
            setLoading(false)
        }
    }, [fetchRoles, tenantId])

    const handleAddRole = () => {
        navigate('/tenantportal/tenant/roles/create')
    }

    const handleEditRole = (role: RoleDto) => {
        navigate(`/tenantportal/tenant/roles/edit/${role.id}`)
    }

    const handleDeleteRole = async (roleId: string) => {
        if (window.confirm('Are you sure you want to delete this role?')) {
            try {
                await RoleService.deleteRole(roleId)
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={2500}
                    >
                        Role deleted successfully.
                    </Notification>,
                )
                fetchRoles()
            } catch (error) {
                console.error('Failed to delete role:', error)
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Failed to delete role.
                    </Notification>,
                )
            }
        }
    }

    const filteredRoles = useMemo(() => {
        if (!debouncedSearchTerm.trim()) {
            return roles
        }
        return roles.filter(
            (role) =>
                role.name
                    .toLowerCase()
                    .includes(debouncedSearchTerm.toLowerCase()) ||
                (role.description &&
                    role.description
                        .toLowerCase()
                        .includes(debouncedSearchTerm.toLowerCase())),
        )
    }, [roles, debouncedSearchTerm]) // Use debouncedSearchTerm

    const paginatedRoles = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return filteredRoles.slice(start, end)
    }, [filteredRoles, currentPage, pageSize])

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handlePageSizeChange = (selectedOption: any) => {
        if (selectedOption) {
            setPageSize(selectedOption.value)
            setCurrentPage(1) // Reset to first page when page size changes
        }
    }

    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearchTerm, pageSize]) // Use debouncedSearchTerm

    if (!tenantId && !loading) {
        return (
            <div className="p-4">
                <Notification
                    title="Missing Tenant Info"
                    type="warning"
                    closable
                >
                    Tenant information is not available. Cannot display role
                    management.
                </Notification>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Role Management</h2>
                <div className="flex items-center">
                    <Input
                        prefix={<HiOutlineSearch className="text-lg" />}
                        type="text"
                        placeholder="Search roles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mr-4"
                    />
                    <Button
                        variant="solid"
                        icon={<HiPlusCircle />}
                        onClick={handleAddRole}
                    >
                        Add Role
                    </Button>
                </div>
            </div>
            <Card>
                {loading ? (
                    <Loading loading={true} />
                ) : (
                    <>
                        <TenantRolesTable
                            roles={paginatedRoles}
                            onEdit={handleEditRole}
                            onDelete={handleDeleteRole}
                        />
                        {filteredRoles.length > 0 && ( // Show pagination controls only if there are roles
                            <div className="flex justify-between items-center mt-4">
                                {' '}
                                {/* Changed to justify-between */}
                                <Pagination
                                    currentPage={currentPage}
                                    total={filteredRoles.length}
                                    pageSize={pageSize} // Use dynamic pageSize
                                    onChange={handlePageChange}
                                />
                                <div className="min-w-[120px]">
                                    {' '}
                                    {/* Added container for Select */}
                                    <Select
                                        size="sm"
                                        options={PAGE_SIZE_OPTIONS}
                                        value={PAGE_SIZE_OPTIONS.find(
                                            (option) =>
                                                option.value === pageSize,
                                        )}
                                        onChange={handlePageSizeChange}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    )
}

export default RoleManagementPage

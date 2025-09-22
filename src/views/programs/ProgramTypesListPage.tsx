import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Card,
    Input,
    Button,
    Notification,
    toast,
    Tag,
    Avatar,
    Pagination,
    Dropdown,
    Skeleton,
    Alert,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineDotsVertical,
    HiOutlineArrowLeft,
} from 'react-icons/hi'
import ProgramTypeService from '@/services/ProgramTypeService'
import useAuth from '@/auth/useAuth'
import type { ProgramType } from '@/@types/programType'

const ProgramTypesListPage: React.FC = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const [programTypes, setProgramTypes] = useState<ProgramType[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)

    // Check if we're in tenant portal based on current path
    const isInTenantPortal =
        window.location.pathname.startsWith('/tenantportal')
    const programsPath = isInTenantPortal
        ? '/tenantportal/programs'
        : '/app/programs'
    const createPath = isInTenantPortal
        ? '/tenantportal/program-types/create'
        : '/app/program-types/create'

    // Check permissions - Only CS-Admin and CS-User can access program type management
    const hasAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const hasCreateAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const hasEditAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const hasDeleteAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    useEffect(() => {
        if (hasAccess) {
            loadProgramTypes()
        }
    }, [hasAccess])

    const loadProgramTypes = async () => {
        try {
            setLoading(true)
            const data = await ProgramTypeService.getProgramTypes()
            setProgramTypes(data)
        } catch (error) {
            console.error('Error loading program types:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to load program types
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteProgramType = async (programType: ProgramType) => {
        if (
            !window.confirm(
                `Are you sure you want to delete "${programType.typeName}"? This action cannot be undone.`,
            )
        ) {
            return
        }

        try {
            await ProgramTypeService.deleteProgramType(
                programType.programTypeID,
            )

            toast.push(
                <Notification type="success" title="Success">
                    Program type deleted successfully
                </Notification>,
            )

            await loadProgramTypes()
        } catch (error) {
            console.error('Error deleting program type:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    {error instanceof Error
                        ? error.message
                        : 'Failed to delete program type'}
                </Notification>,
            )
        }
    }

    // Filter and paginate program types
    const filteredProgramTypes = programTypes.filter((programType) => {
        const searchLower = searchText.toLowerCase()
        return (
            programType.typeName.toLowerCase().includes(searchLower) ||
            (programType.typeDescription?.toLowerCase() || '').includes(
                searchLower,
            )
        )
    })

    const totalPages = Math.ceil(filteredProgramTypes.length / pageSize)
    const paginatedProgramTypes = filteredProgramTypes.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    )

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    // Check if user has access to program type management
    if (!hasAccess) {
        return (
            <div className="space-y-4">
                <Card>
                    <div className="p-6 text-center">
                        <Alert type="warning" title="Access Denied">
                            You don't have permission to manage program types.
                            Only CS-Admin and CS-User roles can access this
                            feature.
                        </Alert>
                        <Button
                            variant="plain"
                            className="mt-4"
                            onClick={() => navigate(programsPath)}
                        >
                            Back to Programs
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="plain"
                            icon={<HiOutlineArrowLeft />}
                            onClick={() => navigate(programsPath)}
                        >
                            Back to Programs
                        </Button>
                        <div>
                            <h4 className="mb-1">Program Types</h4>
                            <p className="text-gray-600">
                                Manage program types and their attributes
                            </p>
                        </div>
                    </div>
                    {hasCreateAccess && (
                        <Button
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={() => navigate(createPath)}
                            className="w-full sm:w-auto"
                        >
                            Add Program Type
                        </Button>
                    )}
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="max-w-md">
                        <Input
                            placeholder="Search program types..."
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value)
                                setCurrentPage(1)
                            }}
                            prefix={<HiOutlineSearch />}
                        />
                    </div>
                </div>

                {/* Program Types List */}
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(5)].map((_, index) => (
                            <Skeleton key={index} height="120px" />
                        ))}
                    </div>
                ) : paginatedProgramTypes.length === 0 ? (
                    <Card className="text-center py-12">
                        <div className="text-gray-500">
                            {searchText
                                ? 'No program types found matching your search'
                                : 'No program types found'}
                        </div>
                        {hasCreateAccess && !searchText && (
                            <Button
                                variant="solid"
                                className="mt-4"
                                onClick={() => navigate(createPath)}
                            >
                                Create First Program Type
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {paginatedProgramTypes.map((programType) => (
                            <Card
                                key={programType.programTypeID}
                                className="p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <Avatar
                                            size="md"
                                            shape="circle"
                                            className="bg-blue-100 text-blue-600"
                                        >
                                            {programType.typeName
                                                .charAt(0)
                                                .toUpperCase()}
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h5 className="font-semibold text-lg truncate">
                                                    {programType.typeName}
                                                </h5>
                                                <Tag
                                                    className={
                                                        programType.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }
                                                >
                                                    {programType.isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Tag>
                                            </div>

                                            {programType.typeDescription && (
                                                <p className="text-gray-600 mb-3">
                                                    {
                                                        programType.typeDescription
                                                    }
                                                </p>
                                            )}

                                            <div className="flex items-center gap-6 text-sm text-gray-500">
                                                <div>
                                                    <span className="font-medium">
                                                        Attributes:
                                                    </span>{' '}
                                                    {programType.attributes
                                                        ?.length || 0}
                                                </div>
                                                <div>
                                                    <span className="font-medium">
                                                        Created:
                                                    </span>{' '}
                                                    {formatDate(
                                                        programType.createdAt,
                                                    )}
                                                </div>
                                            </div>

                                            {programType.attributes &&
                                                programType.attributes.length >
                                                    0 && (
                                                    <div className="mt-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {programType.attributes
                                                                .slice(0, 5)
                                                                .map(
                                                                    (
                                                                        attr,
                                                                        index,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                index
                                                                            }
                                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                                        >
                                                                            {
                                                                                attr.attributeName
                                                                            }
                                                                            {attr.isRequired && (
                                                                                <span className="ml-1 text-red-500">
                                                                                    *
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    ),
                                                                )}
                                                            {programType
                                                                .attributes
                                                                .length > 5 && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                                    +
                                                                    {programType
                                                                        .attributes
                                                                        .length -
                                                                        5}{' '}
                                                                    more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <Dropdown
                                        renderTitle={
                                            <Button
                                                variant="plain"
                                                size="sm"
                                                icon={<HiOutlineDotsVertical />}
                                            />
                                        }
                                        placement="bottom-end"
                                    >
                                        {hasEditAccess && (
                                            <Dropdown.Item
                                                eventKey="edit"
                                                onClick={() =>
                                                    navigate(
                                                        isInTenantPortal
                                                            ? `/tenantportal/program-types/edit/${programType.programTypeID}`
                                                            : `/app/program-types/edit/${programType.programTypeID}`,
                                                    )
                                                }
                                            >
                                                <HiOutlinePencil className="mr-2" />
                                                Edit Program Type
                                            </Dropdown.Item>
                                        )}

                                        {hasDeleteAccess && (
                                            <>
                                                <div className="my-1 border-b border-gray-200 dark:border-gray-600" />
                                                <Dropdown.Item
                                                    eventKey="delete"
                                                    onClick={() =>
                                                        handleDeleteProgramType(
                                                            programType,
                                                        )
                                                    }
                                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <HiOutlineTrash className="mr-2" />
                                                    Delete Program Type
                                                </Dropdown.Item>
                                            </>
                                        )}
                                    </Dropdown>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <Pagination
                            total={filteredProgramTypes.length}
                            pageSize={pageSize}
                            currentPage={currentPage}
                            onChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                )}
            </Card>
        </div>
    )
}

export default ProgramTypesListPage

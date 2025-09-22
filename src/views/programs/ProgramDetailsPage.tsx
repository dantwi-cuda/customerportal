import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { Card, Button, Alert, Skeleton, Tag } from '@/components/ui'
import {
    HiOutlineMail,
    HiOutlinePhone,
    HiOutlineCalendar,
    HiOutlineOfficeBuilding,
    HiOutlineArrowLeft,
    HiOutlineClipboardList,
    HiOutlineBadgeCheck,
    HiOutlineHashtag,
    HiOutlineInformationCircle,
} from 'react-icons/hi'
import ProgramService from '@/services/ProgramService'
import type { Program } from '@/@types/program'

const ProgramDetailsPage: React.FC = () => {
    const { user } = useAuth()
    const { programId } = useParams<{ programId: string }>()
    const navigate = useNavigate()

    const [program, setProgram] = useState<Program | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Check user permissions
    const isTenantAdmin = user?.authority?.some((role: string) =>
        ['Tenant-Admin'].includes(role),
    )

    const isPortalAdmin = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    // Determine the correct programs page URL based on user role
    const getProgramsPageUrl = () => {
        if (isPortalAdmin) {
            return '/tenantportal/programs'
        } else {
            return '/app/programs'
        }
    }

    useEffect(() => {
        if (programId) {
            loadProgram()
        }
    }, [programId])

    const loadProgram = async () => {
        if (!programId) return

        try {
            setLoading(true)
            setError(null)
            const programData = await ProgramService.getProgram(
                Number(programId),
            )
            setProgram(programData)
        } catch (error) {
            console.error('Error loading program:', error)
            setError('Failed to load program details')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string | null | undefined): string => {
        if (!dateString) return 'N/A'
        try {
            return new Date(dateString).toLocaleDateString()
        } catch {
            return 'N/A'
        }
    }

    // Access control
    if (!isTenantAdmin && !isPortalAdmin) {
        return (
            <Card>
                <Alert type="danger">
                    You do not have permission to access this page.
                </Alert>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton height="60px" />
                <Skeleton height="400px" />
            </div>
        )
    }

    if (error || !program) {
        return (
            <div className="space-y-6">
                <Card>
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="plain"
                            icon={<HiOutlineArrowLeft />}
                            onClick={() => navigate(getProgramsPageUrl())}
                        >
                            Back to Programs
                        </Button>
                    </div>
                </Card>
                <Card>
                    <Alert type="danger">{error || 'Program not found'}</Alert>
                </Card>
            </div>
        )
    }

    // Calculate active shops count
    const activeShopsCount =
        program.shopSubscriptions?.filter((sub) => sub.isActive).length || 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="plain"
                            icon={<HiOutlineArrowLeft />}
                            onClick={() => navigate(getProgramsPageUrl())}
                        >
                            Back to Programs
                        </Button>
                        <div>
                            <h4 className="mb-1">Program Details</h4>
                            <p className="text-gray-600">
                                View detailed information about this program
                            </p>
                        </div>
                    </div>
                    <Tag
                        className={
                            program.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                        }
                    >
                        {program.isActive ? 'Active' : 'Inactive'}
                    </Tag>
                </div>
            </Card>

            {/* Program Details */}
            <div className="space-y-6">
                {/* Basic Information */}
                <Card className="p-6">
                    <h6 className="text-lg font-medium text-gray-700 mb-4">
                        Basic Information
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                                Program Name
                            </label>
                            <p className="text-base font-medium">
                                {program.programName || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                                Program Type
                            </label>
                            <Tag className="bg-blue-100 text-blue-700">
                                {program.programTypeName || 'N/A'}
                            </Tag>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                                Description
                            </label>
                            <p className="text-base text-gray-600">
                                {program.programDescription ||
                                    'No description provided'}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Contact Information */}
                <Card className="p-6">
                    <h6 className="text-lg font-medium text-gray-700 mb-4">
                        Contact Information
                    </h6>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <HiOutlineMail className="w-5 h-5 text-gray-400" />
                            <div>
                                <label className="block text-sm font-medium text-gray-500">
                                    Contact Name
                                </label>
                                <p className="text-base">
                                    {program.contactName || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <HiOutlinePhone className="w-5 h-5 text-gray-400" />
                            <div>
                                <label className="block text-sm font-medium text-gray-500">
                                    Phone
                                </label>
                                <p className="text-base">
                                    {program.contactPhone || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <HiOutlineMail className="w-5 h-5 text-gray-400" />
                            <div>
                                <label className="block text-sm font-medium text-gray-500">
                                    Email
                                </label>
                                <p className="text-base">
                                    {program.contactEmail || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Program Timeline */}
                <Card className="p-6">
                    <h6 className="text-lg font-medium text-gray-700 mb-4">
                        Program Timeline
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <HiOutlineCalendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <label className="block text-sm font-medium text-gray-500">
                                    Start Date
                                </label>
                                <p className="text-base">
                                    {formatDate(program.startDate)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <HiOutlineCalendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <label className="block text-sm font-medium text-gray-500">
                                    End Date
                                </label>
                                <p className="text-base">
                                    {formatDate(program.endDate)}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Assignment Information */}
                <Card className="p-6">
                    <h6 className="text-lg font-medium text-gray-700 mb-4">
                        Assignment Information
                    </h6>
                    <div className="flex items-center gap-4">
                        <HiOutlineOfficeBuilding className="w-5 h-5 text-gray-400" />
                        <div>
                            <label className="block text-sm font-medium text-gray-500">
                                Active Shop Assignments
                            </label>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-blue-600">
                                    {activeShopsCount}
                                </span>
                                <span className="text-sm text-gray-500">
                                    shop{activeShopsCount !== 1 ? 's' : ''}{' '}
                                    currently assigned
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Program Specific Attributes */}
                {program.typeSpecificAttributes &&
                    Object.keys(program.typeSpecificAttributes).length > 0 && (
                        <Card className="p-6">
                            <h6 className="text-lg font-medium text-gray-700 mb-4">
                                Program Specific Attributes
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(
                                    program.typeSpecificAttributes,
                                ).map(([key, value]) => {
                                    // Format the display value based on type
                                    const formatValue = (val: any): string => {
                                        if (val === null || val === undefined)
                                            return 'N/A'

                                        // Check if it's a date string
                                        if (
                                            typeof val === 'string' &&
                                            val.match(
                                                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
                                            )
                                        ) {
                                            try {
                                                return new Date(
                                                    val,
                                                ).toLocaleString()
                                            } catch {
                                                return val
                                            }
                                        }

                                        // Check if it's a number
                                        if (typeof val === 'number') {
                                            return val.toLocaleString()
                                        }

                                        // Check if it's a boolean
                                        if (typeof val === 'boolean') {
                                            return val ? 'Yes' : 'No'
                                        }

                                        return val.toString()
                                    }

                                    // Get appropriate icon based on the key name
                                    const getAttributeIcon = (
                                        attributeKey: string,
                                    ) => {
                                        const keyLower =
                                            attributeKey.toLowerCase()
                                        if (
                                            keyLower.includes('account') ||
                                            keyLower.includes('chart')
                                        ) {
                                            return (
                                                <HiOutlineClipboardList className="w-4 h-4 text-blue-500" />
                                            )
                                        }
                                        if (
                                            keyLower.includes('date') ||
                                            keyLower.includes('time')
                                        ) {
                                            return (
                                                <HiOutlineCalendar className="w-4 h-4 text-green-500" />
                                            )
                                        }
                                        if (
                                            keyLower.includes('status') ||
                                            keyLower.includes('completion')
                                        ) {
                                            return (
                                                <HiOutlineBadgeCheck className="w-4 h-4 text-purple-500" />
                                            )
                                        }
                                        if (
                                            keyLower.includes('number') ||
                                            keyLower.includes('count')
                                        ) {
                                            return (
                                                <HiOutlineHashtag className="w-4 h-4 text-orange-500" />
                                            )
                                        }
                                        return (
                                            <HiOutlineInformationCircle className="w-4 h-4 text-gray-500" />
                                        )
                                    }

                                    // Get appropriate tag color based on value
                                    const getValueColor = (
                                        val: any,
                                        attributeKey: string,
                                    ): string => {
                                        if (typeof val === 'boolean') {
                                            return val
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                        }

                                        const keyLower =
                                            attributeKey.toLowerCase()
                                        const valLower = val
                                            ?.toString()
                                            .toLowerCase()

                                        if (keyLower.includes('status')) {
                                            if (
                                                valLower === 'complete' ||
                                                valLower === 'completed'
                                            ) {
                                                return 'bg-green-100 text-green-700'
                                            }
                                            if (
                                                valLower === 'pending' ||
                                                valLower === 'in progress'
                                            ) {
                                                return 'bg-yellow-100 text-yellow-700'
                                            }
                                            if (
                                                valLower === 'failed' ||
                                                valLower === 'error'
                                            ) {
                                                return 'bg-red-100 text-red-700'
                                            }
                                        }

                                        return 'bg-blue-100 text-blue-700'
                                    }

                                    const formattedValue = formatValue(value)
                                    const shouldUseTag =
                                        key.toLowerCase().includes('status') ||
                                        key
                                            .toLowerCase()
                                            .includes('completion') ||
                                        typeof value === 'boolean'

                                    return (
                                        <div
                                            key={key}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                        >
                                            <div className="flex items-start gap-3">
                                                {getAttributeIcon(key)}
                                                <div className="flex-1 min-w-0">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        {key}
                                                    </label>
                                                    {shouldUseTag ? (
                                                        <Tag
                                                            className={`${getValueColor(value, key)} font-medium`}
                                                        >
                                                            {formattedValue}
                                                        </Tag>
                                                    ) : (
                                                        <p className="text-base font-semibold text-gray-900 break-words">
                                                            {formattedValue}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>
                    )}

                {/* Metadata */}
                <Card className="p-6">
                    <h6 className="text-lg font-medium text-gray-700 mb-4">
                        Metadata
                    </h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                                Created By
                            </label>
                            <p className="text-base">
                                {program.createdByCustomerName || 'System'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                                Program ID
                            </label>
                            <p className="text-base font-mono">
                                {program.programId}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                                Created Date
                            </label>
                            <p className="text-base">
                                {formatDate(program.createdAt)}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                                Last Updated
                            </label>
                            <p className="text-base">
                                {formatDate(program.updatedAt)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default ProgramDetailsPage

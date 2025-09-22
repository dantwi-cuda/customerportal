import React from 'react'
import { Dialog, Card, Tag, Button } from '@/components/ui'
import {
    HiOutlineCalendar,
    HiOutlinePhone,
    HiOutlineMail,
    HiOutlineOfficeBuilding,
} from 'react-icons/hi'
import type { Program } from '@/@types/program'

interface ViewProgramDialogProps {
    isOpen: boolean
    onClose: () => void
    program: Program | null
}

const ViewProgramDialog: React.FC<ViewProgramDialogProps> = ({
    isOpen,
    onClose,
    program,
}) => {
    if (!program) return null

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString()
    }

    const activeShopsCount =
        program.shopSubscriptions?.filter((sub) => sub.isActive).length || 0

    return (
        <Dialog isOpen={isOpen} width={600} onRequestClose={onClose}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h5 className="text-lg font-semibold">Program Details</h5>
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

                <div className="space-y-6">
                    {/* Basic Information */}
                    <Card className="p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-3">
                            Basic Information
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Program Name
                                </label>
                                <p className="text-sm font-medium">
                                    {program.programName || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Program Type
                                </label>
                                <p className="text-sm">
                                    <Tag className="bg-blue-100 text-blue-700">
                                        {program.programTypeName || 'N/A'}
                                    </Tag>
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Description
                                </label>
                                <p className="text-sm text-gray-600">
                                    {program.programDescription ||
                                        'No description provided'}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Contact Information */}
                    <Card className="p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-3">
                            Contact Information
                        </h6>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <HiOutlineMail className="w-4 h-4 text-gray-400" />
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">
                                        Contact Name
                                    </label>
                                    <p className="text-sm">
                                        {program.contactName || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <HiOutlinePhone className="w-4 h-4 text-gray-400" />
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">
                                        Phone
                                    </label>
                                    <p className="text-sm">
                                        {program.contactPhone || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <HiOutlineMail className="w-4 h-4 text-gray-400" />
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">
                                        Email
                                    </label>
                                    <p className="text-sm">
                                        {program.contactEmail || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Program Timeline */}
                    <Card className="p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-3">
                            Program Timeline
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">
                                        Start Date
                                    </label>
                                    <p className="text-sm">
                                        {formatDate(program.startDate)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">
                                        End Date
                                    </label>
                                    <p className="text-sm">
                                        {formatDate(program.endDate)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Assignment Information */}
                    <Card className="p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-3">
                            Assignment Information
                        </h6>
                        <div className="flex items-center gap-3">
                            <HiOutlineOfficeBuilding className="w-4 h-4 text-gray-400" />
                            <div>
                                <label className="block text-xs font-medium text-gray-500">
                                    Active Shop Assignments
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                        {activeShopsCount}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        shop{activeShopsCount !== 1 ? 's' : ''}{' '}
                                        assigned
                                    </span>
                                </div>
                            </div>
                        </div>

                        {program.shopSubscriptions &&
                            program.shopSubscriptions.length > 0 && (
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-500 mb-2">
                                        Assigned Shops
                                    </label>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {program.shopSubscriptions
                                            .filter((sub) => sub.isActive)
                                            .slice(0, 5)
                                            .map((subscription, index) => (
                                                <div
                                                    key={index}
                                                    className="text-xs bg-gray-50 px-2 py-1 rounded"
                                                >
                                                    {subscription.shopName ||
                                                        `Shop ID: ${subscription.shopId}`}
                                                </div>
                                            ))}
                                        {activeShopsCount > 5 && (
                                            <div className="text-xs text-gray-500 italic">
                                                ... and {activeShopsCount - 5}{' '}
                                                more shops
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                    </Card>

                    {/* Metadata */}
                    <Card className="p-4">
                        <h6 className="text-sm font-medium text-gray-700 mb-3">
                            Metadata
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Created By
                                </label>
                                <p className="text-sm">
                                    {program.createdByCustomerName || 'System'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Program ID
                                </label>
                                <p className="text-sm font-mono">
                                    {program.programId}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Created Date
                                </label>
                                <p className="text-sm">
                                    {formatDate(program.createdAt)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Last Updated
                                </label>
                                <p className="text-sm">
                                    {formatDate(program.updatedAt)}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Type Specific Attributes */}
                    {program.typeSpecificAttributes &&
                        Object.keys(program.typeSpecificAttributes).length >
                            0 && (
                            <Card className="p-4">
                                <h6 className="text-sm font-medium text-gray-700 mb-3">
                                    Program Specific Attributes
                                </h6>
                                <div className="space-y-2">
                                    {Object.entries(
                                        program.typeSpecificAttributes,
                                    ).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="flex justify-between items-center"
                                        >
                                            <label className="text-xs font-medium text-gray-500">
                                                {key}
                                            </label>
                                            <span className="text-sm">
                                                {value?.toString() || 'N/A'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                </div>

                <div className="mt-6 flex justify-end">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </Dialog>
    )
}

export default ViewProgramDialog

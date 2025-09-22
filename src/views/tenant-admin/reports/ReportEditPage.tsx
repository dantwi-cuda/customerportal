import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    Notification,
    toast,
    FormContainer,
    FormItem,
    Select,
    Textarea,
} from '@/components/ui'
import { HiOutlineArrowLeft, HiOutlineSave } from 'react-icons/hi'
import * as ReportService from '@/services/ReportService'
import { useNavigate, useParams } from 'react-router-dom'
import type { Report, ReportCategory } from '@/@types/report'
import useAuth from '@/auth/useAuth'
import type { SingleValue } from 'react-select'

// Types for Select component
interface SelectOption {
    value: string
    label: string
}

const ReportEditPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const isNewReport = id === 'new'

    // State management
    const [report, setReport] = useState<Partial<Report>>({
        name: '',
        tenantDescription: '',
        reportCategoryId: 0,
    })
    const [categories, setCategories] = useState<ReportCategory[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Tenant admin check: User must have a tenantId to manage reports
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (isTenantAdmin) {
            fetchCategories()
            if (!isNewReport && id) {
                fetchReportDetails(id)
            }
        }
    }, [id, isTenantAdmin])

    const fetchReportDetails = async (reportId: string) => {
        setLoading(true)
        try {
            const data = await ReportService.getReportDetails(reportId)
            setReport(data)
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

    const fetchCategories = async () => {
        try {
            const data = await ReportService.getCategories()
            setCategories(data)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target
        setReport((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleCategoryChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return

        setReport((prev) => ({
            ...prev,
            tenantReportCategoryId: parseInt(newValue.value, 10),
        }))
    }

    const handleStatusChange = (newValue: SingleValue<SelectOption>) => {
        if (!newValue) return

        setReport((prev) => ({
            ...prev,
            isTenantEnabled: newValue.value === 'true',
        }))
    }

    const handleApprovalStatusChange = (
        newValue: SingleValue<SelectOption>,
    ) => {
        if (!newValue) return

        setReport((prev) => ({
            ...prev,
            isTenantApproved: newValue.value === 'true',
        }))
    }

    const handleSave = async () => {
        if (!report.name?.trim()) {
            toast.push(
                <Notification type="warning" title="Validation error">
                    Report name is required.
                </Notification>,
            )
            return
        }

        setSaving(true)
        try {
            console.log('=== REPORT SAVE PAYLOAD ===')
            console.log('Report ID:', id)
            console.log('Is New Report:', isNewReport)
            console.log('Payload being sent:', JSON.stringify(report, null, 2))
            console.log('==========================')

            if (isNewReport) {
                const result = await ReportService.createReport(report)
                console.log('Create Report Response:', result)
                toast.push(
                    <Notification type="success" title="Report created">
                        Report has been created successfully.
                    </Notification>,
                )
            } else if (id) {
                const result = await ReportService.updateReport(id, report)
                console.log('Update Report Response:', result)
                toast.push(
                    <Notification type="success" title="Report updated">
                        Report has been updated successfully.
                    </Notification>,
                )
            }
            navigate('/tenantportal/tenant/reports')
        } catch (error) {
            console.error('Error saving report:', error)
            console.error(
                'Failed payload was:',
                JSON.stringify(report, null, 2),
            )
            toast.push(
                <Notification type="danger" title="Error saving report">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        navigate('/tenantportal/tenant/reports')
    }

    // Category options for select
    const categoryOptions = categories.map((category) => ({
        value: category.id.toString(),
        label: category.name,
    }))

    // Find selected category
    const selectedCategory = categoryOptions.find(
        (option) => option.value === report.tenantReportCategoryId?.toString(),
    )

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
                            onClick={handleCancel}
                        >
                            Back to Reports
                        </Button>
                        <div>
                            <h4 className="mb-1">
                                {isNewReport ? 'Create Report' : 'Edit Report'}
                            </h4>
                            <p className="text-gray-600 text-sm">
                                {isNewReport
                                    ? 'Set up a new report in the system'
                                    : 'Update report information and settings'}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiOutlineSave />}
                        onClick={handleSave}
                        loading={saving}
                        disabled={!report.name?.trim()}
                        className="w-full sm:w-auto"
                    >
                        {isNewReport ? 'Create Report' : 'Save Changes'}
                    </Button>
                </div>
            </Card>

            {/* Content Card */}
            <Card>
                <div className="p-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <FormContainer>
                            <FormItem
                                label="Display Name"
                                invalid={!report.name?.trim()}
                                errorMessage="Report name is required"
                            >
                                <Input
                                    name="name"
                                    value={report.name || ''}
                                    onChange={handleInputChange}
                                    placeholder="Enter report name"
                                />
                            </FormItem>

                            <FormItem label="Description">
                                <Textarea
                                    name="tenantDescription"
                                    value={report.tenantDescription || ''}
                                    onChange={handleInputChange}
                                    placeholder="Enter report description"
                                    className="h-24"
                                />
                            </FormItem>

                            <FormItem label="Category">
                                <Select
                                    options={categoryOptions}
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
                                    placeholder="Select a category"
                                />
                            </FormItem>

                            {!isNewReport && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormItem label="Workspace">
                                            <Input
                                                value={
                                                    report.workspaceName || ''
                                                }
                                                disabled
                                            />
                                        </FormItem>

                                        <FormItem label="Status">
                                            <Select
                                                options={[
                                                    {
                                                        value: 'true',
                                                        label: 'Enabled',
                                                    },
                                                    {
                                                        value: 'false',
                                                        label: 'Disabled',
                                                    },
                                                ]}
                                                value={
                                                    report.isTenantEnabled !==
                                                    undefined
                                                        ? {
                                                              value: String(
                                                                  report.isTenantEnabled,
                                                              ),
                                                              label: report.isTenantEnabled
                                                                  ? 'Enabled'
                                                                  : 'Disabled',
                                                          }
                                                        : null
                                                }
                                                onChange={handleStatusChange}
                                                placeholder="Select status"
                                            />
                                        </FormItem>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormItem label="Approval Status">
                                            <Select
                                                options={[
                                                    {
                                                        value: 'true',
                                                        label: 'Approved',
                                                    },
                                                    {
                                                        value: 'false',
                                                        label: 'Pending Approval',
                                                    },
                                                ]}
                                                value={
                                                    report.isTenantApproved !==
                                                    undefined
                                                        ? {
                                                              value: String(
                                                                  report.isTenantApproved,
                                                              ),
                                                              label: report.isTenantApproved
                                                                  ? 'Approved'
                                                                  : 'Pending Approval',
                                                          }
                                                        : null
                                                }
                                                onChange={
                                                    handleApprovalStatusChange
                                                }
                                                placeholder="Select approval status"
                                            />
                                        </FormItem>

                                        <FormItem label="Last Updated">
                                            <Input
                                                value={
                                                    report.updatedAt
                                                        ? new Date(
                                                              report.updatedAt,
                                                          ).toLocaleString()
                                                        : 'N/A'
                                                }
                                                disabled
                                            />
                                        </FormItem>
                                    </div>
                                </>
                            )}
                        </FormContainer>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default ReportEditPage

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
        description: '',
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
            reportCategoryId: parseInt(newValue.value, 10),
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
            if (isNewReport) {
                await ReportService.createReport(report)
                toast.push(
                    <Notification type="success" title="Report created">
                        Report has been created successfully.
                    </Notification>,
                )
            } else if (id) {
                await ReportService.updateReport(id, report)
                toast.push(
                    <Notification type="success" title="Report updated">
                        Report has been updated successfully.
                    </Notification>,
                )
            }
            navigate('/tenantportal/tenant/reports')
        } catch (error) {
            console.error('Error saving report:', error)
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
        (option) => option.value === report.reportCategoryId?.toString(),
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
        <div className="p-2 sm:p-4">
            <div className="mb-4 flex items-center">
                <Button
                    size="sm"
                    icon={<HiOutlineArrowLeft />}
                    onClick={handleCancel}
                    variant="plain"
                >
                    Back to Reports
                </Button>
            </div>

            <Card>
                <div className="p-4">
                    <h4 className="mb-4">
                        {isNewReport ? 'Create Report' : 'Edit Report'}
                    </h4>

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
                                    name="description"
                                    value={report.description || ''}
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
                                    <FormItem label="Original Name">
                                        <Input
                                            value={report.originalName || ''}
                                            disabled
                                        />
                                    </FormItem>

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
                                            <div className="flex items-center h-10 px-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-2 ${report.isEnabled ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                ></span>
                                                <span>
                                                    {report.isEnabled
                                                        ? 'Enabled'
                                                        : 'Disabled'}
                                                </span>
                                            </div>
                                        </FormItem>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormItem label="Approval Status">
                                            <div className="flex items-center h-10 px-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-2 ${report.isApproved ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                                                ></span>
                                                <span>
                                                    {report.isApproved
                                                        ? 'Approved'
                                                        : 'Pending Approval'}
                                                </span>
                                            </div>
                                        </FormItem>

                                        <FormItem label="Last Updated">
                                            <Input
                                                value={
                                                    report.lastUpdated
                                                        ? new Date(
                                                              report.lastUpdated,
                                                          ).toLocaleString()
                                                        : 'N/A'
                                                }
                                                disabled
                                            />
                                        </FormItem>
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                                <Button
                                    variant="default"
                                    onClick={handleCancel}
                                    className="w-full sm:w-auto order-2 sm:order-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="solid"
                                    icon={<HiOutlineSave />}
                                    onClick={handleSave}
                                    loading={saving}
                                    className="w-full sm:w-auto order-1 sm:order-2"
                                >
                                    {isNewReport ? 'Create' : 'Save'}
                                </Button>
                            </div>
                        </FormContainer>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default ReportEditPage

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    Card,
    Button,
    Steps,
    Input,
    Select,
    FormItem,
    FormContainer,
    Checkbox,
    DatePicker,
    Tag,
    Avatar,
    Notification,
    toast,
    Alert,
} from '@/components/ui'
import {
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiOutlineCheck,
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineDocumentReport,
    HiOutlineUsers,
    HiOutlineMail,
    HiOutlineExclamation,
} from 'react-icons/hi'
import SubscriptionService from '@/services/SubscriptionService'
import ReportService from '@/services/ReportService'
import { usePermissionStore } from '@/store/permissionStore'
import useAuth from '@/auth/useAuth'
import UserTable from './components/UserTable'
import type {
    CreateSubscriptionDto,
    UpdateSubscriptionDto,
    ScheduleConfig,
} from '@/@types/subscription'

interface FormData {
    name: string
    description: string
    scheduleType: 'daily' | 'weekly' | 'monthly'
    scheduleConfig: ScheduleConfig
    scheduleStartDate: Date
    scheduleEndDate?: Date
    reportIds: string[]
    userIds: string[]
    emailSubject: string
    emailBody: string
    isActive: boolean
}

interface ReportOption {
    reportId: string
    reportName: string
    workspaceName?: string
    reportCategory?: string
}

interface UserOption {
    userId: string
    userName: string
    userEmail: string
}

const SubscriptionWizardPage = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditing = Boolean(id)
    const { hasPermission } = usePermissionStore()
    const { user } = useAuth()

    const [currentStep, setCurrentStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [reports, setReports] = useState<ReportOption[]>([])
    const [users, setUsers] = useState<UserOption[]>([])
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        scheduleType: 'daily',
        scheduleConfig: {
            dailyTime: '09:00',
        },
        scheduleStartDate: new Date(),
        reportIds: [],
        userIds: [],
        emailSubject: 'Scheduled Report',
        emailBody: 'Please find your scheduled report attached.',
        isActive: true,
    })

    // Permission checks
    const canCreate =
        hasPermission('subscription.create') ||
        hasPermission('subscription.all') ||
        user?.authority?.includes('Tenant-Admin')
    const canEdit =
        hasPermission('subscription.edit') ||
        hasPermission('subscription.all') ||
        user?.authority?.includes('Tenant-Admin')

    useEffect(() => {
        if (isEditing && !canEdit) {
            navigate('/subscriptions')
            return
        }
        if (!isEditing && !canCreate) {
            navigate('/subscriptions')
            return
        }

        loadInitialData()
    }, [id, isEditing, canCreate, canEdit])

    const loadInitialData = async () => {
        try {
            setLoading(true)

            // Load reports and users
            const [reportsData, usersData] = await Promise.all([
                ReportService.getReports(),
                // In a real app, you'd have a UserService.getUsers()
                // For now, we'll use a mock or leave empty
                Promise.resolve([]),
            ])

            setReports(
                reportsData.map((report: any) => ({
                    reportId: report.id,
                    reportName: report.name,
                    workspaceName: report.workspaceName,
                    reportCategory:
                        report.reportCategory || report.categoryName,
                })),
            )

            // If editing, load the subscription data
            if (isEditing && id) {
                const subscription = await SubscriptionService.getSubscription(
                    parseInt(id),
                )
                setFormData({
                    name: subscription.name,
                    description: subscription.description || '',
                    scheduleType: subscription.scheduleType as
                        | 'daily'
                        | 'weekly'
                        | 'monthly',
                    scheduleConfig: subscription.scheduleConfig,
                    scheduleStartDate: new Date(subscription.scheduleStartDate),
                    scheduleEndDate: subscription.scheduleEndDate
                        ? new Date(subscription.scheduleEndDate)
                        : undefined,
                    reportIds:
                        subscription.reports?.map((r) => String(r.reportId)) ||
                        [],
                    userIds:
                        (subscription.users
                            ?.map((u) => u.userId)
                            .filter(Boolean) as string[]) || [],
                    emailSubject: subscription.emailSubject,
                    emailBody: subscription.emailBody,
                    isActive: subscription.isActive,
                })
            }
        } catch (error) {
            console.error('Failed to load initial data:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to load data
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleScheduleTypeChange = (type: 'daily' | 'weekly' | 'monthly') => {
        let newConfig: ScheduleConfig = {}

        switch (type) {
            case 'daily':
                newConfig = { dailyTime: '09:00' }
                break
            case 'weekly':
                newConfig = { weeklyDays: [1], weeklyTime: '09:00' }
                break
            case 'monthly':
                newConfig = {
                    monthlyDay: 1,
                    monthlyTime: '09:00',
                    lastDayOfMonth: false,
                }
                break
        }

        setFormData((prev) => ({
            ...prev,
            scheduleType: type,
            scheduleConfig: newConfig,
        }))
    }

    const updateScheduleConfig = (updates: Partial<ScheduleConfig>) => {
        setFormData((prev) => ({
            ...prev,
            scheduleConfig: { ...prev.scheduleConfig, ...updates },
        }))
    }

    const handleSubmit = async () => {
        try {
            setLoading(true)

            const payload = {
                name: formData.name,
                description: formData.description,
                scheduleType: formData.scheduleType,
                scheduleConfig: formData.scheduleConfig,
                scheduleStartDate: formData.scheduleStartDate
                    .toISOString()
                    .split('T')[0],
                scheduleEndDate: formData.scheduleEndDate
                    ?.toISOString()
                    .split('T')[0],
                reportIds: formData.reportIds,
                userIds: formData.userIds,
                emailSubject: formData.emailSubject,
                emailBody: formData.emailBody,
                isActive: formData.isActive,
            }

            // Log the payload for debugging
            console.log('Subscription payload:', payload)

            if (isEditing && id) {
                await SubscriptionService.updateSubscription(
                    parseInt(id),
                    payload as unknown as UpdateSubscriptionDto,
                )
                toast.push(
                    <Notification type="success" title="Success">
                        Subscription updated successfully
                    </Notification>,
                )
            } else {
                await SubscriptionService.createSubscription(
                    payload as unknown as CreateSubscriptionDto,
                )
                toast.push(
                    <Notification type="success" title="Success">
                        Subscription created successfully
                    </Notification>,
                )
            }

            navigate('/subscriptions')
        } catch (error) {
            console.error('Failed to save subscription:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to save subscription
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const isStepValid = (step: number): boolean => {
        switch (step) {
            case 0: // Basic Info
                return Boolean(formData.name.trim())
            case 1: // Schedule
                return Boolean(formData.scheduleStartDate)
            case 2: // Reports
                return formData.reportIds.length > 0
            case 3: // Recipients
                return formData.userIds.length > 0
            case 4: // Email
                return Boolean(
                    formData.emailSubject.trim() && formData.emailBody.trim(),
                )
            default:
                return true
        }
    }

    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const steps = [
        {
            title: 'Basic Information',
            icon: <HiOutlineDocumentReport />,
        },
        {
            title: 'Schedule',
            icon: <HiOutlineClock />,
        },
        {
            title: 'Select Reports',
            icon: <HiOutlineDocumentReport />,
        },
        {
            title: 'Recipients',
            icon: <HiOutlineUsers />,
        },
        {
            title: 'Email Configuration',
            icon: <HiOutlineMail />,
        },
    ]

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Basic Information
                            </h3>
                            <div className="space-y-4">
                                <FormItem label="Subscription Name" asterisk>
                                    <Input
                                        placeholder="Enter subscription name"
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
                                        textArea
                                        placeholder="Enter description (optional)"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        rows={3}
                                    />
                                </FormItem>
                                <FormItem label="Status">
                                    <Checkbox
                                        key={`isActive-${formData.isActive}`}
                                        checked={formData.isActive}
                                        onChange={(checked) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                isActive: checked,
                                            }))
                                        }
                                    >
                                        <span className="text-sm sm:text-base">
                                            Active (subscription will run
                                            according to schedule)
                                        </span>
                                    </Checkbox>
                                </FormItem>
                            </div>
                        </div>
                    </div>
                )

            case 1:
                return (
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Schedule Configuration
                            </h3>
                            <div className="space-y-4">
                                <FormItem label="Schedule Type" asterisk>
                                    <Select<{
                                        value: string
                                        label: string
                                    }>
                                        value={{
                                            value: formData.scheduleType,
                                            label:
                                                formData.scheduleType ===
                                                'daily'
                                                    ? 'Daily'
                                                    : formData.scheduleType ===
                                                        'weekly'
                                                      ? 'Weekly'
                                                      : 'Monthly',
                                        }}
                                        onChange={(option) =>
                                            option &&
                                            handleScheduleTypeChange(
                                                option.value as
                                                    | 'daily'
                                                    | 'weekly'
                                                    | 'monthly',
                                            )
                                        }
                                        options={[
                                            { value: 'daily', label: 'Daily' },
                                            {
                                                value: 'weekly',
                                                label: 'Weekly',
                                            },
                                            {
                                                value: 'monthly',
                                                label: 'Monthly',
                                            },
                                        ]}
                                    />
                                </FormItem>

                                {formData.scheduleType === 'daily' && (
                                    <FormItem label="Time" asterisk>
                                        <Input
                                            type="time"
                                            value={
                                                formData.scheduleConfig
                                                    .dailyTime || '09:00'
                                            }
                                            onChange={(e) =>
                                                updateScheduleConfig({
                                                    dailyTime: e.target.value,
                                                })
                                            }
                                        />
                                    </FormItem>
                                )}

                                {formData.scheduleType === 'weekly' && (
                                    <div className="space-y-4">
                                        <FormItem label="Days of Week" asterisk>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                                                {[
                                                    'Sunday',
                                                    'Monday',
                                                    'Tuesday',
                                                    'Wednesday',
                                                    'Thursday',
                                                    'Friday',
                                                    'Saturday',
                                                ].map((day, index) => {
                                                    const dayIndex = index as
                                                        | 0
                                                        | 1
                                                        | 2
                                                        | 3
                                                        | 4
                                                        | 5
                                                        | 6
                                                    return (
                                                        <Checkbox
                                                            key={`${day}-${dayIndex}-${formData.scheduleConfig.weeklyDays?.includes(dayIndex)}`}
                                                            checked={
                                                                formData.scheduleConfig.weeklyDays?.includes(
                                                                    dayIndex,
                                                                ) || false
                                                            }
                                                            onChange={(
                                                                checked,
                                                            ) => {
                                                                const currentDays =
                                                                    formData
                                                                        .scheduleConfig
                                                                        .weeklyDays ||
                                                                    []
                                                                const newDays =
                                                                    checked
                                                                        ? [
                                                                              ...currentDays,
                                                                              dayIndex,
                                                                          ]
                                                                        : currentDays.filter(
                                                                              (
                                                                                  d,
                                                                              ) =>
                                                                                  d !==
                                                                                  dayIndex,
                                                                          )
                                                                updateScheduleConfig(
                                                                    {
                                                                        weeklyDays:
                                                                            newDays,
                                                                    },
                                                                )
                                                            }}
                                                        >
                                                            <span className="text-sm sm:text-base">
                                                                {day}
                                                            </span>
                                                        </Checkbox>
                                                    )
                                                })}
                                            </div>
                                        </FormItem>
                                        <FormItem label="Time" asterisk>
                                            <Input
                                                type="time"
                                                value={
                                                    formData.scheduleConfig
                                                        .weeklyTime || '09:00'
                                                }
                                                onChange={(e) =>
                                                    updateScheduleConfig({
                                                        weeklyTime:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </FormItem>
                                    </div>
                                )}

                                {formData.scheduleType === 'monthly' && (
                                    <div className="space-y-4">
                                        <FormItem
                                            label="Monthly Schedule"
                                            asterisk
                                        >
                                            <div className="space-y-3">
                                                <Checkbox
                                                    key={`lastDay-${formData.scheduleConfig.lastDayOfMonth}`}
                                                    checked={
                                                        formData.scheduleConfig
                                                            .lastDayOfMonth ||
                                                        false
                                                    }
                                                    onChange={(checked) =>
                                                        updateScheduleConfig({
                                                            lastDayOfMonth:
                                                                checked,
                                                        })
                                                    }
                                                >
                                                    <span className="text-sm sm:text-base">
                                                        Last day of month
                                                    </span>
                                                </Checkbox>
                                                {!formData.scheduleConfig
                                                    .lastDayOfMonth && (
                                                    <div className="max-w-xs">
                                                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                            Day of month
                                                        </label>
                                                        <Select<{
                                                            value: number
                                                            label: string
                                                        }>
                                                            value={{
                                                                value:
                                                                    formData
                                                                        .scheduleConfig
                                                                        .monthlyDay ||
                                                                    1,
                                                                label: String(
                                                                    formData
                                                                        .scheduleConfig
                                                                        .monthlyDay ||
                                                                        1,
                                                                ),
                                                            }}
                                                            onChange={(
                                                                option,
                                                            ) =>
                                                                option &&
                                                                updateScheduleConfig(
                                                                    {
                                                                        monthlyDay:
                                                                            option.value,
                                                                    },
                                                                )
                                                            }
                                                            options={Array.from(
                                                                { length: 31 },
                                                                (_, i) => ({
                                                                    value:
                                                                        i + 1,
                                                                    label: String(
                                                                        i + 1,
                                                                    ),
                                                                    key: i + 1,
                                                                }),
                                                            )}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </FormItem>
                                        <FormItem label="Time" asterisk>
                                            <Input
                                                type="time"
                                                value={
                                                    formData.scheduleConfig
                                                        .monthlyTime || '09:00'
                                                }
                                                onChange={(e) =>
                                                    updateScheduleConfig({
                                                        monthlyTime:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </FormItem>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormItem label="Start Date" asterisk>
                                        <DatePicker
                                            value={formData.scheduleStartDate}
                                            onChange={(date) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    scheduleStartDate:
                                                        date || new Date(),
                                                }))
                                            }
                                        />
                                    </FormItem>

                                    <FormItem label="End Date (Optional)">
                                        <DatePicker
                                            value={formData.scheduleEndDate}
                                            onChange={(date) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    scheduleEndDate:
                                                        date || undefined,
                                                }))
                                            }
                                        />
                                    </FormItem>
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Select Reports
                            </h3>
                            <p className="text-gray-600 mb-4 text-sm sm:text-base">
                                Choose the reports to include in this
                                subscription
                            </p>
                            {reports.length === 0 ? (
                                <Alert
                                    type="warning"
                                    showIcon
                                    title="No Reports Available"
                                >
                                    No reports are available for selection.
                                    Please create reports first.
                                </Alert>
                            ) : (
                                <FormItem label="Reports" asterisk>
                                    <Select
                                        isMulti
                                        isSearchable
                                        closeMenuOnSelect={false}
                                        placeholder="Search and select reports..."
                                        value={formData.reportIds.map(
                                            (reportId) => {
                                                const report = reports.find(
                                                    (r) =>
                                                        r.reportId === reportId,
                                                )
                                                if (!report) {
                                                    return {
                                                        value: reportId,
                                                        label: reportId,
                                                    }
                                                }
                                                const displayLabel = `${report.reportName}${
                                                    report.reportCategory
                                                        ? ` (${report.reportCategory})`
                                                        : ''
                                                }`
                                                return {
                                                    value: reportId,
                                                    label: displayLabel,
                                                    workspaceName:
                                                        report.workspaceName,
                                                    reportCategory:
                                                        report.reportCategory,
                                                }
                                            },
                                        )}
                                        onChange={(selectedOptions) => {
                                            const newReportIds = Array.isArray(
                                                selectedOptions,
                                            )
                                                ? selectedOptions.map(
                                                      (option) => option.value,
                                                  )
                                                : []
                                            setFormData((prev) => ({
                                                ...prev,
                                                reportIds: newReportIds,
                                            }))
                                        }}
                                        options={reports.map((report) => {
                                            const displayLabel = `${report.reportName}${
                                                report.reportCategory
                                                    ? ` (${report.reportCategory})`
                                                    : ''
                                            }`
                                            return {
                                                value: report.reportId,
                                                label: displayLabel,
                                                workspaceName:
                                                    report.workspaceName,
                                                reportCategory:
                                                    report.reportCategory,
                                            }
                                        })}
                                    />
                                </FormItem>
                            )}
                            {formData.reportIds.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Selected: {formData.reportIds.length}{' '}
                                        report(s)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Recipients
                            </h3>
                            <p className="text-gray-600 mb-4 text-sm sm:text-base">
                                Select users who will receive the scheduled
                                reports
                            </p>
                            <div className="overflow-x-auto">
                                <UserTable
                                    selectedUserIds={formData.userIds}
                                    onUserSelectionChange={(selectedIds) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            userIds: selectedIds,
                                        }))
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">
                                Email Configuration
                            </h3>
                            <div className="space-y-4">
                                <FormItem label="Email Subject" asterisk>
                                    <Input
                                        placeholder="Enter email subject"
                                        value={formData.emailSubject}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                emailSubject: e.target.value,
                                            }))
                                        }
                                    />
                                </FormItem>
                                <FormItem label="Email Body" asterisk>
                                    <Input
                                        textArea
                                        placeholder="Enter email body"
                                        value={formData.emailBody}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                emailBody: e.target.value,
                                            }))
                                        }
                                        rows={6}
                                        className="w-full resize-y"
                                    />
                                </FormItem>
                                <Alert
                                    type="info"
                                    showIcon
                                    title="Email Templates"
                                    className="break-words"
                                >
                                    <p className="text-sm">
                                        You can use placeholders like
                                        [REPORT_NAME], [DATE], [TIME] in your
                                        email content. These will be replaced
                                        with actual values when the email is
                                        sent.
                                    </p>
                                </Alert>
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    if (!canCreate && !isEditing) {
        return (
            <div className="p-6">
                <Card className="p-6 text-center">
                    <HiOutlineExclamation className="text-red-500 text-4xl mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        Access Denied
                    </h3>
                    <p className="text-gray-600">
                        You don't have permission to create subscriptions.
                    </p>
                </Card>
            </div>
        )
    }

    if (!canEdit && isEditing) {
        return (
            <div className="p-6">
                <Card className="p-6 text-center">
                    <HiOutlineExclamation className="text-red-500 text-4xl mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        Access Denied
                    </h3>
                    <p className="text-gray-600">
                        You don't have permission to edit subscriptions.
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-2 sm:p-4 space-y-4">
            {/* Header Card */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <Button
                            variant="plain"
                            icon={<HiOutlineArrowLeft />}
                            onClick={() => navigate('/subscriptions')}
                            className="self-start sm:self-auto"
                        >
                            Back
                        </Button>
                        <div>
                            <h4 className="mb-1">
                                {isEditing
                                    ? 'Edit Subscription'
                                    : 'Create Subscription'}
                            </h4>
                            <p className="text-gray-600">
                                {isEditing
                                    ? 'Update subscription details'
                                    : 'Set up automated report delivery'}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Content Card */}
            <Card className="w-full">
                <div className="p-4 sm:p-6">
                    {/* Steps */}
                    <div className="mb-6 sm:mb-8">
                        <div className="overflow-x-auto">
                            <Steps
                                current={currentStep}
                                className="mb-6 min-w-max"
                            >
                                {steps.map((step, index) => (
                                    <Steps.Item
                                        key={index}
                                        title={step.title}
                                    />
                                ))}
                            </Steps>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="w-full overflow-hidden">
                        <div className="min-h-[300px] sm:min-h-[400px]">
                            {renderStepContent()}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-6 border-t gap-4">
                        <div className="order-2 sm:order-1">
                            {currentStep > 0 && (
                                <Button
                                    variant="default"
                                    icon={<HiOutlineArrowLeft />}
                                    onClick={prevStep}
                                    disabled={loading}
                                    className="w-full sm:w-auto"
                                >
                                    Previous
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
                            <Button
                                variant="plain"
                                onClick={() => navigate('/subscriptions')}
                                disabled={loading}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>
                            {currentStep < steps.length - 1 ? (
                                <Button
                                    variant="solid"
                                    icon={<HiOutlineArrowRight />}
                                    onClick={nextStep}
                                    disabled={
                                        !isStepValid(currentStep) || loading
                                    }
                                    className="w-full sm:w-auto"
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    variant="solid"
                                    icon={<HiOutlineCheck />}
                                    onClick={handleSubmit}
                                    disabled={
                                        !isStepValid(currentStep) || loading
                                    }
                                    loading={loading}
                                    className="w-full sm:w-auto"
                                >
                                    {isEditing
                                        ? 'Update Subscription'
                                        : 'Create Subscription'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default SubscriptionWizardPage

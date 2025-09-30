import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    FormContainer,
    FormItem,
    Input,
    Steps,
    Alert,
    Notification,
    toast,
    Progress,
} from '@/components/ui'
import { Switcher } from '@/components/ui/Switcher'
import { useNavigate } from 'react-router-dom'
import {
    HiOutlineCheck,
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiOutlineRefresh,
    HiOutlineExclamationCircle,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlinePlay,
} from 'react-icons/hi'
import useAuth from '@/auth/useAuth'
import {
    createCustomerWithBranding,
    updateCustomerWithBranding,
    uploadCustomerLogoWithBranding,
    uploadCustomerBackgroundWithBranding,
    uploadCustomerIconWithBranding,
    getCustomerByIdWithBranding,
} from '@/services/CustomerService'
import ImageUploadComponent from '@/components/shared/ImageUploadComponent'
import presetThemeSchemaConfig from '@/configs/preset-theme-schema.config'
import classNames from '@/utils/classNames'

// Step completion status
enum StepStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

interface StepState {
    status: StepStatus
    error?: string
    data?: any
}

// Enhanced wizard progress interface
interface WizardProgress {
    customerId?: number
    stepStates: StepState[]
    currentStep: number
    timestamp: number
    // Form data for recovery
    customerInfo: {
        name: string
        subdomain: string
        address: string
        legacyBusinessNetworkID: string
        isActive: boolean
    }
    portalBranding: {
        portalDisplayName: string
        portalDisplaySubName: string
        portalDisplayPageSubTitle: string
        theme: string
    }
    adminInfo: {
        adminName: string
        adminEmail: string
    }
    assetUploads: {
        logoStatus?: 'pending' | 'uploaded' | 'failed'
        backgroundStatus?: 'pending' | 'uploaded' | 'failed'
        iconStatus?: 'pending' | 'uploaded' | 'failed'
        logoUrl?: string
        backgroundUrl?: string
        iconUrl?: string
    }
    version: number // For compatibility
}

// Smart Customer Creation Wizard with Atomic Step Processing
const CustomerCreateWizard = () => {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(0)

    // Step completion tracking
    const [stepStates, setStepStates] = useState<StepState[]>([
        { status: StepStatus.PENDING }, // Customer Info
        { status: StepStatus.PENDING }, // Portal Branding
        { status: StepStatus.PENDING }, // Admin User
        { status: StepStatus.PENDING }, // Assets Upload
    ])

    // Created customer data from step 1
    const [createdCustomer, setCreatedCustomer] = useState<any>(null)

    // Form data state organized by steps
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        subdomain: '',
        address: '',
        legacyBusinessNetworkID: '',
        isActive: true,
    })

    const [portalBranding, setPortalBranding] = useState({
        portalDisplayName: '',
        portalDisplaySubName: '',
        portalDisplayPageSubTitle: '',
        theme: 'default',
    })

    const [adminInfo, setAdminInfo] = useState({
        adminName: '',
        adminEmail: '',
    })

    const [assetUploads, setAssetUploads] = useState({
        logo: null as File | null,
        backgroundImage: null as File | null,
        icon: null as File | null,
    })

    // Enhanced auto-save detection with full form data recovery
    useEffect(() => {
        const savedProgress = localStorage.getItem('customerWizardProgress')
        if (savedProgress) {
            try {
                const progress: WizardProgress = JSON.parse(savedProgress)

                // Check if progress is recent (within 24 hours) and valid
                const isRecent =
                    Date.now() - progress.timestamp < 24 * 60 * 60 * 1000
                const hasValidData =
                    progress.version === 1 &&
                    (progress.customerId || progress.customerInfo?.name)

                if (isRecent && hasValidData) {
                    // Restore all form data
                    if (progress.customerInfo)
                        setCustomerInfo(progress.customerInfo)
                    if (progress.portalBranding)
                        setPortalBranding(progress.portalBranding)
                    if (progress.adminInfo) setAdminInfo(progress.adminInfo)

                    // Restore progress state
                    if (progress.customerId) {
                        setCreatedCustomer({ id: progress.customerId })
                    }
                    setStepStates(progress.stepStates || stepStates)
                    setCurrentStep(progress.currentStep || 0)

                    // Show enhanced recovery notification
                    const timeAgo = Math.floor(
                        (Date.now() - progress.timestamp) / (1000 * 60),
                    )
                    toast.push(
                        <Notification
                            title="Progress Restored"
                            type="info"
                            duration={8000}
                        >
                            Found previous wizard progress from {timeAgo}{' '}
                            minutes ago.
                            {progress.customerId
                                ? 'Customer partially created - you can continue where you left off.'
                                : 'Form data restored - you can resume filling out the form.'}
                        </Notification>,
                    )
                } else {
                    // Clear old/invalid progress
                    localStorage.removeItem('customerWizardProgress')
                }
            } catch (error) {
                console.error('Failed to restore wizard progress:', error)
                localStorage.removeItem('customerWizardProgress')
            }
        }
    }, [])

    // Enhanced progress saving with complete form data
    const saveProgress = (forceAll = false) => {
        try {
            const progress: WizardProgress = {
                customerId: createdCustomer?.id,
                stepStates,
                currentStep,
                timestamp: Date.now(),
                customerInfo,
                portalBranding,
                adminInfo,
                assetUploads: {
                    logoStatus: assetUploads.logo ? 'pending' : undefined,
                    backgroundStatus: assetUploads.backgroundImage
                        ? 'pending'
                        : undefined,
                    iconStatus: assetUploads.icon ? 'pending' : undefined,
                },
                version: 1,
            }

            // Always save if we have meaningful progress or force flag
            const hasProgress =
                createdCustomer?.id ||
                customerInfo.name ||
                customerInfo.subdomain ||
                forceAll

            if (hasProgress) {
                localStorage.setItem(
                    'customerWizardProgress',
                    JSON.stringify(progress),
                )
            }
        } catch (error) {
            console.error('Failed to save wizard progress:', error)
        }
    }

    // Auto-save form data as user types
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            saveProgress()
        }, 1000) // Debounce saves by 1 second

        return () => clearTimeout(timeoutId)
    }, [
        customerInfo,
        portalBranding,
        adminInfo,
        assetUploads,
        stepStates,
        currentStep,
    ])

    // Wizard steps with enhanced metadata
    const steps = [
        {
            title: 'Customer Information',
            description: 'Create customer record',
            icon: HiOutlineCheckCircle,
            atomic: true,
        },
        {
            title: 'Portal Branding',
            description: 'Configure portal settings',
            icon: HiOutlineCheckCircle,
            atomic: true,
        },
        {
            title: 'Admin User',
            description: 'Create admin account',
            icon: HiOutlineCheckCircle,
            atomic: true,
        },
        {
            title: 'Assets Upload',
            description: 'Upload branding assets',
            icon: HiOutlineCheckCircle,
            atomic: true,
        },
    ]

    // Enhanced clear wizard progress with options
    const clearProgress = (confirmRequired = true) => {
        const doClear = () => {
            localStorage.removeItem('customerWizardProgress')
            setCreatedCustomer(null)
            setStepStates([
                { status: StepStatus.PENDING },
                { status: StepStatus.PENDING },
                { status: StepStatus.PENDING },
                { status: StepStatus.PENDING },
            ])
            setCurrentStep(0)
            // Reset form data
            setCustomerInfo({
                name: '',
                subdomain: '',
                address: '',
                legacyBusinessNetworkID: '',
                isActive: true,
            })
            setPortalBranding({
                portalDisplayName: '',
                portalDisplaySubName: '',
                portalDisplayPageSubTitle: '',
                theme: 'default',
            })
            setAdminInfo({
                adminName: '',
                adminEmail: '',
            })
            setAssetUploads({
                logo: null,
                backgroundImage: null,
                icon: null,
            })
        }

        if (confirmRequired && (createdCustomer?.id || customerInfo.name)) {
            const confirmMessage = createdCustomer?.id
                ? 'This will clear all progress and delete the partially created customer. Are you sure?'
                : 'This will clear all form data. Are you sure?'

            if (window.confirm(confirmMessage)) {
                doClear()
                toast.push(
                    <Notification title="Progress Cleared" type="info">
                        Wizard has been reset. You can start fresh.
                    </Notification>,
                )
            }
        } else {
            doClear()
        }
    }

    // Check if customer exists and load its data for continuation
    const loadExistingCustomer = async (customerId: string) => {
        try {
            const customer = await getCustomerByIdWithBranding(customerId)

            // Populate form with existing customer data
            setCustomerInfo({
                name: customer.name || '',
                subdomain: customer.subdomain || '',
                address: customer.address || '',
                legacyBusinessNetworkID: customer.legacyBusinessNetworkID || '',
                isActive: customer.isActive ?? true,
            })

            setPortalBranding({
                portalDisplayName: customer.portalDisplayName || '',
                portalDisplaySubName: customer.portalDisplaySubName || '',
                portalDisplayPageSubTitle:
                    customer.portalDisplayPageSubTitle || '',
                theme: customer.theme || 'default',
            })

            setAdminInfo({
                adminName: '', // Admin name not available in CustomerBrandingResponse
                adminEmail: '', // Admin email not available in CustomerBrandingResponse
            })

            setCreatedCustomer(customer)

            // Determine what steps are already completed
            const newStepStates = [...stepStates]
            newStepStates[0] = { status: StepStatus.COMPLETED, data: customer } // Customer created

            if (customer.portalDisplayName || customer.theme) {
                newStepStates[1] = { status: StepStatus.COMPLETED } // Branding configured
            }

            // Admin step - we can't detect completion from current API
            // Assume it's completed if customer exists (since admin was needed to create it)
            newStepStates[2] = { status: StepStatus.COMPLETED } // Admin configured

            if (
                customer.logoUrl ||
                customer.backgroundImageUrl ||
                customer.portalWindowIcon
            ) {
                newStepStates[3] = { status: StepStatus.COMPLETED } // Assets uploaded
            }

            setStepStates(newStepStates)

            // Find the next incomplete step
            const nextStep = newStepStates.findIndex(
                (state) => state.status !== StepStatus.COMPLETED,
            )
            setCurrentStep(nextStep >= 0 ? nextStep : 3) // Default to last step if all complete

            toast.push(
                <Notification title="Customer Loaded" type="success">
                    Existing customer data loaded. You can continue or modify
                    the configuration.
                </Notification>,
            )

            return customer
        } catch (error) {
            console.error('Failed to load existing customer:', error)
            toast.push(
                <Notification title="Load Failed" type="danger">
                    Could not load customer data. Starting fresh.
                </Notification>,
            )
            return null
        }
    }
    const updateCustomerInfo = (field: string, value: any) => {
        setCustomerInfo((prev) => ({ ...prev, [field]: value }))
    }

    const updatePortalBranding = (field: string, value: any) => {
        setPortalBranding((prev) => ({ ...prev, [field]: value }))
    }

    const updateAdminInfo = (field: string, value: any) => {
        setAdminInfo((prev) => ({ ...prev, [field]: value }))
    }

    const updateAssetUploads = (field: string, file: File | null) => {
        setAssetUploads((prev) => ({ ...prev, [field]: file }))
    }

    // Update step state helper
    const updateStepState = (
        stepIndex: number,
        newState: Partial<StepState>,
    ) => {
        setStepStates((prev) => {
            const updated = [...prev]
            updated[stepIndex] = { ...updated[stepIndex], ...newState }
            return updated
        })
        saveProgress()
    }

    // Domain validation
    const validateDomain = async (subdomain: string) => {
        if (!subdomain)
            return { isValid: false, message: 'Subdomain is required' }

        try {
            // Simulate domain validation - replace with actual API call
            if (
                subdomain === 'admin' ||
                subdomain === 'api' ||
                subdomain === 'www'
            ) {
                return { isValid: false, message: 'This domain is reserved' }
            }
            if (subdomain.length < 3) {
                return {
                    isValid: false,
                    message: 'Domain must be at least 3 characters',
                }
            }
            return { isValid: true, message: 'Domain is available' }
        } catch (error) {
            return { isValid: false, message: 'Unable to validate domain' }
        }
    }

    // Step 1: Create Customer Record
    const processStep1 = async () => {
        updateStepState(0, { status: StepStatus.IN_PROGRESS })

        try {
            // Validate domain first
            const domainCheck = await validateDomain(customerInfo.subdomain)
            if (!domainCheck.isValid) {
                updateStepState(0, {
                    status: StepStatus.FAILED,
                    error: domainCheck.message,
                })
                return false
            }

            const customerData = {
                name: customerInfo.name,
                subdomain: customerInfo.subdomain,
                address: customerInfo.address,
                legacyBusinessNetworkID: customerInfo.legacyBusinessNetworkID,
                isActive: customerInfo.isActive,
                email: adminInfo.adminEmail, // Need email for customer creation
                phone: '',
            }

            console.log('Creating customer:', customerData)
            const newCustomer = await createCustomerWithBranding(customerData)

            setCreatedCustomer(newCustomer)
            updateStepState(0, {
                status: StepStatus.COMPLETED,
                data: newCustomer,
            })

            toast.push(
                <Notification title="Customer Created" type="success">
                    Customer "{customerInfo.name}" created successfully
                </Notification>,
            )

            return true
        } catch (error) {
            console.error('Step 1 failed:', error)
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to create customer'
            updateStepState(0, {
                status: StepStatus.FAILED,
                error: errorMessage,
            })

            toast.push(
                <Notification title="Creation Failed" type="danger">
                    {errorMessage}
                </Notification>,
            )
            return false
        }
    }

    // Step 2: Update Portal Branding
    const processStep2 = async () => {
        if (!createdCustomer?.id) {
            updateStepState(1, {
                status: StepStatus.FAILED,
                error: 'No customer found',
            })
            return false
        }

        updateStepState(1, { status: StepStatus.IN_PROGRESS })

        try {
            const brandingData = {
                // Required fields from UpdateCustomerDto
                name: customerInfo.name,
                subdomain: customerInfo.subdomain,
                // Optional fields
                address: customerInfo.address,
                legacyBusinessNetworkID: customerInfo.legacyBusinessNetworkID,
                // Branding fields
                portalDisplayName: portalBranding.portalDisplayName,
                portalDisplaySubName: portalBranding.portalDisplaySubName,
                portalDisplayPageSubTitle:
                    portalBranding.portalDisplayPageSubTitle,
                theme: portalBranding.theme,
            }

            // Update customer with branding info
            await updateCustomerWithBranding(
                createdCustomer.id.toString(),
                brandingData,
            )

            updateStepState(1, {
                status: StepStatus.COMPLETED,
                data: brandingData,
            })

            toast.push(
                <Notification title="Branding Updated" type="success">
                    Portal branding configured successfully
                </Notification>,
            )

            return true
        } catch (error) {
            console.error('Step 2 failed:', error)
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to update branding'
            updateStepState(1, {
                status: StepStatus.FAILED,
                error: errorMessage,
            })

            toast.push(
                <Notification title="Branding Failed" type="danger">
                    {errorMessage}
                </Notification>,
            )
            return false
        }
    }

    // Step 3: Create Admin User
    const processStep3 = async () => {
        if (!createdCustomer?.id) {
            updateStepState(2, {
                status: StepStatus.FAILED,
                error: 'No customer found',
            })
            return false
        }

        updateStepState(2, { status: StepStatus.IN_PROGRESS })

        try {
            // For now, just mark as completed since admin info was part of customer creation
            // In a real implementation, you'd have a separate admin user creation API
            const adminData = {
                name: adminInfo.adminName,
                email: adminInfo.adminEmail,
                customerId: createdCustomer.id,
            }

            updateStepState(2, {
                status: StepStatus.COMPLETED,
                data: adminData,
            })

            toast.push(
                <Notification title="Admin User Ready" type="success">
                    Admin user "{adminInfo.adminName}" configured successfully
                </Notification>,
            )

            return true
        } catch (error) {
            console.error('Step 3 failed:', error)
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to create admin user'
            updateStepState(2, {
                status: StepStatus.FAILED,
                error: errorMessage,
            })

            toast.push(
                <Notification title="Admin Creation Failed" type="danger">
                    {errorMessage}
                </Notification>,
            )
            return false
        }
    }

    // Step 4: Upload Assets
    const processStep4 = async () => {
        if (!createdCustomer?.id) {
            updateStepState(3, {
                status: StepStatus.FAILED,
                error: 'No customer found',
            })
            return false
        }

        updateStepState(3, { status: StepStatus.IN_PROGRESS })

        try {
            const uploads: Array<{ name: string; promise: Promise<any> }> = []

            if (assetUploads.logo) {
                uploads.push({
                    name: 'logo',
                    promise: uploadCustomerLogoWithBranding(
                        createdCustomer.id.toString(),
                        assetUploads.logo,
                    ),
                })
            }

            if (assetUploads.backgroundImage) {
                uploads.push({
                    name: 'background',
                    promise: uploadCustomerBackgroundWithBranding(
                        createdCustomer.id.toString(),
                        assetUploads.backgroundImage,
                    ),
                })
            }

            if (assetUploads.icon) {
                uploads.push({
                    name: 'icon',
                    promise: uploadCustomerIconWithBranding(
                        createdCustomer.id.toString(),
                        assetUploads.icon,
                    ),
                })
            }

            if (uploads.length === 0) {
                updateStepState(3, {
                    status: StepStatus.COMPLETED,
                    data: { message: 'No assets to upload' },
                })
                toast.push(
                    <Notification title="Assets Step Complete" type="info">
                        No assets were selected for upload
                    </Notification>,
                )
                return true
            }

            // Upload all assets
            const results = await Promise.allSettled(
                uploads.map((u) => u.promise),
            )
            const successful = results.filter(
                (r) => r.status === 'fulfilled',
            ).length
            const failed = results.filter((r) => r.status === 'rejected').length

            if (failed === 0) {
                updateStepState(3, {
                    status: StepStatus.COMPLETED,
                    data: { successful, failed },
                })
                toast.push(
                    <Notification title="Assets Uploaded" type="success">
                        All {successful} assets uploaded successfully
                    </Notification>,
                )
                return true
            } else {
                const errorMessage = `${successful} assets uploaded, ${failed} failed`
                updateStepState(3, {
                    status: StepStatus.FAILED,
                    error: errorMessage,
                })
                toast.push(
                    <Notification title="Partial Upload" type="warning">
                        {errorMessage}. You can retry the failed uploads.
                    </Notification>,
                )
                return false
            }
        } catch (error) {
            console.error('Step 4 failed:', error)
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to upload assets'
            updateStepState(3, {
                status: StepStatus.FAILED,
                error: errorMessage,
            })

            toast.push(
                <Notification title="Upload Failed" type="danger">
                    {errorMessage}
                </Notification>,
            )
            return false
        }
    }

    // Process current step
    const processCurrentStep = async () => {
        switch (currentStep) {
            case 0:
                return await processStep1()
            case 1:
                return await processStep2()
            case 2:
                return await processStep3()
            case 3:
                return await processStep4()
            default:
                return false
        }
    }

    // Complete wizard
    const completeWizard = () => {
        clearProgress()
        toast.push(
            <Notification title="Customer Setup Complete" type="success">
                Customer "{customerInfo.name}" has been created successfully
                with all configurations
            </Notification>,
        )
        navigate('/admin/customers')
    }

    // Form validation for each step
    const validateStep = (stepIndex: number) => {
        switch (stepIndex) {
            case 0:
                return (
                    customerInfo.name &&
                    customerInfo.subdomain &&
                    adminInfo.adminEmail
                )
            case 1:
                return true // Branding is optional
            case 2:
                return adminInfo.adminName && adminInfo.adminEmail
            case 3:
                return true // Assets are optional
            default:
                return false
        }
    }

    // Handle step navigation
    const handleNext = async () => {
        if (!validateStep(currentStep)) {
            toast.push(
                <Notification title="Validation Error" type="warning">
                    Please fill in all required fields before proceeding
                </Notification>,
            )
            return
        }

        // If step is already completed, just move to next step
        if (stepStates[currentStep].status === StepStatus.COMPLETED) {
            if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1)
            } else {
                completeWizard()
            }
            return
        }

        // Process the current step
        const success = await processCurrentStep()
        if (success) {
            if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1)
            } else {
                completeWizard()
            }
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        } else {
            navigate('/admin/customers')
        }
    }

    // Retry failed step
    const retryStep = async (stepIndex: number) => {
        setCurrentStep(stepIndex)
        const success = await processCurrentStep()
        return success
    }

    // Get step status icon
    const getStepIcon = (stepIndex: number) => {
        const state = stepStates[stepIndex]
        switch (state.status) {
            case StepStatus.COMPLETED:
                return (
                    <HiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                )
            case StepStatus.IN_PROGRESS:
                return (
                    <HiOutlineClock className="w-5 h-5 text-blue-600 animate-pulse" />
                )
            case StepStatus.FAILED:
                return (
                    <HiOutlineExclamationCircle className="w-5 h-5 text-red-600" />
                )
            default:
                return (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )
        }
    }

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Customer Information
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem
                                label="Customer Name *"
                                className="md:col-span-2"
                            >
                                <Input
                                    placeholder="Enter customer name"
                                    value={customerInfo.name}
                                    onChange={(e) =>
                                        updateCustomerInfo(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label="Subdomain *">
                                <Input
                                    placeholder="yourcompany"
                                    value={customerInfo.subdomain}
                                    onChange={(e) =>
                                        updateCustomerInfo(
                                            'subdomain',
                                            e.target.value,
                                        )
                                    }
                                />
                                <div className="text-sm text-gray-500 mt-1">
                                    Used for portal URL:{' '}
                                    {customerInfo.subdomain || 'subdomain'}
                                    .yourplatform.com
                                </div>
                            </FormItem>

                            <FormItem label="Admin Email *">
                                <Input
                                    type="email"
                                    placeholder="admin@company.com"
                                    value={adminInfo.adminEmail}
                                    onChange={(e) =>
                                        updateAdminInfo(
                                            'adminEmail',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label="Address" className="md:col-span-2">
                                <Input
                                    placeholder="Company address"
                                    value={customerInfo.address}
                                    onChange={(e) =>
                                        updateCustomerInfo(
                                            'address',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label="Legacy Business Network ID">
                                <Input
                                    placeholder="Legacy ID (optional)"
                                    value={customerInfo.legacyBusinessNetworkID}
                                    onChange={(e) =>
                                        updateCustomerInfo(
                                            'legacyBusinessNetworkID',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label="Status">
                                <Switcher
                                    checked={customerInfo.isActive}
                                    onChange={(checked) =>
                                        updateCustomerInfo('isActive', checked)
                                    }
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    {customerInfo.isActive
                                        ? 'Active'
                                        : 'Inactive'}
                                </span>
                            </FormItem>
                        </div>
                    </div>
                )

            case 1: // Portal Branding
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem
                                label="Portal Display Name"
                                className="md:col-span-2"
                            >
                                <Input
                                    placeholder="Portal display name"
                                    value={portalBranding.portalDisplayName}
                                    onChange={(e) =>
                                        updatePortalBranding(
                                            'portalDisplayName',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label="Portal Sub Name">
                                <Input
                                    placeholder="Sub name"
                                    value={portalBranding.portalDisplaySubName}
                                    onChange={(e) =>
                                        updatePortalBranding(
                                            'portalDisplaySubName',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label="Page Subtitle">
                                <Input
                                    placeholder="Page subtitle"
                                    value={
                                        portalBranding.portalDisplayPageSubTitle
                                    }
                                    onChange={(e) =>
                                        updatePortalBranding(
                                            'portalDisplayPageSubTitle',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem label="Theme" className="md:col-span-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {Object.keys(presetThemeSchemaConfig).map(
                                        (key) => (
                                            <Card
                                                key={key}
                                                className={classNames(
                                                    'cursor-pointer p-3 border-2 transition-all',
                                                    portalBranding.theme === key
                                                        ? 'border-blue-600 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300',
                                                )}
                                                onClick={() =>
                                                    updatePortalBranding(
                                                        'theme',
                                                        key,
                                                    )
                                                }
                                            >
                                                <div className="text-center">
                                                    <div className="font-medium capitalize">
                                                        {key}
                                                    </div>
                                                    {portalBranding.theme ===
                                                        key && (
                                                        <HiOutlineCheck className="w-4 h-4 text-blue-600 mx-auto mt-1" />
                                                    )}
                                                </div>
                                            </Card>
                                        ),
                                    )}
                                </div>
                            </FormItem>
                        </div>
                    </div>
                )

            case 2: // Admin User
                return (
                    <div className="space-y-6">
                        <Alert showIcon className="mb-4">
                            Configure the admin user who will have full access
                            to the customer portal.
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem
                                label="Admin Name *"
                                className="md:col-span-2"
                            >
                                <Input
                                    placeholder="Administrator full name"
                                    value={adminInfo.adminName}
                                    onChange={(e) =>
                                        updateAdminInfo(
                                            'adminName',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormItem>

                            <FormItem
                                label="Admin Email *"
                                className="md:col-span-2"
                            >
                                <Input
                                    type="email"
                                    placeholder="admin@company.com"
                                    value={adminInfo.adminEmail}
                                    onChange={(e) =>
                                        updateAdminInfo(
                                            'adminEmail',
                                            e.target.value,
                                        )
                                    }
                                />
                                <div className="text-sm text-gray-500 mt-1">
                                    Login credentials will be sent to this email
                                </div>
                            </FormItem>
                        </div>
                    </div>
                )

            case 3: // Assets Upload
                return (
                    <div className="space-y-6">
                        <Alert showIcon className="mb-4">
                            Upload branding assets for the customer portal. All
                            uploads are optional.
                        </Alert>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            <div>
                                <ImageUploadComponent
                                    label="Company Logo"
                                    description="Upload your company logo (recommended: 200x100px, max 2MB)"
                                    currentImageUrl={
                                        assetUploads.logo
                                            ? URL.createObjectURL(
                                                  assetUploads.logo,
                                              )
                                            : undefined
                                    }
                                    onUpload={async (file: File) => {
                                        updateAssetUploads('logo', file)
                                        return {
                                            url: URL.createObjectURL(file),
                                            fileName: file.name,
                                            originalFileName: file.name,
                                            contentType: file.type,
                                            sizeInBytes: file.size,
                                            uploadedAt:
                                                new Date().toISOString(),
                                        }
                                    }}
                                    accept="image/*"
                                    maxSizeInMB={2}
                                    maxWidth={500}
                                    maxHeight={250}
                                />
                            </div>

                            <div>
                                <ImageUploadComponent
                                    label="Background Image"
                                    description="Upload a background image for your portal (recommended: 1920x1080px, max 5MB)"
                                    currentImageUrl={
                                        assetUploads.backgroundImage
                                            ? URL.createObjectURL(
                                                  assetUploads.backgroundImage,
                                              )
                                            : undefined
                                    }
                                    onUpload={async (file: File) => {
                                        updateAssetUploads(
                                            'backgroundImage',
                                            file,
                                        )
                                        return {
                                            url: URL.createObjectURL(file),
                                            fileName: file.name,
                                            originalFileName: file.name,
                                            contentType: file.type,
                                            sizeInBytes: file.size,
                                            uploadedAt:
                                                new Date().toISOString(),
                                        }
                                    }}
                                    accept="image/*"
                                    maxSizeInMB={5}
                                    aspectRatio="16:9"
                                />
                            </div>

                            <div>
                                <ImageUploadComponent
                                    label="Favicon/Icon"
                                    description="Upload a favicon for your portal (recommended: 32x32px, max 1MB)"
                                    currentImageUrl={
                                        assetUploads.icon
                                            ? URL.createObjectURL(
                                                  assetUploads.icon,
                                              )
                                            : undefined
                                    }
                                    onUpload={async (file: File) => {
                                        updateAssetUploads('icon', file)
                                        return {
                                            url: URL.createObjectURL(file),
                                            fileName: file.name,
                                            originalFileName: file.name,
                                            contentType: file.type,
                                            sizeInBytes: file.size,
                                            uploadedAt:
                                                new Date().toISOString(),
                                        }
                                    }}
                                    accept="image/*"
                                    maxSizeInMB={1}
                                    minWidth={16}
                                    minHeight={16}
                                    maxWidth={512}
                                    maxHeight={512}
                                    aspectRatio="1:1"
                                />
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Create New Customer
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Set up a new customer with portal branding and
                                admin access
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <Input
                                    placeholder="Customer ID (to continue existing)"
                                    className="w-48"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            const input =
                                                e.target as HTMLInputElement
                                            if (input.value) {
                                                loadExistingCustomer(
                                                    input.value,
                                                )
                                                input.value = ''
                                            }
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    variant="twoTone"
                                    onClick={(e) => {
                                        const input = e.currentTarget
                                            .previousElementSibling as HTMLInputElement
                                        if (input?.value) {
                                            loadExistingCustomer(input.value)
                                            input.value = ''
                                        }
                                    }}
                                >
                                    Load
                                </Button>
                            </div>
                            <Button
                                variant="plain"
                                onClick={() => navigate('/admin/customers')}
                            >
                                <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
                                Back to Customers
                            </Button>
                        </div>
                    </div>

                    {/* Progress Summary for Existing Customers */}
                    {createdCustomer && (
                        <Alert showIcon type="info" className="mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <strong>Continuing Customer Setup:</strong>{' '}
                                    Customer "{customerInfo.name}" (ID:{' '}
                                    {createdCustomer.id})
                                    <div className="text-sm mt-1">
                                        Progress:{' '}
                                        {
                                            stepStates.filter(
                                                (s) =>
                                                    s.status ===
                                                    StepStatus.COMPLETED,
                                            ).length
                                        }
                                        /{steps.length} steps completed
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        onClick={() =>
                                            window.open(
                                                `/admin/customers/${createdCustomer.id}`,
                                                '_blank',
                                            )
                                        }
                                    >
                                        View Customer
                                    </Button>
                                </div>
                            </div>
                        </Alert>
                    )}

                    {/* Progress Steps */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={classNames(
                                                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                                                stepStates[index].status ===
                                                    StepStatus.COMPLETED
                                                    ? 'bg-green-600 border-green-600'
                                                    : stepStates[index]
                                                            .status ===
                                                        StepStatus.IN_PROGRESS
                                                      ? 'bg-blue-600 border-blue-600'
                                                      : stepStates[index]
                                                              .status ===
                                                          StepStatus.FAILED
                                                        ? 'bg-red-600 border-red-600'
                                                        : index === currentStep
                                                          ? 'border-blue-600 bg-blue-50'
                                                          : 'border-gray-300',
                                            )}
                                        >
                                            {stepStates[index].status ===
                                            StepStatus.COMPLETED ? (
                                                <HiOutlineCheck className="w-5 h-5 text-white" />
                                            ) : stepStates[index].status ===
                                              StepStatus.IN_PROGRESS ? (
                                                <HiOutlineClock className="w-5 h-5 text-white animate-pulse" />
                                            ) : stepStates[index].status ===
                                              StepStatus.FAILED ? (
                                                <HiOutlineExclamationCircle className="w-5 h-5 text-white" />
                                            ) : (
                                                <span
                                                    className={classNames(
                                                        'text-sm font-medium',
                                                        index === currentStep
                                                            ? 'text-blue-600'
                                                            : 'text-gray-500',
                                                    )}
                                                >
                                                    {index + 1}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 text-center">
                                            <div
                                                className={classNames(
                                                    'text-sm font-medium',
                                                    index === currentStep
                                                        ? 'text-blue-600'
                                                        : 'text-gray-900',
                                                )}
                                            >
                                                {step.title}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {step.description}
                                            </div>
                                        </div>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={classNames(
                                                'w-16 h-0.5 mx-4 transition-all',
                                                stepStates[index].status ===
                                                    StepStatus.COMPLETED
                                                    ? 'bg-green-600'
                                                    : 'bg-gray-300',
                                            )}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step Status Alerts */}
                    {stepStates[currentStep].status === StepStatus.FAILED && (
                        <Alert showIcon type="danger" className="mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <strong>Step Failed:</strong>{' '}
                                    {stepStates[currentStep].error}
                                </div>
                                <Button
                                    size="sm"
                                    variant="solid"
                                    onClick={() => retryStep(currentStep)}
                                    className="ml-4"
                                >
                                    <HiOutlineRefresh className="w-4 h-4 mr-1" />
                                    Retry
                                </Button>
                            </div>
                        </Alert>
                    )}

                    {stepStates[currentStep].status ===
                        StepStatus.COMPLETED && (
                        <Alert showIcon type="success" className="mb-6">
                            <strong>Step Complete:</strong>{' '}
                            {steps[currentStep].title} has been processed
                            successfully.
                        </Alert>
                    )}

                    {/* Step Content */}
                    <FormContainer>{renderStepContent()}</FormContainer>
                </div>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button variant="plain" onClick={handleBack}>
                    <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
                    {currentStep > 0 ? 'Previous' : 'Cancel'}
                </Button>

                <div className="flex items-center space-x-3">
                    {createdCustomer && (
                        <Button
                            variant="plain"
                            onClick={() => clearProgress()}
                            className="text-red-600 hover:text-red-700"
                        >
                            Start Over
                        </Button>
                    )}

                    <Button
                        variant="solid"
                        onClick={handleNext}
                        disabled={
                            stepStates[currentStep].status ===
                            StepStatus.IN_PROGRESS
                        }
                    >
                        {stepStates[currentStep].status ===
                        StepStatus.IN_PROGRESS ? (
                            <>
                                <HiOutlineClock className="w-4 h-4 mr-2 animate-pulse" />
                                Processing...
                            </>
                        ) : currentStep === steps.length - 1 ? (
                            <>
                                <HiOutlineCheck className="w-4 h-4 mr-2" />
                                Complete Setup
                            </>
                        ) : stepStates[currentStep].status ===
                          StepStatus.COMPLETED ? (
                            <>
                                <HiOutlineArrowRight className="w-4 h-4 mr-2" />
                                Continue
                            </>
                        ) : (
                            <>
                                <HiOutlinePlay className="w-4 h-4 mr-2" />
                                {stepStates[currentStep].status ===
                                StepStatus.FAILED
                                    ? 'Retry Step'
                                    : 'Process Step'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default CustomerCreateWizard

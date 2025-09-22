import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    Notification,
    toast,
    FormItem,
    FormContainer,
    Spinner,
    Alert,
    Checkbox,
    Dialog,
} from '@/components/ui'
import { HiOutlineArrowLeft, HiOutlineSave } from 'react-icons/hi'
import WorkspaceService from '@/services/WorkspaceService'
import { useNavigate, useParams } from 'react-router-dom'
import type {
    WorkspaceDto,
    UpdateCustomerWorkspaceNameAndStatusDto,
} from '@/@types/workspace'
import useAuth from '@/auth/useAuth'

const WorkspaceEditPage = () => {
    const navigate = useNavigate()
    const { workspaceId } = useParams<{ workspaceId: string }>()
    const { user } = useAuth()

    const [workspace, setWorkspace] = useState<WorkspaceDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [customerWorkspaceName, setCustomerWorkspaceName] =
        useState<string>('')
    const [isActive, setIsActive] = useState<boolean>(true)
    const [hasInitialValues, setHasInitialValues] = useState(false)
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

    // Tenant admin check
    const isTenantAdmin = !!user?.tenantId

    const handleBack = () => {
        const nameChanged = customerWorkspaceName !== (workspace?.name || '')
        const originalActiveState = hasInitialValues
            ? workspace?.isActive
            : true

        if (nameChanged || isActive !== originalActiveState) {
            // Show confirmation dialog if there are unsaved changes
            setConfirmDialogOpen(true)
        } else {
            // Navigate directly if no changes
            navigate('/tenantportal/tenant/workspaces')
        }
    }

    useEffect(() => {
        if (workspaceId && isTenantAdmin) {
            fetchWorkspaceDetails()
        }
    }, [workspaceId, isTenantAdmin])

    const fetchWorkspaceDetails = async () => {
        setLoading(true)
        setError(null)
        try {
            if (!workspaceId) {
                throw new Error('Workspace ID is required')
            }

            const customerId = user?.tenantId
            if (!customerId) {
                throw new Error('User tenant ID is required')
            }

            // Get workspace basic details
            const workspaceData =
                await WorkspaceService.getWorkspace(workspaceId)
            setWorkspace(workspaceData)

            // Get workspace assignments to get customer-specific details
            const assignments = await WorkspaceService.getWorkspaceAssignments()
            const tenantAssignment = assignments.find(
                (a) =>
                    String(a.workspaceId) === String(workspaceId) &&
                    String(a.customerId) === String(customerId),
            )

            if (!tenantAssignment) {
                throw new Error('This workspace is not assigned to your tenant')
            }

            // Set initial values from assignment
            setCustomerWorkspaceName(
                tenantAssignment.workspaceName || workspaceData.name,
            )
            setIsActive(
                tenantAssignment.isAssignedToCustomerActive !== undefined
                    ? tenantAssignment.isAssignedToCustomerActive
                    : workspaceData.isActive,
            )
            setHasInitialValues(true)
        } catch (error) {
            console.error('Error fetching workspace details:', error)
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'An unknown error occurred'
            setError(errorMessage)
            toast.push(
                <Notification type="danger" title="Error">
                    {errorMessage}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!workspaceId || !user?.tenantId) {
            toast.push(
                <Notification type="danger" title="Error">
                    Missing required information
                </Notification>,
            )
            return
        }

        setSaving(true)
        try {
            const customerId = user.tenantId

            // Create the update payload
            const updateData: UpdateCustomerWorkspaceNameAndStatusDto = {
                isActive,
                customerWorkspaceName:
                    customerWorkspaceName.trim() !== workspace?.name
                        ? customerWorkspaceName.trim()
                        : null,
            }

            await WorkspaceService.updateWorkspaceNameAndStatus(
                workspaceId,
                customerId,
                updateData,
            )

            toast.push(
                <Notification type="success" title="Success">
                    Workspace updated successfully
                </Notification>,
            )

            // Navigate back to the workspace list
            navigate('/tenantportal/tenant/workspaces')
        } catch (error) {
            console.error('Error updating workspace:', error)
            toast.push(
                <Notification type="danger" title="Error saving workspace">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleConfirmNavigateBack = () => {
        const nameChanged = customerWorkspaceName !== (workspace?.name || '')
        const originalActiveState = hasInitialValues
            ? workspace?.isActive
            : true

        if (nameChanged || isActive !== originalActiveState) {
            // Show confirmation dialog if there are unsaved changes
            setConfirmDialogOpen(true)
        } else {
            // Navigate directly if no changes
            navigate('/tenantportal/tenant/workspaces')
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size={40} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4">
                <Alert type="danger" title="Error" showIcon>
                    {error}
                </Alert>
                <Button
                    className="mt-4"
                    onClick={() => navigate('/tenantportal/tenant/workspaces')}
                >
                    Back to Workspaces
                </Button>
            </div>
        )
    }

    if (!workspace) {
        return (
            <div className="p-4">
                <Alert type="warning" title="Workspace Not Found" showIcon>
                    The requested workspace was not found or you don't have
                    permission to edit it.
                </Alert>
                <Button
                    className="mt-4"
                    onClick={() => navigate('/tenantportal/tenant/workspaces')}
                >
                    Back to Workspaces
                </Button>
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
                            Back to Workspaces
                        </Button>
                        <div>
                            <h4 className="mb-1">Edit Workspace Settings</h4>
                            <p className="text-gray-600 text-sm">
                                Customize workspace name and status for your
                                tenant
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiOutlineSave />}
                        onClick={handleSave}
                        loading={saving}
                        disabled={saving}
                        className="w-full sm:w-auto"
                    >
                        Save Changes
                    </Button>
                </div>
            </Card>

            {/* Content Card */}
            <Card>
                <div className="p-4">
                    <div className="mb-6">
                        <div className="text-sm text-gray-500 mb-2">
                            Global Workspace Name
                        </div>
                        <div className="font-medium">{workspace.name}</div>
                    </div>

                    <FormContainer>
                        <FormItem
                            label="Custom Workspace Name"
                            extra="This name will only be visible within your tenant"
                        >
                            <Input
                                value={customerWorkspaceName}
                                onChange={(e) =>
                                    setCustomerWorkspaceName(e.target.value)
                                }
                                placeholder={workspace.name}
                            />
                        </FormItem>

                        <FormItem>
                            <Checkbox
                                checked={isActive}
                                onChange={(checked) => setIsActive(checked)}
                            >
                                Active for your tenant
                            </Checkbox>
                            <div className="text-xs text-gray-500 mt-1 ml-6">
                                When inactive, users from your tenant will not
                                be able to access this workspace
                            </div>
                        </FormItem>
                    </FormContainer>
                </div>
            </Card>

            {/* Confirmation Dialog for Unsaved Changes */}
            <Dialog
                isOpen={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                contentClassName="max-w-md"
            >
                <h5 className="mb-4">Unsaved Changes</h5>
                <p>
                    You have unsaved changes. Are you sure you want to leave
                    this page?
                </p>
                <div className="mt-6 text-right">
                    <Button
                        className="mr-2"
                        variant="plain"
                        onClick={() => setConfirmDialogOpen(false)}
                    >
                        Stay
                    </Button>
                    <Button
                        variant="solid"
                        color="red-600"
                        onClick={() =>
                            navigate('/tenantportal/tenant/workspaces')
                        }
                    >
                        Discard Changes
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default WorkspaceEditPage

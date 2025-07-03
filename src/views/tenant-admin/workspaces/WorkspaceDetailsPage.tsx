import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Notification,
    toast,
    Spinner,
    Alert,
    Badge,
} from '@/components/ui'
import WorkspaceService from '@/services/WorkspaceService'
import { useNavigate, useParams } from 'react-router-dom'
import type { WorkspaceDto } from '@/@types/workspace'
import useAuth from '@/auth/useAuth'
import {
    HiOutlineExternalLink,
    HiOutlinePencilAlt,
    HiOutlineUserGroup,
} from 'react-icons/hi'

const WorkspaceDetailsPage = () => {
    const navigate = useNavigate()
    const { workspaceId } = useParams<{ workspaceId: string }>()
    const { user } = useAuth()

    const [workspace, setWorkspace] = useState<WorkspaceDto | null>(null)
    const [customWorkspaceName, setCustomWorkspaceName] = useState<
        string | null
    >(null)
    const [isActive, setIsActive] = useState<boolean | undefined>(undefined)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Tenant admin check
    const isTenantAdmin = !!user?.tenantId

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
            const assignments = await WorkspaceService.getWorkspaceAssignments()            console.log("Looking for assignment with workspaceId:", workspaceId, "and customerId:", customerId);
            console.log("All assignments:", assignments);
            
            const tenantAssignment = assignments.find(
                (a) => {
                    // Debug logging
                    console.log("Checking assignment:", a);
                    console.log("Comparing workspaceId:", a.workspaceId, "===", workspaceId, "Result:", a.workspaceId === workspaceId);
                    console.log("Comparing customerId:", String(a.customerId), "===", String(customerId), "Result:", String(a.customerId) === String(customerId));
                    
                    // Make sure both IDs are strings for consistent comparison
                    return String(a.workspaceId) === String(workspaceId) && 
                           String(a.customerId) === String(customerId);
                }
            )
            
            console.log("Found tenant assignment:", tenantAssignment);

            if (!tenantAssignment) {
                throw new Error('This workspace is not assigned to your tenant')
            }

            // Set customer-specific info
            if (tenantAssignment.workspaceName !== workspaceData.name) {
                setCustomWorkspaceName(tenantAssignment.workspaceName)
            }

            setIsActive(tenantAssignment.isAssignedToCustomerActive)
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
                    permission to view it.
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
        <div className="p-4 max-w-4xl mx-auto">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 className="text-lg font-medium">Workspace Details</h3>
                <Button
                    onClick={() => navigate('/tenantportal/tenant/workspaces')}
                >
                    Back to Workspaces
                </Button>
            </div>

            <Card className="mb-6">
                <div className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-xl font-semibold mb-1">
                                {customWorkspaceName || workspace.name}
                            </h4>
                            {customWorkspaceName && (
                                <p className="text-sm text-gray-500">
                                    Original name: {workspace.name}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                icon={<HiOutlinePencilAlt />}
                                onClick={() =>
                                    navigate(
                                        `/tenantportal/tenant/workspaces/${workspaceId}/edit`,
                                    )
                                }
                            >
                                Edit
                            </Button>
                            <Button
                                size="sm"
                                icon={<HiOutlineUserGroup />}
                                onClick={() =>
                                    navigate(
                                        `/tenantportal/tenant/workspaces/${workspaceId}/assignments`,
                                    )
                                }
                            >
                                Assignments
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        {isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200">
                                Active
                            </Badge>
                        ) : (
                            <Badge className="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200">
                                Inactive
                            </Badge>
                        )}
                    </div>

                    <div className="mt-6">
                        <div className="font-medium mb-2">
                            Workspace Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    ID
                                </div>
                                <div>{workspace.workspaceId}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Description
                                </div>
                                <div>
                                    {workspace.description || 'No description'}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Global Status
                                </div>
                                <div>
                                    {workspace.isActive ? (
                                        <Badge className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200">
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200">
                                            Inactive
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">
                                    Validation Status
                                </div>
                                <div>
                                    {workspace.isValidated ? (
                                        <Badge className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200">
                                            Validated
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-200">
                                            Not Validated
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="font-medium mb-2">Actions</div>
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                onClick={() =>
                                    navigate(
                                        `/tenantportal/tenant/workspaces/${workspaceId}/edit`,
                                    )
                                }
                                icon={<HiOutlinePencilAlt />}
                            >
                                Edit Name & Status
                            </Button>
                            <Button
                                onClick={() =>
                                    navigate(
                                        `/tenantportal/tenant/workspaces/${workspaceId}/assignments`,
                                    )
                                }
                                icon={<HiOutlineUserGroup />}
                            >
                                Manage Assignments
                            </Button>
                            {workspace.isActive && isActive && (
                                <Button
                                    variant="solid"
                                    color="blue-600"
                                    icon={<HiOutlineExternalLink />}
                                >
                                    Open Workspace
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default WorkspaceDetailsPage

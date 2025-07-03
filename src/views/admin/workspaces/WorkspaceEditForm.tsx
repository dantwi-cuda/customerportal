import React, { useState, useEffect } from 'react'
import {
    Input,
    Button,
    FormItem,
    FormContainer,
    Alert,
    Checkbox,
    Select,
    Notification,
    toast,
    Card,
} from '@/components/ui'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import { Workspace, UpdateWorkspaceDto } from '@/@types/workspace'
import WorkspaceService from '@/services/WorkspaceService'
import { useNavigate, useParams } from 'react-router-dom'
import Spinner from '@/components/ui/Spinner'
import { HiOutlineArrowLeft } from 'react-icons/hi'

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Workspace name is required'),
    description: Yup.string(),
    workspaceId: Yup.string().required('Workspace ID is required'),
    isActive: Yup.boolean(),
})

const WorkspaceEditForm: React.FC = () => {
    const navigate = useNavigate()
    const { workspaceId } = useParams<{ workspaceId: string }>()
    const [workspace, setWorkspace] = useState<Workspace | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (!workspaceId) {
            setLoading(false)
            setErrorMessage('Workspace ID is missing.')
            toast.push(
                <Notification title="Error" type="danger" duration={0}>
                    Workspace ID is missing.
                </Notification>,
            )
            return
        }

        setLoading(true) // Start loading
        WorkspaceService.getWorkspace(workspaceId)
            .then((apiData: any) => {
                setLoading(false)
                console.log('API Response Data:', apiData) // Log the raw API response

                // Check if essential data like id or name is missing or blank from API response
                if (
                    !apiData ||
                    typeof apiData.id === 'undefined' ||
                    !apiData.name || // Checks for null, undefined, empty string, 0, false
                    (typeof apiData.name === 'string' &&
                        apiData.name.trim() === '') // Explicitly checks for blank string
                ) {
                    console.error(
                        'API response missing critical data (id or name), or name is blank: ',
                        apiData,
                    )
                    setErrorMessage(
                        'Failed to load essential workspace details (ID or Name missing or blank from server response).',
                    )
                    toast.push(
                        <Notification
                            title="Load Error"
                            type="danger"
                            duration={0}
                        >
                            Essential workspace data (ID/Name) missing or blank
                            from server response. Please check the workspace or
                            contact support.
                        </Notification>,
                    )
                    setWorkspace(null) // Ensure the error UI is triggered
                    return
                }

                // Transform API data to the frontend Workspace model
                const transformedWorkspace: Workspace = {
                    id: String(apiData.id), // API sends number, frontend Workspace type wants string
                    workspaceId:
                        apiData.workspaceID !== null &&
                        typeof apiData.workspaceID !== 'undefined'
                            ? String(apiData.workspaceID)
                            : '', // API sends workspaceID (note casing), map to string. If null/undefined, map to empty string.
                    name: apiData.name,
                    description: apiData.description || undefined, // Ensure optional fields are undefined if not present
                    isActive:
                        apiData.isActive !== undefined
                            ? apiData.isActive
                            : true,
                    isValidated:
                        apiData.isValidated !== undefined
                            ? apiData.isValidated
                            : false,
                    createdAt: String(apiData.createdAt || ''), // Ensure string, handle potential null
                    updatedAt: String(apiData.updatedAt || ''), // Ensure string, handle potential null
                    status:
                        apiData.status ||
                        (apiData.isActive ? 'ACTIVE' : 'INACTIVE'), // Derive status if not directly provided
                    // assignedCustomerIds: apiData.assignedCustomerIds || [], // Uncomment and adjust if this field is part of your API response and Workspace type
                }

                console.log(
                    'Transformed Workspace Object:',
                    transformedWorkspace,
                ) // Log the transformed workspace object
                setWorkspace(transformedWorkspace)
            })
            .catch((error: any) => {
                setLoading(false)
                console.error('Error fetching workspace:', error)
                const message =
                    error?.response?.data?.message ||
                    error?.message ||
                    'Failed to fetch workspace details. The workspace may not exist or there was a network issue.'
                setErrorMessage(message)
                toast.push(
                    <Notification
                        title="Fetch Error"
                        type="danger"
                        duration={0}
                    >
                        {message}
                    </Notification>,
                )
                setWorkspace(null) // Ensure the error UI is triggered
            })
    }, [workspaceId])

    const initialFormValues = React.useMemo(() => {
        // This memo recalculates initialValues whenever the workspace state changes.
        console.log('useMemo running, workspace:', workspace)

        // The guard `if (errorMessage || !workspace)` before Formik renders ensures `workspace` is not null here.
        if (!workspace) {
            // Fallback if workspace is somehow null when Formik tries to use these values,
            // though the surrounding conditional rendering should prevent this.
            return {
                workspaceId: '',
                name: '',
                description: '',
                isActive: true,
            }
        }
        const values = {
            workspaceId: workspace.workspaceId || '',
            name: workspace.name || '',
            description: workspace.description || '',
            isActive:
                workspace.isActive === undefined ? true : workspace.isActive,
        }
        console.log('Form Initial Values:', values) // Log the form initial values
        return values
    }, [workspace])

    const handleSubmit = async (
        values: UpdateWorkspaceDto,
        { setSubmitting }: any,
    ) => {
        if (!workspaceId) return
        setSubmitting(true)
        setErrorMessage(null)
        try {
            await WorkspaceService.updateWorkspace(workspaceId, values)
            toast.push(
                <Notification title="Workspace Updated" type="success">
                    Workspace "{values.name || workspace?.name}" has been
                    successfully updated.
                </Notification>,
            )
            navigate('/tenantportal/workspaces')
        } catch (error: any) {
            console.error('Error updating workspace:', error)
            setErrorMessage(
                error.message ||
                    'Failed to update workspace. Please try again.',
            )
            toast.push(
                <Notification title="Update Failed" type="danger">
                    {error.message || 'Failed to update workspace.'}
                </Notification>,
            )
        }
        setSubmitting(false)
    }

    const handleCancel = () => {
        navigate('/tenantportal/workspaces')
    }

    if (loading) {
        return (
            <Card className="mb-4">
                <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <Spinner size={40} />
                        <div className="mt-2">Loading workspace details...</div>
                    </div>
                </div>
            </Card>
        )
    }

    if (errorMessage || !workspace) {
        return (
            <Card className="mb-4">
                <div className="p-4">
                    <Alert type="danger" showIcon>
                        {errorMessage || 'Workspace data could not be loaded.'}
                    </Alert>
                    <div className="mt-4">
                        <Button
                            onClick={handleCancel}
                            icon={<HiOutlineArrowLeft />}
                        >
                            Back to Workspaces
                        </Button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="mb-4">
            <div className="flex items-center justify-between mb-4">
                <h4>Edit Workspace: {workspace.name}</h4>
            </div>
            <Formik
                key={workspace.id} // Add key prop here
                initialValues={initialFormValues} // Use the memoized initialValues
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ errors, touched, isSubmitting, values }) => {
                    console.log('Current Formik Values:', values) // Log current values
                    return (
                        <Form>
                            <FormContainer>
                                <FormItem
                                    label="Workspace ID"
                                    invalid={Boolean(
                                        errors.workspaceId &&
                                            touched.workspaceId,
                                    )}
                                    errorMessage={errors.workspaceId}
                                >
                                    <Field name="workspaceId">
                                        {({ field }: any) => (
                                            <Input
                                                {...field}
                                                type="text"
                                                placeholder="Enter workspace ID"
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                                <FormItem
                                    label="Workspace Name"
                                    invalid={Boolean(
                                        errors.name && touched.name,
                                    )}
                                    errorMessage={errors.name}
                                >
                                    <Field name="name">
                                        {({ field }: any) => (
                                            <Input
                                                {...field}
                                                type="text"
                                                placeholder="Enter workspace name"
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                                <FormItem
                                    label="Description (Optional)"
                                    invalid={Boolean(
                                        errors.description &&
                                            touched.description,
                                    )}
                                    errorMessage={errors.description}
                                >
                                    <Field name="description">
                                        {({ field }: any) => (
                                            <Input
                                                {...field}
                                                placeholder="Enter workspace description"
                                                textArea
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                                <FormItem label="Status">
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                            <Field
                                                type="checkbox"
                                                name="isActive"
                                                className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                Active
                                            </span>
                                        </label>
                                        {/* The Field for isValidated has been removed */}
                                    </div>
                                </FormItem>
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        type="button"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="solid"
                                        color="blue-600"
                                        loading={isSubmitting}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting
                                            ? 'Updating...'
                                            : 'Update Workspace'}
                                    </Button>
                                </div>
                            </FormContainer>
                        </Form>
                    )
                }}
            </Formik>
        </Card>
    )
}

export default WorkspaceEditForm

import React, { useState } from 'react'
import {
    Input,
    Button,
    FormItem,
    FormContainer,
    Alert,
    Card,
    Checkbox,
    Notification,
    toast,
} from '@/components/ui'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import { CreateWorkspaceDto } from '@/@types/workspace'
import WorkspaceService from '@/services/WorkspaceService'
import { useNavigate } from 'react-router-dom'
import { HiOutlineArrowLeft } from 'react-icons/hi'

const validationSchema = Yup.object().shape({
    workspaceId: Yup.string().required('Workspace ID is required'),
    name: Yup.string().required('Workspace name is required'),
    description: Yup.string(),
    isActive: Yup.boolean(),
    isValidated: Yup.boolean(),
})

const WorkspaceCreateForm: React.FC = () => {
    const navigate = useNavigate()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleSubmit = async (
        values: CreateWorkspaceDto,
        { setSubmitting }: any,
    ) => {
        setSubmitting(true)
        setErrorMessage(null)
        try {
            await WorkspaceService.createWorkspace(values)
            toast.push(
                <Notification title="Workspace Created" type="success">
                    Workspace "{values.name}" has been successfully created.
                </Notification>,
            )
            navigate('/tenantportal/workspaces')
        } catch (error: any) {
            console.error('Error creating workspace:', error)
            setErrorMessage(
                error.message ||
                    'Failed to create workspace. Please try again.',
            )
            toast.push(
                <Notification title="Creation Failed" type="danger">
                    {error.message || 'Failed to create workspace.'}
                </Notification>,
            )
        }
        setSubmitting(false)
    }

    const handleCancel = () => {
        navigate('/tenantportal/workspaces')
    }

    return (
        <Card className="mb-4">
            <div className="flex items-center justify-between mb-4">
                <h4>Create New Workspace</h4>
            </div>
            {errorMessage && (
                <Alert type="danger" showIcon className="mb-4">
                    {errorMessage}
                </Alert>
            )}
            <Formik
                initialValues={{
                    workspaceId: '',
                    name: '',
                    description: '',
                    isActive: true,
                    isValidated: false,
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, isSubmitting, values }) => (
                    <Form>
                        <FormContainer>
                            <FormItem
                                label="Workspace ID"
                                invalid={Boolean(
                                    errors.workspaceId && touched.workspaceId,
                                )}
                                errorMessage={errors.workspaceId}
                            >
                                <Field
                                    type="text"
                                    name="workspaceId"
                                    placeholder="Enter workspace ID"
                                    component={Input}
                                />
                            </FormItem>
                            <FormItem
                                label="Workspace Name"
                                invalid={Boolean(errors.name && touched.name)}
                                errorMessage={errors.name}
                            >
                                <Field
                                    type="text"
                                    name="name"
                                    placeholder="Enter workspace name"
                                    component={Input}
                                />
                            </FormItem>
                            <FormItem
                                label="Description (Optional)"
                                invalid={Boolean(
                                    errors.description && touched.description,
                                )}
                                errorMessage={errors.description}
                            >
                                <Field
                                    name="description"
                                    placeholder="Enter workspace description"
                                    component={Input}
                                    textArea
                                />
                            </FormItem>
                            <FormItem label="Status">
                                <div className="flex flex-col gap-2">
                                    <Field name="isActive">
                                        {({ field }: any) => (
                                            <Checkbox
                                                checked={field.value}
                                                onChange={(e) =>
                                                    field.onChange({
                                                        ...field,
                                                        target: {
                                                            ...field.target,
                                                            value: e,
                                                        },
                                                    })
                                                }
                                            >
                                                Active
                                            </Checkbox>
                                        )}
                                    </Field>
                                    <Field name="isValidated">
                                        {({ field }: any) => (
                                            <Checkbox
                                                checked={field.value}
                                                onChange={(e) =>
                                                    field.onChange({
                                                        ...field,
                                                        target: {
                                                            ...field.target,
                                                            value: e,
                                                        },
                                                    })
                                                }
                                            >
                                                Validated
                                            </Checkbox>
                                        )}
                                    </Field>
                                </div>
                            </FormItem>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" onClick={handleCancel}>
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
                                        ? 'Creating...'
                                        : 'Create Workspace'}
                                </Button>
                            </div>
                        </FormContainer>
                    </Form>
                )}
            </Formik>
        </Card>
    )
}

export default WorkspaceCreateForm

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
    workspaceID: Yup.string().required('Workspace ID is required'),
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

        // Create the payload with systemName assigned to the same value as name
        const payload = {
            ...values,
            systemName: values.name, // Assign workspace name to systemName
        }

        // Debug: Log the payload being sent to the API
        console.log('Workspace creation payload:', payload)
        console.log(
            'Workspace creation payload JSON:',
            JSON.stringify(payload, null, 2),
        )

        try {
            const result = await WorkspaceService.createWorkspace(payload)
            console.log('Workspace creation result:', result)

            toast.push(
                <Notification title="Workspace Created" type="success">
                    Workspace "{values.name}" has been successfully created.
                </Notification>,
            )
            navigate('/tenantportal/workspaces')
        } catch (error: any) {
            console.error('Error creating workspace:', error)
            console.error('Error response:', error.response?.data)
            setErrorMessage(
                error.response?.data?.message ||
                    error.message ||
                    'Failed to create workspace. Please try again.',
            )
            toast.push(
                <Notification title="Creation Failed" type="danger">
                    {error.response?.data?.message ||
                        error.message ||
                        'Failed to create workspace.'}
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
                    workspaceID: '',
                    name: '',
                    description: '',
                    isActive: true,
                    isValidated: false,
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, isSubmitting, values }) => {
                    // Debug: Log form values to help troubleshoot
                    console.log('Form values:', values)
                    console.log('Form errors:', errors)
                    console.log('Form touched:', touched)

                    return (
                        <Form>
                            <FormContainer>
                                <FormItem
                                    label="Workspace ID"
                                    invalid={Boolean(
                                        errors.workspaceID &&
                                            touched.workspaceID,
                                    )}
                                    errorMessage={errors.workspaceID}
                                >
                                    <Field name="workspaceID">
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
                                        <Field name="isActive">
                                            {({ field, form }: any) => (
                                                <Checkbox
                                                    checked={field.value}
                                                    onChange={(checked) =>
                                                        form.setFieldValue(
                                                            'isActive',
                                                            checked,
                                                        )
                                                    }
                                                >
                                                    Active
                                                </Checkbox>
                                            )}
                                        </Field>
                                        <Field name="isValidated">
                                            {({ field, form }: any) => (
                                                <Checkbox
                                                    checked={field.value}
                                                    onChange={(checked) =>
                                                        form.setFieldValue(
                                                            'isValidated',
                                                            checked,
                                                        )
                                                    }
                                                >
                                                    Validated
                                                </Checkbox>
                                            )}
                                        </Field>
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
                                            ? 'Creating...'
                                            : 'Create Workspace'}
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

export default WorkspaceCreateForm

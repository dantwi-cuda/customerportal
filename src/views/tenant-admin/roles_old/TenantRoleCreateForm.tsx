import React, { useState, useEffect } from 'react' // Added useEffect
import { useNavigate } from 'react-router-dom'
import {
    Button,
    Input,
    FormContainer,
    FormItem,
    Textarea,
} from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { AdaptiveCard } from '@/components/shared'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import RoleService from '@/services/RoleService'
import PermissionService from '@/services/PermissionService' // Import PermissionService
import useAuth from '@/auth/useAuth'
import { CreateRoleDto } from '@/@types/role'
import { Permission } from '@/@types/permission' // Import Permission type
import { HiOutlinePlusCircle } from 'react-icons/hi'
import { Notification } from '@/components/ui/Notification'
import toast from '@/components/ui/toast/toast'

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Role name is required'),
    description: Yup.string(),
    permissions: Yup.array()
        .of(Yup.string())
        .min(1, 'At least one permission is required'), // Validate permissions
})

const TenantRoleCreateForm = () => {
    const navigate = useNavigate()
    const { user: tenantAdminUser } = useAuth()
    const [permissions, setPermissions] = useState<Permission[]>([]) // State for available permissions
    const [loadingPermissions, setLoadingPermissions] = useState(true)

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                setLoadingPermissions(true)
                const fetchedPermissions =
                    await PermissionService.getPermissions() // response is now Permission[]
                setPermissions(fetchedPermissions || []) // Use fetchedPermissions directly
            } catch (error) {
                console.error('Failed to fetch permissions:', error)
                toast.push(
                    <Notification title="Error" type="danger" duration={2500}>
                        Failed to load permissions.
                    </Notification>,
                )
            } finally {
                setLoadingPermissions(false)
            }
        }
        fetchPermissions()
    }, [])

    const initialValues = {
        name: '',
        description: '',
        permissions: [], // Initialize with empty array for selected permissions
    }

    const handleSubmit = async (
        values: typeof initialValues,
        { setSubmitting, setFieldError }: any,
    ) => {
        setSubmitting(true)
        if (!tenantAdminUser || !(tenantAdminUser as any).tenantId) {
            toast.push(
                <Notification title="Error" type="danger" duration={2500}>
                    Tenant information is missing. Cannot create role.
                </Notification>,
            )
            setSubmitting(false)
            return
        }

        const rolePayload: CreateRoleDto = {
            name: values.name,
            description: values.description || null,
            tenantId: (tenantAdminUser as any).tenantId,
            type: 'TENANT',
            permissions: values.permissions, // Use selected permissions from form values
        }

        try {
            await RoleService.createRole(rolePayload)
            toast.push(
                <Notification
                    title="Role Created"
                    type="success"
                    duration={2500}
                >
                    Role {values.name} has been created successfully.
                </Notification>,
            )
            navigate('/tenantportal/tenant/roles')
        } catch (error: any) {
            console.error('Failed to create role:', error)
            const errorMessage =
                error.response?.data?.message || 'An unexpected error occurred.'
            toast.push(
                <Notification
                    title="Creation Failed"
                    type="danger"
                    duration={2500}
                >
                    {errorMessage}
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AdaptiveCard className="h-full" bodyClass="h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="mb-4 text-lg font-semibold">
                    Create New Tenant Role
                </h3>
            </div>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ values, touched, errors, isSubmitting }) => (
                    <Form>
                        <FormContainer>
                            <Card className="p-6 mb-6">
                                <h4 className="text-md font-semibold mb-4">
                                    Role Information
                                </h4>
                                <FormItem
                                    label="Role Name"
                                    invalid={!!(errors.name && touched.name)}
                                    errorMessage={errors.name as string}
                                >
                                    <Field
                                        type="text"
                                        name="name"
                                        component={Input}
                                        placeholder="Enter role name"
                                    />
                                </FormItem>
                                <FormItem
                                    label="Description"
                                    invalid={
                                        !!(
                                            errors.description &&
                                            touched.description
                                        )
                                    }
                                    errorMessage={errors.description as string}
                                >
                                    <Field
                                        name="description"
                                        component={Textarea}
                                        placeholder="Enter role description (optional)"
                                    />
                                </FormItem>

                                <FormItem
                                    label="Permissions"
                                    invalid={
                                        !!(
                                            errors.permissions &&
                                            touched.permissions
                                        )
                                    }
                                    errorMessage={errors.permissions as string}
                                >
                                    {loadingPermissions ? (
                                        <p>Loading permissions...</p>
                                    ) : permissions.length === 0 ? (
                                        <p>No permissions available.</p>
                                    ) : (
                                        Object.entries(
                                            permissions.reduce(
                                                (acc, permission) => {
                                                    const category =
                                                        permission.category ||
                                                        'General'
                                                    if (!acc[category]) {
                                                        acc[category] = []
                                                    }
                                                    acc[category].push(
                                                        permission,
                                                    )
                                                    return acc
                                                },
                                                {} as Record<
                                                    string,
                                                    Permission[]
                                                >,
                                            ),
                                        ).map(([category, perms]) => (
                                            <div
                                                key={category}
                                                className="mb-4"
                                            >
                                                <h5 className="text-sm font-semibold mb-2 capitalize">
                                                    {category.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                                                    {perms.map((permission) => (
                                                        <label
                                                            key={permission.id}
                                                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                        >
                                                            <Field
                                                                type="checkbox"
                                                                name="permissions"
                                                                value={
                                                                    permission.id
                                                                }
                                                                className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                                    {
                                                                        permission.name
                                                                    }
                                                                </span>
                                                                {/* {permission.description && (
                                                                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                                                        {
                                                                            permission.description
                                                                        }
                                                                    </span>
                                                                )} */}
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </FormItem>
                            </Card>

                            <div className="mt-6 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="plain"
                                    onClick={() =>
                                        navigate('/tenantportal/tenant/roles')
                                    }
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="solid"
                                    color="blue-600"
                                    type="submit"
                                    loading={isSubmitting}
                                    icon={<HiOutlinePlusCircle />}
                                >
                                    {isSubmitting
                                        ? 'Creating...'
                                        : 'Create Role'}
                                </Button>
                            </div>
                        </FormContainer>
                    </Form>
                )}
            </Formik>
        </AdaptiveCard>
    )
}

export default TenantRoleCreateForm

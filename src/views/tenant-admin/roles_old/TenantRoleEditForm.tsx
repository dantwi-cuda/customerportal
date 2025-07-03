import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    Button,
    Input,
    FormContainer,
    FormItem,
    Textarea,
    Tabs,
} from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { AdaptiveCard } from '@/components/shared'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import RoleService from '@/services/RoleService'
import PermissionService from '@/services/PermissionService' // Import PermissionService
import useAuth from '@/auth/useAuth'
import { RoleDto, UpdateRoleDto } from '@/@types/role'
import { Permission } from '@/@types/permission' // Import Permission type
import {
    HiOutlinePencilAlt,
    HiOutlineSave,
    // HiOutlineShieldCheck, // Icon for permissions tab if needed
} from 'react-icons/hi'
import { Notification } from '@/components/ui/Notification'
import toast from '@/components/ui/toast/toast'
import { Loading } from '@/components/shared'

const { TabNav, TabList, TabContent } = Tabs

const roleDetailsValidationSchema = Yup.object().shape({
    name: Yup.string().required('Role name is required'),
    description: Yup.string(),
    // No permissions validation here, handled in its own tab/form or on overall submit if combined
})

const permissionsValidationSchema = Yup.object().shape({
    permissions: Yup.array()
        .of(Yup.string())
        .min(1, 'At least one permission is required'),
})

const TenantRoleEditForm = () => {
    const navigate = useNavigate()
    const { roleId } = useParams<{ roleId: string }>()
    const { user: tenantAdminUser } = useAuth()

    const [loading, setLoading] = useState(true)
    const [role, setRole] = useState<RoleDto | null>(null)
    const [availablePermissions, setAvailablePermissions] = useState<
        Permission[]
    >([]) // State for all available permissions
    const [loadingPermissions, setLoadingPermissions] = useState(true)
    const [activeTab, setActiveTab] = useState('details')

    const fetchPermissions = useCallback(async () => {
        try {
            setLoadingPermissions(true)
            const fetchedPermissions = await PermissionService.getPermissions() // response is now Permission[]
            setAvailablePermissions(fetchedPermissions || []) // Use fetchedPermissions directly
        } catch (error) {
            console.error('Failed to fetch permissions:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to load permissions.
                </Notification>,
            )
        } finally {
            setLoadingPermissions(false)
        }
    }, [])

    const fetchRole = useCallback(async () => {
        if (!roleId) return
        setLoading(true)
        try {
            const fetchedRole = await RoleService.getRole(
                roleId /*, (tenantAdminUser as any)?.tenantId */,
            )

            if (
                fetchedRole.tenantId !== (tenantAdminUser as any)?.tenantId &&
                fetchedRole.type === 'TENANT'
            ) {
                toast.push(
                    <Notification
                        title="Access Denied"
                        type="danger"
                        duration={3000}
                    >
                        You do not have permission to edit this role.
                    </Notification>,
                )
                navigate('/tenantportal/tenant/roles')
                return
            }
            setRole(fetchedRole)
        } catch (error) {
            console.error('Failed to fetch role:', error)
            toast.push(
                <Notification title="Fetch Error" type="danger" duration={3000}>
                    Failed to load role data.
                </Notification>,
            )
            navigate('/tenantportal/tenant/roles')
        } finally {
            setLoading(false)
        }
    }, [roleId, navigate, tenantAdminUser])

    useEffect(() => {
        fetchRole()
        fetchPermissions() // Fetch permissions when component mounts
    }, [fetchRole, fetchPermissions])

    const handleRoleDetailsSubmit = async (
        values: any,
        { setSubmitting }: any,
    ) => {
        if (!roleId || !role) return
        setSubmitting(true)

        const updatePayload: UpdateRoleDto = {
            name: values.name,
            description: values.description || null,
            permissions: role.permissions || [], // Keep existing permissions when updating details only
        }

        try {
            await RoleService.updateRole(
                roleId,
                updatePayload /*, (tenantAdminUser as any)?.tenantId */,
            )
            toast.push(
                <Notification
                    title="Role Updated"
                    type="success"
                    duration={2500}
                >
                    Role details updated successfully.
                </Notification>,
            )
            fetchRole() // Re-fetch role to get updated data
        } catch (error: any) {
            console.error('Failed to update role details:', error)
            const errorMessage =
                error.response?.data?.message || 'An unexpected error occurred.'
            toast.push(
                <Notification
                    title="Update Failed"
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

    const handlePermissionsSubmit = async (
        values: { permissions: string[] },
        { setSubmitting }: any,
    ) => {
        if (!roleId || !role) return
        setSubmitting(true)

        const updatePayload: UpdateRoleDto = {
            // name and description are not updated here, only permissions
            name: role.name, // Or fetch current name if not available in role state
            description: role.description,
            permissions: values.permissions,
        }

        try {
            await RoleService.updateRole(roleId, updatePayload)
            toast.push(
                <Notification
                    title="Permissions Updated"
                    type="success"
                    duration={2500}
                >
                    Role permissions updated successfully.
                </Notification>,
            )
            fetchRole() // Re-fetch role to get updated permissions
        } catch (error: any) {
            console.error('Failed to update role permissions:', error)
            const errorMessage =
                error.response?.data?.message || 'An unexpected error occurred.'
            toast.push(
                <Notification
                    title="Update Failed"
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

    if (loading || loadingPermissions) {
        // Check loadingPermissions as well
        return <Loading loading={true} />
    }

    if (!role) {
        return <div className="p-4">Role not found or access denied.</div>
    }

    const initialRoleDetailsValues = {
        name: role.name || '',
        description: role.description || '',
    }

    const initialPermissionsValues = {
        permissions: role.permissions || [],
    }

    return (
        <AdaptiveCard className="h-full" bodyClass="h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="mb-4 text-lg font-semibold">
                    Edit Tenant Role: {role.name}
                </h3>
            </div>
            <Tabs value={activeTab} onChange={setActiveTab}>
                <TabList>
                    <TabNav value="details" icon={<HiOutlinePencilAlt />}>
                        Details
                    </TabNav>
                    <TabNav
                        value="permissions" /* icon={<HiOutlineShieldCheck />} */
                    >
                        Permissions
                    </TabNav>
                </TabList>
                <div className="p-4">
                    <TabContent value="details">
                        <Formik
                            initialValues={initialRoleDetailsValues}
                            validationSchema={roleDetailsValidationSchema}
                            onSubmit={handleRoleDetailsSubmit}
                            enableReinitialize
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
                                                invalid={
                                                    !!(
                                                        errors.name &&
                                                        touched.name
                                                    )
                                                }
                                                errorMessage={
                                                    errors.name as string
                                                }
                                            >
                                                <Field name="name">
                                                    {({ field }: any) => (
                                                        <Input
                                                            {...field}
                                                            type="text"
                                                        />
                                                    )}
                                                </Field>
                                            </FormItem>
                                            <FormItem
                                                label="Description"
                                                invalid={
                                                    !!(
                                                        errors.description &&
                                                        touched.description
                                                    )
                                                }
                                                errorMessage={
                                                    errors.description as string
                                                }
                                            >
                                                <Field name="description">
                                                    {({ field }: any) => (
                                                        <Textarea {...field} />
                                                    )}
                                                </Field>
                                            </FormItem>
                                        </Card>

                                        <div className="mt-6 flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="plain"
                                                onClick={() =>
                                                    navigate(
                                                        '/tenantportal/tenant/roles',
                                                    )
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
                                                icon={<HiOutlineSave />}
                                            >
                                                {isSubmitting
                                                    ? 'Saving...'
                                                    : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </FormContainer>
                                </Form>
                            )}
                        </Formik>
                    </TabContent>
                    <TabContent value="permissions">
                        {loadingPermissions ? (
                            <p>Loading permissions...</p>
                        ) : (
                            <Formik
                                initialValues={initialPermissionsValues}
                                validationSchema={permissionsValidationSchema}
                                onSubmit={handlePermissionsSubmit}
                                enableReinitialize // Important if role.permissions changes
                            >
                                {({
                                    values,
                                    touched,
                                    errors,
                                    isSubmitting,
                                    setFieldValue,
                                }) => (
                                    <Form>
                                        <FormContainer>
                                            <Card className="p-6 mb-6">
                                                <h4 className="text-md font-semibold mb-4">
                                                    Manage Permissions
                                                </h4>
                                                {availablePermissions.length ===
                                                0 ? (
                                                    <p>
                                                        No permissions available
                                                        to assign.
                                                    </p>
                                                ) : (
                                                    Object.entries(
                                                        availablePermissions.reduce(
                                                            (
                                                                acc,
                                                                permission,
                                                            ) => {
                                                                const category =
                                                                    permission.category ||
                                                                    'General'
                                                                if (
                                                                    !acc[
                                                                        category
                                                                    ]
                                                                ) {
                                                                    acc[
                                                                        category
                                                                    ] = []
                                                                }
                                                                acc[
                                                                    category
                                                                ].push(
                                                                    permission,
                                                                )
                                                                return acc
                                                            },
                                                            {} as Record<
                                                                string,
                                                                Permission[]
                                                            >,
                                                        ),
                                                    ).map(
                                                        ([category, perms]) => (
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
                                                                    {perms.map(
                                                                        (
                                                                            permission,
                                                                        ) => (
                                                                            <label
                                                                                key={
                                                                                    permission.id
                                                                                }
                                                                                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                                            >
                                                                                <Field
                                                                                    type="checkbox"
                                                                                    name="permissions"
                                                                                    value={
                                                                                        permission.id
                                                                                    }
                                                                                    checked={values.permissions.includes(
                                                                                        permission.id,
                                                                                    )}
                                                                                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                                                                    // onChange is handled by Formik's Field component when value is present
                                                                                />
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                                                        {
                                                                                            permission.name
                                                                                        }
                                                                                    </span>
                                                                                    {/* Description intentionally omitted as per request */}
                                                                                </div>
                                                                            </label>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ),
                                                    )
                                                )}
                                            </Card>
                                            {errors.permissions &&
                                                touched.permissions && (
                                                    <FormItem
                                                        invalid={
                                                            !!(
                                                                errors.permissions &&
                                                                touched.permissions
                                                            )
                                                        }
                                                        errorMessage={
                                                            errors.permissions as string
                                                        }
                                                        className="mt-0 mb-4"
                                                    />
                                                )}
                                            <div className="mt-6 flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="plain"
                                                    onClick={() =>
                                                        navigate(
                                                            '/tenantportal/tenant/roles',
                                                        )
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
                                                    icon={<HiOutlineSave />}
                                                >
                                                    {isSubmitting
                                                        ? 'Saving...'
                                                        : 'Save Permissions'}
                                                </Button>
                                            </div>
                                        </FormContainer>
                                    </Form>
                                )}
                            </Formik>
                        )}
                    </TabContent>
                </div>
            </Tabs>
        </AdaptiveCard>
    )
}

export default TenantRoleEditForm

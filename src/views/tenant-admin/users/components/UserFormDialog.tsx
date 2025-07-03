import React from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, Tag } from '@/components/ui' // Assuming Tag is available for multi-select display
import { FormContainer, FormItem } from '@/components/ui/Form'
import { Field, Form, Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import UserService from '@/services/UserService'
import { UserDto, CreateUserRequest, UpdateUserRequest } from '@/@types/user'
import { TENANT_ADMIN, END_USER } from '@/constants/roles.constant' // Corrected import

interface UserFormDialogProps {
    isOpen: boolean
    onClose: () => void
    onSave: () => void
    user: UserDto | null
    tenantId?: number | null
}

// These roles should be filtered based on what a TENANT_ADMIN can assign.
// This might involve fetching roles from an API (e.g., /api/Role filtered by tenantId or type)
// For now, using a predefined list.
const tenantAssignableRolesOptions = [
    { value: TENANT_ADMIN, label: 'Tenant Admin' }, // Changed from ROLES.TENANT_ADMIN
    { value: END_USER, label: 'End User' }, // Changed from ROLES.END_USER
]

const userStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    // 'pending' is often a system-set status, not manually assigned.
]

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string()
        .email('Invalid email format')
        .required('Email is required'),
    roles: Yup.array()
        .of(Yup.string())
        .min(1, 'At least one role must be selected')
        .required('Role is required'),
    password: Yup.string().when('$isNewUser', {
        is: true,
        then: (schema: Yup.StringSchema) =>
            schema
                .required('Password is required for new users')
                .min(8, 'Password must be at least 8 characters'),
        otherwise: (schema: Yup.StringSchema) =>
            schema
                .nullable()
                .test(
                    'password-optional-complexity',
                    'Password must be at least 8 characters if provided',
                    (value?: string | null) => !value || value.length >= 8,
                ),
    }),
    status: Yup.string().required('Status is required'),
})

const UserFormDialog: React.FC<UserFormDialogProps> = ({
    isOpen,
    onClose,
    onSave,
    user,
    tenantId,
}) => {
    const isNewUser = !user

    const handleSubmit = async (
        values: {
            name: string
            email: string
            roles: string[]
            password?: string
            status: string
        },
        { setSubmitting, setFieldError }: any,
    ) => {
        setSubmitting(true)
        try {
            const baseUserDto: Partial<UserDto> & { tenantId?: number | null } =
                {
                    // Allow tenantId here temporarily
                    name: values.name,
                    email: values.email,
                    status: values.status,
                    isCustomerUser: true,
                    isCCIUser: false,
                    tenantId: tenantId, // Use tenantId from props for new users
                }

            if (isNewUser) {
                const createPayload: CreateUserRequest = {
                    user: baseUserDto as UserDto, // Assert to UserDto; backend handles tenantId if needed
                    password: values.password!,
                    roles: values.roles,
                }
                await UserService.createUser(createPayload)
            } else if (user?.id) {
                // For updates, tenantId might be immutable or handled by backend context.
                // Do not include tenantId in the user DTO for update if it's not part of UserDto type.
                // If it IS part of UserDto and updatable, it should be added to the type.
                // For now, assuming tenantId is not directly updated via this form for existing users.
                const updateUserDto: UserDto = {
                    id: user.id,
                    name: values.name,
                    email: values.email,
                    status: values.status,
                    isCustomerUser: true, // Retain these as they are fixed for tenant admin scope
                    isCCIUser: false,
                    // roles will be handled in UpdateUserRequest, not directly in UserDto here
                }

                const updatePayload: UpdateUserRequest = {
                    user: updateUserDto,
                    roles: values.roles,
                }
                await UserService.updateUser(user.id, updatePayload)
            }
            onSave()
        } catch (error: any) {
            console.error('Failed to save user:', error)
            if (error.response?.data?.message) {
                setFieldError('general', error.response.data.message)
            } else if (error.response?.data?.errors) {
                // Handle specific field errors if backend provides them
                const backendErrors = error.response.data.errors
                for (const key in backendErrors) {
                    if (
                        Object.prototype.hasOwnProperty.call(backendErrors, key)
                    ) {
                        setFieldError(
                            key.toLowerCase(),
                            backendErrors[key].join(', '),
                        )
                    }
                }
            } else {
                setFieldError('general', 'An unexpected error occurred.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const initialValues = {
        name: user?.name || '',
        email: user?.email || '',
        roles: user?.roles || [], // Assuming user.roles is string[]
        password: '',
        status: user?.status || 'active',
    }

    // Determine the title for the dialog
    const dialogTitle = isNewUser ? 'Add New User' : 'Edit User'

    return (
        // Pass title via a prop that Dialog might accept, e.g., modalProps or directly if supported
        // For react-modal, `contentLabel` is used for accessibility, or a custom header can be built.
        // Assuming Dialog component internally handles a title display or we add a header.
        <Dialog
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel={dialogTitle}
            width={600}
        >
            <div className="p-6">
                {' '}
                {/* Added padding for content */}
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    {dialogTitle}
                </h3>{' '}
                {/* Manual title */}
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                    // Provide isNewUser in context for Yup
                    context={{ isNewUser: isNewUser }}
                >
                    {({
                        values,
                        touched,
                        errors,
                        isSubmitting,
                        setFieldValue,
                    }: FormikProps<any>) => (
                        <Form>
                            <FormContainer>
                                {errors.general && (
                                    <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
                                        {errors.general}
                                    </div>
                                )}
                                <FormItem
                                    label="Name"
                                    invalid={!!(errors.name && touched.name)}
                                    errorMessage={errors.name as string}
                                >
                                    <Field
                                        type="text"
                                        name="name"
                                        component={Input}
                                        placeholder="Full Name"
                                    />
                                </FormItem>
                                <FormItem
                                    label="Email"
                                    invalid={!!(errors.email && touched.email)}
                                    errorMessage={errors.email as string}
                                >
                                    <Field
                                        type="email"
                                        name="email"
                                        component={Input}
                                        placeholder="user@example.com"
                                    />
                                </FormItem>

                                {/* Conditional rendering of password field based on isNewUser */}
                                {isNewUser ? (
                                    <FormItem
                                        label="Password"
                                        invalid={
                                            !!(
                                                errors.password &&
                                                touched.password
                                            )
                                        }
                                        errorMessage={errors.password as string}
                                    >
                                        <Field
                                            type="password"
                                            name="password"
                                            component={Input}
                                            placeholder="Min 8 characters"
                                        />
                                    </FormItem>
                                ) : (
                                    <FormItem
                                        label="Password (leave blank to keep current)" // Info integrated into label
                                        invalid={
                                            !!(
                                                errors.password &&
                                                touched.password
                                            )
                                        }
                                        errorMessage={errors.password as string}
                                    >
                                        <Field
                                            type="password"
                                            name="password"
                                            component={Input}
                                            placeholder="Min 8 characters (optional)"
                                        />
                                    </FormItem>
                                )}

                                <FormItem
                                    label="Roles"
                                    invalid={!!(errors.roles && touched.roles)}
                                    errorMessage={errors.roles as string}
                                >
                                    <Select
                                        isMulti
                                        name="roles"
                                        options={tenantAssignableRolesOptions}
                                        value={tenantAssignableRolesOptions.filter(
                                            (option) =>
                                                values.roles?.includes(
                                                    option.value,
                                                ),
                                        )}
                                        onChange={(selectedOptions) =>
                                            setFieldValue(
                                                'roles',
                                                selectedOptions
                                                    ? selectedOptions.map(
                                                          (o: any) => o.value,
                                                      )
                                                    : [],
                                            )
                                        }
                                        componentAs={Field}
                                    />
                                </FormItem>

                                <FormItem
                                    label="Status"
                                    invalid={
                                        !!(errors.status && touched.status)
                                    }
                                    errorMessage={errors.status as string}
                                >
                                    <Select
                                        name="status"
                                        options={userStatusOptions}
                                        value={userStatusOptions.find(
                                            (option) =>
                                                option.value === values.status,
                                        )}
                                        onChange={(selectedOption) =>
                                            setFieldValue(
                                                'status',
                                                selectedOption
                                                    ? selectedOption.value
                                                    : null,
                                            )
                                        }
                                        componentAs={Field}
                                    />
                                </FormItem>

                                <div className="text-right mt-6">
                                    <Button
                                        type="button"
                                        className="mr-2"
                                        variant="plain"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="solid"
                                        type="submit"
                                        loading={isSubmitting}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting
                                            ? 'Saving...'
                                            : isNewUser
                                              ? 'Create User'
                                              : 'Save Changes'}
                                    </Button>
                                </div>
                            </FormContainer>
                        </Form>
                    )}
                </Formik>
            </div>
        </Dialog>
    )
}

export default UserFormDialog

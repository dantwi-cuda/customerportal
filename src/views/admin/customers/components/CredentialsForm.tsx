import React from 'react'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import { Button } from '@/components/ui/Button'

export type CredentialsFormValues = {
    username: string
    password?: string // Password might be optional if only setting initially or not always updated
    // confirmPassword?: string // If password is being set/changed
}

interface CredentialsFormProps {
    initialValues?: CredentialsFormValues
    // eslint-disable-next-line no-unused-vars
    onSubmit: (values: CredentialsFormValues, helpers: any) => void
    isSubmitting?: boolean
    isNewUser?: boolean // To control if password is required, etc.
}

const CredentialsForm: React.FC<CredentialsFormProps> = ({
    initialValues = { username: '', password: '' },
    onSubmit,
    isSubmitting,
    isNewUser = false,
}) => {
    const validationSchema = Yup.object().shape({
        username: Yup.string().required('Username is required'),
        password: isNewUser
            ? Yup.string()
                  .required('Password is required')
                  .min(8, 'Password must be at least 8 characters')
            : Yup.string()
                  .min(8, 'Password must be at least 8 characters')
                  .optional(),
        // confirmPassword: isNewUser
        //     ? Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Confirm password is required')
        //     : Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').optional(),
    })

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            enableReinitialize
        >
            {({ errors, touched }) => (
                <Form>
                    <FormContainer>
                        <FormItem
                            label="Username (for TENANT_ADMIN)"
                            invalid={errors.username && touched.username}
                            errorMessage={errors.username}
                        >
                            <Field
                                type="text"
                                autoComplete="off"
                                name="username"
                                placeholder="Enter username"
                                component={Input}
                            />
                        </FormItem>
                        <FormItem
                            label="Password"
                            invalid={errors.password && touched.password}
                            errorMessage={errors.password}
                        >
                            <Field
                                type="password"
                                autoComplete="new-password"
                                name="password"
                                placeholder={
                                    isNewUser
                                        ? 'Enter password'
                                        : 'Leave blank to keep current password'
                                }
                                component={Input}
                            />
                        </FormItem>
                        {/* <FormItem
                            label="Confirm Password"
                            invalid={errors.confirmPassword && touched.confirmPassword}
                            errorMessage={errors.confirmPassword}
                        >
                            <Field
                                type="password"
                                autoComplete="new-password"
                                name="confirmPassword"
                                placeholder={isNewUser ? "Confirm password" : "Leave blank to keep current password"}
                                component={Input}
                            />
                        </FormItem> */}
                        <FormItem>
                            <Button
                                variant="solid"
                                type="submit"
                                loading={isSubmitting}
                            >
                                {isSubmitting
                                    ? 'Saving...'
                                    : 'Save Credentials'}
                            </Button>
                        </FormItem>
                    </FormContainer>
                </Form>
            )}
        </Formik>
    )
}

export default CredentialsForm

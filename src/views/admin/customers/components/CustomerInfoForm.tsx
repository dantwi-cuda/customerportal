import React from 'react'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import { Button } from '@/components/ui/Button'
import { Customer } from '@/@types/customer' // Assuming Customer type exists

export type CustomerInfoFormValues = {
    name: string
    email: string
    // Add other relevant customer fields here
    // e.g., companyName: string, contactPerson: string, etc.
}

interface CustomerInfoFormProps {
    initialValues?: CustomerInfoFormValues
    // eslint-disable-next-line no-unused-vars
    onSubmit: (values: CustomerInfoFormValues, helpers: any) => void
    isSubmitting?: boolean
    customer?: Customer // Optional: if editing an existing customer
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Customer name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    // Add validation for other fields
})

const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
    initialValues = { name: '', email: '' },
    onSubmit,
    isSubmitting,
    // customer, // If needed for displaying existing data or conditional logic
}) => {
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
                            label="Customer Name"
                            invalid={errors.name && touched.name}
                            errorMessage={errors.name}
                        >
                            <Field
                                type="text"
                                autoComplete="off"
                                name="name"
                                placeholder="Enter customer name"
                                component={Input}
                            />
                        </FormItem>
                        <FormItem
                            label="Email"
                            invalid={errors.email && touched.email}
                            errorMessage={errors.email}
                        >
                            <Field
                                type="email"
                                autoComplete="off"
                                name="email"
                                placeholder="Enter email"
                                component={Input}
                            />
                        </FormItem>
                        {/* Add other form fields here */}
                        <FormItem>
                            <Button
                                variant="solid"
                                type="submit"
                                loading={isSubmitting}
                            >
                                {isSubmitting
                                    ? 'Saving...'
                                    : 'Save Customer Info'}
                            </Button>
                        </FormItem>
                    </FormContainer>
                </Form>
            )}
        </Formik>
    )
}

export default CustomerInfoForm

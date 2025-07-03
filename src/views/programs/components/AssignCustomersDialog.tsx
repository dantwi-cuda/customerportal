import React, { useState, useEffect } from 'react'
import {
    Dialog,
    Button,
    Select,
    DatePicker,
    FormItem,
    FormContainer,
    Checkbox,
    Table,
    Avatar,
} from '@/components/ui'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import type { Program, AssignProgramToCustomersRequest } from '@/@types/program'
import type { Customer } from '@/@types/customer'
import CustomerService from '@/services/CustomerService'

interface AssignCustomersDialogProps {
    isOpen: boolean
    program?: Program
    onClose: () => void
    onSubmit: (data: AssignProgramToCustomersRequest) => void
    loading?: boolean
}

const assignValidationSchema = Yup.object().shape({
    customerIds: Yup.array().min(1, 'Please select at least one customer'),
    startDate: Yup.date().nullable(),
    endDate: Yup.date()
        .nullable()
        .when('startDate', (startDate, schema) => {
            return startDate
                ? schema.min(startDate, 'End date must be after start date')
                : schema
        }),
})

const AssignCustomersDialog: React.FC<AssignCustomersDialogProps> = ({
    isOpen,
    program,
    onClose,
    onSubmit,
    loading = false,
}) => {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loadingCustomers, setLoadingCustomers] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadCustomers()
        }
    }, [isOpen])

    const loadCustomers = async () => {
        setLoadingCustomers(true)
        try {
            const customersData = await CustomerService.getCustomers()
            setCustomers(customersData.filter((customer) => customer.isActive))
        } catch (error) {
            console.error('Failed to load customers:', error)
        } finally {
            setLoadingCustomers(false)
        }
    }

    const initialValues = {
        customerIds: [] as number[],
        startDate: null as Date | null,
        endDate: null as Date | null,
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={true}
            width={800}
        >
            <div className="p-6">
                <div className="mb-6">
                    <h4 className="mb-2">Assign Program to Customers</h4>
                    <p className="text-gray-600">
                        Assign "{program?.name}" to one or more customers
                    </p>
                </div>

                {loadingCustomers ? (
                    <div className="text-center py-8">Loading customers...</div>
                ) : (
                    <Formik
                        initialValues={initialValues}
                        validationSchema={assignValidationSchema}
                        onSubmit={(values) => {
                            const submitData: AssignProgramToCustomersRequest =
                                {
                                    customerIds: values.customerIds,
                                    startDate: values.startDate?.toISOString(),
                                    endDate: values.endDate?.toISOString(),
                                }
                            onSubmit(submitData)
                        }}
                    >
                        {({ values, touched, errors, setFieldValue }) => (
                            <Form>
                                <FormContainer>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <FormItem
                                            label="Assignment Start Date"
                                            invalid={
                                                !!(
                                                    errors.startDate &&
                                                    touched.startDate
                                                )
                                            }
                                            errorMessage={errors.startDate}
                                        >
                                            <Field name="startDate">
                                                {({ field }: any) => (
                                                    <DatePicker
                                                        {...field}
                                                        placeholder="Select start date (optional)"
                                                        value={values.startDate}
                                                        onChange={(date) => {
                                                            setFieldValue(
                                                                'startDate',
                                                                date,
                                                            )
                                                        }}
                                                    />
                                                )}
                                            </Field>
                                        </FormItem>

                                        <FormItem
                                            label="Assignment End Date"
                                            invalid={
                                                !!(
                                                    errors.endDate &&
                                                    touched.endDate
                                                )
                                            }
                                            errorMessage={errors.endDate}
                                        >
                                            <Field name="endDate">
                                                {({ field }: any) => (
                                                    <DatePicker
                                                        {...field}
                                                        placeholder="Select end date (optional)"
                                                        value={values.endDate}
                                                        onChange={(date) => {
                                                            setFieldValue(
                                                                'endDate',
                                                                date,
                                                            )
                                                        }}
                                                    />
                                                )}
                                            </Field>
                                        </FormItem>
                                    </div>

                                    <FormItem
                                        label="Select Customers *"
                                        invalid={
                                            !!(
                                                errors.customerIds &&
                                                touched.customerIds
                                            )
                                        }
                                        errorMessage={errors.customerIds}
                                    >
                                        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                                            <Table>
                                                <Table.THead>
                                                    <Table.Tr>
                                                        <Table.Th className="w-12">
                                                            <Checkbox
                                                                checked={
                                                                    values
                                                                        .customerIds
                                                                        .length ===
                                                                    customers.length
                                                                }
                                                                indeterminate={
                                                                    values
                                                                        .customerIds
                                                                        .length >
                                                                        0 &&
                                                                    values
                                                                        .customerIds
                                                                        .length <
                                                                        customers.length
                                                                }
                                                                onChange={(
                                                                    checked,
                                                                ) => {
                                                                    if (
                                                                        checked
                                                                    ) {
                                                                        setFieldValue(
                                                                            'customerIds',
                                                                            customers.map(
                                                                                (
                                                                                    c,
                                                                                ) =>
                                                                                    c.id,
                                                                            ),
                                                                        )
                                                                    } else {
                                                                        setFieldValue(
                                                                            'customerIds',
                                                                            [],
                                                                        )
                                                                    }
                                                                }}
                                                            />
                                                        </Table.Th>
                                                        <Table.Th>
                                                            Customer
                                                        </Table.Th>
                                                        <Table.Th>
                                                            Status
                                                        </Table.Th>
                                                    </Table.Tr>
                                                </Table.THead>
                                                <Table.TBody>
                                                    {customers.map(
                                                        (customer) => (
                                                            <Table.Tr
                                                                key={
                                                                    customer.id
                                                                }
                                                            >
                                                                <Table.Td>
                                                                    <Checkbox
                                                                        checked={values.customerIds.includes(
                                                                            customer.id,
                                                                        )}
                                                                        onChange={(
                                                                            checked,
                                                                        ) => {
                                                                            if (
                                                                                checked
                                                                            ) {
                                                                                setFieldValue(
                                                                                    'customerIds',
                                                                                    [
                                                                                        ...values.customerIds,
                                                                                        customer.id,
                                                                                    ],
                                                                                )
                                                                            } else {
                                                                                setFieldValue(
                                                                                    'customerIds',
                                                                                    values.customerIds.filter(
                                                                                        (
                                                                                            id,
                                                                                        ) =>
                                                                                            id !==
                                                                                            customer.id,
                                                                                    ),
                                                                                )
                                                                            }
                                                                        }}
                                                                    />
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <div className="flex items-center space-x-3">
                                                                        <Avatar
                                                                            size="sm"
                                                                            className="bg-blue-100 text-blue-600"
                                                                        >
                                                                            {customer.name.charAt(
                                                                                0,
                                                                            )}
                                                                        </Avatar>
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {
                                                                                    customer.name
                                                                                }
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                {
                                                                                    customer.contactEmail
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </Table.Td>
                                                                <Table.Td>
                                                                    <span className="text-emerald-600 text-sm">
                                                                        Active
                                                                    </span>
                                                                </Table.Td>
                                                            </Table.Tr>
                                                        ),
                                                    )}
                                                </Table.TBody>
                                            </Table>
                                        </div>
                                    </FormItem>

                                    <div className="flex justify-end space-x-4 mt-8">
                                        <Button
                                            type="button"
                                            variant="plain"
                                            onClick={onClose}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="solid"
                                            loading={loading}
                                        >
                                            Assign to Customers
                                        </Button>
                                    </div>
                                </FormContainer>
                            </Form>
                        )}
                    </Formik>
                )}
            </div>
        </Dialog>
    )
}

export default AssignCustomersDialog

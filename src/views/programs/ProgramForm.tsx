import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Input,
    Select,
    DatePicker,
    FormItem,
    FormContainer,
    Alert,
    Notification,
    Skeleton,
} from '@/components/ui'
import { toast } from '@/components/ui'
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineX } from 'react-icons/hi'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useParams, useNavigate } from 'react-router-dom'
import type {
    Program,
    CreateProgramRequest,
    UpdateProgramRequest,
    ProgramType,
} from '@/@types/program'
import ProgramService from '@/services/ProgramService'
import useAuth from '@/auth/useAuth'

const programValidationSchema = Yup.object().shape({
    name: Yup.string().required('Program name is required'),
    description: Yup.string(),
    programTypeId: Yup.number().required('Program type is required'),
    contactName: Yup.string(),
    contactPhone: Yup.string(),
    startDate: Yup.date().nullable(),
    endDate: Yup.date()
        .nullable()
        .when('startDate', (startDate, schema) => {
            return startDate
                ? schema.min(startDate, 'End date must be after start date')
                : schema
        }),
    manufacturerId: Yup.number().nullable(),
})

const ProgramForm: React.FC = () => {
    const { programId } = useParams<{ programId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const isEdit = Boolean(programId)

    const [program, setProgram] = useState<Program | null>(null)
    const [programTypes, setProgramTypes] = useState<ProgramType[]>([])
    const [loading, setLoading] = useState(isEdit)
    const [submitting, setSubmitting] = useState(false)

    const hasEditAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'program.edit'].includes(role),
    )

    const hasCreateAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'program.create'].includes(role),
    )

    const isPortalAdmin = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const getBackPath = () => {
        return isPortalAdmin ? '/tenantportal/programs' : '/app/programs'
    }

    useEffect(() => {
        loadData()
    }, [programId])

    const loadData = async () => {
        try {
            setLoading(true)
            const programTypesData = await ProgramService.getProgramTypes()
            setProgramTypes(programTypesData)

            if (isEdit && programId) {
                const programData = await ProgramService.getProgram(
                    parseInt(programId),
                )
                setProgram(programData)
            }
        } catch (error) {
            console.error('Error loading data:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load program data
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (values: any) => {
        try {
            setSubmitting(true)

            if (isEdit && program) {
                const updateData: UpdateProgramRequest = {
                    name: values.name,
                    description: values.description || undefined,
                    programTypeId: values.programTypeId,
                    contactName: values.contactName || undefined,
                    contactPhone: values.contactPhone || undefined,
                    startDate: values.startDate || undefined,
                    endDate: values.endDate || undefined,
                    manufacturerId: values.manufacturerId || undefined,
                    isActive:
                        values.isActive !== undefined ? values.isActive : true,
                }

                await ProgramService.updateProgram(
                    program.programId,
                    updateData,
                )

                toast.push(
                    <Notification title="Success" type="success">
                        Program updated successfully
                    </Notification>,
                )
            } else {
                const createData: CreateProgramRequest = {
                    name: values.name,
                    description: values.description || undefined,
                    programTypeId: values.programTypeId,
                    contactName: values.contactName || undefined,
                    contactPhone: values.contactPhone || undefined,
                    startDate: values.startDate || undefined,
                    endDate: values.endDate || undefined,
                    manufacturerId: values.manufacturerId || undefined,
                }

                await ProgramService.createProgram(createData)

                toast.push(
                    <Notification title="Success" type="success">
                        Program created successfully
                    </Notification>,
                )
            }

            navigate(getBackPath())
        } catch (error) {
            console.error('Error saving program:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to save program
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    if (!hasCreateAccess && !isEdit) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to create programs.
                </Alert>
            </Card>
        )
    }

    if (!hasEditAccess && isEdit) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to edit programs.
                </Alert>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton height="60px" />
                <Skeleton height="400px" />
            </div>
        )
    }

    if (isEdit && !program) {
        return (
            <Card>
                <Alert type="danger">Program not found.</Alert>
            </Card>
        )
    }

    const initialValues = {
        name: program?.name || '',
        description: program?.description || '',
        programTypeId: program?.programTypeId || '',
        contactName: program?.contactName || '',
        contactPhone: program?.contactPhone || '',
        startDate: program?.startDate ? new Date(program.startDate) : null,
        endDate: program?.endDate ? new Date(program.endDate) : null,
        manufacturerId: program?.manufacturerId || '',
        isActive: program?.isActive !== undefined ? program.isActive : true,
    }

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="plain"
                        size="sm"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate(getBackPath())}
                    >
                        Back to Programs
                    </Button>
                    <div>
                        <h4 className="mb-1">
                            {isEdit ? 'Edit Program' : 'Add New Program'}
                        </h4>
                        <p className="text-gray-600">
                            {isEdit
                                ? 'Update program details'
                                : 'Create a new program'}
                        </p>
                    </div>
                </div>

                <Formik
                    initialValues={initialValues}
                    validationSchema={programValidationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ values, setFieldValue, errors, touched }) => (
                        <Form>
                            <FormContainer>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormItem
                                        label="Program Name *"
                                        invalid={Boolean(
                                            errors.name && touched.name,
                                        )}
                                        errorMessage={errors.name}
                                    >
                                        <Field name="name">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    placeholder="Enter program name"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="Program Type *"
                                        invalid={Boolean(
                                            errors.programTypeId &&
                                                touched.programTypeId,
                                        )}
                                        errorMessage={errors.programTypeId}
                                    >
                                        <Field name="programTypeId">
                                            {({ field }: any) => (
                                                <Select
                                                    {...field}
                                                    placeholder="Select program type"
                                                    value={
                                                        field.value
                                                            ? {
                                                                  value: field.value,
                                                                  label:
                                                                      programTypes.find(
                                                                          (
                                                                              pt,
                                                                          ) =>
                                                                              pt.programTypeId ===
                                                                              field.value,
                                                                      )
                                                                          ?.typeName ||
                                                                      '',
                                                              }
                                                            : null
                                                    }
                                                    options={programTypes.map(
                                                        (type) => ({
                                                            value: type.programTypeId,
                                                            label: type.typeName,
                                                        }),
                                                    )}
                                                    onChange={(option: any) =>
                                                        setFieldValue(
                                                            'programTypeId',
                                                            option?.value || '',
                                                        )
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="Contact Name"
                                        invalid={Boolean(
                                            errors.contactName &&
                                                touched.contactName,
                                        )}
                                        errorMessage={errors.contactName}
                                    >
                                        <Field name="contactName">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    placeholder="Enter contact name"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="Contact Phone"
                                        invalid={Boolean(
                                            errors.contactPhone &&
                                                touched.contactPhone,
                                        )}
                                        errorMessage={errors.contactPhone}
                                    >
                                        <Field name="contactPhone">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    placeholder="Enter contact phone"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="Start Date"
                                        invalid={Boolean(
                                            errors.startDate &&
                                                touched.startDate,
                                        )}
                                        errorMessage={errors.startDate}
                                    >
                                        <Field name="startDate">
                                            {({ field }: any) => (
                                                <DatePicker
                                                    {...field}
                                                    placeholder="Select start date"
                                                    value={field.value}
                                                    onChange={(date) =>
                                                        setFieldValue(
                                                            'startDate',
                                                            date,
                                                        )
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="End Date"
                                        invalid={Boolean(
                                            errors.endDate && touched.endDate,
                                        )}
                                        errorMessage={errors.endDate}
                                    >
                                        <Field name="endDate">
                                            {({ field }: any) => (
                                                <DatePicker
                                                    {...field}
                                                    placeholder="Select end date"
                                                    value={field.value}
                                                    onChange={(date) =>
                                                        setFieldValue(
                                                            'endDate',
                                                            date,
                                                        )
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </FormItem>
                                </div>

                                <FormItem
                                    label="Description"
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
                                                textArea
                                                rows={4}
                                                placeholder="Enter program description"
                                            />
                                        )}
                                    </Field>
                                </FormItem>

                                {isEdit && (
                                    <FormItem label="Status">
                                        <Field name="isActive">
                                            {({ field }: any) => (
                                                <Select
                                                    {...field}
                                                    value={
                                                        field.value
                                                            ? {
                                                                  value: true,
                                                                  label: 'Active',
                                                              }
                                                            : {
                                                                  value: false,
                                                                  label: 'Inactive',
                                                              }
                                                    }
                                                    options={[
                                                        {
                                                            value: true,
                                                            label: 'Active',
                                                        },
                                                        {
                                                            value: false,
                                                            label: 'Inactive',
                                                        },
                                                    ]}
                                                    onChange={(option: any) =>
                                                        setFieldValue(
                                                            'isActive',
                                                            option?.value,
                                                        )
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </FormItem>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        variant="solid"
                                        icon={<HiOutlineCheck />}
                                        loading={submitting}
                                    >
                                        {isEdit
                                            ? 'Update Program'
                                            : 'Create Program'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="plain"
                                        icon={<HiOutlineX />}
                                        onClick={() => navigate(getBackPath())}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </FormContainer>
                        </Form>
                    )}
                </Formik>
            </Card>
        </div>
    )
}

export default ProgramForm

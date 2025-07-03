import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    Select,
    Textarea,
    FormItem,
    FormContainer,
    DatePicker,
    Switcher,
} from '@/components/ui'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import type {
    Program,
    ProgramType,
    CreateProgramRequest,
    UpdateProgramRequest,
} from '@/@types/program'
import type { Manufacturer } from '@/@types/parts'
import ProgramService from '@/services/ProgramService'
import ManufacturerService from '@/services/ManufacturerService'

interface ProgramFormProps {
    program?: Program
    onSubmit: (data: CreateProgramRequest | UpdateProgramRequest) => void
    onCancel: () => void
    loading?: boolean
}

const programValidationSchema = Yup.object().shape({
    name: Yup.string()
        .required('Program name is required')
        .max(255, 'Name is too long'),
    description: Yup.string().max(500, 'Description is too long'),
    programTypeId: Yup.number().required('Program type is required'),
    contactName: Yup.string().max(255, 'Contact name is too long'),
    contactPhone: Yup.string().max(50, 'Phone number is too long'),
    manufacturerId: Yup.number().nullable(),
    startDate: Yup.date().nullable(),
    endDate: Yup.date()
        .nullable()
        .when('startDate', (startDate, schema) => {
            return startDate
                ? schema.min(startDate, 'End date must be after start date')
                : schema
        }),
    isActive: Yup.boolean().required(),
})

const ProgramForm: React.FC<ProgramFormProps> = ({
    program,
    onSubmit,
    onCancel,
    loading = false,
}) => {
    const [programTypes, setProgramTypes] = useState<ProgramType[]>([])
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
    const [loadingData, setLoadingData] = useState(true)

    const isEditing = !!program

    useEffect(() => {
        loadFormData()
    }, [])

    const loadFormData = async () => {
        setLoadingData(true)
        try {
            const [typesData, manufacturersData] = await Promise.all([
                ProgramService.getProgramTypes(),
                ManufacturerService.getManufacturers(),
            ])
            setProgramTypes(typesData)
            setManufacturers(manufacturersData)
        } catch (error) {
            console.error('Failed to load form data:', error)
        } finally {
            setLoadingData(false)
        }
    }

    const initialValues = {
        name: program?.name || '',
        description: program?.description || '',
        programTypeId: program?.programTypeId || '',
        contactName: program?.contactName || '',
        contactPhone: program?.contactPhone || '',
        manufacturerId: program?.manufacturerId || '',
        startDate: program?.startDate ? new Date(program.startDate) : null,
        endDate: program?.endDate ? new Date(program.endDate) : null,
        isActive: program?.isActive ?? true,
    }

    return (
        <Card>
            <div className="p-6">
                <div className="mb-6">
                    <h4 className="mb-1">
                        {isEditing ? 'Edit Program' : 'Create New Program'}
                    </h4>
                    <p className="text-gray-600">
                        {isEditing
                            ? 'Update program information'
                            : 'Enter the details for the new program'}
                    </p>
                </div>

                {loadingData ? (
                    <div className="text-center py-8">Loading form data...</div>
                ) : (
                    <Formik
                        initialValues={initialValues}
                        validationSchema={programValidationSchema}
                        onSubmit={(values) => {
                            const submitData = {
                                ...values,
                                programTypeId: Number(values.programTypeId),
                                manufacturerId: values.manufacturerId
                                    ? Number(values.manufacturerId)
                                    : undefined,
                                startDate: values.startDate?.toISOString(),
                                endDate: values.endDate?.toISOString(),
                            }
                            onSubmit(submitData)
                        }}
                        enableReinitialize
                    >
                        {({ values, touched, errors, setFieldValue }) => (
                            <Form>
                                <FormContainer>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormItem
                                            label="Program Name *"
                                            invalid={
                                                !!(errors.name && touched.name)
                                            }
                                            errorMessage={errors.name}
                                        >
                                            <Field
                                                type="text"
                                                name="name"
                                                placeholder="Enter program name"
                                                component={Input}
                                            />
                                        </FormItem>

                                        <FormItem
                                            label="Program Type *"
                                            invalid={
                                                !!(
                                                    errors.programTypeId &&
                                                    touched.programTypeId
                                                )
                                            }
                                            errorMessage={errors.programTypeId}
                                        >
                                            <Field name="programTypeId">
                                                {({ field }: any) => (
                                                    <Select
                                                        {...field}
                                                        placeholder="Select program type"
                                                        value={programTypes.find(
                                                            (type) =>
                                                                type.programTypeId ===
                                                                Number(
                                                                    values.programTypeId,
                                                                ),
                                                        )}
                                                        options={programTypes.map(
                                                            (type) => ({
                                                                value: type.programTypeId,
                                                                label: type.typeName,
                                                            }),
                                                        )}
                                                        onChange={(
                                                            option: any,
                                                        ) => {
                                                            setFieldValue(
                                                                'programTypeId',
                                                                option?.value ||
                                                                    '',
                                                            )
                                                        }}
                                                    />
                                                )}
                                            </Field>
                                        </FormItem>

                                        <FormItem
                                            label="Manufacturer"
                                            invalid={
                                                !!(
                                                    errors.manufacturerId &&
                                                    touched.manufacturerId
                                                )
                                            }
                                            errorMessage={errors.manufacturerId}
                                        >
                                            <Field name="manufacturerId">
                                                {({ field }: any) => (
                                                    <Select
                                                        {...field}
                                                        placeholder="Select manufacturer (optional)"
                                                        isClearable
                                                        value={manufacturers.find(
                                                            (mfg) =>
                                                                mfg.manufacturerID ===
                                                                Number(
                                                                    values.manufacturerId,
                                                                ),
                                                        )}
                                                        options={manufacturers.map(
                                                            (mfg) => ({
                                                                value: mfg.manufacturerID,
                                                                label: mfg.manufacturerName,
                                                            }),
                                                        )}
                                                        onChange={(
                                                            option: any,
                                                        ) => {
                                                            setFieldValue(
                                                                'manufacturerId',
                                                                option?.value ||
                                                                    '',
                                                            )
                                                        }}
                                                    />
                                                )}
                                            </Field>
                                        </FormItem>

                                        <FormItem
                                            label="Contact Name"
                                            invalid={
                                                !!(
                                                    errors.contactName &&
                                                    touched.contactName
                                                )
                                            }
                                            errorMessage={errors.contactName}
                                        >
                                            <Field
                                                type="text"
                                                name="contactName"
                                                placeholder="Enter contact name"
                                                component={Input}
                                            />
                                        </FormItem>

                                        <FormItem
                                            label="Contact Phone"
                                            invalid={
                                                !!(
                                                    errors.contactPhone &&
                                                    touched.contactPhone
                                                )
                                            }
                                            errorMessage={errors.contactPhone}
                                        >
                                            <Field
                                                type="text"
                                                name="contactPhone"
                                                placeholder="Enter contact phone"
                                                component={Input}
                                            />
                                        </FormItem>

                                        <FormItem
                                            label="Start Date"
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
                                                        placeholder="Select start date"
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
                                            label="End Date"
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
                                                        placeholder="Select end date"
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

                                        {isEditing && (
                                            <FormItem label="Status">
                                                <Field name="isActive">
                                                    {({ field }: any) => (
                                                        <div className="flex items-center space-x-2">
                                                            <Switcher
                                                                {...field}
                                                                checked={
                                                                    values.isActive
                                                                }
                                                                onChange={(
                                                                    checked,
                                                                ) => {
                                                                    setFieldValue(
                                                                        'isActive',
                                                                        checked,
                                                                    )
                                                                }}
                                                            />
                                                            <span className="text-sm">
                                                                {values.isActive
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </Field>
                                            </FormItem>
                                        )}
                                    </div>

                                    <FormItem
                                        label="Description"
                                        invalid={
                                            !!(
                                                errors.description &&
                                                touched.description
                                            )
                                        }
                                        errorMessage={errors.description}
                                    >
                                        <Field name="description">
                                            {({ field }: any) => (
                                                <Textarea
                                                    {...field}
                                                    placeholder="Enter program description (optional)"
                                                    rows={3}
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <div className="flex justify-end space-x-4 mt-8">
                                        <Button
                                            type="button"
                                            variant="plain"
                                            onClick={onCancel}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="solid"
                                            loading={loading}
                                        >
                                            {isEditing
                                                ? 'Update Program'
                                                : 'Create Program'}
                                        </Button>
                                    </div>
                                </FormContainer>
                            </Form>
                        )}
                    </Formik>
                )}
            </div>
        </Card>
    )
}

export default ProgramForm

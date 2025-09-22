import React, { useState, useEffect } from 'react'
import {
    Dialog,
    Input,
    Button,
    Notification,
    toast,
    FormItem,
    FormContainer,
    Switcher,
    Card,
    Table,
    Tag,
} from '@/components/ui'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'
import ProgramTypeService from '@/services/ProgramTypeService'
import type {
    ProgramType,
    CreateProgramTypeRequest,
    UpdateProgramTypeRequest,
    ProgramTypeAttribute,
    CreateProgramTypeAttributeRequest,
    UpdateProgramTypeAttributeRequest,
} from '@/@types/programType'

// Validation schemas
const programTypeValidationSchema = Yup.object().shape({
    typeName: Yup.string()
        .min(2, 'Type name must be at least 2 characters')
        .max(100, 'Type name must be less than 100 characters')
        .required('Type name is required'),
    typeDescription: Yup.string().max(
        500,
        'Description must be less than 500 characters',
    ),
    isActive: Yup.boolean().required(),
})

const attributeValidationSchema = Yup.object().shape({
    attributeName: Yup.string()
        .min(2, 'Attribute name must be at least 2 characters')
        .max(100, 'Attribute name must be less than 100 characters')
        .required('Attribute name is required'),
    attributeType: Yup.string().required('Attribute type is required'),
    description: Yup.string().max(
        500,
        'Description must be less than 500 characters',
    ),
    defaultValue: Yup.string().max(
        255,
        'Default value must be less than 255 characters',
    ),
    isRequired: Yup.boolean().required(),
    isActive: Yup.boolean().required(),
})

interface ProgramTypeModalProps {
    isOpen: boolean
    onClose: () => void
    onProgramTypesUpdated: () => void
}

const ProgramTypeModal: React.FC<ProgramTypeModalProps> = ({
    isOpen,
    onClose,
    onProgramTypesUpdated,
}) => {
    const [programTypes, setProgramTypes] = useState<ProgramType[]>([])
    const [selectedProgramType, setSelectedProgramType] =
        useState<ProgramType | null>(null)
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState<'list' | 'edit' | 'create'>(
        'list',
    )

    // Initial form values for program type
    const initialProgramTypeValues = {
        typeName: selectedProgramType?.typeName || '',
        typeDescription: selectedProgramType?.typeDescription || '',
        isActive: selectedProgramType?.isActive ?? true,
    }

    useEffect(() => {
        if (isOpen) {
            loadProgramTypes()
        }
    }, [isOpen])

    useEffect(() => {
        if (selectedProgramType) {
            setActiveTab('edit')
        }
    }, [selectedProgramType])

    const loadProgramTypes = async () => {
        try {
            setLoading(true)
            const data = await ProgramTypeService.getProgramTypes()
            setProgramTypes(data)
        } catch (error) {
            console.error('Error loading program types:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to load program types
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleCreateProgramType = async (
        values: typeof initialProgramTypeValues,
    ) => {
        setSubmitting(true)
        try {
            const createData: CreateProgramTypeRequest = {
                typeName: values.typeName,
                typeDescription: values.typeDescription,
                isActive: values.isActive,
            }

            await ProgramTypeService.createProgramType(createData)

            toast.push(
                <Notification type="success" title="Success">
                    Program type created successfully
                </Notification>,
            )

            await loadProgramTypes()
            onProgramTypesUpdated()
            setActiveTab('list')
        } catch (error) {
            console.error('Error creating program type:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    {error instanceof Error
                        ? error.message
                        : 'Failed to create program type'}
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateProgramType = async (
        values: typeof initialProgramTypeValues,
    ) => {
        if (!selectedProgramType) return

        setSubmitting(true)
        try {
            const updateData: UpdateProgramTypeRequest = {
                typeName: values.typeName,
                typeDescription: values.typeDescription,
                isActive: values.isActive,
            }

            await ProgramTypeService.updateProgramType(
                selectedProgramType.programTypeID,
                updateData,
            )

            toast.push(
                <Notification type="success" title="Success">
                    Program type updated successfully
                </Notification>,
            )

            await loadProgramTypes()
            onProgramTypesUpdated()
            setSelectedProgramType(null)
            setActiveTab('list')
        } catch (error) {
            console.error('Error updating program type:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    {error instanceof Error
                        ? error.message
                        : 'Failed to update program type'}
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteProgramType = async (programType: ProgramType) => {
        if (
            !window.confirm(
                `Are you sure you want to delete "${programType.typeName}"? This action cannot be undone.`,
            )
        ) {
            return
        }

        try {
            await ProgramTypeService.deleteProgramType(
                programType.programTypeID,
            )

            toast.push(
                <Notification type="success" title="Success">
                    Program type deleted successfully
                </Notification>,
            )

            await loadProgramTypes()
            onProgramTypesUpdated()

            if (
                selectedProgramType?.programTypeID === programType.programTypeID
            ) {
                setSelectedProgramType(null)
                setActiveTab('list')
            }
        } catch (error) {
            console.error('Error deleting program type:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    {error instanceof Error
                        ? error.message
                        : 'Failed to delete program type'}
                </Notification>,
            )
        }
    }

    const renderProgramTypesList = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h4>Program Types</h4>
                <Button
                    size="sm"
                    variant="solid"
                    icon={<HiOutlinePlus />}
                    onClick={() => {
                        setSelectedProgramType(null)
                        setActiveTab('create')
                    }}
                >
                    Add Program Type
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading program types...</div>
            ) : programTypes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No program types found
                </div>
            ) : (
                <div className="space-y-3">
                    {programTypes.map((programType) => (
                        <Card key={programType.programTypeID} className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h5 className="font-medium">
                                            {programType.typeName}
                                        </h5>
                                        <Tag
                                            className={
                                                programType.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }
                                        >
                                            {programType.isActive
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Tag>
                                    </div>
                                    {programType.typeDescription && (
                                        <p className="text-sm text-gray-600 mb-2">
                                            {programType.typeDescription}
                                        </p>
                                    )}
                                    <div className="text-xs text-gray-500">
                                        Attributes:{' '}
                                        {programType.attributes?.length || 0}
                                        {programType.attributes &&
                                            programType.attributes.length >
                                                0 && (
                                                <div className="mt-1">
                                                    {programType.attributes
                                                        .slice(0, 3)
                                                        .map((attr, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-block text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1 mt-1"
                                                            >
                                                                {
                                                                    attr.attributeName
                                                                }
                                                            </span>
                                                        ))}
                                                    {programType.attributes
                                                        .length > 3 && (
                                                        <span className="text-xs text-gray-500">
                                                            +
                                                            {programType
                                                                .attributes
                                                                .length -
                                                                3}{' '}
                                                            more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Created:{' '}
                                        {new Date(
                                            programType.createdAt,
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        icon={<HiOutlinePencil />}
                                        onClick={() =>
                                            setSelectedProgramType(programType)
                                        }
                                    />
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        icon={<HiOutlineTrash />}
                                        onClick={() =>
                                            handleDeleteProgramType(programType)
                                        }
                                        className="text-red-600 hover:text-red-800"
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )

    const renderProgramTypeForm = () => {
        const isEdit = activeTab === 'edit' && selectedProgramType
        const title = isEdit
            ? `Edit Program Type: ${selectedProgramType?.typeName}`
            : 'Create Program Type'

        return (
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <Button
                        size="sm"
                        variant="plain"
                        onClick={() => {
                            setSelectedProgramType(null)
                            setActiveTab('list')
                        }}
                    >
                        ← Back to List
                    </Button>
                    <h4>{title}</h4>
                </div>

                <Formik
                    initialValues={initialProgramTypeValues}
                    validationSchema={programTypeValidationSchema}
                    onSubmit={
                        isEdit
                            ? handleUpdateProgramType
                            : handleCreateProgramType
                    }
                    enableReinitialize
                >
                    {({ errors, touched, values }) => (
                        <Form>
                            <FormContainer>
                                <FormItem
                                    label="Type Name"
                                    invalid={
                                        !!(errors.typeName && touched.typeName)
                                    }
                                    errorMessage={errors.typeName}
                                >
                                    <Field name="typeName">
                                        {({ field, form }: any) => (
                                            <Input
                                                type="text"
                                                placeholder="Enter type name"
                                                value={field.value}
                                                onChange={(e) =>
                                                    form.setFieldValue(
                                                        field.name,
                                                        e.target.value,
                                                    )
                                                }
                                                onBlur={() =>
                                                    form.setFieldTouched(
                                                        field.name,
                                                        true,
                                                    )
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>

                                <FormItem
                                    label="Description"
                                    invalid={
                                        !!(
                                            errors.typeDescription &&
                                            touched.typeDescription
                                        )
                                    }
                                    errorMessage={errors.typeDescription}
                                >
                                    <Field name="typeDescription">
                                        {({ field, form }: any) => (
                                            <Input
                                                type="text"
                                                placeholder="Enter description (optional)"
                                                value={field.value}
                                                onChange={(e) =>
                                                    form.setFieldValue(
                                                        field.name,
                                                        e.target.value,
                                                    )
                                                }
                                                onBlur={() =>
                                                    form.setFieldTouched(
                                                        field.name,
                                                        true,
                                                    )
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>

                                <FormItem label="Status">
                                    <Field name="isActive">
                                        {({ field, form }: any) => (
                                            <div className="flex items-center gap-2">
                                                <Switcher
                                                    checked={field.value}
                                                    onChange={(checked) =>
                                                        form.setFieldValue(
                                                            field.name,
                                                            checked,
                                                        )
                                                    }
                                                />
                                                <span className="text-sm">
                                                    {field.value
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </div>
                                        )}
                                    </Field>
                                </FormItem>

                                <div className="flex justify-end gap-3 mt-6">
                                    <Button
                                        type="button"
                                        variant="plain"
                                        onClick={() => {
                                            setSelectedProgramType(null)
                                            setActiveTab('list')
                                        }}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="solid"
                                        loading={submitting}
                                    >
                                        {isEdit
                                            ? 'Update Program Type'
                                            : 'Create Program Type'}
                                    </Button>
                                </div>
                            </FormContainer>
                        </Form>
                    )}
                </Formik>
            </div>
        )
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={true}
            width={800}
            height={600}
        >
            <div className="p-6 h-full flex flex-col">
                <div className="flex-1 overflow-auto">
                    {activeTab === 'list' && renderProgramTypesList()}
                    {(activeTab === 'create' || activeTab === 'edit') &&
                        renderProgramTypeForm()}
                </div>
            </div>
        </Dialog>
    )
}

export default ProgramTypeModal

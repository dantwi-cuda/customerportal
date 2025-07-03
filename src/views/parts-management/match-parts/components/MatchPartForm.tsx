import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import FormItem from '@/components/ui/Form/FormItem'
import { HiArrowLeft, HiCheck, HiX } from 'react-icons/hi'
import type { PartMatch, MasterPart, SupplierPart } from '@/@types/parts'

interface SelectOption {
    value: number | string
    label: string
}

interface MatchPartFormProps {
    match?: PartMatch
    onSave: (matchData: Partial<PartMatch>) => void
    onCancel: () => void
    loading?: boolean
    masterParts: MasterPart[]
    supplierParts: SupplierPart[]
}

const MatchPartForm = ({
    match,
    onSave,
    onCancel,
    loading = false,
    masterParts,
    supplierParts,
}: MatchPartFormProps) => {
    const [formData, setFormData] = useState({
        masterPartID: match?.masterPartID || 0,
        supplierPartID: match?.supplierPartID || 0,
        confidenceScore: match?.confidenceScore || 0,
        matchStatus: match?.matchStatus || 'Pending',
        matchedBy: match?.matchedBy || '',
        notes: match?.notes || '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (match) {
            setFormData({
                masterPartID: match.masterPartID,
                supplierPartID: match.supplierPartID,
                confidenceScore: match.confidenceScore || 0,
                matchStatus: match.matchStatus,
                matchedBy: match.matchedBy,
                notes: match.notes || '',
            })
        }
    }, [match])

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }))
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.masterPartID) {
            newErrors.masterPartID = 'Master part is required'
        }
        if (!formData.supplierPartID) {
            newErrors.supplierPartID = 'Supplier part is required'
        }
        if (!formData.matchedBy.trim()) {
            newErrors.matchedBy = 'Matched by is required'
        }
        if (formData.confidenceScore < 0 || formData.confidenceScore > 1) {
            newErrors.confidenceScore =
                'Confidence score must be between 0 and 1'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            onSave(formData)
        }
    }

    const masterPartOptions: SelectOption[] = masterParts.map((part) => ({
        value: part.partID,
        label: `${part.partNumber} - ${part.manufacturerName} ${part.brandName}`,
    }))

    const supplierPartOptions: SelectOption[] = supplierParts.map((part) => ({
        value: part.partID,
        label: `${part.supplierPartNumber} - ${part.supplierName}`,
    }))

    const statusOptions: SelectOption[] = [
        { value: 'Pending', label: 'Pending' },
        { value: 'Approved', label: 'Approved' },
        { value: 'Rejected', label: 'Rejected' },
    ]

    const selectedMasterPart = masterParts.find(
        (p) => p.partID === formData.masterPartID,
    )
    const selectedSupplierPart = supplierParts.find(
        (p) => p.partID === formData.supplierPartID,
    )

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="plain"
                        size="sm"
                        icon={<HiArrowLeft />}
                        onClick={onCancel}
                    >
                        Back
                    </Button>
                    <h2 className="text-xl font-semibold">
                        {match ? 'Edit Part Match' : 'Create Part Match'}
                    </h2>
                </div>
                <div className="flex gap-2">
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
                        icon={<HiCheck />}
                    >
                        {match ? 'Update Match' : 'Create Match'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Master Part Selection */}
                <Card className="p-4">
                    <h3 className="text-lg font-medium mb-4">Master Part</h3>
                    <div className="space-y-4">
                        <FormItem
                            label="Select Master Part"
                            invalid={!!errors.masterPartID}
                            errorMessage={errors.masterPartID}
                        >
                            <Select
                                placeholder="Choose a master part..."
                                value={masterPartOptions.find(
                                    (opt) =>
                                        opt.value === formData.masterPartID,
                                )}
                                options={masterPartOptions}
                                onChange={(option) =>
                                    handleInputChange(
                                        'masterPartID',
                                        option?.value || 0,
                                    )
                                }
                            />
                        </FormItem>

                        {selectedMasterPart && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                <div className="text-sm space-y-1">
                                    <div>
                                        <strong>Part Number:</strong>{' '}
                                        {selectedMasterPart.partNumber}
                                    </div>
                                    <div>
                                        <strong>Description:</strong>{' '}
                                        {selectedMasterPart.description}
                                    </div>
                                    <div>
                                        <strong>Manufacturer:</strong>{' '}
                                        {selectedMasterPart.manufacturerName}
                                    </div>
                                    <div>
                                        <strong>Brand:</strong>{' '}
                                        {selectedMasterPart.brandName}
                                    </div>
                                    <div>
                                        <strong>Category:</strong>{' '}
                                        {selectedMasterPart.partCategoryName}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Supplier Part Selection */}
                <Card className="p-4">
                    <h3 className="text-lg font-medium mb-4">Supplier Part</h3>
                    <div className="space-y-4">
                        <FormItem
                            label="Select Supplier Part"
                            invalid={!!errors.supplierPartID}
                            errorMessage={errors.supplierPartID}
                        >
                            <Select
                                placeholder="Choose a supplier part..."
                                value={supplierPartOptions.find(
                                    (opt) =>
                                        opt.value === formData.supplierPartID,
                                )}
                                options={supplierPartOptions}
                                onChange={(option) =>
                                    handleInputChange(
                                        'supplierPartID',
                                        option?.value || 0,
                                    )
                                }
                            />
                        </FormItem>

                        {selectedSupplierPart && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                <div className="text-sm space-y-1">
                                    <div>
                                        <strong>Part Number:</strong>{' '}
                                        {
                                            selectedSupplierPart.supplierPartNumber
                                        }
                                    </div>
                                    <div>
                                        <strong>Description:</strong>{' '}
                                        {selectedSupplierPart.description}
                                    </div>
                                    <div>
                                        <strong>Supplier:</strong>{' '}
                                        {selectedSupplierPart.supplierName}
                                    </div>
                                    <div>
                                        <strong>Manufacturer:</strong>{' '}
                                        {selectedSupplierPart.manufacturerName}
                                    </div>
                                    <div>
                                        <strong>Brand:</strong>{' '}
                                        {selectedSupplierPart.brandName}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Match Details */}
            <Card className="p-4">
                <h3 className="text-lg font-medium mb-4">Match Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormItem
                        label="Confidence Score (0-1)"
                        invalid={!!errors.confidenceScore}
                        errorMessage={errors.confidenceScore}
                    >
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={formData.confidenceScore}
                            onChange={(e) =>
                                handleInputChange(
                                    'confidenceScore',
                                    parseFloat(e.target.value) || 0,
                                )
                            }
                        />
                    </FormItem>

                    <FormItem label="Status">
                        <Select
                            value={statusOptions.find(
                                (opt) => opt.value === formData.matchStatus,
                            )}
                            options={statusOptions}
                            onChange={(option) =>
                                handleInputChange(
                                    'matchStatus',
                                    option?.value || 'Pending',
                                )
                            }
                        />
                    </FormItem>

                    <FormItem
                        label="Matched By"
                        invalid={!!errors.matchedBy}
                        errorMessage={errors.matchedBy}
                    >
                        <Input
                            value={formData.matchedBy}
                            onChange={(e) =>
                                handleInputChange('matchedBy', e.target.value)
                            }
                        />
                    </FormItem>
                </div>

                <div className="mt-4">
                    <FormItem label="Notes">
                        <Textarea
                            placeholder="Add any notes about this match..."
                            value={formData.notes}
                            onChange={(e) =>
                                handleInputChange('notes', e.target.value)
                            }
                            rows={3}
                        />
                    </FormItem>
                </div>
            </Card>

            {/* Match Comparison */}
            {selectedMasterPart && selectedSupplierPart && (
                <Card className="p-4">
                    <h3 className="text-lg font-medium mb-4">
                        Match Comparison
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left p-2">Attribute</th>
                                    <th className="text-left p-2">
                                        Master Part
                                    </th>
                                    <th className="text-left p-2">
                                        Supplier Part
                                    </th>
                                    <th className="text-center p-2">Match</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr>
                                    <td className="p-2 font-medium">
                                        Part Number
                                    </td>
                                    <td className="p-2">
                                        {selectedMasterPart.partNumber}
                                    </td>
                                    <td className="p-2">
                                        {
                                            selectedSupplierPart.supplierPartNumber
                                        }
                                    </td>
                                    <td className="p-2 text-center">
                                        {selectedMasterPart.partNumber ===
                                        selectedSupplierPart.supplierPartNumber ? (
                                            <HiCheck className="text-green-500 mx-auto" />
                                        ) : (
                                            <HiX className="text-red-500 mx-auto" />
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-2 font-medium">
                                        Description
                                    </td>
                                    <td className="p-2 max-w-xs truncate">
                                        {selectedMasterPart.description}
                                    </td>
                                    <td className="p-2 max-w-xs truncate">
                                        {selectedSupplierPart.description}
                                    </td>
                                    <td className="p-2 text-center">
                                        {selectedMasterPart.description
                                            .toLowerCase()
                                            .includes(
                                                selectedSupplierPart.description.toLowerCase(),
                                            ) ||
                                        selectedSupplierPart.description
                                            .toLowerCase()
                                            .includes(
                                                selectedMasterPart.description.toLowerCase(),
                                            ) ? (
                                            <HiCheck className="text-yellow-500 mx-auto" />
                                        ) : (
                                            <HiX className="text-red-500 mx-auto" />
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-2 font-medium">
                                        Manufacturer/Supplier
                                    </td>
                                    <td className="p-2">
                                        {selectedMasterPart.manufacturerName}
                                    </td>
                                    <td className="p-2">
                                        {selectedSupplierPart.supplierName}
                                    </td>
                                    <td className="p-2 text-center">
                                        {selectedMasterPart.manufacturerName ===
                                        selectedSupplierPart.supplierName ? (
                                            <HiCheck className="text-green-500 mx-auto" />
                                        ) : (
                                            <HiX className="text-red-500 mx-auto" />
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </form>
    )
}

export default MatchPartForm

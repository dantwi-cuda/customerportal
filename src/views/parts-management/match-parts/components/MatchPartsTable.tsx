import { useState, useMemo, useRef } from 'react'
import type { SyntheticEvent, MouseEvent } from 'react'
import Table from '@/components/ui/Table'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Badge from '@/components/ui/Badge'
import Dropdown from '@/components/ui/Dropdown'
import type { DropdownRef } from '@/components/ui/Dropdown'
import EllipsisButton from '@/components/shared/EllipsisButton'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import {
    HiOutlineTrash,
    HiOutlineCheck,
    HiOutlineX,
    HiOutlineEye,
    HiPencil,
    HiTrash,
} from 'react-icons/hi'
import type { PartMatch } from '@/@types/parts'
import usePartsPermissions from '../../shared/usePartsPermissions'

const { Tr, Th, Td, THead, TBody } = Table

// Match Actions Dropdown Component
interface MatchActionsDropdownProps {
    match: PartMatch
    onEdit: (match: PartMatch) => void
    onDelete: (matchID: number) => void
    onApprove: (matchID: number) => void
    onReject: (matchID: number) => void
    onView: (match: PartMatch) => void
    setDeleteConfirmation: (state: {
        isOpen: boolean
        matchID?: number
        isBulk?: boolean
    }) => void
}

const MatchActionsDropdown: React.FC<MatchActionsDropdownProps> = ({
    match,
    onEdit,
    onDelete,
    onApprove,
    onReject,
    onView,
    setDeleteConfirmation,
}) => {
    const { canUpdateMatchParts, canDeleteMatchParts } = usePartsPermissions()
    const dropdownRef = useRef<DropdownRef>(null)

    const handleDropdownClick = (e: MouseEvent) => {
        e.stopPropagation()
        dropdownRef.current?.handleDropdownOpen()
    }

    const handleDropdownItemClick = (
        e: SyntheticEvent,
        callback?: () => void,
    ) => {
        e.stopPropagation()
        callback?.()
    }

    return (
        <Dropdown
            ref={dropdownRef}
            renderTitle={<EllipsisButton onClick={handleDropdownClick} />}
            placement="bottom-end"
        >
            <Dropdown.Item
                eventKey="view"
                onClick={(e) => handleDropdownItemClick(e, () => onView(match))}
            >
                <HiOutlineEye className="text-lg" />
                <span>View Details</span>
            </Dropdown.Item>

            {match.matchStatus === 'Pending' && canUpdateMatchParts && (
                <>
                    <Dropdown.Item
                        eventKey="approve"
                        onClick={(e) =>
                            handleDropdownItemClick(e, () =>
                                onApprove(match.matchID),
                            )
                        }
                    >
                        <HiOutlineCheck className="text-lg text-green-600" />
                        <span>Approve</span>
                    </Dropdown.Item>
                    <Dropdown.Item
                        eventKey="reject"
                        onClick={(e) =>
                            handleDropdownItemClick(e, () =>
                                onReject(match.matchID),
                            )
                        }
                    >
                        <HiOutlineX className="text-lg text-red-600" />
                        <span>Reject</span>
                    </Dropdown.Item>
                </>
            )}

            {canDeleteMatchParts && (
                <Dropdown.Item
                    eventKey="delete"
                    onClick={(e) =>
                        handleDropdownItemClick(e, () =>
                            setDeleteConfirmation({
                                isOpen: true,
                                matchID: match.matchID,
                            }),
                        )
                    }
                >
                    <HiTrash className="text-lg text-red-600" />
                    <span>Delete</span>
                </Dropdown.Item>
            )}
        </Dropdown>
    )
}

interface MatchPartsTableProps {
    data: PartMatch[]
    loading: boolean
    onEdit: (match: PartMatch) => void
    onDelete: (matchID: number) => void
    onApprove: (matchID: number) => void
    onReject: (matchID: number) => void
    onView: (match: PartMatch) => void
    onBulkDelete: (matchIDs: number[]) => void
    onBulkApprove: (matchIDs: number[]) => void
    onBulkReject: (matchIDs: number[]) => void
}

const MatchPartsTable = ({
    data,
    loading,
    onEdit,
    onDelete,
    onApprove,
    onReject,
    onView,
    onBulkDelete,
    onBulkApprove,
    onBulkReject,
}: MatchPartsTableProps) => {
    const { canUpdateMatchParts, canDeleteMatchParts } = usePartsPermissions()

    const [selectedMatches, setSelectedMatches] = useState<number[]>([])
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean
        matchID?: number
        isBulk?: boolean
    }>({ isOpen: false })

    const allSelected = useMemo(() => {
        return data.length > 0 && selectedMatches.length === data.length
    }, [data.length, selectedMatches.length])

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedMatches([])
        } else {
            setSelectedMatches(data.map((match) => match.matchID))
        }
    }

    const handleSelectMatch = (matchID: number) => {
        setSelectedMatches((prev) =>
            prev.includes(matchID)
                ? prev.filter((id) => id !== matchID)
                : [...prev, matchID],
        )
    }

    const getStatusClassName = (status: string) => {
        switch (status) {
            case 'Approved':
                return 'bg-emerald-500 text-white'
            case 'Rejected':
                return 'bg-red-500 text-white'
            case 'Pending':
            default:
                return 'bg-yellow-500 text-white'
        }
    }

    const getConfidenceClassName = (score?: number) => {
        if (!score) return 'bg-gray-500 text-white'
        if (score >= 0.8) return 'bg-emerald-500 text-white'
        if (score >= 0.6) return 'bg-yellow-500 text-white'
        return 'bg-red-500 text-white'
    }

    const handleConfirmDelete = () => {
        if (deleteConfirmation.isBulk) {
            onBulkDelete(selectedMatches)
            setSelectedMatches([])
        } else if (deleteConfirmation.matchID) {
            onDelete(deleteConfirmation.matchID)
        }
        setDeleteConfirmation({ isOpen: false })
    }

    const formatConfidenceScore = (score?: number) => {
        if (!score) return 'N/A'
        return `${Math.round(score * 100)}%`
    }

    return (
        <>
            {selectedMatches.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                            {selectedMatches.length} match(es) selected
                        </span>
                        <div className="flex gap-2">
                            {canUpdateMatchParts && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        color="green-500"
                                        onClick={() =>
                                            onBulkApprove(selectedMatches)
                                        }
                                    >
                                        <HiOutlineCheck className="mr-1" />
                                        Bulk Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        color="red-500"
                                        onClick={() =>
                                            onBulkReject(selectedMatches)
                                        }
                                    >
                                        <HiOutlineX className="mr-1" />
                                        Bulk Reject
                                    </Button>
                                </>
                            )}
                            {canDeleteMatchParts && (
                                <Button
                                    size="sm"
                                    variant="solid"
                                    color="red-500"
                                    onClick={() =>
                                        setDeleteConfirmation({
                                            isOpen: true,
                                            isBulk: true,
                                        })
                                    }
                                >
                                    <HiOutlineTrash className="mr-1" />
                                    Bulk Delete
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Table>
                <THead>
                    <Tr>
                        <Th>
                            <Checkbox
                                checked={allSelected}
                                onChange={handleSelectAll}
                            />
                        </Th>
                        <Th>Status</Th>
                        <Th>Confidence</Th>
                        <Th>Master Part</Th>
                        <Th>Supplier Part</Th>
                        <Th>Matched By</Th>
                        <Th>Match Date</Th>
                        <Th>Actions</Th>
                    </Tr>
                </THead>
                <TBody>
                    {loading ? (
                        <Tr>
                            <Td colSpan={8} className="text-center py-8">
                                Loading...
                            </Td>
                        </Tr>
                    ) : data.length === 0 ? (
                        <Tr>
                            <Td colSpan={8} className="text-center py-8">
                                No matches found
                            </Td>
                        </Tr>
                    ) : (
                        data.map((match) => (
                            <Tr key={match.matchID}>
                                <Td>
                                    <Checkbox
                                        checked={selectedMatches.includes(
                                            match.matchID,
                                        )}
                                        onChange={() =>
                                            handleSelectMatch(match.matchID)
                                        }
                                    />
                                </Td>
                                <Td>
                                    <Badge
                                        className={getStatusClassName(
                                            match.matchStatus,
                                        )}
                                    >
                                        {match.matchStatus}
                                    </Badge>
                                </Td>
                                <Td>
                                    <Badge
                                        className={getConfidenceClassName(
                                            match.confidenceScore,
                                        )}
                                    >
                                        {formatConfidenceScore(
                                            match.confidenceScore,
                                        )}
                                    </Badge>
                                </Td>
                                <Td>
                                    <div>
                                        <div className="font-semibold">
                                            {match.masterPartNumber}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {match.masterPartManufacturer} |{' '}
                                            {match.masterPartBrand}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate max-w-48">
                                            {match.masterPartDescription}
                                        </div>
                                    </div>
                                </Td>
                                <Td>
                                    <div>
                                        <div className="font-semibold">
                                            {match.supplierPartNumber}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {match.supplierName}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate max-w-48">
                                            {match.supplierPartDescription}
                                        </div>
                                    </div>
                                </Td>
                                <Td>{match.matchedBy}</Td>
                                <Td>
                                    {new Date(
                                        match.matchDate,
                                    ).toLocaleDateString()}
                                </Td>
                                <Td>
                                    <MatchActionsDropdown
                                        match={match}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onApprove={onApprove}
                                        onReject={onReject}
                                        onView={onView}
                                        setDeleteConfirmation={
                                            setDeleteConfirmation
                                        }
                                    />
                                </Td>
                            </Tr>
                        ))
                    )}
                </TBody>
            </Table>

            <ConfirmDialog
                isOpen={deleteConfirmation.isOpen}
                title={
                    deleteConfirmation.isBulk
                        ? 'Delete Selected Matches'
                        : 'Delete Match'
                }
                content={
                    deleteConfirmation.isBulk
                        ? `Are you sure you want to delete ${selectedMatches.length} selected matches? This action cannot be undone.`
                        : 'Are you sure you want to delete this match? This action cannot be undone.'
                }
                confirmButtonColor="red-600"
                onClose={() => setDeleteConfirmation({ isOpen: false })}
                onConfirm={handleConfirmDelete}
            />
        </>
    )
}

export default MatchPartsTable

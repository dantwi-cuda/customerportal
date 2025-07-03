import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { HiPlus, HiRefresh, HiSearch } from 'react-icons/hi'
import MatchPartsTable from './components/MatchPartsTable'
import MatchPartForm from './components/MatchPartForm'
import type { PartMatch, MasterPart, SupplierPart } from '@/@types/parts'
import MatchPartService from '@/services/MatchPartService'
import MasterPartService from '@/services/MasterPartService'
import SupplierPartService from '@/services/SupplierPartService'
import usePartsPermissions from '../shared/usePartsPermissions'

interface SelectOption {
    value: string
    label: string
}

const MatchPartManagementPage = () => {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const {
        canViewMatchParts,
        canCreateMatchParts,
        canUpdateMatchParts,
        canDeleteMatchParts,
    } = usePartsPermissions()

    // Navigation state
    const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit'>(
        'list',
    )
    const [editingMatch, setEditingMatch] = useState<PartMatch | null>(null)

    // Data state
    const [matches, setMatches] = useState<PartMatch[]>([])
    const [masterParts, setMasterParts] = useState<MasterPart[]>([])
    const [supplierParts, setSupplierParts] = useState<SupplierPart[]>([])
    const [loading, setLoading] = useState(true)
    const [formLoading, setFormLoading] = useState(false)

    // Filter state
    const [searchQuery, setSearchQuery] = useState(
        searchParams.get('search') || '',
    )
    const [statusFilter, setStatusFilter] = useState(
        searchParams.get('status') || '',
    )
    const [confidenceFilter, setConfidenceFilter] = useState(
        searchParams.get('confidence') || '',
    )

    // Update URL params when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (searchQuery) params.set('search', searchQuery)
        if (statusFilter) params.set('status', statusFilter)
        if (confidenceFilter) params.set('confidence', confidenceFilter)
        setSearchParams(params)
    }, [searchQuery, statusFilter, confidenceFilter, setSearchParams])

    const fetchMatches = useCallback(async () => {
        if (!canViewMatchParts) return

        try {
            setLoading(true)
            const response = await MatchPartService.getMatches({
                search: searchQuery,
                status: statusFilter,
                // Note: confidenceScore filtering would need to be handled server-side
            })
            setMatches(response.data)
        } catch (error) {
            console.error('Failed to fetch matches:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch part matches.
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }, [canViewMatchParts, searchQuery, statusFilter, confidenceFilter])

    const fetchMasterParts = useCallback(async () => {
        try {
            const data = await MasterPartService.getMasterParts()
            setMasterParts(data)
        } catch (error) {
            console.error('Failed to fetch master parts:', error)
        }
    }, [])

    const fetchSupplierParts = useCallback(async () => {
        try {
            const data = await SupplierPartService.getSupplierParts()
            setSupplierParts(data)
        } catch (error) {
            console.error('Failed to fetch supplier parts:', error)
        }
    }, [])

    useEffect(() => {
        fetchMatches()
        fetchMasterParts()
        fetchSupplierParts()
    }, [fetchMatches, fetchMasterParts, fetchSupplierParts])

    const handleAddMatch = () => {
        if (!canCreateMatchParts) return
        setEditingMatch(null)
        setCurrentView('add')
    }

    const handleEditMatch = (match: PartMatch) => {
        if (!canUpdateMatchParts) return
        setEditingMatch(match)
        setCurrentView('edit')
    }

    const handleViewMatch = (match: PartMatch) => {
        // Could open a detailed view modal or navigate to details page
        console.log('View match details:', match)
    }

    const handleDeleteMatch = async (matchID: number) => {
        if (!canDeleteMatchParts) return

        try {
            await MatchPartService.deleteMatch(matchID)
            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    Match deleted successfully.
                </Notification>,
            )
            await fetchMatches()
        } catch (error) {
            console.error('Failed to delete match:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to delete match.
                </Notification>,
            )
        }
    }

    const handleBulkDelete = async (matchIDs: number[]) => {
        if (!canDeleteMatchParts) return

        try {
            await Promise.all(
                matchIDs.map((id) => MatchPartService.deleteMatch(id)),
            )
            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    {matchIDs.length} matches deleted successfully.
                </Notification>,
            )
            await fetchMatches()
        } catch (error) {
            console.error('Failed to delete matches:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to delete matches.
                </Notification>,
            )
        }
    }

    const handleApproveMatch = async (matchID: number) => {
        if (!canUpdateMatchParts) return

        try {
            await MatchPartService.updateMatch(matchID, {
                matchStatus: 'Approved',
            })
            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    Match approved successfully.
                </Notification>,
            )
            await fetchMatches()
        } catch (error) {
            console.error('Failed to approve match:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to approve match.
                </Notification>,
            )
        }
    }

    const handleRejectMatch = async (matchID: number) => {
        if (!canUpdateMatchParts) return

        try {
            await MatchPartService.updateMatch(matchID, {
                matchStatus: 'Rejected',
            })
            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    Match rejected successfully.
                </Notification>,
            )
            await fetchMatches()
        } catch (error) {
            console.error('Failed to reject match:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to reject match.
                </Notification>,
            )
        }
    }

    const handleBulkApprove = async (matchIDs: number[]) => {
        if (!canUpdateMatchParts) return

        try {
            await Promise.all(
                matchIDs.map((id) =>
                    MatchPartService.updateMatch(id, {
                        matchStatus: 'Approved',
                    }),
                ),
            )
            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    {matchIDs.length} matches approved successfully.
                </Notification>,
            )
            await fetchMatches()
        } catch (error) {
            console.error('Failed to approve matches:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to approve matches.
                </Notification>,
            )
        }
    }

    const handleBulkReject = async (matchIDs: number[]) => {
        if (!canUpdateMatchParts) return

        try {
            await Promise.all(
                matchIDs.map((id) =>
                    MatchPartService.updateMatch(id, {
                        matchStatus: 'Rejected',
                    }),
                ),
            )
            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    {matchIDs.length} matches rejected successfully.
                </Notification>,
            )
            await fetchMatches()
        } catch (error) {
            console.error('Failed to reject matches:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to reject matches.
                </Notification>,
            )
        }
    }

    const handleSaveMatch = async (matchData: Partial<PartMatch>) => {
        try {
            setFormLoading(true)

            if (editingMatch) {
                await MatchPartService.updateMatch(editingMatch.matchID, {
                    matchStatus: matchData.matchStatus!,
                    notes: matchData.notes,
                })
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Match updated successfully.
                    </Notification>,
                )
            } else {
                await MatchPartService.createMatch({
                    masterPartID: matchData.masterPartID!,
                    supplierPartID: matchData.supplierPartID!,
                    notes: matchData.notes,
                })
                toast.push(
                    <Notification
                        title="Success"
                        type="success"
                        duration={3000}
                    >
                        Match created successfully.
                    </Notification>,
                )
            }

            setCurrentView('list')
            setEditingMatch(null)
            await fetchMatches()
        } catch (error) {
            console.error('Failed to save match:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to save match.
                </Notification>,
            )
        } finally {
            setFormLoading(false)
        }
    }

    const handleCancelForm = () => {
        setCurrentView('list')
        setEditingMatch(null)
    }

    const statusOptions: SelectOption[] = [
        { value: '', label: 'All Statuses' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Approved', label: 'Approved' },
        { value: 'Rejected', label: 'Rejected' },
    ]

    const confidenceOptions: SelectOption[] = [
        { value: '', label: 'All Confidence Levels' },
        { value: 'high', label: 'High (≥80%)' },
        { value: 'medium', label: 'Medium (60-79%)' },
        { value: 'low', label: 'Low (<60%)' },
    ]

    if (!canViewMatchParts) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">
                    You don't have permission to view part matches.
                </p>
            </div>
        )
    }

    if (currentView === 'add' || currentView === 'edit') {
        return (
            <MatchPartForm
                match={editingMatch || undefined}
                onSave={handleSaveMatch}
                onCancel={handleCancelForm}
                loading={formLoading}
                masterParts={masterParts}
                supplierParts={supplierParts}
            />
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Part Matches</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage matches between master parts and supplier parts
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="plain"
                        size="sm"
                        icon={<HiRefresh />}
                        onClick={fetchMatches}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                    {canCreateMatchParts && (
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<HiPlus />}
                            onClick={handleAddMatch}
                        >
                            Add Match
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search matches..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select
                        placeholder="Filter by status"
                        value={statusOptions.find(
                            (opt) => opt.value === statusFilter,
                        )}
                        options={statusOptions}
                        onChange={(option) =>
                            setStatusFilter(option?.value || '')
                        }
                    />
                    <Select
                        placeholder="Filter by confidence"
                        value={confidenceOptions.find(
                            (opt) => opt.value === confidenceFilter,
                        )}
                        options={confidenceOptions}
                        onChange={(option) =>
                            setConfidenceFilter(option?.value || '')
                        }
                    />
                    <div className="text-sm text-gray-500 flex items-center">
                        Total: {matches.length} matches
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="p-4">
                <MatchPartsTable
                    data={matches}
                    loading={loading}
                    onEdit={handleEditMatch}
                    onDelete={handleDeleteMatch}
                    onApprove={handleApproveMatch}
                    onReject={handleRejectMatch}
                    onView={handleViewMatch}
                    onBulkDelete={handleBulkDelete}
                    onBulkApprove={handleBulkApprove}
                    onBulkReject={handleBulkReject}
                />
            </Card>
        </div>
    )
}

export default MatchPartManagementPage

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import MatchPartsTable from '../components/MatchPartsTable'
import type { PartMatch } from '@/@types/parts'

// Mock the permissions hook
vi.mock('../../shared/usePartsPermissions', () => ({
    default: () => ({
        canUpdateMatchParts: true,
        canDeleteMatchParts: true,
    }),
}))

const mockMatches: PartMatch[] = [
    {
        matchID: 1,
        masterPartID: 1,
        supplierPartID: 1,
        matchedBy: 'Test User',
        matchDate: '2024-01-01',
        matchStatus: 'Pending',
        confidenceScore: 0.85,
        notes: 'Test match',
        masterPartNumber: 'MP001',
        masterPartDescription: 'Test Master Part',
        masterPartManufacturer: 'Test Manufacturer',
        masterPartBrand: 'Test Brand',
        supplierPartNumber: 'SP001',
        supplierPartDescription: 'Test Supplier Part',
        supplierName: 'Test Supplier',
    },
]

const defaultProps = {
    data: mockMatches,
    loading: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onApprove: vi.fn(),
    onReject: vi.fn(),
    onView: vi.fn(),
    onBulkDelete: vi.fn(),
    onBulkApprove: vi.fn(),
    onBulkReject: vi.fn(),
}

describe('MatchPartsTable', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders match data correctly', () => {
        render(<MatchPartsTable {...defaultProps} />)

        expect(screen.getByText('Pending')).toBeInTheDocument()
        expect(screen.getByText('MP001')).toBeInTheDocument()
        expect(screen.getByText('SP001')).toBeInTheDocument()
        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText('85%')).toBeInTheDocument()
    })

    it('shows loading state', () => {
        render(<MatchPartsTable {...defaultProps} loading={true} />)
        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('shows empty state when no data', () => {
        render(<MatchPartsTable {...defaultProps} data={[]} />)
        expect(screen.getByText('No matches found')).toBeInTheDocument()
    })

    it('handles row selection', async () => {
        render(<MatchPartsTable {...defaultProps} />)

        const checkbox = screen.getAllByRole('checkbox')[1] // Skip the "select all" checkbox
        fireEvent.click(checkbox)

        await waitFor(() => {
            expect(screen.getByText('1 match(es) selected')).toBeInTheDocument()
        })
    })

    it('handles select all', async () => {
        render(<MatchPartsTable {...defaultProps} />)

        const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
        fireEvent.click(selectAllCheckbox)

        await waitFor(() => {
            expect(screen.getByText('1 match(es) selected')).toBeInTheDocument()
        })
    })

    it('shows bulk actions when items are selected', async () => {
        render(<MatchPartsTable {...defaultProps} />)

        const checkbox = screen.getAllByRole('checkbox')[1]
        fireEvent.click(checkbox)

        await waitFor(() => {
            expect(screen.getByText('Bulk Approve')).toBeInTheDocument()
            expect(screen.getByText('Bulk Reject')).toBeInTheDocument()
            expect(screen.getByText('Bulk Delete')).toBeInTheDocument()
        })
    })
})

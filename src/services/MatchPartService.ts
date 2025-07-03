import ApiService from './ApiService'
import type { 
    PartMatch, 
    CreatePartMatchRequest, 
    UpdatePartMatchRequest, 
    SuggestMatchesRequest,
    MatchSuggestion
} from '@/@types/parts'

const MatchPartService = {
    // Get all part matches with filtering and pagination
    async getMatches(params?: {
        page?: number
        limit?: number
        search?: string
        status?: string
        masterPartID?: number
        supplierPartID?: number
    }): Promise<{
        data: PartMatch[]
        total: number
        page: number
        limit: number
    }> {
        return ApiService.fetchDataWithAxios({
            url: 'PartMatch',
            method: 'get',
            params,
        })
    },

    // Get a specific part match by ID
    async getMatchById(matchID: number): Promise<PartMatch> {
        return ApiService.fetchDataWithAxios({
            url: `PartMatch/${matchID}`,
            method: 'get',
        })
    },

    // Create a new part match
    async createMatch(data: CreatePartMatchRequest): Promise<PartMatch> {
        return ApiService.fetchDataWithAxios({
            url: 'PartMatch',
            method: 'post',
            data,
        })
    },

    // Update an existing part match
    async updateMatch(matchID: number, data: UpdatePartMatchRequest): Promise<PartMatch> {
        return ApiService.fetchDataWithAxios({
            url: `PartMatch/${matchID}`,
            method: 'put',
            data,
        })
    },

    // Delete a part match
    async deleteMatch(matchID: number): Promise<void> {
        return ApiService.fetchDataWithAxios({
            url: `PartMatch/${matchID}`,
            method: 'delete',
        })
    },

    // Approve a part match
    async approveMatch(matchID: number, notes?: string): Promise<PartMatch> {
        return ApiService.fetchDataWithAxios({
            url: `PartMatch/${matchID}/approve`,
            method: 'post',
            data: { notes },
        })
    },

    // Reject a part match
    async rejectMatch(matchID: number, notes?: string): Promise<PartMatch> {
        return ApiService.fetchDataWithAxios({
            url: `PartMatch/${matchID}/reject`,
            method: 'post',
            data: { notes },
        })
    },

    // Get suggested matches for automatic matching
    async getSuggestedMatches(data: SuggestMatchesRequest): Promise<MatchSuggestion[]> {
        return ApiService.fetchDataWithAxios({
            url: 'PartMatch/suggest',
            method: 'post',
            data,
        })
    },

    // Auto-match parts based on AI/ML algorithms
    async autoMatch(threshold?: number): Promise<{
        created: number
        suggestions: MatchSuggestion[]
    }> {
        return ApiService.fetchDataWithAxios({
            url: 'PartMatch/auto-match',
            method: 'post',
            data: { threshold },
        })
    },

    // Export matches to various formats
    async exportMatches(format: 'excel' | 'csv', filters?: {
        status?: string
        dateFrom?: string
        dateTo?: string
    }): Promise<Blob> {
        return ApiService.fetchDataWithAxios({
            url: `PartMatch/export/${format}`,
            method: 'get',
            params: filters,
            responseType: 'blob',
        })
    },

    // Bulk operations
    async bulkApprove(matchIDs: number[]): Promise<{ success: number; failed: number }> {
        return ApiService.fetchDataWithAxios({
            url: 'PartMatch/bulk-approve',
            method: 'post',
            data: { matchIDs },
        })
    },

    async bulkReject(matchIDs: number[]): Promise<{ success: number; failed: number }> {
        return ApiService.fetchDataWithAxios({
            url: 'PartMatch/bulk-reject',
            method: 'post',
            data: { matchIDs },
        })
    },

    async bulkDelete(matchIDs: number[]): Promise<{ success: number; failed: number }> {
        return ApiService.fetchDataWithAxios({
            url: 'PartMatch/bulk-delete',
            method: 'post',
            data: { matchIDs },
        })
    },
}

export default MatchPartService

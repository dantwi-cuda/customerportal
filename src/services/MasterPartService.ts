import ApiService from './ApiService'
import type { 
    MasterPart, 
    CreateMasterPartRequest, 
    UpdateMasterPartRequest 
} from '@/@types/parts'

const MasterPartService = {
    // Get all master parts
    getMasterParts: async (): Promise<MasterPart[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<MasterPart[]>({
                url: 'masterpart',
                method: 'get',
            })
            return result
        } catch (error) {
            console.error('Failed to fetch master parts:', error)
            throw error
        }
    },

    // Get master part by ID
    getMasterPart: async (id: number): Promise<MasterPart> => {
        try {
            const result = await ApiService.fetchDataWithAxios<MasterPart>({
                url: `masterpart/${id}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch master part ${id}:`, error)
            throw error
        }
    },

    // Get master parts by manufacturer
    getMasterPartsByManufacturer: async (manufacturerId: number): Promise<MasterPart[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<MasterPart[]>({
                url: `masterpart/manufacturer/${manufacturerId}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch master parts for manufacturer ${manufacturerId}:`, error)
            throw error
        }
    },

    // Get master parts by brand
    getMasterPartsByBrand: async (brandId: number): Promise<MasterPart[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<MasterPart[]>({
                url: `masterpart/brand/${brandId}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch master parts for brand ${brandId}:`, error)
            throw error
        }
    },

    // Search master parts
    searchMasterParts: async (searchTerm: string): Promise<MasterPart[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<MasterPart[]>({
                url: 'masterpart/search',
                method: 'get',
                params: { searchTerm },
            })
            return result
        } catch (error) {
            console.error('Failed to search master parts:', error)
            throw error
        }
    },

    // Create master part
    createMasterPart: async (data: CreateMasterPartRequest): Promise<MasterPart> => {
        try {
            const result = await ApiService.fetchDataWithAxios<MasterPart>({
                url: 'masterpart',
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error('Failed to create master part:', error)
            throw error
        }
    },

    // Update master part
    updateMasterPart: async (id: number, data: UpdateMasterPartRequest): Promise<MasterPart> => {
        try {
            const result = await ApiService.fetchDataWithAxios<MasterPart>({
                url: `masterpart/${id}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error(`Failed to update master part ${id}:`, error)
            throw error
        }
    },

    // Delete master part
    deleteMasterPart: async (id: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `masterpart/${id}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to delete master part ${id}:`, error)
            throw error
        }
    },
}

export default MasterPartService

import ApiService from './ApiService'
import type { 
    Manufacturer, 
    CreateManufacturerRequest, 
    UpdateManufacturerRequest 
} from '@/@types/parts'

const ManufacturerService = {
    // Get all manufacturers
    getManufacturers: async (): Promise<Manufacturer[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Manufacturer[]>({
                url: 'manufacturer',
                method: 'get',
            })
            return result
        } catch (error) {
            console.error('Failed to fetch manufacturers:', error)
            throw error
        }
    },

    // Get manufacturer by ID
    getManufacturer: async (id: number): Promise<Manufacturer> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Manufacturer>({
                url: `manufacturer/${id}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch manufacturer ${id}:`, error)
            throw error
        }
    },

    // Create manufacturer
    createManufacturer: async (data: CreateManufacturerRequest): Promise<Manufacturer> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Manufacturer>({
                url: 'manufacturer',
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error('Failed to create manufacturer:', error)
            throw error
        }
    },

    // Update manufacturer
    updateManufacturer: async (id: number, data: UpdateManufacturerRequest): Promise<Manufacturer> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Manufacturer>({
                url: `manufacturer/${id}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error(`Failed to update manufacturer ${id}:`, error)
            throw error
        }
    },

    // Delete manufacturer
    deleteManufacturer: async (id: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `manufacturer/${id}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to delete manufacturer ${id}:`, error)
            throw error
        }
    },
}

export default ManufacturerService

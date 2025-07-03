import ApiService from './ApiService'
import type { 
    Brand, 
    CreateBrandRequest, 
    UpdateBrandRequest 
} from '@/@types/parts'

const BrandService = {
    // Get all brands
    getBrands: async (): Promise<Brand[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Brand[]>({
                url: 'brand',
                method: 'get',
            })
            return result
        } catch (error) {
            console.error('Failed to fetch brands:', error)
            throw error
        }
    },

    // Get brand by ID
    getBrand: async (id: number): Promise<Brand> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Brand>({
                url: `brand/${id}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch brand ${id}:`, error)
            throw error
        }
    },

    // Get brands by manufacturer
    getBrandsByManufacturer: async (manufacturerId: number): Promise<Brand[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Brand[]>({
                url: `brand/manufacturer/${manufacturerId}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch brands for manufacturer ${manufacturerId}:`, error)
            throw error
        }
    },

    // Create brand
    createBrand: async (data: CreateBrandRequest): Promise<Brand> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Brand>({
                url: 'brand',
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error('Failed to create brand:', error)
            throw error
        }
    },

    // Update brand
    updateBrand: async (id: number, data: UpdateBrandRequest): Promise<Brand> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Brand>({
                url: `brand/${id}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error(`Failed to update brand ${id}:`, error)
            throw error
        }
    },

    // Delete brand
    deleteBrand: async (id: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `brand/${id}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to delete brand ${id}:`, error)
            throw error
        }
    },
}

export default BrandService

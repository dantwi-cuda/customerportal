import ApiService from './ApiService'
import type { 
    PartCategory, 
    CreatePartCategoryRequest, 
    UpdatePartCategoryRequest 
} from '@/@types/parts'

const PartCategoryService = {
    // Get all part categories
    getPartCategories: async (): Promise<PartCategory[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<PartCategory[]>({
                url: 'partcategory',
                method: 'get',
            })
            return result
        } catch (error) {
            console.error('Failed to fetch part categories:', error)
            throw error
        }
    },

    // Get part category by ID
    getPartCategory: async (id: number): Promise<PartCategory> => {
        try {
            const result = await ApiService.fetchDataWithAxios<PartCategory>({
                url: `partcategory/${id}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch part category ${id}:`, error)
            throw error
        }
    },

    // Create part category
    createPartCategory: async (data: CreatePartCategoryRequest): Promise<PartCategory> => {
        try {
            const result = await ApiService.fetchDataWithAxios<PartCategory>({
                url: 'partcategory',
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error('Failed to create part category:', error)
            throw error
        }
    },

    // Update part category
    updatePartCategory: async (id: number, data: UpdatePartCategoryRequest): Promise<PartCategory> => {
        try {
            const result = await ApiService.fetchDataWithAxios<PartCategory>({
                url: `partcategory/${id}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error(`Failed to update part category ${id}:`, error)
            throw error
        }
    },

    // Delete part category
    deletePartCategory: async (id: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `partcategory/${id}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to delete part category ${id}:`, error)
            throw error
        }
    },
}

export default PartCategoryService

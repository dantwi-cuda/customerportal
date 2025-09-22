import ApiService from './ApiService'
import type {
    ProgramCategory,
    CreateProgramCategoryRequest,
    UpdateProgramCategoryRequest,
} from '@/@types/programCategory'

/**
 * Service for managing program categories
 * Provides CRUD operations with proper error handling and logging
 */
const ProgramCategoryService = {
    /**
     * Get all program categories
     * @returns Promise<ProgramCategory[]> List of program categories
     */
    getProgramCategories: async (): Promise<ProgramCategory[]> => {
        try {
            console.log('ProgramCategoryService.getProgramCategories - Fetching categories')
            
            const result = await ApiService.fetchDataWithAxios<ProgramCategory[]>({
                url: '/api/ProgramCategory',
                method: 'get',
            })
            
            console.log('ProgramCategoryService.getProgramCategories - Success:', result?.length || 0, 'categories')
            return result || []
        } catch (error) {
            console.error('ProgramCategoryService.getProgramCategories - Error:', error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to fetch program categories: ${error.message}`
                    : 'Failed to fetch program categories: Unknown error occurred'
            )
        }
    },

    /**
     * Get a program category by ID
     * @param id Program category ID
     * @returns Promise<ProgramCategory> Program category details
     */
    getProgramCategoryById: async (id: number): Promise<ProgramCategory> => {
        try {
            console.log(`ProgramCategoryService.getProgramCategoryById - Fetching category ${id}`)
            
            // Input validation
            if (!id || id <= 0) {
                throw new Error('Valid category ID is required')
            }
            
            const result = await ApiService.fetchDataWithAxios<ProgramCategory>({
                url: `/api/ProgramCategory/${id}`,
                method: 'get',
            })
            
            if (!result) {
                throw new Error(`Program category with ID ${id} not found`)
            }
            
            console.log(`ProgramCategoryService.getProgramCategoryById - Success: Found category ${id}`)
            return result
        } catch (error) {
            console.error(`ProgramCategoryService.getProgramCategoryById - Error fetching category ${id}:`, error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to fetch program category: ${error.message}`
                    : 'Failed to fetch program category: Unknown error occurred'
            )
        }
    },

    /**
     * Create a new program category
     * @param data Program category creation data
     * @returns Promise<ProgramCategory> Created program category
     */
    createProgramCategory: async (data: CreateProgramCategoryRequest): Promise<ProgramCategory> => {
        try {
            console.log('ProgramCategoryService.createProgramCategory - Creating:', data)
            
            // Input validation
            if (!data.categoryName || data.categoryName.trim().length === 0) {
                throw new Error('Category name is required')
            }
            if (data.categoryName.length > 100) {
                throw new Error('Category name must be 100 characters or less')
            }
            if (data.categoryDescription && data.categoryDescription.length > 500) {
                throw new Error('Category description must be 500 characters or less')
            }
            
            const result = await ApiService.fetchDataWithAxios<ProgramCategory>({
                url: '/api/ProgramCategory',
                method: 'post',
                data: data as any,
            })
            
            console.log('ProgramCategoryService.createProgramCategory - Success:', result)
            return result
        } catch (error) {
            console.error('ProgramCategoryService.createProgramCategory - Error:', error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to create program category: ${error.message}`
                    : 'Failed to create program category: Unknown error occurred'
            )
        }
    },

    /**
     * Update an existing program category
     * @param id Program category ID
     * @param data Program category update data
     * @returns Promise<ProgramCategory> Updated program category
     */
    updateProgramCategory: async (
        id: number,
        data: UpdateProgramCategoryRequest,
    ): Promise<ProgramCategory> => {
        try {
            console.log(`ProgramCategoryService.updateProgramCategory - Updating category ${id}:`, data)
            
            // Input validation
            if (!id || id <= 0) {
                throw new Error('Valid category ID is required')
            }
            if (!data.categoryName || data.categoryName.trim().length === 0) {
                throw new Error('Category name is required')
            }
            if (data.categoryName.length > 100) {
                throw new Error('Category name must be 100 characters or less')
            }
            if (data.categoryDescription && data.categoryDescription.length > 500) {
                throw new Error('Category description must be 500 characters or less')
            }
            
            const result = await ApiService.fetchDataWithAxios<ProgramCategory>({
                url: `/api/ProgramCategory/${id}`,
                method: 'put',
                data: data as any,
            })
            
            console.log(`ProgramCategoryService.updateProgramCategory - Success: Updated category ${id}`)
            return result
        } catch (error) {
            console.error(`ProgramCategoryService.updateProgramCategory - Error updating category ${id}:`, error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to update program category: ${error.message}`
                    : 'Failed to update program category: Unknown error occurred'
            )
        }
    },

    /**
     * Delete a program category
     * @param id Program category ID
     * @returns Promise<void>
     */
    deleteProgramCategory: async (id: number): Promise<void> => {
        try {
            console.log(`ProgramCategoryService.deleteProgramCategory - Deleting category ${id}`)
            
            // Input validation
            if (!id || id <= 0) {
                throw new Error('Valid category ID is required')
            }
            
            await ApiService.fetchDataWithAxios<void>({
                url: `/api/ProgramCategory/${id}`,
                method: 'delete',
            })
            
            console.log(`ProgramCategoryService.deleteProgramCategory - Success: Deleted category ${id}`)
        } catch (error) {
            console.error(`ProgramCategoryService.deleteProgramCategory - Error deleting category ${id}:`, error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to delete program category: ${error.message}`
                    : 'Failed to delete program category: Unknown error occurred'
            )
        }
    },
}

export default ProgramCategoryService

import ApiService from './ApiService'
import type { 
    ProgramType, 
    CreateProgramTypeRequest, 
    UpdateProgramTypeRequest, 
    CreateProgramTypeAttributeRequest,
    UpdateProgramTypeAttributeRequest 
} from '@/@types/programType'

/**
 * Program Type Service
 * Handles all API operations related to program types and their attributes
 * Following Azure best practices for error handling and security
 */
const ProgramTypeService = {
    /**
     * Get all program types with their attributes
     * @returns Promise<ProgramType[]> List of program types
     */
    getProgramTypes: async (): Promise<ProgramType[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<ProgramType[]>({
                url: '/api/ProgramType',
                method: 'get',
            })
            console.log('ProgramTypeService.getProgramTypes - Success:', result.length, 'program types retrieved')
            return result
        } catch (error) {
            console.error('ProgramTypeService.getProgramTypes - Error:', error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to fetch program types: ${error.message}`
                    : 'Failed to fetch program types: Unknown error occurred'
            )
        }
    },

    /**
     * Get a specific program type by ID
     * @param id Program type ID
     * @returns Promise<ProgramType> Program type details
     */
    getProgramTypeById: async (id: number): Promise<ProgramType> => {
        try {
            const result = await ApiService.fetchDataWithAxios<ProgramType>({
                url: `/api/ProgramType/${id}`,
                method: 'get',
            })
            console.log(`ProgramTypeService.getProgramTypeById - Success: Retrieved program type ${id}`)
            return result
        } catch (error) {
            console.error(`ProgramTypeService.getProgramTypeById - Error fetching program type ${id}:`, error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to fetch program type: ${error.message}`
                    : 'Failed to fetch program type: Unknown error occurred'
            )
        }
    },

    /**
     * Create a new program type
     * @param data Program type creation data
     * @returns Promise<ProgramType> Created program type
     */
    createProgramType: async (data: CreateProgramTypeRequest): Promise<ProgramType> => {
        try {
            console.log('ProgramTypeService.createProgramType - Creating:', data)
            
            // Input validation
            if (!data.typeName || data.typeName.trim().length === 0) {
                throw new Error('Program type name is required')
            }
            
            const result = await ApiService.fetchDataWithAxios<ProgramType>({
                url: '/api/ProgramType',
                method: 'post',
                data: data as any,
            })
            console.log('ProgramTypeService.createProgramType - Success:', result)
            return result
        } catch (error) {
            console.error('ProgramTypeService.createProgramType - Error:', error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to create program type: ${error.message}`
                    : 'Failed to create program type: Unknown error occurred'
            )
        }
    },

    /**
     * Update an existing program type
     * @param id Program type ID
     * @param data Program type update data
     * @returns Promise<ProgramType> Updated program type
     */
    updateProgramType: async (id: number, data: UpdateProgramTypeRequest): Promise<ProgramType> => {
        try {
            console.log(`ProgramTypeService.updateProgramType - Updating program type ${id}:`, data)
            
            // Input validation
            if (!data.typeName || data.typeName.trim().length === 0) {
                throw new Error('Program type name is required')
            }
            
            const result = await ApiService.fetchDataWithAxios<ProgramType>({
                url: `/api/ProgramType/${id}`,
                method: 'put',
                data: data as any,
            })
            console.log(`ProgramTypeService.updateProgramType - Success: Updated program type ${id}`)
            return result
        } catch (error) {
            console.error(`ProgramTypeService.updateProgramType - Error updating program type ${id}:`, error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to update program type: ${error.message}`
                    : 'Failed to update program type: Unknown error occurred'
            )
        }
    },

    /**
     * Delete a program type
     * @param id Program type ID
     * @returns Promise<void>
     */
    deleteProgramType: async (id: number): Promise<void> => {
        try {
            console.log(`ProgramTypeService.deleteProgramType - Deleting program type ${id}`)
            
            await ApiService.fetchDataWithAxios<void>({
                url: `/api/ProgramType/${id}`,
                method: 'delete',
            })
            console.log(`ProgramTypeService.deleteProgramType - Success: Deleted program type ${id}`)
        } catch (error) {
            console.error(`ProgramTypeService.deleteProgramType - Error deleting program type ${id}:`, error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to delete program type: ${error.message}`
                    : 'Failed to delete program type: Unknown error occurred'
            )
        }
    },

    /**
     * Create a new attribute for a program type
     * @param data Program type attribute creation data
     * @returns Promise<any> Created attribute
     */
    createProgramTypeAttribute: async (data: CreateProgramTypeAttributeRequest): Promise<any> => {
        try {
            console.log('ProgramTypeService.createProgramTypeAttribute - Creating:', data)
            
            // Input validation
            if (!data.attributeName || data.attributeName.trim().length === 0) {
                throw new Error('Attribute name is required')
            }
            if (!data.attributeType || data.attributeType.trim().length === 0) {
                throw new Error('Attribute type is required')
            }
            
            const result = await ApiService.fetchDataWithAxios<any>({
                url: `/api/ProgramType/${data.programTypeID}/attributes`,
                method: 'post',
                data: data as any,
            })
            console.log('ProgramTypeService.createProgramTypeAttribute - Success:', result)
            return result
        } catch (error) {
            console.error('ProgramTypeService.createProgramTypeAttribute - Error:', error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to create program type attribute: ${error.message}`
                    : 'Failed to create program type attribute: Unknown error occurred'
            )
        }
    },

    /**
     * Update a program type attribute
     * @param programTypeId Program type ID
     * @param attributeId Attribute ID
     * @param data Attribute update data
     * @returns Promise<any> Updated attribute
     */
    updateProgramTypeAttribute: async (
        programTypeId: number, 
        attributeId: number, 
        data: UpdateProgramTypeAttributeRequest
    ): Promise<any> => {
        try {
            console.log(`ProgramTypeService.updateProgramTypeAttribute - Updating attribute ${attributeId} for program type ${programTypeId}:`, data)
            
            // Input validation
            if (!data.attributeName || data.attributeName.trim().length === 0) {
                throw new Error('Attribute name is required')
            }
            if (!data.attributeType || data.attributeType.trim().length === 0) {
                throw new Error('Attribute type is required')
            }
            
            const result = await ApiService.fetchDataWithAxios<any>({
                url: `/api/ProgramType/${programTypeId}/attributes/${attributeId}`,
                method: 'put',
                data: data as any,
            })
            console.log(`ProgramTypeService.updateProgramTypeAttribute - Success: Updated attribute ${attributeId}`)
            return result
        } catch (error) {
            console.error(`ProgramTypeService.updateProgramTypeAttribute - Error updating attribute ${attributeId}:`, error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to update program type attribute: ${error.message}`
                    : 'Failed to update program type attribute: Unknown error occurred'
            )
        }
    },

    /**
     * Delete a program type attribute
     * @param programTypeId Program type ID
     * @param attributeId Attribute ID
     * @returns Promise<void>
     */
    deleteProgramTypeAttribute: async (programTypeId: number, attributeId: number): Promise<void> => {
        try {
            console.log(`ProgramTypeService.deleteProgramTypeAttribute - Deleting attribute ${attributeId} from program type ${programTypeId}`)
            
            await ApiService.fetchDataWithAxios<void>({
                url: `/api/ProgramType/${programTypeId}/attributes/${attributeId}`,
                method: 'delete',
            })
            console.log(`ProgramTypeService.deleteProgramTypeAttribute - Success: Deleted attribute ${attributeId}`)
        } catch (error) {
            console.error(`ProgramTypeService.deleteProgramTypeAttribute - Error deleting attribute ${attributeId}:`, error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to delete program type attribute: ${error.message}`
                    : 'Failed to delete program type attribute: Unknown error occurred'
            )
        }
    }
}

export default ProgramTypeService

import ApiService from './ApiService'
import type {
    Program,
    ProgramType,
    ProgramAssignment,
    ProgramShopAssignment,
    CreateProgramRequest,
    UpdateProgramRequest,
    AssignProgramToCustomersRequest,
    AssignProgramToShopsRequest,
} from '@/@types/program'
import {
    mockPrograms,
    mockProgramTypes,
    mockCustomerAssignments,
    mockShopAssignments,
    mockApiResponse,
} from './MockProgramData'

// Configuration flag for using mock data (set to true for development)
const USE_MOCK_DATA = true

const ProgramService = {
    // Get all programs
    getPrograms: async (): Promise<Program[]> => {
        try {
            if (USE_MOCK_DATA) {
                console.log('Using mock program data for development')
                return await mockApiResponse(mockPrograms)
            }
            
            const result = await ApiService.fetchDataWithAxios<Program[]>({
                url: 'program',
                method: 'get',
            })
            return result
        } catch (error) {
            console.warn('API failed, falling back to mock data:', error)
            return await mockApiResponse(mockPrograms)
        }
    },

    // Get program by ID
    getProgram: async (id: number): Promise<Program> => {
        try {
            if (USE_MOCK_DATA) {
                const program = mockPrograms.find(p => p.programId === id)
                if (program) {
                    return await mockApiResponse(program)
                }
                throw new Error(`Program with ID ${id} not found`)
            }
            
            const result = await ApiService.fetchDataWithAxios<Program>({
                url: `program/${id}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.warn(`API failed for program ${id}, falling back to mock data:`, error)
            const program = mockPrograms.find(p => p.programId === id)
            if (program) {
                return await mockApiResponse(program)
            }
            throw error
        }
    },

    // Get programs by shop
    getProgramsByShop: async (shopId: number): Promise<Program[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Program[]>({
                url: `program/shop/${shopId}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch programs for shop ${shopId}:`, error)
            throw error
        }
    },

    // Create program
    createProgram: async (data: CreateProgramRequest): Promise<Program> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Program>({
                url: 'program',
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error('Failed to create program:', error)
            throw error
        }
    },

    // Update program
    updateProgram: async (id: number, data: UpdateProgramRequest): Promise<Program> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Program>({
                url: `program/${id}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error(`Failed to update program ${id}:`, error)
            throw error
        }
    },

    // Delete program
    deleteProgram: async (id: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `program/${id}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to delete program ${id}:`, error)
            throw error
        }
    },

    // Get program types
    getProgramTypes: async (): Promise<ProgramType[]> => {
        try {
            if (USE_MOCK_DATA) {
                console.log('Using mock program types data for development')
                return await mockApiResponse(mockProgramTypes)
            }
            
            const result = await ApiService.fetchDataWithAxios<ProgramType[]>({
                url: 'program/types',
                method: 'get',
            })
            return result
        } catch (error) {
            console.warn('API failed for program types, falling back to mock data:', error)
            return await mockApiResponse(mockProgramTypes)
        }
    },

    // Assign program to customers
    assignProgramToCustomers: async (
        programId: number,
        data: AssignProgramToCustomersRequest,
    ): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `program/${programId}/assign/customers`,
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
        } catch (error) {
            console.error(`Failed to assign program ${programId} to customers:`, error)
            throw error
        }
    },

    // Assign program to shops
    assignProgramToShops: async (
        programId: number,
        data: AssignProgramToShopsRequest,
    ): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `program/${programId}/assign/shops`,
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
        } catch (error) {
            console.error(`Failed to assign program ${programId} to shops:`, error)
            throw error
        }
    },

    // Get program customer assignments
    getProgramCustomerAssignments: async (programId: number): Promise<ProgramAssignment[]> => {
        try {
            if (USE_MOCK_DATA) {
                const assignments = mockCustomerAssignments.filter(a => a.programId === programId)
                return await mockApiResponse(assignments)
            }
            
            const result = await ApiService.fetchDataWithAxios<ProgramAssignment[]>({
                url: `program/${programId}/assignments/customers`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.warn(`API failed for customer assignments, falling back to mock data:`, error)
            const assignments = mockCustomerAssignments.filter(a => a.programId === programId)
            return await mockApiResponse(assignments)
        }
    },

    // Get program shop assignments
    getProgramShopAssignments: async (programId: number): Promise<ProgramShopAssignment[]> => {
        try {
            if (USE_MOCK_DATA) {
                const assignments = mockShopAssignments.filter(a => a.programId === programId)
                return await mockApiResponse(assignments)
            }
            
            const result = await ApiService.fetchDataWithAxios<ProgramShopAssignment[]>({
                url: `program/${programId}/assignments/shops`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.warn(`API failed for shop assignments, falling back to mock data:`, error)
            const assignments = mockShopAssignments.filter(a => a.programId === programId)
            return await mockApiResponse(assignments)
        }
    },

    // Remove program assignment
    removeProgramAssignment: async (assignmentId: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `program/assignment/${assignmentId}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to remove program assignment ${assignmentId}:`, error)
            throw error
        }
    },

    // Update program assignment
    updateProgramAssignment: async (
        assignmentId: number,
        data: { isActive: boolean; startDate?: string; endDate?: string },
    ): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `program/assignment/${assignmentId}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
        } catch (error) {
            console.error(`Failed to update program assignment ${assignmentId}:`, error)
            throw error
        }
    },
}

export default ProgramService

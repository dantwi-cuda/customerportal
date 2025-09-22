import ApiService from './ApiService'
import ProgramTypeService from './ProgramTypeService'
import type {
    Program,
    ProgramAssignment,
    ProgramShopAssignment,
    CreateProgramRequest,
    UpdateProgramRequest,
    AssignProgramToCustomersRequest,
    AssignProgramToShopsRequest,
} from '@/@types/program'
import type { ProgramType } from '@/@types/programType'
import {
    mockPrograms,
    mockCustomerAssignments,
    mockShopAssignments,
    mockApiResponse,
} from './MockProgramData'

// Configuration flag for using mock data (set to false for production)
const USE_MOCK_DATA = false

const ProgramService = {
    // Get all programs
    getPrograms: async (): Promise<Program[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<any[]>({
                url: 'Program',
                method: 'get',
            })
            
            console.log('🔧 ProgramService: Raw API response sample:', result[0])
            
            // Map API response to match our interface
            const mappedResult = result.map((program: any) => ({
                programId: program.programID || program.programId,
                programName: program.programName,
                programDescription: program.programDescription || program.description,
                programTypeId: program.programTypeID || program.programTypeId,
                programTypeName: program.programTypeName,
                contactName: program.contactName,
                contactPhone: program.contactPhone,
                contactEmail: program.contactEmail,
                startDate: program.startDate,
                endDate: program.endDate,
                createdByCustomerId: program.createdByCustomerID || program.createdByCustomerId,
                createdByCustomerName: program.createdByCustomerName,
                createdByUserId: program.createdByUserID || program.createdByUserId,
                createdAt: program.createdAt,
                updatedAt: program.updatedAt,
                isActive: program.isActive,
                typeSpecificAttributes: program.typeSpecificAttributes,
                assignments: program.assignments,
                shopSubscriptions: program.shopSubscriptions || program.ShopSubscriptions || program.programShopSubscriptions || program.ProgramShopSubscriptions || [],
            }))
            
            console.log('🔧 ProgramService: Mapped result sample:', mappedResult[0])
            
            return mappedResult
        } catch (error) {
            console.error('Failed to fetch programs:', error)
            if (USE_MOCK_DATA) {
                console.warn('Falling back to mock data')
                return await mockApiResponse(mockPrograms)
            }
            throw error
        }
    },

    // Get program by ID
    getProgram: async (id: number): Promise<Program> => {
        try {
            const result = await ApiService.fetchDataWithAxios<any>({
                url: `Program/${id}`,
                method: 'get',
            })
            
            // Map API response to match our interface
            const mappedResult = {
                programId: result.programID || result.programId,
                programName: result.programName,
                programDescription: result.programDescription || result.description,
                programTypeId: result.programTypeID || result.programTypeId,
                programTypeName: result.programTypeName,
                contactName: result.contactName,
                contactPhone: result.contactPhone,
                contactEmail: result.contactEmail,
                startDate: result.startDate,
                endDate: result.endDate,
                createdByCustomerId: result.createdByCustomerID || result.createdByCustomerId,
                createdByCustomerName: result.createdByCustomerName,
                createdByUserId: result.createdByUserID || result.createdByUserId,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
                isActive: result.isActive,
                typeSpecificAttributes: result.typeSpecificAttributes,
                assignments: result.assignments,
                shopSubscriptions: result.shopSubscriptions || result.ShopSubscriptions || result.programShopSubscriptions || result.ProgramShopSubscriptions || [],
            }
            
            return mappedResult
        } catch (error) {
            console.error(`Failed to fetch program ${id}:`, error)
            if (USE_MOCK_DATA) {
                console.warn(`Falling back to mock data for program ${id}`)
                const program = mockPrograms.find(p => p.programId === id)
                if (program) {
                    return await mockApiResponse(program)
                }
            }
            throw error
        }
    },

    // Get programs by shop
    getProgramsByShop: async (shopId: number): Promise<Program[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Program[]>({
                url: `Program/shop/${shopId}`,
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
            console.log('🔧 ProgramService: Creating program with data:', data)
            const result = await ApiService.fetchDataWithAxios<Program>({
                url: 'Program',
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
            console.log('🔧 ProgramService: Create program response:', result)
            return result
        } catch (error) {
            console.error('Failed to create program:', error)
            throw error
        }
    },

    // Update program
    updateProgram: async (id: number, data: UpdateProgramRequest): Promise<Program> => {
        try {
            console.log(`🔧 ProgramService: Updating program ${id} with data:`, data)
            const result = await ApiService.fetchDataWithAxios<Program>({
                url: `Program/${id}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
            console.log('🔧 ProgramService: Update program response:', result)
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
                url: `Program/${id}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to delete program ${id}:`, error)
            throw error
        }
    },

    // Toggle program active status
    toggleProgramActiveStatus: async (id: number, isActive: boolean): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `Program/${id}/active`,
                method: 'put',
                data: { isActive },
            })
        } catch (error) {
            console.error(`Failed to toggle program ${id} active status:`, error)
            throw error
        }
    },

    // Get program types
    getProgramTypes: async (): Promise<ProgramType[]> => {
        try {
            const result = await ProgramTypeService.getProgramTypes()
            return result
        } catch (error) {
            console.error('Failed to fetch program types:', error)
            throw new Error(
                error instanceof Error 
                    ? `Failed to fetch program types: ${error.message}`
                    : 'Failed to fetch program types: Unknown error occurred'
            )
        }
    },

    // Assign program to customers
    assignProgramToCustomers: async (
        programId: number,
        data: AssignProgramToCustomersRequest,
    ): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `Program/${programId}/assign/customers`,
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
                url: `Program/${programId}/assign/shops`,
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
        } catch (error) {
            console.error(`Failed to assign program ${programId} to shops:`, error)
            throw error
        }
    },

    // Get program customer assignments - now extracted from main program endpoint
    getProgramCustomerAssignments: async (programId: number): Promise<ProgramAssignment[]> => {
        try {
            // Use the main program endpoint which includes assignments
            const program = await ProgramService.getProgram(programId)
            console.log(`Found ${program.assignments?.length || 0} customer assignments for program ${programId}`)
            return program.assignments || []
        } catch (error) {
            console.error(`Failed to fetch customer assignments for program ${programId}:`, error)
            if (USE_MOCK_DATA) {
                console.warn('Falling back to mock data')
                const assignments = mockCustomerAssignments.filter(a => a.programId === programId)
                return await mockApiResponse(assignments)
            }
            throw error
        }
    },

    // Get program shop assignments - now extracted from main program endpoint
    getProgramShopAssignments: async (programId: number): Promise<ProgramShopAssignment[]> => {
        try {
            // Use the main program endpoint which includes shopSubscriptions
            const program = await ProgramService.getProgram(programId)
            
            console.log(`Found ${program.shopSubscriptions?.length || 0} shop subscriptions for program ${programId}`)
            
            // Map ProgramShopSubscription to ProgramShopAssignment format
            const shopAssignments: ProgramShopAssignment[] = (program.shopSubscriptions || []).map((subscription, index) => {
                console.log(`Mapping subscription ${index}:`, {
                    shopSubscriptionId: subscription.shopSubscriptionId,
                    shopId: subscription.shopId,
                    shopName: subscription.shopName
                })
                
                return {
                    assignmentId: subscription.shopSubscriptionId,
                    programId: subscription.programId,
                    shopId: subscription.shopId,
                    shopName: subscription.shopName,
                    retroactiveDays: subscription.retroactiveDays,
                    minWarrantySalesDollars: subscription.minWarrantySalesDollars,
                    assignedAt: subscription.assignedAt,
                    assignedByUserId: subscription.assignedByUserId,
                    isActive: subscription.isActive
                }
            })
            
            console.log(`Mapped to ${shopAssignments.length} shop assignments`)
            return shopAssignments
        } catch (error) {
            console.error(`Failed to fetch shop assignments for program ${programId}:`, error)
            if (USE_MOCK_DATA) {
                console.warn('Falling back to mock data')
                const assignments = mockShopAssignments.filter(a => a.programId === programId)
                return await mockApiResponse(assignments)
            }
            throw error
        }
    },

    // Remove program assignment
    removeProgramAssignment: async (assignmentId: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `Program/assignment/${assignmentId}`,
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
                url: `Program/assignment/${assignmentId}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
        } catch (error) {
            console.error(`Failed to update program assignment ${assignmentId}:`, error)
            throw error
        }
    },

    // Remove shop assignment using specific endpoint
    removeShopAssignment: async (programId: number, assignmentId: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `Program/${programId}/assign/shop/${assignmentId}`,
                method: 'delete',
            })
            console.log(`Successfully removed shop assignment ${assignmentId} from program ${programId}`)
        } catch (error) {
            console.error(`Failed to remove shop assignment ${assignmentId} from program ${programId}:`, error)
            throw error
        }
    },
}

export default ProgramService

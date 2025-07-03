export interface ProgramType {
    programTypeId: number
    typeName: string
    typeDescription?: string
    createdAt: string
}

export interface Program {
    programId: number
    name: string
    description?: string
    programTypeId: number
    programTypeName?: string
    contactName?: string
    contactPhone?: string
    startDate?: string
    endDate?: string
    manufacturerId?: number
    manufacturerName?: string
    createdByCustomerId?: number
    createdByCustomerName?: string
    createdAt: string
    updatedAt: string
    isActive: boolean
    typeSpecificAttributes?: Record<string, any>
}

export interface ProgramAssignment {
    assignmentId: number
    programId: number
    customerId: number
    customerName?: string
    assignedAt: string
    assignedByUserId?: string
    assignedByUserName?: string
    isActive: boolean
    startDate?: string
    endDate?: string
}

export interface ProgramShopAssignment {
    assignmentId: number
    programId: number
    shopId: number
    shopName?: string
    retroactiveDays: number
    minWarrantySalesDollars: number
    assignedAt: string
    assignedByUserId?: string
    assignedByUserName?: string
    isActive: boolean
}

export interface CreateProgramRequest {
    name: string
    description?: string
    programTypeId: number
    contactName?: string
    contactPhone?: string
    startDate?: string
    endDate?: string
    manufacturerId?: number
    typeSpecificAttributes?: Record<string, any>
}

export interface UpdateProgramRequest {
    name: string
    description?: string
    programTypeId: number
    contactName?: string
    contactPhone?: string
    startDate?: string
    endDate?: string
    manufacturerId?: number
    isActive: boolean
    typeSpecificAttributes?: Record<string, any>
}

export interface AssignProgramToCustomersRequest {
    customerIds: number[]
    startDate?: string
    endDate?: string
}

export interface AssignProgramToShopsRequest {
    shopAssignments: {
        shopId: number
        retroactiveDays: number
        minWarrantySalesDollars: number
    }[]
}

export interface ProgramListItem extends Program {
    customerAssignments?: ProgramAssignment[]
    shopAssignments?: ProgramShopAssignment[]
}

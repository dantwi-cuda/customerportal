export interface Program {
    programId: number
    programName: string
    programDescription?: string
    programTypeId: number
    programTypeName?: string
    contactName?: string
    contactPhone?: string
    contactEmail?: string
    startDate?: string
    endDate?: string
    createdByCustomerId?: number
    createdByCustomerName?: string
    createdByUserId?: string
    createdAt: string
    updatedAt: string
    isActive: boolean
    typeSpecificAttributes?: Record<string, any>
    assignments?: ProgramAssignment[]
    shopSubscriptions?: ProgramShopSubscription[]
}

export interface ProgramAssignment {
    assignmentId: number
    programId: number
    programName?: string
    customerId: number
    customerName?: string
    assignedAt: string
    assignedByUserId?: string
    isActive: boolean
    startDate?: string
    endDate?: string
}

export interface ProgramShopSubscription {
    shopSubscriptionId: number
    programId: number
    programName?: string
    shopId: number
    shopName?: string
    retroactiveDays: number
    minWarrantySalesDollars: number
    assignedAt: string
    assignedByUserId?: string
    isActive: boolean
    startDate?: string
    endDate?: string
    additionalParameters?: Record<string, any>
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
    programName: string
    programDescription?: string
    programTypeID: number
    contactName?: string
    contactPhone?: string
    contactEmail?: string
    startDate?: string
    endDate?: string
    isActive?: boolean
    typeSpecificAttributes?: Record<string, any>
}

export interface UpdateProgramRequest {
    programName: string
    programDescription?: string
    programTypeID: number
    contactName?: string
    contactPhone?: string
    contactEmail?: string
    startDate?: string
    endDate?: string
    isActive: boolean
    typeSpecificAttributes?: Record<string, any>
}

export interface AssignProgramToCustomersRequest {
    customerIds: number[]
    startDate?: string
    endDate?: string
}

export interface AssignProgramToShopsRequest {
    shopIds: number[]
    retroactiveDays?: number
    minWarrantySalesDollars?: number
    isActive?: boolean
    startDate?: string
    endDate?: string
    additionalParameters?: Record<string, any>
    skipExisting?: boolean
}

export interface ProgramListItem extends Program {
    customerAssignments?: ProgramAssignment[]
    shopAssignments?: ProgramShopAssignment[]
}

import type {
    Program,
    ProgramType,
    ProgramAssignment,
    ProgramShopAssignment,
} from '@/@types/program'

// Mock data for development/testing
export const mockProgramTypes: ProgramType[] = [
    {
        programTypeId: 1,
        typeName: 'Extended Warranty',
        typeDescription: 'Extended warranty program for automotive parts',
        createdAt: '2024-01-15T10:00:00Z',
    },
    {
        programTypeId: 2,
        typeName: 'Service Contract',
        typeDescription: 'Service contract program for maintenance',
        createdAt: '2024-01-15T10:00:00Z',
    },
    {
        programTypeId: 3,
        typeName: 'Loyalty Program',
        typeDescription: 'Customer loyalty and rewards program',
        createdAt: '2024-01-15T10:00:00Z',
    },
]

export const mockPrograms: Program[] = [
    {
        programId: 1,
        name: 'AutoCare Extended Warranty',
        description: 'Comprehensive extended warranty coverage for automotive parts and components',
        programTypeId: 1,
        programTypeName: 'Extended Warranty',
        contactName: 'John Smith',
        contactPhone: '+1-555-0123',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        manufacturerId: 101,
        manufacturerName: 'AutoParts Inc.',
        createdByCustomerId: 1,
        createdByCustomerName: 'Global Auto Solutions',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-06-01T14:30:00Z',
        isActive: true,
        typeSpecificAttributes: {
            coveragePeriod: 24,
            maxClaimAmount: 5000,
        },
    },
    {
        programId: 2,
        name: 'Quick Service Network',
        description: 'Fast-track service program for participating shops',
        programTypeId: 2,
        programTypeName: 'Service Contract',
        contactName: 'Sarah Johnson',
        contactPhone: '+1-555-0456',
        startDate: '2024-03-01',
        endDate: '2025-02-28',
        manufacturerId: 102,
        manufacturerName: 'ServicePro Corp',
        createdByCustomerId: 2,
        createdByCustomerName: 'Rapid Repair Network',
        createdAt: '2024-02-20T09:15:00Z',
        updatedAt: '2024-06-15T11:45:00Z',
        isActive: true,
        typeSpecificAttributes: {
            serviceLevel: 'Premium',
            responseTime: 24,
        },
    },
    {
        programId: 3,
        name: 'VIP Customer Rewards',
        description: 'Exclusive rewards program for high-value customers',
        programTypeId: 3,
        programTypeName: 'Loyalty Program',
        contactName: 'Mike Chen',
        contactPhone: '+1-555-0789',
        startDate: '2024-02-15',
        endDate: undefined,
        manufacturerId: undefined,
        manufacturerName: undefined,
        createdByCustomerId: 1,
        createdByCustomerName: 'Global Auto Solutions',
        createdAt: '2024-02-10T16:20:00Z',
        updatedAt: '2024-05-20T13:10:00Z',
        isActive: true,
        typeSpecificAttributes: {
            tierLevels: 3,
            pointsMultiplier: 2.5,
        },
    },
    {
        programId: 4,
        name: 'Legacy Maintenance Plan',
        description: 'Older maintenance program - now inactive',
        programTypeId: 2,
        programTypeName: 'Service Contract',
        contactName: 'Lisa Davis',
        contactPhone: '+1-555-0321',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        manufacturerId: 103,
        manufacturerName: 'OldService Ltd',
        createdByCustomerId: 3,
        createdByCustomerName: 'Classic Auto Care',
        createdAt: '2023-01-01T08:00:00Z',
        updatedAt: '2023-12-31T23:59:00Z',
        isActive: false,
        typeSpecificAttributes: {
            serviceLevel: 'Basic',
            monthlyFee: 29.99,
        },
    },
]

export const mockCustomerAssignments: ProgramAssignment[] = [
    {
        assignmentId: 1,
        programId: 1,
        customerId: 1,
        customerName: 'Global Auto Solutions',
        assignedAt: '2024-01-20T09:30:00Z',
        assignedByUserId: 'admin@example.com',
        assignedByUserName: 'Admin User',
        isActive: true,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
    },
    {
        assignmentId: 2,
        programId: 1,
        customerId: 2,
        customerName: 'Rapid Repair Network',
        assignedAt: '2024-01-25T14:15:00Z',
        assignedByUserId: 'admin@example.com',
        assignedByUserName: 'Admin User',
        isActive: true,
        startDate: '2024-02-01',
        endDate: '2024-12-31',
    },
    {
        assignmentId: 3,
        programId: 2,
        customerId: 2,
        customerName: 'Rapid Repair Network',
        assignedAt: '2024-03-05T11:00:00Z',
        assignedByUserId: 'admin@example.com',
        assignedByUserName: 'Admin User',
        isActive: true,
        startDate: '2024-03-01',
        endDate: '2025-02-28',
    },
]

export const mockShopAssignments: ProgramShopAssignment[] = [
    {
        assignmentId: 101,
        programId: 1,
        shopId: 1,
        shopName: 'Downtown Auto Repair',
        retroactiveDays: 30,
        minWarrantySalesDollars: 500.00,
        assignedAt: '2024-01-22T10:45:00Z',
        assignedByUserId: 'manager@example.com',
        assignedByUserName: 'Shop Manager',
        isActive: true,
    },
    {
        assignmentId: 102,
        programId: 1,
        shopId: 2,
        shopName: 'Westside Service Center',
        retroactiveDays: 15,
        minWarrantySalesDollars: 750.00,
        assignedAt: '2024-02-01T15:20:00Z',
        assignedByUserId: 'manager@example.com',
        assignedByUserName: 'Shop Manager',
        isActive: true,
    },
    {
        assignmentId: 103,
        programId: 2,
        shopId: 3,
        shopName: 'Express Auto Care',
        retroactiveDays: 7,
        minWarrantySalesDollars: 300.00,
        assignedAt: '2024-03-10T08:30:00Z',
        assignedByUserId: 'manager@example.com',
        assignedByUserName: 'Shop Manager',
        isActive: true,
    },
    {
        assignmentId: 104,
        programId: 3,
        shopId: 1,
        shopName: 'Downtown Auto Repair',
        retroactiveDays: 0,
        minWarrantySalesDollars: 1000.00,
        assignedAt: '2024-02-20T12:00:00Z',
        assignedByUserId: 'manager@example.com',
        assignedByUserName: 'Shop Manager',
        isActive: true,
    },
]

// Helper function to simulate API delay
export const delay = (ms: number): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, ms))

// Helper function to simulate API responses
export const mockApiResponse = async <T>(data: T, delayMs: number = 500): Promise<T> => {
    await delay(delayMs)
    return data
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { mock } from '../MockAdapter'

interface Customer {
    id: number;
    name: string;
    subdomain?: string;
    address?: string | null;
    logoUrl?: string | null;
    backgroundImageUrl?: string | null;
    theme?: string | null;
    legacyBusinessNetworkID?: string | null;
    portalDisplayName?: string | null;
    portalDisplaySubName?: string | null;
    portalDisplayPageSubTitle?: string | null;
    portalWindowIcon?: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    customerReports?: any[];
    customerShops?: any[];
    customerUsers?: any[];
    customerWorkspaces?: any[];
    programs?: any[];
    reportCategories?: any[];
}

const customerMockData: Customer[] = [
    {
        id: 1,
        name: "Demo Customer",
        subdomain: "demo",
        address: "123 Main St, Demo City, DC 12345",
        logoUrl: null,
        backgroundImageUrl: null,
        theme: "default",
        legacyBusinessNetworkID: "BN001",
        portalDisplayName: "Customer Portal",
        portalDisplaySubName: "Welcome to our portal",
        portalDisplayPageSubTitle: "Your trusted partner",
        portalWindowIcon: "https://example.com/favicon.ico",
        isActive: true,
        createdAt: "2025-07-02T21:51:51.266Z",
        updatedAt: "2025-07-02T21:51:51.266Z",
        customerReports: [],
        customerShops: [],
        customerUsers: [],
        customerWorkspaces: [],
        programs: [],
        reportCategories: []
    },
    {
        id: 2,
        name: "Test Corporation",
        subdomain: "test-corp",
        address: "456 Business Ave, Corporate City, CC 67890",
        logoUrl: "https://example.com/logos/test-corp-logo.png",
        backgroundImageUrl: "https://example.com/backgrounds/test-corp-bg.jpg",
        theme: "dark",
        legacyBusinessNetworkID: "BN002",
        portalDisplayName: "Business Portal",
        portalDisplaySubName: "Enterprise Solutions",
        portalDisplayPageSubTitle: "Driving innovation forward",
        portalWindowIcon: "https://example.com/test-favicon.ico",
        isActive: true,
        createdAt: "2025-06-15T14:30:22.123Z",
        updatedAt: "2025-07-01T09:15:44.567Z",
        customerReports: [],
        customerShops: [],
        customerUsers: [],
        customerWorkspaces: [],
        programs: [],
        reportCategories: []
    },
    {
        id: 3,
        name: "Global Industries",
        subdomain: "global-ind",
        address: "789 Industrial Blvd, Manufacturing City, MC 11122",
        logoUrl: null,
        backgroundImageUrl: null,
        theme: "green",
        legacyBusinessNetworkID: "BN003",
        portalDisplayName: "Manufacturing Portal",
        portalDisplaySubName: "Worldwide Excellence",
        portalDisplayPageSubTitle: "Leading the industry",
        portalWindowIcon: null,
        isActive: false,
        createdAt: "2025-05-20T08:45:12.456Z",
        updatedAt: "2025-06-30T16:22:33.789Z",
        customerReports: [],
        customerShops: [],
        customerUsers: [],
        customerWorkspaces: [],
        programs: [],
        reportCategories: []
    }
];

// GET /api/CustomerManagement - Get all customers
mock.onGet('/api/CustomerManagement').reply(() => {
    return [200, customerMockData]
})

// GET /api/customers/{id} - Get customer by ID
mock.onGet(/\/api\/customers\/\d+/).reply((config) => {
    const id = config.url?.split('/').pop()
    const customer = customerMockData.find((c: Customer) => c.id.toString() === id)
    
    if (customer) {
        return [200, customer]
    } else {
        return [404, { message: 'Customer not found' }]
    }
})

// POST /api/customers - Create new customer
mock.onPost('/api/customers').reply((config) => {
    const newCustomerData = JSON.parse(config.data)
    const newId = Math.max(...customerMockData.map((c: Customer) => c.id)) + 1
    
    const newCustomer = {
        id: newId,
        ...newCustomerData,
        isActive: newCustomerData.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerReports: [],
        customerShops: [],
        customerUsers: [],
        customerWorkspaces: [],
        programs: [],
        reportCategories: [],
        logoUrl: null,
        backgroundImageUrl: null
    }
    
    customerMockData.push(newCustomer)
    
    return [201, newCustomer]
})

// PUT /api/customers/{id} - Update customer
mock.onPut(/\/api\/customers\/\d+/).reply((config) => {
    const id = config.url?.split('/').pop()
    const updateData = JSON.parse(config.data)
    const customerIndex = customerMockData.findIndex((c: Customer) => c.id.toString() === id)
    
    if (customerIndex !== -1) {
        const existingCustomer = customerMockData[customerIndex]
        const updatedCustomer = {
            ...existingCustomer,
            ...updateData,
            updatedAt: new Date().toISOString()
        }
        
        customerMockData[customerIndex] = updatedCustomer
        
        return [200, updatedCustomer]
    } else {
        return [404, { message: 'Customer not found' }]
    }
})

// DELETE /api/customers/{id} - Delete customer
mock.onDelete(/\/api\/customers\/\d+/).reply((config) => {
    const id = config.url?.split('/').pop()
    const customerIndex = customerMockData.findIndex((c: Customer) => c.id.toString() === id)
    
    if (customerIndex !== -1) {
        customerMockData.splice(customerIndex, 1)
        return [204]
    } else {
        return [404, { message: 'Customer not found' }]
    }
})

// POST /api/customers/{id}/logo - Upload customer logo
mock.onPost(/\/api\/customers\/\d+\/logo/).reply((config) => {
    const id = config.url?.split('/')[3] // Extract ID from URL
    const customerIndex = customerMockData.findIndex((c: Customer) => c.id.toString() === id)
    
    if (customerIndex !== -1) {
        // Mock successful upload
        const mockLogoUrl = `https://example.com/logos/customer-${id}-logo.png`
        customerMockData[customerIndex].logoUrl = mockLogoUrl
        
        return [200, { url: mockLogoUrl }]
    } else {
        return [404, { message: 'Customer not found' }]
    }
})

// POST /api/customers/{id}/background - Upload customer background
mock.onPost(/\/api\/customers\/\d+\/background/).reply((config) => {
    const id = config.url?.split('/')[3] // Extract ID from URL
    const customerIndex = customerMockData.findIndex((c: Customer) => c.id.toString() === id)
    
    if (customerIndex !== -1) {
        // Mock successful upload
        const mockBackgroundUrl = `https://example.com/backgrounds/customer-${id}-bg.png`
        customerMockData[customerIndex].backgroundImageUrl = mockBackgroundUrl
        
        return [200, { url: mockBackgroundUrl }]
    } else {
        return [404, { message: 'Customer not found' }]
    }
})

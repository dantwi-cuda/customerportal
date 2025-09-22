import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type { 
    CustomerDetailsResponse, 
    CustomerInfo, 
    CustomerCredentials, 
    CustomerBranding,
    Customer,
    CreateCustomerRequest,
    UpdateCustomerRequest,
    CustomerLogoRequest,
    CustomerBackgroundRequest
} from '@/@types/customer'

// Convert API Customer model to frontend CustomerDetailsResponse model
function mapApiCustomerToFrontend(apiCustomer: any): CustomerDetailsResponse {
    console.log("Raw API customer data:", apiCustomer);
    console.log("API customer field details:", {
        name: apiCustomer?.name,
        subdomain: apiCustomer?.subdomain,
        address: apiCustomer?.address,
        theme: apiCustomer?.theme,
        legacyBusinessNetworkID: apiCustomer?.legacyBusinessNetworkID,
        portalDisplayName: apiCustomer?.portalDisplayName,
        portalDisplaySubName: apiCustomer?.portalDisplaySubName,
        portalDisplayPageSubTitle: apiCustomer?.portalDisplayPageSubTitle,
        portalWindowIcon: apiCustomer?.portalWindowIcon,
        isActive: apiCustomer?.isActive
    });
    
    // Handle undefined or null customer
    if (!apiCustomer) {
        console.error("Received undefined or null customer from API");
        return {
            id: "0",
            name: "Unknown",
            isActive: false
        };
    }
    
    const customer: CustomerDetailsResponse = {
        id: apiCustomer.id?.toString() || "0",
        name: apiCustomer.name || "Unnamed Customer",
        legalName: apiCustomer.name || "Unnamed Customer", // Use name as legalName for backward compatibility
        domainUrl: apiCustomer.subdomain || "",
        subdomain: apiCustomer.subdomain || "",
        address: apiCustomer.address || "",
        theme: apiCustomer.theme || "default",
        legacyBusinessNetworkID: apiCustomer.legacyBusinessNetworkID || "",
        portalDisplayName: apiCustomer.portalDisplayName || "",
        portalDisplaySubName: apiCustomer.portalDisplaySubName || "",
        portalDisplayPageSubTitle: apiCustomer.portalDisplayPageSubTitle || "",
        portalWindowIcon: apiCustomer.portalWindowIcon || "",
        isActive: Boolean(apiCustomer.isActive),
        branding: {
            displayTitle: apiCustomer.portalDisplayName || apiCustomer.name || "Unnamed Customer",
            logoUrl: apiCustomer.logoUrl || "",
            backgroundUrl: apiCustomer.backgroundImageUrl || "",
            faviconUrl: apiCustomer.portalWindowIcon || ""
        }
    };
    
    console.log("Mapped customer data:", customer);
    console.log("Customer field details:", {
        name: customer.name,
        subdomain: customer.subdomain,
        address: customer.address,
        theme: customer.theme,
        legacyBusinessNetworkID: customer.legacyBusinessNetworkID,
        portalDisplayName: customer.portalDisplayName,
        portalDisplaySubName: customer.portalDisplaySubName,
        portalDisplayPageSubTitle: customer.portalDisplayPageSubTitle,
        portalWindowIcon: customer.portalWindowIcon,
        isActive: customer.isActive
    });
    return customer;
}

// Get all customers (for admin view)
// Uses: GET /api/CustomerManagement - Returns Customer[] from swagger
export async function getCustomers(): Promise<CustomerDetailsResponse[]> {
    try {
        const response = await ApiService.fetchDataWithAxios<Customer[]>({
            url: '/api/CustomerManagement',
            method: 'get'
        });
        
        console.log('API response for customers:', response);
        
        // Map API response to frontend model
        const mappedCustomers = response.map(mapApiCustomerToFrontend);
        console.log('Mapped customers for frontend:', mappedCustomers);
        
        return mappedCustomers;
    } catch (error) {
        console.error('Error in getCustomers:', error);
        throw error;
    }
}

// Get a specific customer by ID  
// Uses: GET /api/CustomerManagement/{id} - Returns Customer (full object) from swagger
export async function getCustomerById(customerId: string): Promise<CustomerDetailsResponse> {
    try {
        console.log(`Making API call to: /api/CustomerManagement/${customerId}`);
        const response = await ApiService.fetchDataWithAxios<Customer>({
            url: `/api/CustomerManagement/${customerId}`,
            method: 'get'
        });
        
        console.log(`API Response from /api/CustomerManagement/${customerId}:`, response);
        
        // Map API response to frontend model
        return mapApiCustomerToFrontend(response);
    } catch (error) {
        console.error(`Error fetching customer ${customerId}:`, error);
        throw error;
    }
}

// Create a new customer
// Uses: POST /api/CustomerManagement - Takes Customer, returns Customer from swagger
export async function createCustomer(data: CreateCustomerRequest): Promise<CustomerDetailsResponse> {
    const response = await ApiService.fetchDataWithAxios<Customer, CreateCustomerRequest>({
        url: '/api/CustomerManagement',
        method: 'post',
        data
    });
    
    // Map API response back to frontend model
    return mapApiCustomerToFrontend(response);
}

// Update a customer
// Uses: PUT /api/customers/{id} - Takes UpdateCustomerDto, returns CustomerDto from swagger
export async function updateCustomer(customerId: string, data: UpdateCustomerRequest): Promise<CustomerDetailsResponse> {
    const response = await ApiService.fetchDataWithAxios<Customer, UpdateCustomerRequest>({
        url: `/api/customers/${customerId}`,
        method: 'put',
        data
    });
    
    // Map API response back to frontend model
    return mapApiCustomerToFrontend(response);
}

// Upload customer logo
export async function uploadCustomerLogo(customerId: string, data: CustomerLogoRequest): Promise<void> {
    return ApiService.fetchDataWithAxios<void, CustomerLogoRequest>({
        url: `/api/customers/${customerId}/logo`,
        method: 'post',
        data
    });
}

// Upload customer background
export async function uploadCustomerBackground(customerId: string, data: CustomerBackgroundRequest): Promise<void> {
    return ApiService.fetchDataWithAxios<void, CustomerBackgroundRequest>({
        url: `/api/customers/${customerId}/background`,
        method: 'post',
        data
    });
}

// Delete a customer
export async function deleteCustomer(customerId: string): Promise<void> {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/CustomerManagement/${customerId}`,
        method: 'delete'
    });
}

// Get current customer details (for customer portal view)
export async function getCustomerDetails(): Promise<CustomerDetailsResponse> {
    return ApiService.fetchDataWithAxios<CustomerDetailsResponse>({
        url: endpointConfig.customers.getDetails,
        method: 'get'
    });
}

// Legacy method - use updateCustomer instead
export async function updateCustomerInfo(
    customerId: string, 
    data: CustomerInfo
): Promise<CustomerDetailsResponse> {
    // Convert CustomerInfo to UpdateCustomerRequest format
    const updateData: UpdateCustomerRequest = {
        name: data.name,
        subdomain: data.subdomain || data.domainUrl || '',
        address: data.address,
        theme: data.theme,
        legacyBusinessNetworkID: data.legacyBusinessNetworkID,
        portalDisplayName: data.portalDisplayName,
        portalDisplaySubName: data.portalDisplaySubName,
        portalDisplayPageSubTitle: data.portalDisplayPageSubTitle,
        portalWindowIcon: data.portalWindowIcon,
        isActive: data.isActive ?? true
    };
    
    return updateCustomer(customerId, updateData);
}

export async function updateCustomerCredentials(
    customerId: string, 
    data: CustomerCredentials
): Promise<void> {
    return ApiService.fetchDataWithAxios<void, CustomerCredentials>({
        url: `${endpointConfig.customers.updateCredentials}/${customerId}`,
        method: 'put',
        data
    });
}

export async function updateCustomerBranding(
    customerId: string, 
    data: CustomerBranding
): Promise<void> {
    return ApiService.fetchDataWithAxios<void, CustomerBranding>({
        url: `${endpointConfig.customers.updateBranding}/${customerId}`,
        method: 'put',
        data
    });
}

export async function getCustomerAccessToken(customerId: string): Promise<{token: string, domain: string}> {
    return ApiService.fetchDataWithAxios<{token: string, domain: string}>({
        url: `${endpointConfig.customers.getAccessToken}/${customerId}`,
        method: 'get'
    });
}

export async function endCustomerSession(): Promise<void> {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.customers.endCustomerSession,
        method: 'post'
    });
}
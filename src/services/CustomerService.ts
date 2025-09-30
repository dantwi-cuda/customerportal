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

// Customer Branding API Response Types (based on documentation)
export interface CustomerBrandingResponse {
    id: number
    name: string
    subdomain: string
    address?: string
    logoUrl?: string
    backgroundImageUrl?: string
    portalWindowIcon?: string
    theme?: string
    legacyBusinessNetworkID?: string
    portalDisplayName?: string
    portalDisplaySubName?: string
    portalDisplayPageSubTitle?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateCustomerDto extends Record<string, unknown> {
    name: string
    subdomain: string
    address?: string
    theme?: string
    legacyBusinessNetworkID?: string
    portalDisplayName?: string
    portalDisplaySubName?: string
    portalDisplayPageSubTitle?: string
}

export interface ImageUploadResponse {
    url: string
    fileName: string
    originalFileName: string
    contentType: string
    sizeInBytes: number
    width?: number
    height?: number
    uploadedAt: string
}

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

// =================
// Customer Branding API Methods (Priority over CustomerManagement)
// Based on CustomerBranding-React-Integration-Guide.md
// =================

/**
 * Create customer using CustomerBranding API
 * POST /api/customers
 */
export async function createCustomerWithBranding(data: CreateCustomerDto): Promise<CustomerBrandingResponse> {
    try {
        const response = await ApiService.fetchDataWithAxios<CustomerBrandingResponse>({
            url: '/api/customers',
            method: 'POST',
            data: data as Record<string, unknown>
        });
        return response;
    } catch (error) {
        console.error('Error creating customer with branding:', error);
        throw error;
    }
}

/**
 * Update customer using CustomerBranding API
 * PUT /api/customers/{id}
 */
export async function updateCustomerWithBranding(id: string, data: Partial<CreateCustomerDto>): Promise<CustomerBrandingResponse> {
    try {
        const response = await ApiService.fetchDataWithAxios<CustomerBrandingResponse>({
            url: `/api/customers/${id}`,
            method: 'PUT',
            data: data as Record<string, unknown>
        });
        return response;
    } catch (error) {
        console.error('Error updating customer with branding:', error);
        throw error;
    }
}

/**
 * Get customer by ID using CustomerBranding API
 * GET /api/customers/{id}
 */
export async function getCustomerByIdWithBranding(id: string): Promise<CustomerBrandingResponse> {
    try {
        const response = await ApiService.fetchDataWithAxios<CustomerBrandingResponse>({
            url: `/api/customers/${id}`,
            method: 'GET'
        });
        return response;
    } catch (error) {
        console.error('Error fetching customer with branding:', error);
        throw error;
    }
}

/**
 * Upload customer logo
 * POST /api/customers/{id}/logo
 */
export async function uploadCustomerLogoWithBranding(id: string, imageFile: File): Promise<ImageUploadResponse> {
    try {
        const formData = new FormData();
        formData.append('Image', imageFile);

        const response = await ApiService.fetchDataWithAxios<ImageUploadResponse>({
            url: `/api/customers/${id}/logo`,
            method: 'POST',
            data: formData as unknown as Record<string, unknown>,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response;
    } catch (error) {
        console.error('Error uploading customer logo:', error);
        throw error;
    }
}

/**
 * Upload customer background image
 * POST /api/customers/{id}/background
 */
export async function uploadCustomerBackgroundWithBranding(id: string, imageFile: File): Promise<ImageUploadResponse> {
    try {
        const formData = new FormData();
        formData.append('Image', imageFile);

        const response = await ApiService.fetchDataWithAxios<ImageUploadResponse>({
            url: `/api/customers/${id}/background`,
            method: 'POST',
            data: formData as unknown as Record<string, unknown>,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response;
    } catch (error) {
        console.error('Error uploading customer background:', error);
        throw error;
    }
}

/**
 * Upload customer icon/favicon
 * POST /api/customers/{id}/icon
 */
export async function uploadCustomerIconWithBranding(id: string, imageFile: File): Promise<ImageUploadResponse> {
    try {
        const formData = new FormData();
        formData.append('Image', imageFile);

        const response = await ApiService.fetchDataWithAxios<ImageUploadResponse>({
            url: `/api/customers/${id}/icon`,
            method: 'POST',
            data: formData as unknown as Record<string, unknown>,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response;
    } catch (error) {
        console.error('Error uploading customer icon:', error);
        throw error;
    }
}

/**
 * Delete customer logo
 * DELETE /api/customers/{id}/logo
 */
export async function deleteCustomerLogo(id: string): Promise<void> {
    try {
        await ApiService.fetchDataWithAxios<void>({
            url: `/api/customers/${id}/logo`,
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Error deleting customer logo:', error);
        throw error;
    }
}

/**
 * Delete customer background
 * DELETE /api/customers/{id}/background
 */
export async function deleteCustomerBackground(id: string): Promise<void> {
    try {
        await ApiService.fetchDataWithAxios<void>({
            url: `/api/customers/${id}/background`,
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Error deleting customer background:', error);
        throw error;
    }
}

/**
 * Delete customer icon
 * DELETE /api/customers/{id}/icon
 */
export async function deleteCustomerIcon(id: string): Promise<void> {
    try {
        await ApiService.fetchDataWithAxios<void>({
            url: `/api/customers/${id}/icon`,
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Error deleting customer icon:', error);
        throw error;
    }
}

/**
 * Get customer branding by subdomain (public endpoint)
 * GET /api/customers/subdomain/{subdomain}
 */
export async function getCustomerBrandingBySubdomain(subdomain: string): Promise<CustomerBrandingResponse> {
    try {
        const response = await ApiService.fetchDataWithAxios<CustomerBrandingResponse>({
            url: `/api/customers/subdomain/${subdomain}`,
            method: 'GET'
        });
        return response;
    } catch (error) {
        console.error('Error fetching customer branding by subdomain:', error);
        throw error;
    }
}
import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type { 
    CustomerDetailsResponse, 
    CustomerInfo, 
    CustomerCredentials, 
    CustomerBranding 
} from '@/@types/customer'

// Convert API Customer model to frontend CustomerDetailsResponse model
function mapApiCustomerToFrontend(apiCustomer: any): CustomerDetailsResponse {
    console.log("Raw API customer data:", apiCustomer);
    
    // Handle undefined or null customer
    if (!apiCustomer) {
        console.error("Received undefined or null customer from API");
        return {
            id: "0",
            name: "Unknown",
            legalName: "Unknown",
            domainUrl: "",
            isActive: false,
            credentials: {
                biUsername: "",
                biPassword: ""
            },
            branding: {
                displayTitle: "Unknown",
                logoUrl: ""
            }
        };
    }
    
    const customer = {
        id: apiCustomer.id?.toString() || "0",  // Convert number to string
        name: apiCustomer.name || "Unnamed Customer",
        legalName: apiCustomer.legalName || apiCustomer.name || "Unnamed Customer", // Prioritize legalName, fallback to name
        domainUrl: apiCustomer.domainUrl || apiCustomer.subdomain || "", // Prioritize domainUrl, fallback to subdomain
        subdomain: apiCustomer.subdomain || "",
        isActive: Boolean(apiCustomer.isActive),
        credentials: {
            biUsername: apiCustomer.credentials?.biUsername || "",
            biPassword: "" // Password should generally not be sent from backend; initialize as empty
        },
        branding: {
            displayTitle: apiCustomer.branding?.displayTitle || apiCustomer.name || "Unnamed Customer",
            logoUrl: apiCustomer.branding?.logoUrl || "",
            backgroundUrl: apiCustomer.branding?.backgroundUrl || "",
            faviconUrl: apiCustomer.branding?.faviconUrl || "",
            primaryColor: apiCustomer.branding?.primaryColor || "",
            secondaryColor: apiCustomer.branding?.secondaryColor || ""
        }
    };
    
    console.log("Mapped customer data:", customer);
    return customer;
}

// Get all customers (for admin view)
export async function getCustomers() {
    try {
        const response = await ApiService.fetchDataWithAxios<any[]>({
            url: 'api/CustomerManagement',
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
export async function getCustomerById(customerId: string) {
    const response = await ApiService.fetchDataWithAxios<any>({
        url: `api/CustomerManagement/${customerId}`,
        method: 'get'
    });
    
    // Map API response to frontend model
    return mapApiCustomerToFrontend(response);
}

// Convert frontend CustomerDetailsResponse to API Customer model
function mapFrontendToApiCustomer(frontendCustomer: CustomerDetailsResponse): any {
    return {
        name: frontendCustomer.name,
        subdomain: frontendCustomer.subdomain || frontendCustomer.domainUrl,
        isActive: frontendCustomer.isActive
        // API might have other required fields, but these are the primary ones
    };
}

// Create a new customer
export async function createCustomer(data: CustomerDetailsResponse) {
    const apiCustomerData = mapFrontendToApiCustomer(data);
    const response = await ApiService.fetchDataWithAxios<any, any>({
        url: 'api/CustomerManagement',
        method: 'post',
        data: apiCustomerData
    });
    
    // Map API response back to frontend model
    return mapApiCustomerToFrontend(response);
}

// Delete a customer
export async function deleteCustomer(customerId: string) {
    return ApiService.fetchDataWithAxios<void>({
        url: `api/CustomerManagement/${customerId}`,
        method: 'delete'
    })
}

// Get current customer details (for customer portal view)
export async function getCustomerDetails() {
    return ApiService.fetchDataWithAxios<CustomerDetailsResponse>({
        url: endpointConfig.customers.getDetails,
        method: 'get'
    })
}

export async function updateCustomerInfo(
    customerId: string, 
    data: CustomerInfo
) {
    return ApiService.fetchDataWithAxios<CustomerDetailsResponse, CustomerInfo>({
        url: `api/CustomerManagement/${customerId}`,
        method: 'put',
        data
    })
}

export async function updateCustomerCredentials(
    customerId: string, 
    data: CustomerCredentials
) {
    return ApiService.fetchDataWithAxios<void, CustomerCredentials>({
        url: `${endpointConfig.customers.updateCredentials}/${customerId}`,
        method: 'put',
        data
    })
}

export async function updateCustomerBranding(
    customerId: string, 
    data: CustomerBranding
) {
    return ApiService.fetchDataWithAxios<void, CustomerBranding>({
        url: `${endpointConfig.customers.updateBranding}/${customerId}`,
        method: 'put',
        data
    })
}

export async function getCustomerAccessToken(customerId: string) {
    return ApiService.fetchDataWithAxios<{token: string, domain: string}>({
        url: `${endpointConfig.customers.getAccessToken}/${customerId}`,
        method: 'get'
    })
}

export async function endCustomerSession() {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.customers.endCustomerSession,
        method: 'post'
    })
}
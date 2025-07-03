# API Integration Fixes

## Issue

The customers list was empty even though direct API calls to `GET http://localhost:5211/api/CustomerManagement` returned records.

## Root Cause

1. **Incorrect Endpoints**: The CustomerService.ts file was using `endpointConfig.customers.updateInfo` which was set to `api/CustomerManagement` but this was intended for customer update operations, not retrieval.

2. **Model Mismatch**: The API's Customer model has different properties than the frontend's CustomerDetailsResponse model:

    **API Model (`Customer`)**:

    ```json
    {
      "id": 1,  // number
      "name": "string",
      "subdomain": "string",
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z",
      "customerUsers": [...],
      "customerWorkspaces": [...],
      "shops": [...],
      "programs": [...]
    }
    ```

    **Frontend Model (`CustomerDetailsResponse`)**:

    ```typescript
    {
      id?: string;  // string
      name: string;
      legalName: string;  // Not in API
      domainUrl: string;  // Not in API
      subdomain?: string;
      isActive: boolean;
      credentials?: {  // Not in API
        biUsername: string;
        biPassword: string;
      };
      branding?: {  // Not in API
        displayTitle: string;
        logoUrl: string;
        backgroundUrl?: string;
        faviconUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
      };
    }
    ```

## Fixes Implemented

1. **Updated API Endpoints**: Changed the direct URLs in CustomerService.ts to use the correct endpoints from swagger.json:

    - GET /api/CustomerManagement for listing customers
    - GET /api/CustomerManagement/{id} for getting a customer by ID
    - POST /api/CustomerManagement for creating customers
    - DELETE /api/CustomerManagement/{id} for deleting customers

2. **Added Model Mapping**: Created mapper functions to convert between API and frontend models:

    - `mapApiCustomerToFrontend`: Converts API customer to frontend model
    - `mapFrontendToApiCustomer`: Converts frontend model to API format

3. **Added Debugging**: Added console logging to help diagnose issues with the API response and mapping.

## Future Recommendations

1. **Consistent IDs**: The API uses numeric IDs while the frontend uses string IDs. Consider standardizing on one approach.

2. **Extended API Model**: Consider extending the API model to include the additional fields needed by the frontend, such as branding and credentials.

3. **Type Safety**: Use more specific TypeScript interfaces for API responses to catch these issues earlier.

4. **Testing**: Add integration tests that verify the mapping between API and frontend models.

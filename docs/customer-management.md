# Customer Management Documentation

This document provides an overview of the Customer Management functionality in the Customer Portal application.

## Overview

The Customer Management feature allows administrators to:

1. View a list of all customers
2. Create new customers
3. Edit existing customers
4. Delete customers
5. Access customer portals

## Data Models

### CustomerInfo

```typescript
interface CustomerInfo {
    id?: string
    name: string
    legalName: string
    domainUrl: string
    subdomain?: string
    isActive: boolean
}
```

### CustomerCredentials

```typescript
interface CustomerCredentials {
    biUsername: string
    biPassword: string
}
```

### CustomerBranding

```typescript
interface CustomerBranding {
    displayTitle: string
    logoUrl: string
    backgroundUrl?: string
    faviconUrl?: string
    primaryColor?: string
    secondaryColor?: string
}
```

### CustomerDetailsResponse

```typescript
interface CustomerDetailsResponse extends CustomerInfo {
    credentials?: CustomerCredentials
    branding?: CustomerBranding
}
```

## API Services

The customer functionality is implemented in `CustomerService.ts` with the following methods:

-   `getCustomers()`: Retrieves a list of all customers
-   `getCustomerById(customerId)`: Retrieves a specific customer by ID
-   `createCustomer(data)`: Creates a new customer
-   `updateCustomerInfo(customerId, data)`: Updates a customer's basic information
-   `updateCustomerCredentials(customerId, data)`: Updates a customer's BI credentials
-   `updateCustomerBranding(customerId, data)`: Updates a customer's branding settings
-   `deleteCustomer(customerId)`: Deletes a customer
-   `getCustomerAccessToken(customerId)`: Gets a token for accessing a customer's portal
-   `endCustomerSession()`: Ends the current customer session and returns to the CCI portal

## Components

### Pages

-   `CustomersListPage.tsx`: Displays a list of all customers with options to create, edit, or delete customers
-   `CreateCustomerPage.tsx`: Form for creating a new customer
-   `EditCustomerPage.tsx`: Form for editing an existing customer

### Form Components

-   `CustomerInfoForm.tsx`: Form for editing customer basic information
-   `CredentialsForm.tsx`: Form for editing customer BI credentials
-   `BrandingForm.tsx`: Form for editing customer branding settings
-   `BrandingPreview.tsx`: Displays a preview of the customer's branding settings

## Routing

The customer management routes are defined in `adminRoutes.ts`:

-   `/admin/customers`: List all customers
-   `/admin/customers/create`: Create a new customer
-   `/admin/customers/edit/:id`: Edit an existing customer

## Usage Flow

1. Administrator navigates to `/admin/customers` to view the list of customers
2. From there, the administrator can:
    - Click "Create Customer" button to create a new customer
    - Click "Edit" on a customer to update their details
    - Click "Delete" on a customer to remove them
    - Click "Access Portal" to log in to a customer's portal

## Branding Preview

The branding preview functionality allows administrators to see how the customer's branding will look before saving changes. It includes:

1. Logo display
2. Color scheme preview
3. Button styling
4. Portal header preview

## Best Practices

1. **Error Handling**: All API calls include appropriate error handling and user feedback
2. **Validation**: Forms use zod for client-side validation
3. **Confirmation**: Destructive actions (like delete) require confirmation
4. **Progressive Disclosure**: Creation flow is broken down into steps (Info → Credentials → Branding)
5. **Preview**: Branding changes can be previewed before saving

## Future Enhancements

1. **Bulk Operations**: Add support for bulk actions (activate/deactivate multiple customers)
2. **Advanced Filtering**: Implement more advanced filtering and sorting options
3. **Audit Logging**: Track changes to customer settings
4. **Role-based Access**: Refine permissions for different administrator roles

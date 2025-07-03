# Customer Management API Endpoints

This document outlines the available API endpoints for customer management based on the current swagger.json specification.

## Base Endpoint

All customer management endpoints are prefixed with `/api/CustomerManagement`.

## Available Endpoints

### List All Customers

-   **URL**: `/api/CustomerManagement`
-   **Method**: `GET`
-   **Response**: Array of Customer objects

### Get Customer by ID

-   **URL**: `/api/CustomerManagement/{id}`
-   **Method**: `GET`
-   **Parameters**: `id` (integer, required) - The ID of the customer
-   **Response**: Customer object

### Create Customer

-   **URL**: `/api/CustomerManagement`
-   **Method**: `POST`
-   **Request Body**: Customer object
-   **Response**: Customer object

### Update Customer

-   **URL**: `/api/CustomerManagement/{id}`
-   **Method**: `PUT`
-   **Parameters**: `id` (integer, required) - The ID of the customer
-   **Request Body**: Customer object
-   **Response**: Success status

### Update Customer Status

-   **URL**: `/api/CustomerManagement/{id}/status`
-   **Method**: `PATCH`
-   **Parameters**: `id` (integer, required) - The ID of the customer
-   **Request Body**: Boolean value
-   **Response**: Success status

### Get Customer Users

-   **URL**: `/api/CustomerManagement/{customerId}/users`
-   **Method**: `GET`
-   **Parameters**: `customerId` (integer, required) - The ID of the customer
-   **Response**: Array of user objects

### Additional Custom Endpoints

These are custom endpoints that have been implemented but are not yet documented in the swagger.json specification:

-   **Customer Details**: `/api/CustomerManagement/details` (GET)
-   **Customer Credentials**: `/api/CustomerManagement/credentials/{customerId}` (PUT)
-   **Customer Branding**: `/api/CustomerManagement/branding/{customerId}` (PUT)
-   **Customer Access Token**: `/api/CustomerManagement/access-token/{customerId}` (GET)
-   **End Customer Session**: `/api/CustomerManagement/end-session` (POST)

## Customer Object Schema

```json
{
    "id": 0,
    "name": "string",
    "subdomain": "string",
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "customerUsers": [
        {
            /* CustomerUser object */
        }
    ],
    "customerWorkspaces": [
        {
            /* CustomerWorkspace object */
        }
    ],
    "shops": [
        {
            /* Shop object */
        }
    ],
    "programs": [
        {
            /* Program object */
        }
    ]
}
```

## Implementation Notes

-   The Customer object model used in the frontend includes additional properties like `legalName`, `domainUrl`, `credentials`, and `branding` that may need to be mapped to/from the API model.
-   The frontend implementation uses string IDs, while the API appears to use integer IDs. Make sure to handle this conversion appropriately.

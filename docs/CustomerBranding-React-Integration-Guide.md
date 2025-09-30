# Customer Branding System - React Frontend Integration Guide

## Overview

This document provides comprehensive guidance for React frontend developers to integrate with the Customer Branding API system. The API provides full CRUD operations for managing customer information, branding assets, and portal customization settings with multi-tier caching and CDN optimization.

## Table of Contents

1. [API Architecture](#api-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Customer Management](#customer-management)
4. [Branding Assets Management](#branding-assets-management)
5. [Portal Customization](#portal-customization)
6. [Error Handling](#error-handling)
7. [Performance Optimization](#performance-optimization)
8. [Response Formats](#response-formats)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Security Considerations](#security-considerations)

## API Architecture

### Base URL Structure

- **Production**: `https://api.your-domain.com/api/customers`
- **Development**: `https://localhost:7001/api/customers`

### Core Components

- **Caching Strategy**: Multi-tier caching with in-memory (30min TTL) and distributed cache
- **CDN Integration**: Optimized asset delivery with Azure CDN
- **Image Processing**: Automatic WebP conversion, compression, and resizing
- **Folder Structure**: Organized asset storage with URL-safe naming conventions

## Authentication & Authorization

### User Roles & Permissions

#### Global Roles

- **CS-Admin**: Full system access, can manage all customers
- **CS-User**: Limited administrative access, can manage all customers

#### Tenant-Specific Roles

- **Tenant-Admin**: Can manage their own customer/tenant data only
- **Customer User**: Read-only access to their own customer data

#### Role Hierarchy for Operations

- **Create Customer**: CS-Admin, CS-User only
- **Update Customer**: CS-Admin, CS-User, Tenant-Admin (own data only)
- **Upload/Delete Assets**: CS-Admin, CS-User, Tenant-Admin (own data only)
- **View Branding**: Anonymous access for public portal branding

### Authentication Headers

```
Authorization: Bearer <jwt-token>
Content-Type: application/json (for JSON requests)
Content-Type: multipart/form-data (for file uploads)
```

## Customer Management

### 1. Get Customer by ID

**Endpoint**: `GET /api/customers/{id}`

- **Access**: Authenticated users with appropriate permissions
- **Use Case**: Retrieve detailed customer information for management interfaces
- **Response**: Complete customer data including all branding properties

### 2. Get Current Customer

**Endpoint**: `GET /api/customers/current`

- **Access**: Authenticated customer users
- **Use Case**: Self-service customer dashboard, profile management
- **Response**: Current user's customer data

### 3. Create New Customer

**Endpoint**: `POST /api/customers`

- **Access**: CS-Admin, CS-User only
- **Use Case**: Administrative customer onboarding
- **Validation**: Subdomain uniqueness enforced
- **Required Fields**: Name, Subdomain
- **Optional Fields**: Address, Theme, PortalDisplayName, etc.

### 4. Update Customer Information

**Endpoint**: `PUT /api/customers/{id}`

- **Access**: CS-Admin, CS-User, Tenant-Admin (own data)
- **Use Case**: Customer profile updates, branding configuration
- **Validation**: Subdomain uniqueness when changed
- **Cache Invalidation**: Automatically clears branding cache

### 5. Get Customer by Subdomain (Public Branding)

**Endpoint**: `GET /api/customers/subdomain/{subdomain}`

- **Access**: Anonymous (public endpoint)
- **Use Case**: Portal initialization, theme loading, branding display
- **Caching**: 30-minute response cache with ETag support
- **Critical**: Primary endpoint for portal customization

## Branding Assets Management

### Supported Asset Types

1. **Logo**: Customer brand logo (max 5MB, optimized to 300x150px)
2. **Background**: Portal background image (max 10MB, optimized to 1920x1080px)
3. **Icon**: Portal window/tab icon/favicon (max 2MB, optimized to 64x64px)

### Asset Organization Structure

Assets are organized in CDN-optimized folder structure:

- Pattern: `{customer-name-normalized}/{asset-type}/{filename}.webp`
- Example: `nissan-certified-collision/logo/logo-20241225-abc123.webp`

### 1. Upload Logo

**Endpoint**: `POST /api/customers/{id}/logo`

- **Content-Type**: `multipart/form-data`
- **Field Name**: `Image`
- **Size Limit**: 5MB
- **Automatic Processing**: Resize to 300x150px, WebP conversion, 85% quality
- **Old Asset Cleanup**: Automatically deletes previous logo
- **Cache Invalidation**: Clears branding cache

### 2. Upload Background Image

**Endpoint**: `POST /api/customers/{id}/background`

- **Content-Type**: `multipart/form-data`
- **Field Name**: `Image`
- **Size Limit**: 10MB
- **Automatic Processing**: Resize to 1920x1080px, WebP conversion, 90% quality
- **Old Asset Cleanup**: Automatically deletes previous background
- **Cache Invalidation**: Clears branding cache

### 3. Delete Logo

**Endpoint**: `DELETE /api/customers/{id}/logo`

- **Response**: 204 No Content on success
- **Effect**: Removes logo URL from customer record, deletes file from storage
- **Cache Invalidation**: Clears branding cache

### 4. Delete Background

**Endpoint**: `DELETE /api/customers/{id}/background`

- **Response**: 204 No Content on success
- **Effect**: Removes background URL from customer record, deletes file from storage
- **Cache Invalidation**: Clears branding cache

### 5. Upload Icon

**Endpoint**: `POST /api/customers/{id}/icon`

- **Content-Type**: `multipart/form-data`
- **Field Name**: `Image`
- **Size Limit**: 2MB
- **Automatic Processing**: Resize to 64x64px, WebP conversion, 90% quality
- **Old Asset Cleanup**: Automatically deletes previous icon
- **Cache Invalidation**: Clears branding cache
- **Use Case**: Portal favicon, window icon, browser tab icon

### 6. Delete Icon

**Endpoint**: `DELETE /api/customers/{id}/icon`

- **Response**: 204 No Content on success
- **Effect**: Removes icon URL from customer record, deletes file from storage
- **Cache Invalidation**: Clears branding cache

### 7. Generate SAS Token (Advanced)

**Endpoint**: `GET /api/customers/{id}/images/token`

- **Use Case**: Direct Azure storage access for advanced scenarios
- **Token Duration**: 1 hour
- **Security**: Customer-specific container access only

## Portal Customization

### Branding Data Structure

The public branding endpoint returns comprehensive customization data:

```json
{
  "success": true,
  "data": {
    "tenantId": 123,
    "name": "Customer Name",
    "portalDisplayName": {
      "bold": "Customer",
      "normal": "Portal"
    },
    "subtitle": "Welcome to our customer portal",
    "assets": {
      "logo": {
        "url": "https://cdn.domain.com/customer-name/logo/logo.webp",
        "filename": "logo-20241225-abc123.webp",
        "contentType": "image/webp"
      },
      "icon": {
        "url": "https://cdn.domain.com/customer-name/icon/icon.webp",
        "filename": "icon-20241225-ghi789.webp",
        "contentType": "image/webp"
      },
      "background": {
        "url": "https://cdn.domain.com/customer-name/background/bg.webp",
        "filename": "background-20241225-def456.webp",
        "contentType": "image/webp"
      }
    },
    "theme": "light"
  }
}
```

**Note**: The `theme` field will be `null` if the customer has no theme configured. This field contains the actual theme value from the customer's configuration (e.g., "light", "dark", or custom theme names).

### Portal Display Name Logic

- **PortalDisplayName**: Split on first space for Bold/Normal formatting
- **Example**: "Nissan Certified" → Bold: "Nissan", Normal: "Certified"
- **Fallback**: If no space, entire name goes to Bold field

### Theme Support

#### Current Implementation

The theme system now consistently returns the actual customer theme value across all APIs:

**All APIs**: Return `theme` as a simple string

```json
{
  "theme": "light" // or "dark", or any custom value, or null
}
```

#### Implementation Details:

- **Theme Field**: Customer.Theme field stores theme identifiers ("dark", "light", custom values)
- **Consistent Response**: Both Customer Management and Public Branding APIs return the same theme value
- **Null Handling**: Theme field is null when Customer.Theme is empty/null
- **Usage**: Use the theme string directly for CSS class application (e.g., `theme-${theme}`)

#### Theme Usage Examples:

- `"light"` → Apply light theme CSS classes
- `"dark"` → Apply dark theme CSS classes
- `"corporate-blue"` → Apply custom corporate theme
- `null` → Use default theme

#### Future Enhancements:

For advanced theming, consider adding dedicated color fields to the Customer model or parsing color values from structured theme strings.

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Error Scenarios

#### 400 Bad Request

- Invalid file format for image uploads
- Missing required fields in create/update operations
- File size exceeds limits (5MB logo, 10MB background, 2MB icon)
- Subdomain already in use

#### 401 Unauthorized

- Missing or invalid JWT token
- Token expired

#### 403 Forbidden

- Insufficient role permissions
- Attempting to access another customer's data

#### 404 Not Found

- Customer ID doesn't exist
- Subdomain not found (public branding endpoint)
- Inactive customer account

#### 413 Payload Too Large

- File size exceeds server limits
- Request body too large

#### 500 Internal Server Error

- File processing failures
- Database connection issues
- Storage service unavailable

### Error Handling Best Practices

1. **Graceful Degradation**: Show default branding when assets fail to load
2. **User Feedback**: Clear error messages for upload failures
3. **Retry Logic**: Implement retry for transient failures
4. **Validation**: Client-side validation before API calls
5. **Fallback Assets**: Default logos/backgrounds for missing assets

## Performance Optimization

### Caching Strategy

- **Response Cache**: 30-minute cache on branding endpoints
- **ETag Support**: Conditional requests to avoid unnecessary transfers
- **CDN Integration**: Global asset distribution with edge caching
- **Memory Cache**: 30-minute in-memory cache for frequently accessed data

### Image Optimization

- **Automatic WebP**: All images converted to WebP format
- **Smart Compression**: Quality optimized by asset type (85% logo, 90% background)
- **Responsive Sizing**: Automatic resizing to optimal dimensions
- **Progressive Loading**: WebP supports progressive rendering

### Frontend Optimization Guidelines

1. **Lazy Loading**: Load branding assets after critical content
2. **Preload Critical**: Preload logo and primary branding elements
3. **Cache Headers**: Respect ETag and Cache-Control headers
4. **Fallback Strategy**: Progressive enhancement with default styles
5. **Bundle Optimization**: Separate branding logic from core application

### CDN Configuration

- **Global Distribution**: Assets served from nearest edge location
- **Compression**: Automatic GZIP/Brotli compression
- **HTTP/2**: Multiplexed asset delivery
- **SSL**: HTTPS-only asset delivery

## Response Formats

### Customer Management Response

```json
{
  "id": 123,
  "name": "Customer Name",
  "subdomain": "customer-subdomain",
  "address": "123 Main St, City, State",
  "logoUrl": "https://cdn.domain.com/customer/logo/logo.webp",
  "backgroundImageUrl": "https://cdn.domain.com/customer/background/bg.webp",
  "portalWindowIcon": "https://cdn.domain.com/customer/icon/icon.webp",
  "theme": "light",
  "legacyBusinessNetworkID": "BN123456",
  "portalDisplayName": "Customer Portal",
  "portalDisplaySubName": "Powered by CCI",
  "portalDisplayPageSubTitle": "Welcome to our customer portal",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-12-25T12:00:00Z"
}
```

### Image Upload Response

```json
{
  "url": "https://cdn.domain.com/customer/logo/logo-20241225-abc123.webp",
  "fileName": "logo-20241225-abc123.webp",
  "originalFileName": "company-logo.png",
  "contentType": "image/webp",
  "sizeInBytes": 45678,
  "width": 300,
  "height": 150,
  "uploadedAt": "2024-12-25T12:00:00Z"
}
```

### Health Check Response

```json
{
  "success": true,
  "cdnEndpoint": "https://cdn.domain.com",
  "cacheHeaders": {
    "maxAge": 3600,
    "eTag": true
  }
}
```

## Implementation Guidelines

### React Component Architecture

#### 1. Branding Context Provider

Create a context provider to manage branding state across the application:

- Load branding data on app initialization
- Handle subdomain detection
- Provide branding data to child components
- Manage loading and error states

#### 2. Asset Management Components

- **ImageUpload**: Reusable component for logo/background/icon uploads
- **AssetPreview**: Display current assets with edit/delete options
- **BrandingForm**: Customer information and branding settings form
- **ThemeSelector**: Theme selection and customization interface
- **IconUpload**: Specialized component for favicon/icon uploads with preview

#### 3. Portal Customization Hook

Custom hook for branding operations:

- Fetch branding by subdomain
- Upload/delete assets
- Update customer information
- Handle caching and error states

### State Management Recommendations

#### Redux/Zustand Store Structure

```javascript
{
  branding: {
    data: BrandingData | null,
    loading: boolean,
    error: string | null,
    lastUpdated: timestamp
  },
  customer: {
    current: CustomerData | null,
    loading: boolean,
    error: string | null
  },
  uploads: {
    logo: UploadState,
    background: UploadState,
    icon: UploadState
  }
}
```

#### Local State for Forms

- Use controlled components for customer information forms
- Implement optimistic updates for better UX
- Handle validation errors gracefully
- Provide real-time preview of changes

### File Upload Implementation

#### 1. Client-Side Validation

- File type validation (jpg, png, gif, webp, ico for icons)
- File size validation (5MB logo, 10MB background, 2MB icon)
- Dimension validation recommendations (64x64px ideal for icons)
- Preview generation before upload
- Icon format validation (ICO, PNG, WebP recommended for favicons)

#### 2. Upload Progress

- Implement upload progress indicators
- Handle upload cancellation
- Provide retry mechanisms for failed uploads
- Show processing status for image optimization

#### 3. Drag and Drop Support

- Implement drag-and-drop file upload
- Visual feedback for drag states
- Multiple file handling with validation
- Integration with existing upload flows

### Responsive Design Considerations

#### 1. Asset Display

- Responsive logo sizing based on viewport
- Background image optimization for mobile
- Progressive image loading
- Fallback for slow connections

#### 2. Form Layout

- Mobile-first form design
- Touch-friendly upload interfaces
- Collapsible sections for complex forms
- Accessibility compliance

### Testing Strategy

#### 1. Unit Tests

- Branding data transformation
- Upload validation logic
- Error handling scenarios
- State management reducers

#### 2. Integration Tests

- API endpoint integration
- File upload workflows
- Authentication flows
- Cache invalidation

#### 3. E2E Tests

- Complete branding setup flow
- Asset upload and display
- Cross-browser compatibility
- Performance benchmarks

## Security Considerations

### 1. File Upload Security

- **File Type Validation**: Server enforces allowed image formats
- **Size Limits**: Strict file size enforcement (5MB/10MB)
- **Malware Scanning**: Recommended for production environments
- **Content-Type Validation**: Verify actual file content matches extension

### 2. Authentication Security

- **JWT Validation**: Always validate token on sensitive operations
- **Role-Based Access**: Enforce permissions on frontend and backend
- **Secure Storage**: Store tokens securely (HttpOnly cookies recommended)
- **Token Refresh**: Implement automatic token refresh

### 3. Data Protection

- **Input Sanitization**: Sanitize all user inputs
- **XSS Prevention**: Escape user-generated content
- **CSRF Protection**: Implement CSRF tokens for state-changing operations
- **HTTPS Only**: Enforce HTTPS for all communications

### 4. Asset Security

- **CDN Security**: Configure proper CORS and access controls
- **SAS Token Security**: Limit token scope and duration
- **Asset Validation**: Validate asset URLs before displaying
- **Cache Security**: Implement proper cache invalidation

### 5. Privacy Considerations

- **Data Minimization**: Only collect necessary customer information
- **Access Logging**: Log access to sensitive customer data
- **Data Retention**: Implement proper data lifecycle management
- **Compliance**: Ensure GDPR/CCPA compliance for customer data

## Health Check Endpoint

**Endpoint**: `GET /api/customers/health`

- **Access**: Anonymous
- **Purpose**: System health monitoring and CDN configuration
- **Response**: CDN endpoint and cache configuration
- **Use Case**: Application initialization and monitoring

This endpoint provides:

- CDN endpoint URL for asset loading
- Cache configuration for optimal performance
- System health status
- Integration validation

## Conclusion

This Customer Branding API provides a comprehensive solution for multi-tenant portal customization with enterprise-grade performance, security, and scalability. The React frontend should leverage the caching strategies, handle errors gracefully, and provide an intuitive user experience for branding management.

The API is designed to support both simple portal customization and advanced branding scenarios, with room for future enhancements including advanced theming, additional asset types, and extended customization options.

For implementation questions or clarification on specific endpoints, refer to the OpenAPI documentation or contact the backend development team.

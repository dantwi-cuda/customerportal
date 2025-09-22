# Feature Toggles Backend Design Document

## Overview

This document outlines the backend API design for implementing feature toggles that allow Portal Administrators to control tenant access to specific menu features. The system will distinguish between free features (always enabled) and paid features (disabled by default, enabled by Portal Admin).

## Business Requirements

### Feature Categories

1. **Free Features** (Always Enabled)

    - Basic Dashboard
    - Basic Reports (read-only)
    - Shop Properties (basic)

2. **Paid Features** (Disabled by Default)
    - Advanced Shop KPI & Analytics
    - Parts Management (full CRUD)
    - Advanced Accounting Features
    - Premium Subscriptions Management
    - Advanced Reports (Power BI integration)

### Access Control Requirements

-   Portal Admins (CS-Admin) can enable/disable paid features for specific tenants
-   Tenant Admins can see only enabled features in their navigation
-   End Users inherit the same feature access as their tenant
-   Feature changes should be applied immediately without requiring logout
-   Audit trail for feature toggle changes

## Database Schema Design

### 1. Feature Master Table

```sql
CREATE TABLE Features (
    FeatureId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FeatureKey NVARCHAR(100) NOT NULL UNIQUE, -- e.g., 'shop_kpi_advanced', 'parts_management'
    FeatureName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500),
    Category NVARCHAR(50) NOT NULL, -- 'free', 'paid'
    MenuPath NVARCHAR(300), -- Navigation path reference
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
)
```

### 2. Tenant Feature Assignments Table

```sql
CREATE TABLE TenantFeatures (
    TenantFeatureId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TenantId UNIQUEIDENTIFIER NOT NULL,
    FeatureId UNIQUEIDENTIFIER NOT NULL,
    IsEnabled BIT DEFAULT 0,
    EnabledBy UNIQUEIDENTIFIER, -- UserId of who enabled it
    EnabledAt DATETIME2,
    DisabledBy UNIQUEIDENTIFIER, -- UserId of who disabled it
    DisabledAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),

    FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    FOREIGN KEY (FeatureId) REFERENCES Features(FeatureId),
    FOREIGN KEY (EnabledBy) REFERENCES Users(UserId),
    FOREIGN KEY (DisabledBy) REFERENCES Users(UserId),

    CONSTRAINT UK_TenantFeatures_TenantFeature UNIQUE (TenantId, FeatureId)
)
```

### 3. Generic Audit Log System (Recommended)

**Note**: Instead of a feature-specific audit table, use a generic audit logging middleware that supports multiple providers.

#### Generic Audit Log Schema (if using database provider)

```sql
CREATE TABLE AuditLog (
    AuditId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EntityType NVARCHAR(100) NOT NULL, -- 'TenantFeature', 'User', 'Tenant', etc.
    EntityId NVARCHAR(100) NOT NULL, -- Primary key of the affected entity
    Action NVARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'ENABLE', 'DISABLE'
    UserId UNIQUEIDENTIFIER NOT NULL, -- Who performed the action
    TenantId UNIQUEIDENTIFIER, -- Context tenant (if applicable)
    Timestamp DATETIME2 DEFAULT GETUTCDATE(),
    Changes NVARCHAR(MAX), -- JSON object with before/after values
    Metadata NVARCHAR(MAX), -- JSON object with additional context (reason, IP, etc.)
    CorrelationId UNIQUEIDENTIFIER, -- For tracking related operations

    INDEX IX_AuditLog_EntityType_EntityId (EntityType, EntityId),
    INDEX IX_AuditLog_UserId_Timestamp (UserId, Timestamp),
    INDEX IX_AuditLog_TenantId_Timestamp (TenantId, Timestamp)
)
```

## REST API Endpoints Design

### 1. Feature Management Endpoints

#### Get All Features

```http
GET /api/Features
Authorization: Bearer {token}
Roles: CS-Admin, CS-User
```

**Response:**

```json
{
    "success": true,
    "data": [
        {
            "featureId": "uuid",
            "featureKey": "shop_kpi_advanced",
            "featureName": "Advanced Shop KPI",
            "description": "Advanced analytics and KPI tracking",
            "category": "paid",
            "menuPath": "shopKPI",
            "isActive": true
        }
    ]
}
```

#### Create New Feature

```http
POST /api/Features
Authorization: Bearer {token}
Roles: CS-Admin
Content-Type: application/json
```

**Request:**

```json
{
    "featureKey": "parts_management_advanced",
    "featureName": "Advanced Parts Management",
    "description": "Full CRUD operations for parts management",
    "category": "paid",
    "menuPath": "partsManagement"
}
```

#### Update Feature

```http
PUT /api/Features/{featureId}
Authorization: Bearer {token}
Roles: CS-Admin
```

#### Delete Feature

```http
DELETE /api/Features/{featureId}
Authorization: Bearer {token}
Roles: CS-Admin
```

### 2. Tenant Feature Management Endpoints

#### Get Tenant Features

```http
GET /api/Tenants/{tenantId}/Features
Authorization: Bearer {token}
Roles: CS-Admin, CS-User, Tenant-Admin (own tenant only)
```

**Response:**

```json
{
    "success": true,
    "data": {
        "tenantId": "uuid",
        "tenantName": "Example Corp",
        "features": [
            {
                "featureId": "uuid",
                "featureKey": "shop_kpi_advanced",
                "featureName": "Advanced Shop KPI",
                "category": "paid",
                "isEnabled": true,
                "enabledAt": "2025-09-20T10:30:00Z",
                "enabledBy": {
                    "userId": "uuid",
                    "userName": "admin@portal.com"
                }
            }
        ]
    }
}
```

#### Enable Feature for Tenant

```http
POST /api/Tenants/{tenantId}/Features/{featureId}/enable
Authorization: Bearer {token}
Roles: CS-Admin
Content-Type: application/json
```

**Request:**

```json
{
    "reason": "Customer upgraded to premium plan"
}
```

#### Disable Feature for Tenant

```http
POST /api/Tenants/{tenantId}/Features/{featureId}/disable
Authorization: Bearer {token}
Roles: CS-Admin
```

#### Bulk Enable/Disable Features

```http
POST /api/Tenants/{tenantId}/Features/bulk-update
Authorization: Bearer {token}
Roles: CS-Admin
```

**Request:**

```json
{
    "features": [
        {
            "featureId": "uuid",
            "isEnabled": true,
            "reason": "Premium plan activation"
        },
        {
            "featureId": "uuid2",
            "isEnabled": false,
            "reason": "Feature deprecated"
        }
    ]
}
```

### 3. User Access Endpoints

#### Get Current User's Available Features

```http
GET /api/User/Features
Authorization: Bearer {token}
Roles: All authenticated users
```

**Response:**

```json
{
    "success": true,
    "data": {
        "userId": "uuid",
        "tenantId": "uuid",
        "availableFeatures": [
            {
                "featureKey": "shop_kpi_basic",
                "featureName": "Basic Shop KPI",
                "menuPath": "shopKPI",
                "category": "free"
            },
            {
                "featureKey": "parts_management_view",
                "featureName": "Parts Management (View Only)",
                "menuPath": "partsManagement",
                "category": "free"
            }
        ]
    }
}
```

#### Check Feature Access

```http
GET /api/User/Features/{featureKey}/access
Authorization: Bearer {token}
Roles: All authenticated users
```

**Response:**

```json
{
    "success": true,
    "data": {
        "featureKey": "shop_kpi_advanced",
        "hasAccess": true,
        "reason": "Feature enabled for tenant"
    }
}
```

### 4. Audit and Reporting Endpoints

#### Get Audit Log (Generic)

```http
GET /api/Audit?entityType=TenantFeature&entityId={tenantId-featureId}&startDate={date}&endDate={date}
Authorization: Bearer {token}
Roles: CS-Admin
```

**Response:**

```json
{
    "success": true,
    "data": [
        {
            "auditId": "uuid",
            "entityType": "TenantFeature",
            "entityId": "tenantId-featureId",
            "action": "ENABLE",
            "userId": "uuid",
            "userName": "admin@portal.com",
            "tenantId": "uuid",
            "timestamp": "2025-09-20T10:30:00Z",
            "changes": {
                "isEnabled": {
                    "before": false,
                    "after": true
                }
            },
            "metadata": {
                "reason": "Customer upgraded to premium plan",
                "ipAddress": "192.168.1.1",
                "userAgent": "Portal Admin v1.0"
            },
            "correlationId": "uuid"
        }
    ]
}
```

#### Get Feature Usage Report

```http
GET /api/Reports/FeatureUsage?startDate={date}&endDate={date}
Authorization: Bearer {token}
Roles: CS-Admin
```

**Response:**

```json
{
    "success": true,
    "data": {
        "reportDate": "2025-09-20T00:00:00Z",
        "features": [
            {
                "featureKey": "shop_kpi_advanced",
                "featureName": "Advanced Shop KPI",
                "totalTenants": 150,
                "enabledTenants": 75,
                "enablementRate": 0.5
            }
        ]
    }
}
```

## Implementation Requirements

### 1. Backend Service Layer

#### FeatureService

```csharp
public interface IFeatureService
{
    Task<List<Feature>> GetAllFeaturesAsync();
    Task<Feature> CreateFeatureAsync(CreateFeatureRequest request);
    Task<Feature> UpdateFeatureAsync(Guid featureId, UpdateFeatureRequest request);
    Task<bool> DeleteFeatureAsync(Guid featureId);
    Task<List<TenantFeature>> GetTenantFeaturesAsync(Guid tenantId);
    Task<bool> EnableFeatureForTenantAsync(Guid tenantId, Guid featureId, Guid enabledBy, string reason = null);
    Task<bool> DisableFeatureForTenantAsync(Guid tenantId, Guid featureId, Guid disabledBy, string reason = null);
    Task<bool> BulkUpdateTenantFeaturesAsync(Guid tenantId, List<BulkFeatureUpdateRequest> requests, Guid changedBy);
    Task<List<Feature>> GetUserAvailableFeaturesAsync(Guid userId);
    Task<bool> CheckUserFeatureAccessAsync(Guid userId, string featureKey);
}
```

#### TenantFeatureService

```csharp
public interface ITenantFeatureService
{
    Task InitializeTenantFeaturesAsync(Guid tenantId); // Called when new tenant is created
    Task<List<string>> GetEnabledFeatureKeysAsync(Guid tenantId);
    // Note: Audit logging handled by generic middleware, not domain service
}
```

### 2. Generic Audit Logging System

#### IAuditService (Generic)

```csharp
public interface IAuditService
{
    Task LogAsync<T>(string entityType, string entityId, string action, T beforeState, T afterState,
                    Guid userId, Guid? tenantId = null, Dictionary<string, object> metadata = null,
                    Guid? correlationId = null);

    Task<List<AuditEntry>> GetAuditLogAsync(string entityType = null, string entityId = null,
                                           DateTime? startDate = null, DateTime? endDate = null);
}
```

#### IAuditProvider (Strategy Pattern)

```csharp
public interface IAuditProvider
{
    Task WriteAuditAsync(AuditEntry entry);
    Task<List<AuditEntry>> ReadAuditAsync(AuditQuery query);
}

// Implementations:
public class DatabaseAuditProvider : IAuditProvider { }
public class AzureInsightsAuditProvider : IAuditProvider { }
public class ElasticsearchAuditProvider : IAuditProvider { }
```

#### Audit Middleware

```csharp
public class AuditMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        // Capture request state
        var correlationId = Guid.NewGuid();
        context.Items["CorrelationId"] = correlationId;

        await next(context);

        // Capture response and log if needed
    }
}

[AttributeUsage(AttributeTargets.Method)]
public class AuditableAttribute : Attribute
{
    public string EntityType { get; set; }
    public string Action { get; set; }

    public AuditableAttribute(string entityType, string action)
    {
        EntityType = entityType;
        Action = action;
    }
}
```

#### Usage Example

```csharp
[HttpPost("{tenantId}/Features/{featureId}/enable")]
[Auditable("TenantFeature", "ENABLE")]
public async Task<IActionResult> EnableFeatureForTenant(Guid tenantId, Guid featureId, [FromBody] EnableFeatureRequest request)
{
    var beforeState = await _tenantFeatureService.GetTenantFeatureAsync(tenantId, featureId);

    var result = await _featureService.EnableFeatureForTenantAsync(tenantId, featureId, CurrentUserId, request.Reason);

    var afterState = await _tenantFeatureService.GetTenantFeatureAsync(tenantId, featureId);

    // Audit logging handled by middleware/filter automatically
    await _auditService.LogAsync("TenantFeature", $"{tenantId}-{featureId}", "ENABLE",
                                beforeState, afterState, CurrentUserId, tenantId,
                                new Dictionary<string, object> { ["reason"] = request.Reason });

    return Ok(result);
}
```

### 2. Authentication & Authorization

#### Custom Authorization Attribute

```csharp
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireFeatureAttribute : Attribute
{
    public string FeatureKey { get; set; }
    public RequireFeatureAttribute(string featureKey)
    {
        FeatureKey = featureKey;
    }
}
```

#### Usage Example

```csharp
[HttpGet]
[RequireFeature("parts_management_advanced")]
public async Task<IActionResult> GetAdvancedPartsData()
{
    // Implementation
}
```

### 3. Caching Strategy

#### Redis Cache Keys

-   `tenant_features:{tenantId}` - Cache enabled features for a tenant
-   `user_features:{userId}` - Cache user's available features
-   `features:all` - Cache all system features

#### Cache Invalidation

-   Invalidate tenant cache when features are enabled/disabled
-   Invalidate user cache when tenant features change
-   Set TTL of 1 hour for feature caches

### 4. Event System

#### Feature Change Events (Enhanced with Correlation)

```csharp
public class FeatureEnabledEvent : IAuditableEvent
{
    public Guid TenantId { get; set; }
    public string FeatureKey { get; set; }
    public Guid EnabledBy { get; set; }
    public DateTime EnabledAt { get; set; }
    public string Reason { get; set; }
    public Guid CorrelationId { get; set; }

    // IAuditableEvent implementation
    public string EntityType => "TenantFeature";
    public string EntityId => $"{TenantId}-{FeatureKey}";
    public string Action => "ENABLE";
}

public class FeatureDisabledEvent : IAuditableEvent
{
    public Guid TenantId { get; set; }
    public string FeatureKey { get; set; }
    public Guid DisabledBy { get; set; }
    public DateTime DisabledAt { get; set; }
    public string Reason { get; set; }
    public Guid CorrelationId { get; set; }

    // IAuditableEvent implementation
    public string EntityType => "TenantFeature";
    public string EntityId => $"{TenantId}-{FeatureKey}";
    public string Action => "DISABLE";
}
```

````

## Audit Logging Configuration

### Provider Configuration (appsettings.json)
```json
{
  "AuditLogging": {
    "Provider": "Database", // "Database", "AzureInsights", "Elasticsearch", "Hybrid"
    "Providers": {
      "Database": {
        "ConnectionString": "connection-string",
        "TableName": "AuditLog",
        "BatchSize": 100,
        "FlushInterval": "00:00:30"
      },
      "AzureInsights": {
        "InstrumentationKey": "your-key",
        "CustomEventName": "AuditLog"
      },
      "Elasticsearch": {
        "Url": "https://your-elasticsearch-url",
        "IndexPrefix": "audit-log",
        "Username": "username",
        "Password": "password"
      }
    },
    "EnabledEntityTypes": ["TenantFeature", "User", "Tenant"],
    "RetentionDays": 2555, // 7 years
    "EnableMetadataCapture": true
  }
}
````

### Service Registration

```csharp
// Startup.cs or Program.cs
services.Configure<AuditLoggingOptions>(configuration.GetSection("AuditLogging"));

// Register audit providers
services.AddScoped<DatabaseAuditProvider>();
services.AddScoped<AzureInsightsAuditProvider>();
services.AddScoped<ElasticsearchAuditProvider>();

// Register audit service with provider factory
services.AddScoped<IAuditProviderFactory, AuditProviderFactory>();
services.AddScoped<IAuditService, AuditService>();

// Register middleware
app.UseMiddleware<AuditMiddleware>();
```

### Hybrid Provider Example

```csharp
public class HybridAuditProvider : IAuditProvider
{
    private readonly DatabaseAuditProvider _databaseProvider;
    private readonly AzureInsightsAuditProvider _insightsProvider;

    public async Task WriteAuditAsync(AuditEntry entry)
    {
        // Write to database for compliance
        await _databaseProvider.WriteAuditAsync(entry);

        // Send to Azure Insights for real-time monitoring
        await _insightsProvider.WriteAuditAsync(entry);
    }

    public async Task<List<AuditEntry>> ReadAuditAsync(AuditQuery query)
    {
        // Read from database for historical data
        return await _databaseProvider.ReadAuditAsync(query);
    }
}
```

## Pre-defined Features Configuration

### Free Features (Always Enabled)

```json
[
    {
        "featureKey": "dashboard_basic",
        "featureName": "Basic Dashboard",
        "category": "free",
        "menuPath": "tenantDashboard"
    },
    {
        "featureKey": "reports_basic",
        "featureName": "Basic Reports",
        "category": "free",
        "menuPath": "reports"
    },
    {
        "featureKey": "shop_properties_basic",
        "featureName": "Basic Shop Properties",
        "category": "free",
        "menuPath": "shopKPI.shopProperties"
    }
]
```

### Paid Features (Disabled by Default)

```json
[
    {
        "featureKey": "shop_kpi_advanced",
        "featureName": "Advanced Shop KPI & Analytics",
        "category": "paid",
        "menuPath": "shopKPI"
    },
    {
        "featureKey": "parts_management_full",
        "featureName": "Full Parts Management",
        "category": "paid",
        "menuPath": "partsManagement"
    },
    {
        "featureKey": "accounting_advanced",
        "featureName": "Advanced Accounting Features",
        "category": "paid",
        "menuPath": "accounting"
    },
    {
        "featureKey": "subscriptions_management",
        "featureName": "Subscription Management",
        "category": "paid",
        "menuPath": "subscriptions"
    },
    {
        "featureKey": "reports_powerbi",
        "featureName": "Power BI Reports",
        "category": "paid",
        "menuPath": "reports"
    }
]
```

## Security Considerations

1. **Authorization Checks**: Every feature-gated endpoint must verify user's feature access
2. **SQL Injection Prevention**: Use parameterized queries for all database operations
3. **Rate Limiting**: Apply rate limits to feature management endpoints
4. **Audit Logging**: Complete audit trail using generic middleware with configurable providers (Database, Azure Insights, Elasticsearch)
5. **Role Validation**: Ensure only CS-Admin can modify tenant features

## Performance Considerations

1. **Database Indexing**: Create indexes on frequently queried columns
2. **Caching**: Implement Redis caching for feature lookups
3. **Batch Operations**: Support bulk feature updates to reduce API calls
4. **Lazy Loading**: Load features only when needed
5. **Connection Pooling**: Use connection pooling for database operations

## Migration Strategy

1. **Phase 1**: Create database schema and base API endpoints
2. **Phase 2**: Implement feature service layer and caching
3. **Phase 3**: Add authentication/authorization middleware
4. **Phase 4**: Migrate existing navigation logic to use feature toggles
5. **Phase 5**: Add audit logging and reporting features

## Testing Requirements

1. **Unit Tests**: Test all service layer methods
2. **Integration Tests**: Test API endpoints with different role combinations
3. **Performance Tests**: Load test feature lookup operations
4. **Security Tests**: Verify unauthorized access is properly blocked
5. **End-to-End Tests**: Test complete feature toggle workflows

## Documentation Deliverables

1. API documentation (Swagger/OpenAPI)
2. Database schema documentation
3. Service layer documentation
4. Integration guide for frontend
5. Deployment and configuration guide

This design provides a robust, scalable foundation for implementing feature toggles while maintaining security, performance, and auditability requirements.

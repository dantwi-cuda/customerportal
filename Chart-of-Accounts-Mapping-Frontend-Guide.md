# Chart of Accounts Mapping - React Frontend Implementation Guide

## Overview

This guide provides React frontend developers with everything needed to implement the Chart of Accounts mapping functionality. The system allows users to map shop-specific chart of accounts to master chart of accounts, either manually or through automated matching.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Frontend Components Structure](#frontend-components-structure)
5. [Implementation Examples](#implementation-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

## Core Concepts

### Matching Status Types

- **"Not Matched"** - Shop account has no mappings to master accounts
- **"Pending Confirmation"** - Shop account has potential matches awaiting user review
- **"Confirmed"** - Shop account has been successfully mapped to a master account
- **"Rejected"** - Shop account mapping was rejected by user
- **"Superseded"** - Previous mapping was replaced by a new confirmed mapping

### Account Types

- **Shop Accounts** - Specific to individual shops, need to be mapped
- **Master Accounts** - Program-level accounts that shop accounts map to

### Matching Methods

- **"Manual"** - User-created mappings
- **"Auto_Exact"** - Automated exact matches
- **"Auto_Subset"** - Automated substring matches
- **"Auto_Fuzzy"** - Automated fuzzy matching

## API Endpoints

This section provides all endpoints needed for Chart of Accounts mapping operations, organized by functional area.

### Core Data Retrieval

#### 1. Get Shop Chart of Accounts with Matching Status

**Primary endpoint for displaying shop accounts with their mapping status**

```typescript
GET /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts

Query Parameters:
- searchTerm?: string
- matchingStatus?: string ("Not Matched" | "Pending Confirmation" | "Confirmed" | "Rejected")
- pageNumber?: number (default: 1)
- pageSize?: number (default: 20)
- sortBy?: string
- sortDirection?: "asc" | "desc"

Response: ShopChartOfAccountResponseDto
```

#### 2. Get Master Chart of Accounts

**For selecting master accounts during manual matching**

```typescript
GET /api/Accounting/programs/{programId}/master-chart-of-accounts

Query Parameters:
- searchTerm?: string
- pageNumber?: number
- pageSize?: number
- sortBy?: string
- sortDirection?: "asc" | "desc"

Response: ChartOfAccountResponseDto
```

#### 3. Get Unmatched Shop Accounts

**Quick view of accounts that need mapping**

```typescript
GET /api/Accounting/shops/{shopId}/programs/{programId}/unmatched-accounts

Response: ChartOfAccountDto[]
```

### Matching Operations

#### 4. Perform Automatic Matching

**Initiate AI-powered matching process**

```typescript
POST /api/Accounting/account-matchings/auto-match

Body: {
  shopID?: number,        // Optional: specific shop, omit for all shops in program
  programID: number,
  minConfidence: number,  // 0.0 to 1.0, default 0.3
  reviewMode: boolean     // true = pending review, false = auto-confirm
}

Response: AutoMatchResultDto
```

#### 5. Create Manual Match

**Create user-defined mappings with optional immediate confirmation**

```typescript
POST /api/Accounting/account-matchings/manual

Body: {
  shopChartOfAccountID: number,
  masterChartOfAccountID: number,
  matchingConfidence: number,      // 0.0 to 1.0, suggest 0.8 for manual
  matchingMethod: "Manual",
  matchingDetails?: string,        // Optional user notes
  matchingStatus?: "Pending" | "Confirmed"  // default: "Pending"
}

Response: AccountMatchingDto
```

#### 6. Confirm/Reject Matches

**Approve or reject pending matches (supports bulk operations)**

```typescript
POST /api/Accounting/account-matchings/confirm

Body: {
  matchingIDs: number[],           // Array supports bulk operations
  action: "Confirm" | "Reject"
}

Response: { message: string }
```

### Monitoring and Analytics

#### 7. Get Matching Statistics

**Dashboard metrics for matching progress**

```typescript
GET /
  api /
  Accounting /
  shops /
  { shopId } /
  programs /
  { programId } /
  matching -
  statistics;

Response: AutoMatchStatisticsDto;
```

#### 8. Get Pending Matches

**List matches awaiting user review**

```typescript
GET /api/Accounting/account-matchings/pending

Query Parameters:
- shopId?: number
- programId?: number

Response: AccountMatchingDto[]
```

#### 9. Get All Account Matchings

**Comprehensive matching history with filtering**

```typescript
GET /api/Accounting/account-matchings

Query Parameters:
- shopID?: number
- programID?: number
- matchingStatus?: string
- matchingMethod?: string
- minConfidence?: number
- maxConfidence?: number
- searchTerm?: string
- pageNumber?: number (default: 1)
- pageSize?: number (default: 20)

Response: AccountMatchingResponseDto
```

### Individual Account Operations

#### 10. Get Specific Chart of Account

**Detailed view of single account**

```typescript
GET / api / Accounting / chart - of - accounts / { id };

Response: ChartOfAccountDto;
```

#### 11. Update Chart of Account

**Modify account details**

```typescript
PUT / api / Accounting / chart - of - accounts / { id };

Body: UpdateChartOfAccountDto;

Response: ChartOfAccountDto;
```

### Bulk Operations

#### 12. Import Shop Chart of Accounts

**Bulk creation of shop accounts**

```typescript
POST /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts/import

Body: CreateChartOfAccountDto[]

Response: { message: string }
```

#### 13. Stage Excel Import

**Upload and preview Excel file before import**

```typescript
POST /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts/stage-excel

Body: FormData {
  file: File,                    // Excel file
  sheetName?: string            // Optional sheet name
}

Response: StagedDataResponseDto
```

#### 14. Apply Column Mappings and Import

**Map Excel columns to database fields and import**

```typescript
POST /api/Accounting/chart-of-accounts/apply-mappings-and-import/{jobId}/{programId}

Body: ColumnMappingDto[]

Response: CombinedImportResponseDto
```

## Complete Workflow Endpoint Mapping

### Initial Page Load Workflow

1. **Load Shop Accounts with Status**

   ```typescript
   GET /
     api /
     Accounting /
     shops /
     { shopId } /
     programs /
     { programId } /
     chart -
     of -
     accounts;
   ```

2. **Get Statistics for Dashboard**

   ```typescript
   GET /
     api /
     Accounting /
     shops /
     { shopId } /
     programs /
     { programId } /
     matching -
     statistics;
   ```

3. **Load Pending Matches Count**
   ```typescript
   GET /api/Accounting/account-matchings/pending?shopId={shopId}&programId={programId}
   ```

### Auto-Matching Workflow

1. **Start Auto-Matching**

   ```typescript
   POST / api / Accounting / account - matchings / auto - match;
   ```

2. **Refresh Data After Auto-Match**
   ```typescript
   GET /
     api /
     Accounting /
     shops /
     { shopId } /
     programs /
     { programId } /
     chart -
     of -
     accounts;
   GET /
     api /
     Accounting /
     shops /
     { shopId } /
     programs /
     { programId } /
     matching -
     statistics;
   ```

### Manual Matching Workflow

1. **Search Master Accounts**

   ```typescript
   GET /api/Accounting/programs/{programId}/master-chart-of-accounts?searchTerm={term}
   ```

2. **Create Manual Match**

   ```typescript
   POST / api / Accounting / account - matchings / manual;
   ```

3. **Refresh Account Data**
   ```typescript
   GET /
     api /
     Accounting /
     shops /
     { shopId } /
     programs /
     { programId } /
     chart -
     of -
     accounts;
   ```

### Confirmation Workflow

1. **Confirm Single or Multiple Matches**

   ```typescript
   POST / api / Accounting / account - matchings / confirm;
   ```

2. **Refresh Account Data**
   ```typescript
   GET /
     api /
     Accounting /
     shops /
     { shopId } /
     programs /
     { programId } /
     chart -
     of -
     accounts;
   GET /
     api /
     Accounting /
     shops /
     { shopId } /
     programs /
     { programId } /
     matching -
     statistics;
   ```

### Search and Filter Workflow

1. **Filter by Status**

   ```typescript
   GET /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts?matchingStatus={status}
   ```

2. **Search Accounts**

   ```typescript
   GET /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts?searchTerm={term}
   ```

3. **Paginated Results**
   ```typescript
   GET /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts?pageNumber={page}&pageSize={size}
   ```

### Bulk Import Workflow

1. **Upload Excel File**

   ```typescript
   POST /
     api /
     Accounting /
     shops /
     { shopId } /
     programs /
     { programId } /
     chart -
     of -
     accounts / stage -
     excel;
   ```

2. **Preview Staged Data**

   ```typescript
   GET / api / Accounting / chart - of - accounts / staged - data / { jobId };
   ```

3. **Get Available Mapping Fields**

   ```typescript
   GET / api / Accounting / chart - of - accounts / mapping - fields;
   ```

4. **Apply Mappings and Import**

   ```typescript
   POST /api/Accounting/chart-of-accounts/apply-mappings-and-import/{jobId}/{programId}
   ```

5. **Trigger Auto-Match on New Accounts**
   ```typescript
   POST / api / Accounting / account - matchings / auto - match;
   ```

## Common Operation Sequences

### Complete Matching Process from Start to Finish

#### Scenario 1: New Shop Setup with Auto-Matching

```typescript
// 1. Initial data load
const loadInitialData = async () => {
  // Get all shop accounts
  const accounts = await fetch(
    `/api/Accounting/shops/${shopId}/programs/${programId}/chart-of-accounts`
  );

  // Get current statistics
  const stats = await fetch(
    `/api/Accounting/shops/${shopId}/programs/${programId}/matching-statistics`
  );

  // Check for any existing pending matches
  const pending = await fetch(
    `/api/Accounting/account-matchings/pending?shopId=${shopId}&programId=${programId}`
  );

  return { accounts, stats, pending };
};

// 2. Run auto-matching
const runAutoMatching = async () => {
  const result = await fetch("/api/Accounting/account-matchings/auto-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shopID: shopId,
      programID: programId,
      minConfidence: 0.7,
      reviewMode: true, // Create pending matches for review
    }),
  });

  // Refresh data after auto-matching
  await loadInitialData();

  return result;
};

// 3. Review and confirm high-confidence matches
const reviewPendingMatches = async () => {
  const pending = await fetch(
    `/api/Accounting/account-matchings/pending?shopId=${shopId}&programId=${programId}`
  );
  const highConfidenceMatches = pending.filter(
    (match) => match.matchingConfidence >= 0.8
  );

  if (highConfidenceMatches.length > 0) {
    await fetch("/api/Accounting/account-matchings/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchingIDs: highConfidenceMatches.map((m) => m.matchingID),
        action: "Confirm",
      }),
    });
  }
};
```

#### Scenario 2: Manual Matching for Unmatched Accounts

```typescript
// 1. Get unmatched accounts
const getUnmatchedAccounts = async () => {
  return await fetch(
    `/api/Accounting/shops/${shopId}/programs/${programId}/unmatched-accounts`
  );
};

// 2. Search for master accounts
const searchMasterAccounts = async (searchTerm: string) => {
  return await fetch(
    `/api/Accounting/programs/${programId}/master-chart-of-accounts?searchTerm=${encodeURIComponent(
      searchTerm
    )}`
  );
};

// 3. Create manual match with immediate confirmation
const createConfirmedMatch = async (
  shopAccountId: number,
  masterAccountId: number
) => {
  return await fetch("/api/Accounting/account-matchings/manual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shopChartOfAccountID: shopAccountId,
      masterChartOfAccountID: masterAccountId,
      matchingConfidence: 0.8,
      matchingMethod: "Manual",
      matchingStatus: "Confirmed", // Skip pending status
    }),
  });
};

// 4. Bulk create multiple manual matches
const createBulkMatches = async (
  matches: Array<{ shopId: number; masterId: number }>
) => {
  const promises = matches.map((match) =>
    createConfirmedMatch(match.shopId, match.masterId)
  );

  return await Promise.all(promises);
};
```

#### Scenario 3: Reviewing and Managing Existing Matches

```typescript
// 1. Get all matches with filtering
const getAllMatches = async (filters: any) => {
  const params = new URLSearchParams(filters);
  return await fetch(`/api/Accounting/account-matchings?${params}`);
};

// 2. Filter matches by confidence range
const getLowConfidenceMatches = async () => {
  return await fetch(
    `/api/Accounting/account-matchings?maxConfidence=0.6&matchingStatus=Pending Confirmation`
  );
};

// 3. Bulk reject low confidence matches
const rejectLowConfidenceMatches = async () => {
  const lowConfidenceMatches = await getLowConfidenceMatches();

  if (lowConfidenceMatches.length > 0) {
    await fetch("/api/Accounting/account-matchings/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchingIDs: lowConfidenceMatches.map((m) => m.matchingID),
        action: "Reject",
      }),
    });
  }
};

// 4. Re-run auto-matching after rejections
const reRunAutoMatching = async () => {
  await fetch("/api/Accounting/account-matchings/auto-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shopID: shopId,
      programID: programId,
      minConfidence: 0.5, // Lower threshold for second pass
      reviewMode: true,
    }),
  });
};
```

#### Scenario 4: Excel Import with Auto-Matching

```typescript
// 1. Upload Excel file
const uploadExcelFile = async (file: File, sheetName?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (sheetName) formData.append("sheetName", sheetName);

  return await fetch(
    `/api/Accounting/shops/${shopId}/programs/${programId}/chart-of-accounts/stage-excel`,
    {
      method: "POST",
      body: formData,
    }
  );
};

// 2. Get available mapping fields
const getMappingFields = async () => {
  return await fetch("/api/Accounting/chart-of-accounts/mapping-fields");
};

// 3. Apply mappings and import
const applyMappingsAndImport = async (jobId: number, mappings: any[]) => {
  return await fetch(
    `/api/Accounting/chart-of-accounts/apply-mappings-and-import/${jobId}/${programId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mappings),
    }
  );
};

// 4. Auto-match newly imported accounts
const autoMatchNewAccounts = async () => {
  return await fetch("/api/Accounting/account-matchings/auto-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shopID: shopId,
      programID: programId,
      minConfidence: 0.6,
      reviewMode: false, // Auto-confirm high confidence matches
    }),
  });
};

// Complete import workflow
const completeImportWorkflow = async (file: File, mappings: any[]) => {
  try {
    // Stage file
    const stageResult = await uploadExcelFile(file);
    const jobId = stageResult.jobId;

    // Apply mappings and import
    await applyMappingsAndImport(jobId, mappings);

    // Auto-match new accounts
    await autoMatchNewAccounts();

    // Refresh data
    await loadInitialData();
  } catch (error) {
    console.error("Import workflow failed:", error);
    throw error;
  }
};
```

### Error Handling Patterns

#### Network Error Recovery

```typescript
const apiCall = async (url: string, options?: RequestInit, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login
          window.location.href = "/login";
          return;
        }

        if (response.status >= 500 && i < retries - 1) {
          // Retry on server errors
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }

        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

#### Conflict Resolution

```typescript
const handleMatchingConflict = async (
  shopAccountId: number,
  masterAccountId: number
) => {
  try {
    await fetch("/api/Accounting/account-matchings/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopChartOfAccountID: shopAccountId,
        masterChartOfAccountID: masterAccountId,
        matchingConfidence: 0.8,
        matchingMethod: "Manual",
      }),
    });
  } catch (error) {
    if (error.message.includes("already matched")) {
      // Show user confirmation dialog
      const shouldOverride = confirm(
        "This account is already matched. Create new match anyway?"
      );

      if (shouldOverride) {
        // First get existing match and reject it
        const existingMatches = await fetch(
          `/api/Accounting/account-matchings?shopID=${shopAccountId}`
        );

        if (existingMatches.length > 0) {
          await fetch("/api/Accounting/account-matchings/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              matchingIDs: existingMatches.map((m) => m.matchingID),
              action: "Reject",
            }),
          });

          // Now create new match
          await fetch("/api/Accounting/account-matchings/manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shopChartOfAccountID: shopAccountId,
              masterChartOfAccountID: masterAccountId,
              matchingConfidence: 0.8,
              matchingMethod: "Manual",
              matchingStatus: "Confirmed",
            }),
          });
        }
      }
    } else {
      throw error;
    }
  }
};
```

### Real-time Updates Pattern

```typescript
// Polling for updates during long-running operations
const pollForUpdates = async (operation: string, interval = 5000) => {
  const pollInterval = setInterval(async () => {
    try {
      const stats = await fetch(
        `/api/Accounting/shops/${shopId}/programs/${programId}/matching-statistics`
      );

      // Update UI with current stats
      updateMatchingProgress(stats);

      // Check if operation completed
      if (stats.matchRate === 1.0 || operation === "completed") {
        clearInterval(pollInterval);
        await loadInitialData(); // Final refresh
      }
    } catch (error) {
      console.error("Polling error:", error);
      clearInterval(pollInterval);
    }
  }, interval);

  return pollInterval;
};

// Use during auto-matching
const runAutoMatchingWithProgress = async () => {
  const pollInterval = pollForUpdates("auto-matching");

  try {
    await fetch("/api/Accounting/account-matchings/auto-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopID: shopId,
        programID: programId,
        minConfidence: 0.7,
        reviewMode: true,
      }),
    });
  } finally {
    clearInterval(pollInterval);
  }
};
```

## API Testing and Validation

### Quick API Test Suite

Use these cURL commands or Postman requests to test the API endpoints:

#### 1. Test Authentication

```bash
curl -X GET "https://your-api-domain/api/Accounting/shops/1/programs/1/chart-of-accounts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### 2. Test Auto-Matching

```bash
curl -X POST "https://your-api-domain/api/Accounting/account-matchings/auto-match" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopID": 1,
    "programID": 1,
    "minConfidence": 0.7,
    "reviewMode": true
  }'
```

#### 3. Test Manual Match Creation

```bash
curl -X POST "https://your-api-domain/api/Accounting/account-matchings/manual" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopChartOfAccountID": 123,
    "masterChartOfAccountID": 456,
    "matchingConfidence": 0.8,
    "matchingMethod": "Manual",
    "matchingStatus": "Pending"
  }'
```

#### 4. Test Bulk Confirmation

```bash
curl -X POST "https://your-api-domain/api/Accounting/account-matchings/confirm" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchingIDs": [1, 2, 3],
    "action": "Confirm"
  }'
```

### API Endpoint Summary Table

| Operation                  | Method | Endpoint                                                                            | Primary Use Case         | Response Type                   |
| -------------------------- | ------ | ----------------------------------------------------------------------------------- | ------------------------ | ------------------------------- |
| **Data Retrieval**         |
| Get Shop Accounts          | GET    | `/api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts`             | Main data view           | `ShopChartOfAccountResponseDto` |
| Get Master Accounts        | GET    | `/api/Accounting/programs/{programId}/master-chart-of-accounts`                     | Master account selection | `ChartOfAccountResponseDto`     |
| Get Unmatched Accounts     | GET    | `/api/Accounting/shops/{shopId}/programs/{programId}/unmatched-accounts`            | Quick unmatched view     | `ChartOfAccountDto[]`           |
| Get Single Account         | GET    | `/api/Accounting/chart-of-accounts/{id}`                                            | Account details          | `ChartOfAccountDto`             |
| **Matching Operations**    |
| Auto-Match                 | POST   | `/api/Accounting/account-matchings/auto-match`                                      | AI matching              | `AutoMatchResultDto`            |
| Manual Match               | POST   | `/api/Accounting/account-matchings/manual`                                          | User-created match       | `AccountMatchingDto`            |
| Confirm/Reject             | POST   | `/api/Accounting/account-matchings/confirm`                                         | Approve/deny matches     | `{ message: string }`           |
| **Analytics & Monitoring** |
| Get Statistics             | GET    | `/api/Accounting/shops/{shopId}/programs/{programId}/matching-statistics`           | Progress tracking        | `AutoMatchStatisticsDto`        |
| Get Pending Matches        | GET    | `/api/Accounting/account-matchings/pending`                                         | Review queue             | `AccountMatchingDto[]`          |
| Get All Matches            | GET    | `/api/Accounting/account-matchings`                                                 | Complete history         | `AccountMatchingResponseDto`    |
| **Bulk Operations**        |
| Import Accounts            | POST   | `/api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts/import`      | Bulk account creation    | `{ message: string }`           |
| Stage Excel                | POST   | `/api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts/stage-excel` | File upload prep         | `StagedDataResponseDto`         |
| Apply Mappings             | POST   | `/api/Accounting/chart-of-accounts/apply-mappings-and-import/{jobId}/{programId}`   | Excel import             | `CombinedImportResponseDto`     |
| Get Mapping Fields         | GET    | `/api/Accounting/chart-of-accounts/mapping-fields`                                  | Column mapping options   | `MappingTargetFieldDto[]`       |
| **Account Management**     |
| Update Account             | PUT    | `/api/Accounting/chart-of-accounts/{id}`                                            | Modify account           | `ChartOfAccountDto`             |
| Delete Account             | DELETE | `/api/Accounting/chart-of-accounts/{id}`                                            | Remove account           | `204 No Content`                |

### Required Headers for All Requests

```typescript
const defaultHeaders = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};
```

### Common Query Parameter Patterns

#### Pagination

```typescript
?pageNumber=1&pageSize=20
```

#### Filtering

```typescript
?matchingStatus=Pending Confirmation&minConfidence=0.7
```

#### Search

```typescript
?searchTerm=cash&sortBy=accountName&sortDirection=asc
```

#### Multiple Filters

```typescript
?shopID=1&programID=1&matchingStatus=Confirmed&pageNumber=2&pageSize=50
```

## Data Models

### ShopChartOfAccountDto

```typescript
interface ShopChartOfAccountDto {
  chartOfAccountsID: number;
  programID: number;
  shopID?: number;
  accountName?: string;
  accountNumber?: string;
  accountDescription?: string;
  rowCreatedDate?: string;
  rowCreatedBy?: string;
  effectiveDate?: string;
  expiryDate?: string;
  rowModifiedBy?: string;
  rowModifiedDate?: string;
  isMapped: boolean;
  masterChartOfAccountID?: number;
  matchingConfidence?: number;
  matchingMethod?: string;
  isActive: boolean;
  isMasterAccount: boolean;

  // Navigation properties
  programName?: string;
  shopName?: string;
  masterAccountName?: string;

  // Enhanced matching information
  matchingStatus:
    | "Not Matched"
    | "Pending Confirmation"
    | "Confirmed"
    | "Rejected";
  potentialMatches: ChartOfAccountMatchDto[];
  confirmedMatch?: ChartOfAccountMatchDto;
}
```

### ChartOfAccountMatchDto

```typescript
interface ChartOfAccountMatchDto {
  matchingID: number;
  masterChartOfAccountID: number;
  masterAccountName?: string;
  masterAccountNumber?: string;
  masterAccountDescription?: string;
  matchingConfidence: number;
  matchingMethod: string;
  matchingStatus: string;
  matchingDetails?: string;
  createdDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
}
```

### API Response Types

```typescript
interface ShopChartOfAccountResponseDto {
  chartOfAccounts: ShopChartOfAccountDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

interface AutoMatchStatisticsDto {
  totalShopAccounts: number;
  matchedAccounts: number;
  matchRate: number;
  highConfidenceMatches: number;
  subsetMatches: number;
  averageConfidence: number;
}
```

## Frontend Components Structure

### Recommended Component Hierarchy

```
ChartOfAccountsMapping/
├── index.tsx                           // Main container component
├── components/
│   ├── ShopAccountsList.tsx            // Display shop accounts with status
│   ├── UnmatchedAccountsView.tsx       // Show only unmapped accounts
│   ├── MatchingCard.tsx                // Individual account card
│   ├── PotentialMatchesList.tsx        // Show potential matches
│   ├── MasterAccountSelector.tsx       // Select master account
│   ├── AutoMatchControls.tsx           // Auto-matching interface
│   ├── MatchingStatistics.tsx          // Display statistics
│   ├── ConfirmationDialog.tsx          // Confirm/reject actions
│   └── Filters/
│       ├── StatusFilter.tsx            // Filter by matching status
│       ├── SearchFilter.tsx            // Search functionality
│       └── ConfidenceFilter.tsx        // Filter by confidence
├── hooks/
│   ├── useShopAccounts.tsx            // Fetch shop accounts
│   ├── useAutoMatching.tsx            // Handle auto-matching
│   ├── useManualMatching.tsx          // Handle manual matching
│   └── useMatchingActions.tsx         // Confirm/reject actions
├── utils/
│   ├── matchingHelpers.ts             // Utility functions
│   └── constants.ts                   // Status constants
└── types/
    └── index.ts                       // TypeScript interfaces
```

## Implementation Examples

### 1. Main Container Component

```typescript
// ChartOfAccountsMapping/index.tsx
import React, { useState, useEffect } from "react";
import { ShopAccountsList } from "./components/ShopAccountsList";
import { AutoMatchControls } from "./components/AutoMatchControls";
import { MatchingStatistics } from "./components/MatchingStatistics";
import { useShopAccounts } from "./hooks/useShopAccounts";
import { StatusFilter } from "./components/Filters/StatusFilter";

interface Props {
  shopId: number;
  programId: number;
}

export const ChartOfAccountsMapping: React.FC<Props> = ({
  shopId,
  programId,
}) => {
  const [filters, setFilters] = useState({
    matchingStatus: "",
    searchTerm: "",
    pageNumber: 1,
    pageSize: 20,
  });

  const { accounts, loading, error, totalCount, refetch } = useShopAccounts(
    shopId,
    programId,
    filters
  );

  return (
    <div className="chart-of-accounts-mapping">
      <div className="header">
        <h1>Chart of Accounts Mapping</h1>
        <MatchingStatistics shopId={shopId} programId={programId} />
      </div>

      <div className="controls">
        <AutoMatchControls
          shopId={shopId}
          programId={programId}
          onMatchingComplete={refetch}
        />

        <div className="filters">
          <StatusFilter
            value={filters.matchingStatus}
            onChange={(status) =>
              setFilters((prev) => ({ ...prev, matchingStatus: status }))
            }
          />
          {/* Add more filters */}
        </div>
      </div>

      <ShopAccountsList
        accounts={accounts}
        loading={loading}
        error={error}
        onAccountUpdate={refetch}
        shopId={shopId}
        programId={programId}
      />
    </div>
  );
};
```

### 2. Shop Accounts List Component

```typescript
// components/ShopAccountsList.tsx
import React from "react";
import { MatchingCard } from "./MatchingCard";
import { ShopChartOfAccountDto } from "../types";

interface Props {
  accounts: ShopChartOfAccountDto[];
  loading: boolean;
  error?: string;
  onAccountUpdate: () => void;
  shopId: number;
  programId: number;
}

export const ShopAccountsList: React.FC<Props> = ({
  accounts,
  loading,
  error,
  onAccountUpdate,
  shopId,
  programId,
}) => {
  if (loading) return <div>Loading accounts...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const groupedAccounts = {
    notMatched: accounts.filter((acc) => acc.matchingStatus === "Not Matched"),
    pending: accounts.filter(
      (acc) => acc.matchingStatus === "Pending Confirmation"
    ),
    confirmed: accounts.filter((acc) => acc.matchingStatus === "Confirmed"),
    rejected: accounts.filter((acc) => acc.matchingStatus === "Rejected"),
  };

  return (
    <div className="shop-accounts-list">
      {Object.entries(groupedAccounts).map(([status, accountList]) => (
        <div key={status} className={`account-group ${status}`}>
          <h3>
            {status.replace(/([A-Z])/g, " $1").trim()} ({accountList.length})
          </h3>
          <div className="accounts-grid">
            {accountList.map((account) => (
              <MatchingCard
                key={account.chartOfAccountsID}
                account={account}
                onUpdate={onAccountUpdate}
                shopId={shopId}
                programId={programId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 3. Individual Account Matching Card

```typescript
// components/MatchingCard.tsx
import React, { useState } from "react";
import { PotentialMatchesList } from "./PotentialMatchesList";
import { MasterAccountSelector } from "./MasterAccountSelector";
import { useManualMatching } from "../hooks/useManualMatching";
import { useMatchingActions } from "../hooks/useMatchingActions";
import { ShopChartOfAccountDto } from "../types";

interface Props {
  account: ShopChartOfAccountDto;
  onUpdate: () => void;
  shopId: number;
  programId: number;
}

export const MatchingCard: React.FC<Props> = ({
  account,
  onUpdate,
  shopId,
  programId,
}) => {
  const [showMasterSelector, setShowMasterSelector] = useState(false);
  const { createManualMatch } = useManualMatching();
  const { confirmMatches, rejectMatches } = useMatchingActions();

  const getStatusColor = (status: string) => {
    const colors = {
      "Not Matched": "bg-gray-100 text-gray-800",
      "Pending Confirmation": "bg-yellow-100 text-yellow-800",
      Confirmed: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleManualMatch = async (
    masterAccountId: number,
    confidence: number = 0.8
  ) => {
    try {
      await createManualMatch({
        shopChartOfAccountID: account.chartOfAccountsID,
        masterChartOfAccountID: masterAccountId,
        matchingConfidence: confidence,
        matchingMethod: "Manual",
        matchingStatus: "Pending", // or 'Confirmed' for immediate confirmation
      });
      onUpdate();
      setShowMasterSelector(false);
    } catch (error) {
      console.error("Error creating manual match:", error);
    }
  };

  const handleConfirmMatch = async (matchingId: number) => {
    try {
      await confirmMatches([matchingId]);
      onUpdate();
    } catch (error) {
      console.error("Error confirming match:", error);
    }
  };

  const handleRejectMatch = async (matchingId: number) => {
    try {
      await rejectMatches([matchingId]);
      onUpdate();
    } catch (error) {
      console.error("Error rejecting match:", error);
    }
  };

  return (
    <div className="matching-card border rounded-lg p-4 mb-4">
      {/* Account Information */}
      <div className="account-header">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold">{account.accountName}</h4>
            <p className="text-sm text-gray-600">{account.accountNumber}</p>
            <p className="text-xs text-gray-500">
              {account.accountDescription}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded text-xs ${getStatusColor(
              account.matchingStatus
            )}`}
          >
            {account.matchingStatus}
          </span>
        </div>
      </div>

      {/* Confirmed Match Display */}
      {account.confirmedMatch && (
        <div className="confirmed-match mt-3 p-3 bg-green-50 rounded border-l-4 border-green-400">
          <h5 className="font-medium text-green-800">Mapped to:</h5>
          <p className="text-sm">{account.confirmedMatch.masterAccountName}</p>
          <p className="text-xs text-green-600">
            Confidence:{" "}
            {(account.confirmedMatch.matchingConfidence * 100).toFixed(1)}%
          </p>
        </div>
      )}

      {/* Potential Matches */}
      {account.potentialMatches.length > 0 && (
        <PotentialMatchesList
          matches={account.potentialMatches}
          onConfirm={handleConfirmMatch}
          onReject={handleRejectMatch}
        />
      )}

      {/* Actions */}
      <div className="actions mt-4 flex gap-2">
        {account.matchingStatus === "Not Matched" && (
          <button
            onClick={() => setShowMasterSelector(!showMasterSelector)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Manual Match
          </button>
        )}

        {account.matchingStatus === "Confirmed" && (
          <button
            onClick={() => {
              /* Show unmatch option */
            }}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Remove Mapping
          </button>
        )}
      </div>

      {/* Master Account Selector */}
      {showMasterSelector && (
        <MasterAccountSelector
          programId={programId}
          onSelect={handleManualMatch}
          onCancel={() => setShowMasterSelector(false)}
        />
      )}
    </div>
  );
};
```

### 4. Potential Matches List

```typescript
// components/PotentialMatchesList.tsx
import React from "react";
import { ChartOfAccountMatchDto } from "../types";

interface Props {
  matches: ChartOfAccountMatchDto[];
  onConfirm: (matchingId: number) => void;
  onReject: (matchingId: number) => void;
}

export const PotentialMatchesList: React.FC<Props> = ({
  matches,
  onConfirm,
  onReject,
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getMethodBadge = (method: string) => {
    const badges = {
      Auto_Exact: "bg-green-100 text-green-800",
      Auto_Subset: "bg-blue-100 text-blue-800",
      Auto_Fuzzy: "bg-purple-100 text-purple-800",
      Manual: "bg-gray-100 text-gray-800",
    };
    return badges[method] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="potential-matches mt-3">
      <h5 className="font-medium text-gray-700 mb-2">Potential Matches:</h5>
      <div className="space-y-2">
        {matches.map((match) => (
          <div
            key={match.matchingID}
            className="potential-match p-2 border rounded bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium">{match.masterAccountName}</p>
                <p className="text-sm text-gray-600">
                  {match.masterAccountNumber}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`font-medium ${getConfidenceColor(
                      match.matchingConfidence
                    )}`}
                  >
                    {(match.matchingConfidence * 100).toFixed(1)}%
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${getMethodBadge(
                      match.matchingMethod
                    )}`}
                  >
                    {match.matchingMethod.replace("Auto_", "")}
                  </span>
                </div>
                {match.matchingDetails && (
                  <p className="text-xs text-gray-500 mt-1">
                    {match.matchingDetails}
                  </p>
                )}
              </div>

              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => onConfirm(match.matchingID)}
                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  title="Confirm this match"
                >
                  ✓
                </button>
                <button
                  onClick={() => onReject(match.matchingID)}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  title="Reject this match"
                >
                  ✗
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 5. Auto-Matching Controls

```typescript
// components/AutoMatchControls.tsx
import React, { useState } from "react";
import { useAutoMatching } from "../hooks/useAutoMatching";

interface Props {
  shopId: number;
  programId: number;
  onMatchingComplete: () => void;
}

export const AutoMatchControls: React.FC<Props> = ({
  shopId,
  programId,
  onMatchingComplete,
}) => {
  const [minConfidence, setMinConfidence] = useState(0.7);
  const [reviewMode, setReviewMode] = useState(true);
  const { performAutoMatching, loading, error } = useAutoMatching();

  const handleAutoMatch = async () => {
    try {
      const result = await performAutoMatching({
        shopID: shopId,
        programID: programId,
        minConfidence,
        reviewMode,
      });

      // Show results summary
      alert(`Auto-matching completed:
        - ${result.statistics.highConfidenceMatches} high confidence matches
        - ${result.statistics.subsetMatches} subset matches
        - ${
          result.statistics.totalShopAccounts -
          result.statistics.matchedAccounts
        } remain unmatched`);

      onMatchingComplete();
    } catch (error) {
      console.error("Error performing auto-matching:", error);
    }
  };

  return (
    <div className="auto-match-controls p-4 border rounded-lg mb-4">
      <h3 className="font-semibold mb-3">Automatic Matching</h3>

      <div className="flex items-center gap-4 mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Confidence
          </label>
          <input
            type="range"
            min="0.3"
            max="1.0"
            step="0.1"
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-gray-600 ml-2">
            {(minConfidence * 100).toFixed(0)}%
          </span>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={reviewMode}
              onChange={(e) => setReviewMode(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Require manual review</span>
          </label>
        </div>
      </div>

      <button
        onClick={handleAutoMatch}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Start Auto-Matching"}
      </button>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
};
```

### 6. Custom Hooks

```typescript
// hooks/useShopAccounts.tsx
import { useState, useEffect } from "react";
import { ShopChartOfAccountDto, ShopChartOfAccountResponseDto } from "../types";

interface Filters {
  matchingStatus?: string;
  searchTerm?: string;
  pageNumber: number;
  pageSize: number;
}

export const useShopAccounts = (
  shopId: number,
  programId: number,
  filters: Filters
) => {
  const [accounts, setAccounts] = useState<ShopChartOfAccountDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(
        `/api/Accounting/shops/${shopId}/programs/${programId}/chart-of-accounts?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ShopChartOfAccountResponseDto = await response.json();
      setAccounts(data.chartOfAccounts);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [shopId, programId, filters]);

  return {
    accounts,
    loading,
    error,
    totalCount,
    refetch: fetchAccounts,
  };
};
```

```typescript
// hooks/useManualMatching.tsx
import { useState } from "react";

interface CreateMatchingRequest {
  shopChartOfAccountID: number;
  masterChartOfAccountID: number;
  matchingConfidence: number;
  matchingMethod: string;
  matchingDetails?: string;
  matchingStatus?: string;
}

export const useManualMatching = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createManualMatch = async (request: CreateMatchingRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/Accounting/account-matchings/manual", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create manual match";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createManualMatch,
    loading,
    error,
  };
};
```

```typescript
// hooks/useMatchingActions.tsx
import { useState } from "react";

export const useMatchingActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmMatches = async (matchingIDs: number[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/Accounting/account-matchings/confirm",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matchingIDs,
            action: "Confirm",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to confirm matches";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectMatches = async (matchingIDs: number[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/Accounting/account-matchings/confirm",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matchingIDs,
            action: "Reject",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reject matches";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    confirmMatches,
    rejectMatches,
    loading,
    error,
  };
};
```

## Error Handling

### Common HTTP Status Codes

- **200**: Success
- **400**: Bad Request (validation errors, missing required fields)
- **401**: Unauthorized (invalid or missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (shop, program, or account not found)
- **409**: Conflict (account already matched)
- **500**: Internal Server Error

### Error Response Format

```typescript
interface ErrorResponse {
  message: string;
  details?: string;
}
```

### Error Handling Example

```typescript
const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = "/login";
  } else if (error.response?.status === 403) {
    // Show permission denied message
    setError("You do not have permission to perform this action");
  } else if (error.response?.data?.message) {
    // Show API error message
    setError(error.response.data.message);
  } else {
    // Show generic error
    setError("An unexpected error occurred");
  }
};
```

## Best Practices

### 1. State Management

- Use React Query or SWR for server state management
- Implement optimistic updates for better UX
- Cache frequently accessed master accounts

### 2. Performance Optimization

- Implement virtual scrolling for large account lists
- Use debounced search to reduce API calls
- Lazy load potential matches when needed

### 3. User Experience

- Show loading states during API calls
- Provide clear feedback for all actions
- Use confidence scores to guide user decisions
- Group accounts by matching status for better organization

### 4. Accessibility

- Add proper ARIA labels for screen readers
- Ensure keyboard navigation works
- Use semantic HTML elements
- Provide alternative text for status indicators

### 5. Testing

- Mock API responses for unit tests
- Test error scenarios thoroughly
- Verify accessibility compliance
- Test with various confidence score scenarios

### 6. Security

- Always include authorization tokens
- Validate user permissions before showing sensitive data
- Sanitize user inputs
- Use HTTPS for all API communications

## Sample CSS Classes

```css
/* Status-based styling */
.matching-status-not-matched {
  @apply bg-gray-100 text-gray-800;
}
.matching-status-pending {
  @apply bg-yellow-100 text-yellow-800;
}
.matching-status-confirmed {
  @apply bg-green-100 text-green-800;
}
.matching-status-rejected {
  @apply bg-red-100 text-red-800;
}

/* Confidence-based styling */
.confidence-high {
  @apply text-green-600 font-semibold;
}
.confidence-medium {
  @apply text-yellow-600 font-medium;
}
.confidence-low {
  @apply text-red-600 font-normal;
}

/* Interactive elements */
.match-card:hover {
  @apply shadow-md border-blue-200;
}
.match-action-confirm:hover {
  @apply bg-green-600;
}
.match-action-reject:hover {
  @apply bg-red-600;
}
```

## Endpoint Call Sequences & Dependencies

### Critical Call Sequences

#### Page Load Sequence (Required Order)

```typescript
// 1. REQUIRED: Load shop accounts with matching data
GET /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts

// 2. PARALLEL: Load statistics for dashboard
GET /api/Accounting/shops/{shopId}/programs/{programId}/matching-statistics

// 3. PARALLEL: Check for pending matches
GET /api/Accounting/account-matchings/pending?shopId={shopId}&programId={programId}
```

#### Auto-Matching Sequence (Required Order)

```typescript
// 1. REQUIRED: Initiate auto-matching
POST /api/Accounting/account-matchings/auto-match
{
  "shopID": shopId,
  "programID": programId,
  "minConfidence": 0.7,
  "reviewMode": true
}

// 2. REQUIRED: Refresh data after auto-matching
GET /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts
GET /api/Accounting/shops/{shopId}/programs/{programId}/matching-statistics
```

#### Manual Matching Sequence

```typescript
// 1. OPTIONAL: Search master accounts if needed
GET /api/Accounting/programs/{programId}/master-chart-of-accounts?searchTerm={term}

// 2. REQUIRED: Create manual match
POST /api/Accounting/account-matchings/manual
{
  "shopChartOfAccountID": accountId,
  "masterChartOfAccountID": masterAccountId,
  "matchingConfidence": 0.8,
  "matchingMethod": "Manual",
  "matchingStatus": "Pending" // or "Confirmed"
}

// 3. REQUIRED: Refresh shop accounts to show updated status
GET /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts
```

#### Bulk Confirmation Sequence

```typescript
// 1. REQUIRED: Confirm/reject matches
POST /api/Accounting/account-matchings/confirm
{
  "matchingIDs": [1, 2, 3],
  "action": "Confirm" // or "Reject"
}

// 2. REQUIRED: Refresh data to show changes
GET /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts
GET /api/Accounting/shops/{shopId}/programs/{programId}/matching-statistics
```

#### Excel Import Complete Sequence

```typescript
// 1. REQUIRED: Upload file for staging
POST /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts/stage-excel
// FormData with file

// 2. OPTIONAL: Preview staged data
GET /api/Accounting/chart-of-accounts/staged-data/{jobId}

// 3. REQUIRED: Get mapping fields for column mapping
GET /api/Accounting/chart-of-accounts/mapping-fields

// 4. REQUIRED: Apply mappings and import
POST /api/Accounting/chart-of-accounts/apply-mappings-and-import/{jobId}/{programId}
// Column mappings array

// 5. RECOMMENDED: Auto-match newly imported accounts
POST /api/Accounting/account-matchings/auto-match
{
  "shopID": shopId,
  "programID": programId,
  "minConfidence": 0.6,
  "reviewMode": false
}

// 6. REQUIRED: Refresh all data
GET /api/Accounting/shops/{shopId}/programs/{programId}/chart-of-accounts
GET /api/Accounting/shops/{shopId}/programs/{programId}/matching-statistics
```

### Endpoint Dependencies Map

#### Core Dependencies

```
ShopId + ProgramId → All shop-specific endpoints
ProgramId → Master account endpoints
MatchingID → Match-specific operations
JobId → Excel import operations
```

#### Data Refresh Dependencies

```
After Auto-Match → Refresh: accounts, statistics
After Manual Match → Refresh: accounts
After Confirm/Reject → Refresh: accounts, statistics, pending
After Excel Import → Refresh: accounts, statistics
After Account Update → Refresh: accounts
```

### Required Parameters Reference

#### Route Parameters

```typescript
{
  shopId;
} // Integer - Shop identifier
{
  programId;
} // Integer - Program identifier
{
  id;
} // Integer - Chart of Account ID
{
  jobId;
} // Integer - Import job identifier
```

#### Common Query Parameters

```typescript
// Pagination (most GET endpoints)
pageNumber?: number = 1
pageSize?: number = 20

// Search (most GET endpoints)
searchTerm?: string

// Filtering
matchingStatus?: "Not Matched" | "Pending Confirmation" | "Confirmed" | "Rejected"
matchingMethod?: "Manual" | "Auto_Exact" | "Auto_Subset" | "Auto_Fuzzy"
minConfidence?: number  // 0.0 to 1.0
maxConfidence?: number  // 0.0 to 1.0

// Sorting
sortBy?: string
sortDirection?: "asc" | "desc"
```

### Error Recovery Sequences

#### When Auto-Match Fails

```typescript
try {
  await autoMatch();
} catch (error) {
  // Still refresh data to show current state
  await refreshData();
  // Show error to user
  showError(error.message);
}
```

#### When Manual Match Conflicts

```typescript
try {
  await createManualMatch(shopId, masterId);
} catch (error) {
  if (error.message.includes("already matched")) {
    // Get current matches to show conflict
    const existing = await getAccountMatchings({ shopID: shopId });
    showConflictDialog(existing);
  }
}
```

#### When Bulk Operations Partially Fail

```typescript
try {
  await confirmMultipleMatches(matchingIds);
} catch (error) {
  // Refresh to see which ones actually succeeded
  await refreshData();
  // Parse error to show specific failures
  showPartialFailureMessage(error);
}
```

### Performance Optimization Patterns

#### Batch Loading Pattern

```typescript
// Load data in parallel where possible
const [accounts, stats, pending] = await Promise.all([
  fetch(
    `/api/Accounting/shops/${shopId}/programs/${programId}/chart-of-accounts`
  ),
  fetch(
    `/api/Accounting/shops/${shopId}/programs/${programId}/matching-statistics`
  ),
  fetch(
    `/api/Accounting/account-matchings/pending?shopId=${shopId}&programId=${programId}`
  ),
]);
```

#### Conditional Loading Pattern

```typescript
// Only load master accounts when needed
if (showMasterSelector) {
  const masterAccounts = await fetch(
    `/api/Accounting/programs/${programId}/master-chart-of-accounts`
  );
}
```

#### Incremental Refresh Pattern

```typescript
// After operations, only refresh what changed
if (operationType === "manual-match") {
  // Only refresh accounts, stats unchanged
  await refreshAccounts();
} else if (operationType === "bulk-confirm") {
  // Refresh both accounts and stats
  await Promise.all([refreshAccounts(), refreshStatistics()]);
}
```

### Authentication & Authorization Notes

#### Required Permissions

- **Read**: View shop accounts, master accounts, statistics
- **Write**: Create manual matches, confirm/reject matches
- **Admin**: Auto-matching, bulk operations, Excel import

#### Token Management

```typescript
// Check token before long-running operations
const checkAuth = () => {
  const token = localStorage.getItem("token");
  if (!token || isTokenExpired(token)) {
    redirectToLogin();
    return false;
  }
  return true;
};

// Before auto-matching (long operation)
if (!checkAuth()) return;
await performAutoMatching();
```

### Rate Limiting Considerations

#### Bulk Operations

- **Auto-matching**: May take 30+ seconds for large datasets
- **Excel import**: May take 60+ seconds for large files
- **Bulk confirmations**: Limit to 100 matches per request

#### Polling Intervals

```typescript
// Recommended polling intervals
const POLLING_INTERVALS = {
  autoMatching: 5000, // 5 seconds during auto-match
  normalRefresh: 30000, // 30 seconds for general updates
  statisticsRefresh: 10000, // 10 seconds for stats updates
};
```

## Conclusion

This guide provides a comprehensive foundation for implementing the Chart of Accounts mapping functionality in React. The key is to focus on clear visual indicators of mapping status, intuitive workflows for both manual and automatic matching, and responsive feedback for all user actions.

Remember to test thoroughly with different scenarios:

- Large lists of accounts
- Various confidence score ranges
- Network failures and timeouts
- Different user permission levels
- Edge cases like duplicate account numbers

For additional questions or clarifications about the API behavior, refer to the backend documentation or contact the API development team.

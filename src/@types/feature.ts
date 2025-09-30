/**
 * Feature System TypeScript Definitions
 * Based on swagger.json API specifications
 */

// Base Feature Types from API
export interface FeatureResponse {
  featureId: string;
  featureKey: string;
  featureName: string;
  description?: string;
  category: 'free' | 'paid';
  menuPath?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantFeatureResponse {
  featureId: string;
  featureKey: string;
  featureName: string;
  description?: string;
  category: 'free' | 'paid';
  menuPath?: string;
  isEnabled: boolean;
  enabledAt?: string;
  enabledBy?: UserSummary;
  disabledAt?: string;
  disabledBy?: UserSummary;
}

export interface UserSummary {
  userId: string;
  userName: string;
  email?: string;
}

// API Request/Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface FeatureResponseListApiResponse extends ApiResponse<FeatureResponse[]> {}
export interface FeatureResponseApiResponse extends ApiResponse<FeatureResponse> {}
export interface TenantFeatureResponseListApiResponse extends ApiResponse<TenantFeatureResponse[]> {}
export interface TenantFeatureResponseApiResponse extends ApiResponse<TenantFeatureResponse> {}
export interface StringListApiResponse extends ApiResponse<string[]> {}
export interface BooleanApiResponse extends ApiResponse<boolean> {}

// Request Types
export interface CreateFeatureRequest {
  featureKey: string;
  featureName: string;
  description?: string;
  category: 'free' | 'paid';
  menuPath?: string;
}

export interface UpdateFeatureRequest {
  featureName?: string;
  description?: string;
  category?: 'free' | 'paid';
  menuPath?: string;
  isActive?: boolean;
}

export interface BulkFeatureUpdateRequest {
  featureId: string;
  isEnabled: boolean;
  reason?: string;
}

// Frontend-specific Types
export interface FeatureMenuItem {
  featureKey: string;
  menuKey: string;
  title: string;
  path: string;
  icon: string;
  type: 'item' | 'collapse';
  parentFeature?: string;
  requiredRoles: string[];
  subMenus?: FeatureMenuItem[];
  metadata?: {
    category: 'free' | 'paid';
    description: string;
    enabledAt?: string;
    isEnabled?: boolean;
  };
}

export interface UserFeaturesResponse {
  userId: string;
  tenantId: string;
  availableFeatures: FeatureMenuItem[];
  enabledFeatureKeys: string[];
}

export interface FeatureAccessResponse {
  featureKey: string;
  hasAccess: boolean;
  reason?: string;
}

// Admin Portal Types
export interface TenantFeatureManagement {
  tenantId: string;
  tenantName: string;
  features: TenantFeatureResponse[];
  lastUpdated?: string;
}

export interface FeatureUsageStats {
  featureKey: string;
  featureName: string;
  totalTenants: number;
  enabledTenants: number;
  enablementRate: number;
  category: 'free' | 'paid';
}

export interface FeatureUsageReport {
  reportDate: string;
  features: FeatureUsageStats[];
  summary: {
    totalFeatures: number;
    freeFeatures: number;
    paidFeatures: number;
    averageEnablementRate: number;
  };
}

// Audit Types
export interface AuditEntry {
  auditId: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  tenantId?: string;
  timestamp: string;
  changes: {
    before?: any;
    after?: any;
  };
  metadata?: {
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  };
  correlationId?: string;
}

export interface AuditQuery {
  entityType?: string;
  entityId?: string;
  userId?: string;
  tenantId?: string;
  startDate?: string;
  endDate?: string;
  actions?: string[];
  page?: number;
  pageSize?: number;
}

export interface AuditLogResponse extends ApiResponse<AuditEntry[]> {
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    pageSize: number;
  };
}

// State Management Types
export interface FeatureState {
  user: {
    availableFeatures: FeatureMenuItem[];
    enabledFeatureKeys: string[];
    lastFetched?: Date;
    isLoading: boolean;
    error: string | null;
  };
  admin: {
    allFeatures: FeatureResponse[];
    tenantFeatures: Record<string, TenantFeatureResponse[]>;
    selectedTenant?: TenantFeatureManagement;
    auditLog: AuditEntry[];
    isLoading: boolean;
    error: string | null;
  };
  cache: {
    features: Map<string, any>;
    expiry: Map<string, Date>;
  };
}

// Navigation Types (extending existing navigation types)
export interface NavigationTree {
  key: string;
  path: string;
  title: string;
  translateKey?: string;
  icon?: string;
  type: 'item' | 'collapse' | 'title';
  authority?: string[];
  featureKey?: string; // New: Link to feature system
  requiredFeatures?: string[]; // New: Multiple features can control one menu
  subMenu?: NavigationTree[];
  meta?: {
    layout?: string;
    pageContainerType?: string;
    header?: {
      title?: string;
      description?: string;
    };
  };
}

// Feature Constants
export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  category: 'free' | 'paid';
  menuPath: string;
  defaultEnabled: boolean;
  requiredRoles?: string[];
  dependencies?: string[]; // Other features this depends on
}

// Error Types
export interface FeatureError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiry: Date;
}

export interface CacheConfig {
  userFeaturesTTL: number; // milliseconds
  adminFeaturesTTL: number;
  auditLogTTL: number;
  maxCacheSize: number;
}

// Component Props Types
export interface FeatureToggleSwitchProps {
  feature: TenantFeatureResponse;
  tenantId: string;
  onToggle: (featureId: string, enabled: boolean, reason?: string) => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

export interface FeatureGridProps {
  features: TenantFeatureResponse[];
  tenantId: string;
  onBulkUpdate: (updates: BulkFeatureUpdateRequest[]) => Promise<void>;
  selectedFeatures?: string[];
  onSelectionChange?: (selected: string[]) => void;
  category?: 'free' | 'paid' | 'all';
}

export interface TenantSearchProps {
  onTenantSelect: (tenantId: string) => void;
  selectedTenantId?: string;
  placeholder?: string;
}

export interface AuditTrailProps {
  auditLog: AuditEntry[];
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  filters?: AuditQuery;
  onFiltersChange?: (filters: AuditQuery) => void;
}

// Hook Return Types
export interface UseFeatureNavigationReturn {
  navigation: NavigationTree[];
  isLoading: boolean;
  error: string | null;
  refreshNavigation: () => Promise<void>;
  checkFeatureAccess: (featureKey: string) => boolean;
}

export interface UseFeatureManagementReturn {
  features: FeatureResponse[];
  tenantFeatures: TenantFeatureResponse[];
  isLoading: boolean;
  error: string | null;
  enableFeature: (tenantId: string, featureId: string, reason?: string) => Promise<void>;
  disableFeature: (tenantId: string, featureId: string, reason?: string) => Promise<void>;
  bulkUpdateFeatures: (tenantId: string, updates: BulkFeatureUpdateRequest[]) => Promise<void>;
  refreshFeatures: () => Promise<void>;
}

export interface UseAuditLogReturn {
  auditLog: AuditEntry[];
  isLoading: boolean;
  error: string | null;
  loadAuditLog: (query: AuditQuery) => Promise<void>;
  exportAuditLog: (query: AuditQuery, format: 'csv' | 'json') => Promise<void>;
}

// Event Types
export interface FeatureChangeEvent {
  type: 'feature:enabled' | 'feature:disabled' | 'features:bulk-updated';
  tenantId: string;
  featureKey?: string;
  featureKeys?: string[];
  timestamp: Date;
  userId: string;
  reason?: string;
}
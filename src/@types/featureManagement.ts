export interface FeatureResponse {
  featureId: string; // UUID
  featureKey: string;
  featureName: string;
  description: string;
  category: string;
  menuPath: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeatureRequest {
  featureKey: string;
  featureName: string;
  description: string;
  category: string;
  menuPath: string;
}

export interface UpdateFeatureRequest {
  featureKey?: string;
  featureName?: string;
  description?: string;
  category?: string;
  menuPath?: string;
  isActive?: boolean;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface TenantFeatureResponse {
  featureId: string; // UUID
  featureKey: string;
  featureName: string;
  description: string;
  category: string;
  menuPath: string;
  isEnabled: boolean;
  enabledAt?: string;
  enabledBy?: UserSummary;
  disabledAt?: string;
  disabledBy?: UserSummary;
}

export interface BulkUpdateTenantFeaturesRequest {
  featureUpdates: Array<{
    featureId: string;
    isEnabled: boolean;
    reason?: string;
  }>;
}

export interface FeatureFilters {
  category?: string;
  isActive?: boolean;
  searchQuery?: string;
  menuPath?: string;
}

export interface TenantFeatureFilters {
  tenantId?: number;
  isEnabled?: boolean;
  category?: string;
  searchQuery?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FeatureManagementPermissions {
  canViewFeatures: boolean;
  canCreateFeatures: boolean;
  canEditFeatures: boolean;
  canDeleteFeatures: boolean;
  canAssignFeatures: boolean;
  canViewTenantFeatures: boolean;
  canBulkUpdate: boolean;
  canViewAuditLog: boolean;
  canExportData: boolean;
}

export interface FeatureStats {
  totalFeatures: number;
  activeFeatures: number;
  totalTenants: number;
  featuresEnabledCount: number;
}

export interface FeatureActivity {
  id: string;
  action: 'enabled' | 'disabled' | 'created' | 'updated' | 'deleted';
  featureName: string;
  featureKey: string;
  tenantName?: string;
  tenantId?: number;
  performedBy: UserSummary;
  performedAt: string;
  reason?: string;
}

export interface FeatureAuditEntry {
  id: string;
  featureId: string;
  featureKey: string;
  action: string;
  tenantId?: number;
  tenantName?: string;
  performedBy: UserSummary;
  performedAt: string;
  details: Record<string, any>;
  reason?: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface FeatureResponseListApiResponse extends ApiResponse<FeatureResponse[]> {}
export interface FeatureResponseApiResponse extends ApiResponse<FeatureResponse> {}
export interface TenantFeatureResponseListApiResponse extends ApiResponse<TenantFeatureResponse[]> {}
export interface TenantFeatureResponseApiResponse extends ApiResponse<TenantFeatureResponse> {}
export interface StringListApiResponse extends ApiResponse<string[]> {}
export interface BooleanApiResponse extends ApiResponse<boolean> {}

// UI State Types
export interface FeatureManagementState {
  // All system features
  features: FeatureResponse[];
  featuresLoading: boolean;
  featuresError: string | null;
  
  // Tenant features
  tenantFeatures: Record<number, TenantFeatureResponse[]>; // tenantId -> features
  selectedTenantId: number | null;
  tenantFeaturesLoading: boolean;
  tenantFeaturesError: string | null;
  
  // UI state
  selectedFeatures: string[]; // for bulk operations
  searchQuery: string;
  filters: FeatureFilters;
  tenantFilters: TenantFeatureFilters;
  pagination: PaginationState;
  
  // Feature stats and activities
  stats: FeatureStats | null;
  statsLoading: boolean;
  recentActivities: FeatureActivity[];
  activitiesLoading: boolean;
  
  // Cache management
  lastFetched: Record<string, number>;
  cacheExpiry: number;
  
  // Permissions
  permissions: FeatureManagementPermissions;
}

// Form Types
export interface CreateFeatureFormData extends CreateFeatureRequest {
  confirmImplementation: boolean;
}

export interface UpdateFeatureFormData extends UpdateFeatureRequest {
  featureId: string;
}

export interface AssignFeatureFormData {
  tenantId: number;
  featureIds: string[];
  reason?: string;
}

export interface BulkOperationFormData {
  tenantIds: number[];
  featureUpdates: Array<{
    featureId: string;
    isEnabled: boolean;
    reason?: string;
  }>;
}

// Component Props Types
export interface FeatureCardProps {
  feature: FeatureResponse;
  onEdit?: (feature: FeatureResponse) => void;
  onDelete?: (feature: FeatureResponse) => void;
  onToggleStatus?: (feature: FeatureResponse) => void;
  showActions?: boolean;
  isSelected?: boolean;
  onSelect?: (featureId: string) => void;
}

export interface FeatureTableProps {
  features: FeatureResponse[];
  loading?: boolean;
  onEdit?: (feature: FeatureResponse) => void;
  onDelete?: (feature: FeatureResponse) => void;
  onView?: (feature: FeatureResponse) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
}

export interface TenantSelectorProps {
  selectedTenantId: number | null;
  onTenantSelect: (tenantId: number) => void;
  loading?: boolean;
  error?: string | null;
}

export interface FeatureAssignmentMatrixProps {
  tenantId?: number | null;
  onAssignmentChange?: (featureId: number, enabled: boolean) => void;
  className?: string;
}


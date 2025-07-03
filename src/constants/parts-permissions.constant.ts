// Parts Management Permissions

// Manufacturer permissions
export const MANUFACTURER_ALL = 'manufacturer.all'
export const MANUFACTURER_VIEW = 'manufacturer.view'
export const MANUFACTURER_CREATE = 'manufacturer.create'
export const MANUFACTURER_UPDATE = 'manufacturer.update'
export const MANUFACTURER_DELETE = 'manufacturer.delete'

// Brand permissions
export const BRAND_ALL = 'brand.all'
export const BRAND_VIEW = 'brand.view'
export const BRAND_CREATE = 'brand.create'
export const BRAND_UPDATE = 'brand.update'
export const BRAND_DELETE = 'brand.delete'

// Supplier permissions
export const SUPPLIERS_ALL = 'suppliers.all'
export const SUPPLIERS_VIEW = 'suppliers.view'
export const SUPPLIERS_CREATE = 'suppliers.create'
export const SUPPLIERS_UPDATE = 'suppliers.update'
export const SUPPLIERS_DELETE = 'suppliers.delete'

// Part Category permissions
export const PARTCATEGORY_ALL = 'partcategory.all'
export const PARTCATEGORY_VIEW = 'partcategory.view'
export const PARTCATEGORY_CREATE = 'partcategory.create'
export const PARTCATEGORY_UPDATE = 'partcategory.update'
export const PARTCATEGORY_DELETE = 'partcategory.delete'

// Master Parts permissions
export const MASTERPARTS_ALL = 'masterparts.all'
export const MASTERPARTS_VIEW = 'masterparts.view'
export const MASTERPARTS_CREATE = 'masterparts.create'
export const MASTERPARTS_UPDATE = 'masterparts.update'
export const MASTERPARTS_DELETE = 'masterparts.delete'

// Supplier Parts permissions
export const SUPPLIERPARTS_ALL = 'supplierparts.all'
export const SUPPLIERPARTS_VIEW = 'supplierparts.view'
export const SUPPLIERPARTS_CREATE = 'supplierparts.create'
export const SUPPLIERPARTS_UPDATE = 'supplierparts.update'
export const SUPPLIERPARTS_DELETE = 'supplierparts.delete'

// Match Parts permissions
export const MATCHPARTS_ALL = 'matchparts.all'
export const MATCHPARTS_VIEW = 'matchparts.view'
export const MATCHPARTS_CREATE = 'matchparts.create'
export const MATCHPARTS_UPDATE = 'matchparts.update'
export const MATCHPARTS_DELETE = 'matchparts.delete'

// Convenience arrays for common permission groups
export const ALL_MANUFACTURER_PERMISSIONS = [
    MANUFACTURER_ALL,
    MANUFACTURER_VIEW,
    MANUFACTURER_CREATE,
    MANUFACTURER_UPDATE,
    MANUFACTURER_DELETE,
]

export const ALL_BRAND_PERMISSIONS = [
    BRAND_ALL,
    BRAND_VIEW,
    BRAND_CREATE,
    BRAND_UPDATE,
    BRAND_DELETE,
]

export const ALL_SUPPLIER_PERMISSIONS = [
    SUPPLIERS_ALL,
    SUPPLIERS_VIEW,
    SUPPLIERS_CREATE,
    SUPPLIERS_UPDATE,
    SUPPLIERS_DELETE,
]

export const ALL_PARTCATEGORY_PERMISSIONS = [
    PARTCATEGORY_ALL,
    PARTCATEGORY_VIEW,
    PARTCATEGORY_CREATE,
    PARTCATEGORY_UPDATE,
    PARTCATEGORY_DELETE,
]

export const ALL_MASTERPARTS_PERMISSIONS = [
    MASTERPARTS_ALL,
    MASTERPARTS_VIEW,
    MASTERPARTS_CREATE,
    MASTERPARTS_UPDATE,
    MASTERPARTS_DELETE,
]

export const ALL_SUPPLIERPARTS_PERMISSIONS = [
    SUPPLIERPARTS_ALL,
    SUPPLIERPARTS_VIEW,
    SUPPLIERPARTS_CREATE,
    SUPPLIERPARTS_UPDATE,
    SUPPLIERPARTS_DELETE,
]

export const ALL_MATCHPARTS_PERMISSIONS = [
    MATCHPARTS_ALL,
    MATCHPARTS_VIEW,
    MATCHPARTS_CREATE,
    MATCHPARTS_UPDATE,
    MATCHPARTS_DELETE,
]

export const ALL_PARTS_MANAGEMENT_PERMISSIONS = [
    ...ALL_MANUFACTURER_PERMISSIONS,
    ...ALL_BRAND_PERMISSIONS,
    ...ALL_SUPPLIER_PERMISSIONS,
    ...ALL_PARTCATEGORY_PERMISSIONS,
    ...ALL_MASTERPARTS_PERMISSIONS,
    ...ALL_SUPPLIERPARTS_PERMISSIONS,
    ...ALL_MATCHPARTS_PERMISSIONS,
]

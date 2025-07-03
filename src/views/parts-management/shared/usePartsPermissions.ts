import { useMemo } from 'react'
import useAuth from '@/auth/useAuth'
import { 
    TENANT_ADMIN, 
    CS_ADMIN, 
    CS_USER, 
    END_USER 
} from '@/constants/roles.constant'
import {
    MANUFACTURER_ALL,
    MANUFACTURER_VIEW,
    MANUFACTURER_CREATE,
    MANUFACTURER_UPDATE,
    MANUFACTURER_DELETE,
    BRAND_ALL,
    BRAND_VIEW,
    BRAND_CREATE,
    BRAND_UPDATE,
    BRAND_DELETE,
    SUPPLIERS_ALL,
    SUPPLIERS_VIEW,
    SUPPLIERS_CREATE,
    SUPPLIERS_UPDATE,
    SUPPLIERS_DELETE,
    PARTCATEGORY_ALL,
    PARTCATEGORY_VIEW,
    PARTCATEGORY_CREATE,
    PARTCATEGORY_UPDATE,
    PARTCATEGORY_DELETE,
    MASTERPARTS_ALL,
    MASTERPARTS_VIEW,
    MASTERPARTS_CREATE,
    MASTERPARTS_UPDATE,
    MASTERPARTS_DELETE,
    SUPPLIERPARTS_ALL,
    SUPPLIERPARTS_VIEW,
    SUPPLIERPARTS_CREATE,
    SUPPLIERPARTS_UPDATE,
    SUPPLIERPARTS_DELETE,
    MATCHPARTS_ALL,
    MATCHPARTS_VIEW,
    MATCHPARTS_CREATE,
    MATCHPARTS_UPDATE,
    MATCHPARTS_DELETE,
} from '@/constants/parts-permissions.constant'

export interface PartsPermissions {
    // Manufacturer permissions
    canViewManufacturers: boolean
    canCreateManufacturers: boolean
    canUpdateManufacturers: boolean
    canDeleteManufacturers: boolean
    
    // Brand permissions
    canViewBrands: boolean
    canCreateBrands: boolean
    canUpdateBrands: boolean
    canDeleteBrands: boolean
    
    // Supplier permissions
    canViewSuppliers: boolean
    canCreateSuppliers: boolean
    canUpdateSuppliers: boolean
    canDeleteSuppliers: boolean
    
    // Part Category permissions
    canViewPartCategories: boolean
    canCreatePartCategories: boolean
    canUpdatePartCategories: boolean
    canDeletePartCategories: boolean
    
    // Master Parts permissions
    canViewMasterParts: boolean
    canCreateMasterParts: boolean
    canUpdateMasterParts: boolean
    canDeleteMasterParts: boolean
    
    // Supplier Parts permissions
    canViewSupplierParts: boolean
    canCreateSupplierParts: boolean
    canUpdateSupplierParts: boolean
    canDeleteSupplierParts: boolean

    // Match Parts permissions
    canViewMatchParts: boolean
    canCreateMatchParts: boolean
    canUpdateMatchParts: boolean
    canDeleteMatchParts: boolean
    
    // General access
    hasAnyPartsAccess: boolean
}

const usePartsPermissions = (): PartsPermissions => {
    const { user } = useAuth()
    
    const permissions = useMemo(() => {
        const userAuthority = user?.authority || []
        
        // Admin roles have full access
        const isAdmin = userAuthority.includes(TENANT_ADMIN) || 
                       userAuthority.includes(CS_ADMIN) || 
                       userAuthority.includes(CS_USER)
        
        const hasPermission = (permission: string) => {
            return isAdmin || userAuthority.includes(permission)
        }
        
        const hasAllPermission = (allPermission: string) => {
            return hasPermission(allPermission)
        }
        
        // Manufacturer permissions
        const manufacturerAll = hasAllPermission(MANUFACTURER_ALL)
        const canViewManufacturers = manufacturerAll || hasPermission(MANUFACTURER_VIEW)
        const canCreateManufacturers = manufacturerAll || hasPermission(MANUFACTURER_CREATE)
        const canUpdateManufacturers = manufacturerAll || hasPermission(MANUFACTURER_UPDATE)
        const canDeleteManufacturers = manufacturerAll || hasPermission(MANUFACTURER_DELETE)
        
        // Brand permissions
        const brandAll = hasAllPermission(BRAND_ALL)
        const canViewBrands = brandAll || hasPermission(BRAND_VIEW)
        const canCreateBrands = brandAll || hasPermission(BRAND_CREATE)
        const canUpdateBrands = brandAll || hasPermission(BRAND_UPDATE)
        const canDeleteBrands = brandAll || hasPermission(BRAND_DELETE)
        
        // Supplier permissions
        const supplierAll = hasAllPermission(SUPPLIERS_ALL)
        const canViewSuppliers = supplierAll || hasPermission(SUPPLIERS_VIEW)
        const canCreateSuppliers = supplierAll || hasPermission(SUPPLIERS_CREATE)
        const canUpdateSuppliers = supplierAll || hasPermission(SUPPLIERS_UPDATE)
        const canDeleteSuppliers = supplierAll || hasPermission(SUPPLIERS_DELETE)
        
        // Part Category permissions
        const partCategoryAll = hasAllPermission(PARTCATEGORY_ALL)
        const canViewPartCategories = partCategoryAll || hasPermission(PARTCATEGORY_VIEW)
        const canCreatePartCategories = partCategoryAll || hasPermission(PARTCATEGORY_CREATE)
        const canUpdatePartCategories = partCategoryAll || hasPermission(PARTCATEGORY_UPDATE)
        const canDeletePartCategories = partCategoryAll || hasPermission(PARTCATEGORY_DELETE)
        
        // Master Parts permissions
        const masterPartsAll = hasAllPermission(MASTERPARTS_ALL)
        const canViewMasterParts = masterPartsAll || hasPermission(MASTERPARTS_VIEW)
        const canCreateMasterParts = masterPartsAll || hasPermission(MASTERPARTS_CREATE)
        const canUpdateMasterParts = masterPartsAll || hasPermission(MASTERPARTS_UPDATE)
        const canDeleteMasterParts = masterPartsAll || hasPermission(MASTERPARTS_DELETE)
        
        // Supplier Parts permissions
        const supplierPartsAll = hasAllPermission(SUPPLIERPARTS_ALL)
        const canViewSupplierParts = supplierPartsAll || hasPermission(SUPPLIERPARTS_VIEW)
        const canCreateSupplierParts = supplierPartsAll || hasPermission(SUPPLIERPARTS_CREATE)
        const canUpdateSupplierParts = supplierPartsAll || hasPermission(SUPPLIERPARTS_UPDATE)
        const canDeleteSupplierParts = supplierPartsAll || hasPermission(SUPPLIERPARTS_DELETE)
        
        // Match Parts permissions
        const matchPartsAll = hasAllPermission(MATCHPARTS_ALL)
        const canViewMatchParts = matchPartsAll || hasPermission(MATCHPARTS_VIEW)
        const canCreateMatchParts = matchPartsAll || hasPermission(MATCHPARTS_CREATE)
        const canUpdateMatchParts = matchPartsAll || hasPermission(MATCHPARTS_UPDATE)
        const canDeleteMatchParts = matchPartsAll || hasPermission(MATCHPARTS_DELETE)
        
        // Check if user has any parts management access
        const hasAnyPartsAccess = canViewManufacturers || canViewBrands || canViewSuppliers || 
                                 canViewPartCategories || canViewMasterParts || canViewSupplierParts || canViewMatchParts
        
        return {
            canViewManufacturers,
            canCreateManufacturers,
            canUpdateManufacturers,
            canDeleteManufacturers,
            canViewBrands,
            canCreateBrands,
            canUpdateBrands,
            canDeleteBrands,
            canViewSuppliers,
            canCreateSuppliers,
            canUpdateSuppliers,
            canDeleteSuppliers,
            canViewPartCategories,
            canCreatePartCategories,
            canUpdatePartCategories,
            canDeletePartCategories,
            canViewMasterParts,
            canCreateMasterParts,
            canUpdateMasterParts,
            canDeleteMasterParts,
            canViewSupplierParts,
            canCreateSupplierParts,
            canUpdateSupplierParts,
            canDeleteSupplierParts,
            canViewMatchParts,
            canCreateMatchParts,
            canUpdateMatchParts,
            canDeleteMatchParts,
            hasAnyPartsAccess,
        }
    }, [user])
    
    return permissions
}

export default usePartsPermissions

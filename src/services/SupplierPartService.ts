import ApiService from './ApiService'
import type { 
    SupplierPart, 
    CreateSupplierPartRequest, 
    UpdateSupplierPartRequest 
} from '@/@types/parts'

const SupplierPartService = {
    // Get all supplier parts
    getSupplierParts: async (): Promise<SupplierPart[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<SupplierPart[]>({
                url: 'supplierpart',
                method: 'get',
            })
            return result
        } catch (error) {
            console.error('Failed to fetch supplier parts:', error)
            throw error
        }
    },

    // Get supplier part by ID
    getSupplierPart: async (id: number): Promise<SupplierPart> => {
        try {
            const result = await ApiService.fetchDataWithAxios<SupplierPart>({
                url: `supplierpart/${id}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch supplier part ${id}:`, error)
            throw error
        }
    },

    // Get supplier parts by supplier
    getSupplierPartsBySupplier: async (supplierId: number): Promise<SupplierPart[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<SupplierPart[]>({
                url: `supplierpart/supplier/${supplierId}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch supplier parts for supplier ${supplierId}:`, error)
            throw error
        }
    },

    // Get supplier parts for master part
    getSupplierPartsByMasterPart: async (masterPartId: number): Promise<SupplierPart[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<SupplierPart[]>({
                url: `supplierpart/masterpart/${masterPartId}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch supplier parts for master part ${masterPartId}:`, error)
            throw error
        }
    },

    // Search supplier parts
    searchSupplierParts: async (searchTerm: string): Promise<SupplierPart[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<SupplierPart[]>({
                url: 'supplierpart/search',
                method: 'get',
                params: { searchTerm },
            })
            return result
        } catch (error) {
            console.error('Failed to search supplier parts:', error)
            throw error
        }
    },

    // Create supplier part
    createSupplierPart: async (data: CreateSupplierPartRequest): Promise<SupplierPart> => {
        try {
            const result = await ApiService.fetchDataWithAxios<SupplierPart>({
                url: 'supplierpart',
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error('Failed to create supplier part:', error)
            throw error
        }
    },

    // Update supplier part
    updateSupplierPart: async (id: number, data: UpdateSupplierPartRequest): Promise<SupplierPart> => {
        try {
            const result = await ApiService.fetchDataWithAxios<SupplierPart>({
                url: `supplierpart/${id}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error(`Failed to update supplier part ${id}:`, error)
            throw error
        }
    },

    // Delete supplier part
    deleteSupplierPart: async (id: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `supplierpart/${id}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to delete supplier part ${id}:`, error)
            throw error
        }
    },
}

export default SupplierPartService

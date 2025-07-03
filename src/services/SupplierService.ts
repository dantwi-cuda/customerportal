import ApiService from './ApiService'
import type { 
    Supplier, 
    CreateSupplierRequest, 
    UpdateSupplierRequest 
} from '@/@types/parts'

const SupplierService = {
    // Get all suppliers
    getSuppliers: async (): Promise<Supplier[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Supplier[]>({
                url: 'supplier',
                method: 'get',
            })
            return result
        } catch (error) {
            console.error('Failed to fetch suppliers:', error)
            throw error
        }
    },

    // Get supplier by ID
    getSupplier: async (id: number): Promise<Supplier> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Supplier>({
                url: `supplier/${id}`,
                method: 'get',
            })
            return result
        } catch (error) {
            console.error(`Failed to fetch supplier ${id}:`, error)
            throw error
        }
    },

    // Search suppliers
    searchSuppliers: async (searchTerm: string): Promise<Supplier[]> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Supplier[]>({
                url: 'supplier/search',
                method: 'get',
                params: { searchTerm },
            })
            return result
        } catch (error) {
            console.error('Failed to search suppliers:', error)
            throw error
        }
    },

    // Create supplier
    createSupplier: async (data: CreateSupplierRequest): Promise<Supplier> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Supplier>({
                url: 'supplier',
                method: 'post',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error('Failed to create supplier:', error)
            throw error
        }
    },

    // Update supplier
    updateSupplier: async (id: number, data: UpdateSupplierRequest): Promise<Supplier> => {
        try {
            const result = await ApiService.fetchDataWithAxios<Supplier>({
                url: `supplier/${id}`,
                method: 'put',
                data: data as unknown as Record<string, unknown>,
            })
            return result
        } catch (error) {
            console.error(`Failed to update supplier ${id}:`, error)
            throw error
        }
    },

    // Delete supplier
    deleteSupplier: async (id: number): Promise<void> => {
        try {
            await ApiService.fetchDataWithAxios<void>({
                url: `supplier/${id}`,
                method: 'delete',
            })
        } catch (error) {
            console.error(`Failed to delete supplier ${id}:`, error)
            throw error
        }
    },
}

export default SupplierService

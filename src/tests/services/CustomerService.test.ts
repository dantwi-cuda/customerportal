import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as CustomerService from '@/services/CustomerService'
import ApiService from '@/services/ApiService'

// Mock the ApiService module
vi.mock('@/services/ApiService', () => ({
    default: {
        fetchDataWithAxios: vi.fn()
    }
}))

describe('CustomerService', () => {
    const mockCustomer = {
        id: '1',
        name: 'Test Customer',
        legalName: 'Test Customer Legal',
        domainUrl: 'test.example.com',
        isActive: true,
        credentials: {
            biUsername: 'testuser',
            biPassword: 'testpass'
        },
        branding: {
            displayTitle: 'Test Portal',
            logoUrl: 'https://example.com/logo.png',
        }
    }

    beforeEach(() => {
        // Reset all mocks before each test
        vi.resetAllMocks()
    })

    describe('getCustomers', () => {
        it('should fetch all customers', async () => {
            // Setup
            const mockResponse = [mockCustomer]
            vi.mocked(ApiService.fetchDataWithAxios).mockResolvedValueOnce(mockResponse)

            // Execute
            const result = await CustomerService.getCustomers()            // Verify
            expect(ApiService.fetchDataWithAxios).toHaveBeenCalledWith({
                url: 'api/CustomerManagement',
                method: 'get'
            })
            expect(result).toEqual(mockResponse)
        })
    })

    describe('getCustomerById', () => {
        it('should fetch a customer by ID', async () => {
            // Setup
            vi.mocked(ApiService.fetchDataWithAxios).mockResolvedValueOnce(mockCustomer)

            // Execute
            const result = await CustomerService.getCustomerById('1')            // Verify
            expect(ApiService.fetchDataWithAxios).toHaveBeenCalledWith({
                url: 'api/CustomerManagement/1',
                method: 'get'
            })
            expect(result).toEqual(mockCustomer)
        })
    })

    describe('createCustomer', () => {
        it('should create a new customer', async () => {
            // Setup
            vi.mocked(ApiService.fetchDataWithAxios).mockResolvedValueOnce(mockCustomer)

            // Execute
            const result = await CustomerService.createCustomer(mockCustomer)            // Verify
            expect(ApiService.fetchDataWithAxios).toHaveBeenCalledWith({
                url: 'api/CustomerManagement',
                method: 'post',
                data: mockCustomer
            })
            expect(result).toEqual(mockCustomer)
        })
    })

    describe('updateCustomerInfo', () => {
        it('should update customer info', async () => {
            // Setup
            const customerInfo = {
                name: 'Updated Customer',
                legalName: 'Updated Legal Name',
                domainUrl: 'updated.example.com',
                isActive: true
            }
            vi.mocked(ApiService.fetchDataWithAxios).mockResolvedValueOnce(mockCustomer)

            // Execute
            await CustomerService.updateCustomerInfo('1', customerInfo)            // Verify
            expect(ApiService.fetchDataWithAxios).toHaveBeenCalledWith({
                url: 'api/CustomerManagement/1',
                method: 'put',
                data: customerInfo
            })
        })
    })

    describe('deleteCustomer', () => {
        it('should delete a customer', async () => {
            // Setup
            vi.mocked(ApiService.fetchDataWithAxios).mockResolvedValueOnce(undefined)

            // Execute
            await CustomerService.deleteCustomer('1')            // Verify
            expect(ApiService.fetchDataWithAxios).toHaveBeenCalledWith({
                url: 'api/CustomerManagement/1',
                method: 'delete'
            })
        })
    })

    describe('getCustomerAccessToken', () => {
        it('should get a customer access token', async () => {
            // Setup
            const mockToken = {
                token: 'access-token',
                domain: 'test.example.com'
            }
            vi.mocked(ApiService.fetchDataWithAxios).mockResolvedValueOnce(mockToken)

            // Execute
            const result = await CustomerService.getCustomerAccessToken('1')            // Verify
            expect(ApiService.fetchDataWithAxios).toHaveBeenCalledWith({
                url: 'api/CustomerManagement/access-token/1',
                method: 'get'
            })
            expect(result).toEqual(mockToken)
        })
    })
})

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import CustomersListPage from '@/views/admin/customers/CustomerListPage'
import * as CustomerService from '@/services/CustomerService'
import useAuth from '@/auth/useAuth'

// Mock the CustomerService module
vi.mock('@/services/CustomerService', () => ({
    getCustomers: vi.fn(),
}))

// Mock the auth hook
vi.mock('@/auth/useAuth', () => ({
    default: vi.fn(),
}))

describe('CustomersListPage', () => {
    const mockCustomers = [
        {
            id: '1',
            name: 'Customer 1',
            legalName: 'Customer One Inc',
            domainUrl: 'customer1.example.com',
            isActive: true,
            branding: {
                logoUrl: 'https://example.com/logo1.png',
            },
        },
        {
            id: '2',
            name: 'Customer 2',
            legalName: 'Customer Two LLC',
            domainUrl: 'customer2.example.com',
            isActive: false,
            branding: {
                logoUrl: 'https://example.com/logo2.png',
            },
        },
    ]

    beforeEach(() => {
        // Mock the auth hook to return an admin user
        vi.mocked(useAuth).mockReturnValue({
            user: { authority: ['admin'] },
            isAuthenticated: true,
            login: vi.fn(),
            logout: vi.fn(),
            loginWithToken: vi.fn(),
        })

        // Reset all mocks before each test
        vi.resetAllMocks()
    })

    it('renders the customers list', async () => {
        // Setup
        vi.mocked(CustomerService.getCustomers).mockResolvedValue(mockCustomers)

        // Render component
        render(
            <BrowserRouter>
                <CustomersListPage />
            </BrowserRouter>,
        )

        // Check loading state
        expect(screen.getByText('Customers')).toBeInTheDocument()

        // Wait for customers to load
        await waitFor(() => {
            expect(CustomerService.getCustomers).toHaveBeenCalled()
        })

        // Check that customers are displayed
        await waitFor(() => {
            expect(screen.getByText('Customer 1')).toBeInTheDocument()
            expect(screen.getByText('Customer 2')).toBeInTheDocument()
            expect(screen.getByText('Active')).toBeInTheDocument()
            expect(screen.getByText('Inactive')).toBeInTheDocument()
        })
    })

    it('handles errors when loading customers', async () => {
        // Setup
        vi.mocked(CustomerService.getCustomers).mockRejectedValue(
            new Error('Failed to load'),
        )

        // Render component
        render(
            <BrowserRouter>
                <CustomersListPage />
            </BrowserRouter>,
        )

        // Wait for API call to fail
        await waitFor(() => {
            expect(CustomerService.getCustomers).toHaveBeenCalled()
        })

        // Error handling will show a toast notification, which we can't easily test
        // But we can check that the component doesn't crash
        expect(screen.getByText('Customers')).toBeInTheDocument()
    })
})

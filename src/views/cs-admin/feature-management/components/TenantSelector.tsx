import { useState, useEffect } from 'react'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { HiSearch, HiRefresh } from 'react-icons/hi'
import type { TenantSelectorProps } from '@/@types/featureManagement'
import type { CustomerDetailsResponse } from '@/@types/customer'
import { getCustomers } from '@/services/CustomerService'

const TenantSelector = ({
    selectedTenantId,
    onTenantSelect,
    loading = false,
    error = null,
}: TenantSelectorProps) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [customers, setCustomers] = useState<CustomerDetailsResponse[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [recentTenants, setRecentTenants] = useState<number[]>([])

    useEffect(() => {
        loadCustomers()
        loadRecentTenants()
    }, [])

    const loadCustomers = async () => {
        setIsLoading(true)
        try {
            const response = await getCustomers()
            setCustomers(response)
        } catch (error) {
            console.error('Error loading customers:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const loadRecentTenants = () => {
        // Load recent tenants from localStorage
        try {
            const recent = localStorage.getItem('recent-tenants')
            if (recent) {
                setRecentTenants(JSON.parse(recent))
            }
        } catch (error) {
            console.error('Error loading recent tenants:', error)
        }
    }

    const saveRecentTenant = (tenantId: number) => {
        try {
            const recent = JSON.parse(
                localStorage.getItem('recent-tenants') || '[]',
            )
            const updated = [
                tenantId,
                ...recent.filter((id: number) => id !== tenantId),
            ].slice(0, 5)
            localStorage.setItem('recent-tenants', JSON.stringify(updated))
            setRecentTenants(updated)
        } catch (error) {
            console.error('Error saving recent tenant:', error)
        }
    }

    const filteredCustomers = customers.filter((customer) => {
        if (!searchQuery) return true

        const query = searchQuery.toLowerCase()
        return (
            customer.name.toLowerCase().includes(query) ||
            customer.subdomain?.toLowerCase().includes(query) ||
            customer.id?.toString().includes(query)
        )
    })

    const activeCustomers = filteredCustomers.filter((c) => c.isActive)
    const inactiveCustomers = filteredCustomers.filter((c) => !c.isActive)

    const recentCustomers = recentTenants
        .map((id) => customers.find((c) => c.id === id.toString()))
        .filter((c): c is CustomerDetailsResponse => c !== undefined)
        .slice(0, 3)

    const handleTenantSelect = (customerId: string) => {
        const numericId = parseInt(customerId, 10)
        onTenantSelect(numericId)
        saveRecentTenant(numericId)
    }

    const selectedCustomer = customers.find(
        (c) => c.id === selectedTenantId?.toString(),
    )

    const selectOptions = [
        // Recent customers first
        ...recentCustomers
            .filter((customer) => customer.id)
            .map((customer) => ({
                value: customer.id!,
                label: `🕒 ${customer.name} (${customer.subdomain})`,
            })),
        // Then active customers
        ...activeCustomers
            .filter(
                (customer) =>
                    customer.id &&
                    !recentCustomers.some(
                        (recent) => recent.id === customer.id,
                    ),
            )
            .map((customer) => ({
                value: customer.id!,
                label: `${customer.name} (${customer.subdomain})`,
            })),
        // Inactive customers at the end
        ...inactiveCustomers
            .filter((customer) => customer.id)
            .map((customer) => ({
                value: customer.id!,
                label: `${customer.name} (${customer.subdomain}) - Inactive`,
                isDisabled: true,
            })),
    ]

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Select Tenant
                </h3>

                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                        {selectedCustomer
                            ? `Current: ${selectedCustomer.name}`
                            : 'No tenant selected'}
                    </span>
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiRefresh />}
                        onClick={loadCustomers}
                        loading={isLoading}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Quick Search */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search Tenants
                </label>
                <Input
                    type="text"
                    placeholder="Search by name, subdomain, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    prefix={<HiSearch className="text-gray-400" />}
                    className="w-full"
                />
            </div>

            {/* Recent Tenants */}
            {recentCustomers.length > 0 && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recent Tenants
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {recentCustomers.map((customer) => (
                            <button
                                key={customer.id}
                                onClick={() => handleTenantSelect(customer.id!)}
                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                    selectedTenantId?.toString() === customer.id
                                        ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200'
                                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                                {customer.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tenant Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available Tenants ({filteredCustomers.length})
                </label>

                {isLoading || loading ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        Loading tenants...
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                        <div className="text-red-800 dark:text-red-200 text-sm">
                            Error: {error}
                        </div>
                    </div>
                ) : (
                    <Select
                        placeholder="Select a tenant..."
                        value={selectOptions.find(
                            (option) =>
                                option.value === selectedTenantId?.toString(),
                        )}
                        onChange={(option: any) =>
                            option ? handleTenantSelect(option.value) : null
                        }
                        options={selectOptions}
                        size="lg"
                        className="w-full"
                    />
                )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {activeCustomers.length}
                    </div>
                    <div className="text-xs text-gray-500">Active</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                        {inactiveCustomers.length}
                    </div>
                    <div className="text-xs text-gray-500">Inactive</div>
                </div>
                <div className="text-center">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {recentCustomers.length}
                    </div>
                    <div className="text-xs text-gray-500">Recent</div>
                </div>
            </div>

            {/* Selected Tenant Info */}
            {selectedCustomer && (
                <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Selected Tenant Details
                    </h4>
                    <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                        <div>
                            <strong>Name:</strong> {selectedCustomer.name}
                        </div>
                        <div>
                            <strong>Subdomain:</strong>{' '}
                            {selectedCustomer.subdomain || 'N/A'}
                        </div>
                        <div>
                            <strong>ID:</strong> {selectedCustomer.id}
                        </div>
                        <div>
                            <strong>Status:</strong>
                            <span
                                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                    selectedCustomer.isActive
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}
                            >
                                {selectedCustomer.isActive
                                    ? 'Active'
                                    : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TenantSelector

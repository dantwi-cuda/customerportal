import { useState, useMemo } from 'react'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import StatusIcon from '@/components/ui/StatusIcon'
import { HiPencil, HiTrash, HiEye, HiPlay, HiStop, HiSearch } from 'react-icons/hi'
import type { FeatureTableProps, FeatureResponse } from '@/@types/featureManagement'

const { Tr, Th, Td, THead, TBody } = Table

const FeatureTable = ({
  features = [],
  loading = false,
  onEdit,
  onDelete,
  onView,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  pagination,
  onPaginationChange
}: FeatureTableProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof FeatureResponse
    direction: 'asc' | 'desc'
  } | null>(null)

  // Filter and sort features
  const processedFeatures = useMemo(() => {
    let filtered = features

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = features.filter(feature =>
        feature.featureName.toLowerCase().includes(query) ||
        feature.featureKey.toLowerCase().includes(query) ||
        feature.description?.toLowerCase().includes(query) ||
        feature.category.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue === bValue) return 0

        const result = aValue < bValue ? -1 : 1
        return sortConfig.direction === 'asc' ? result : -result
      })
    }

    return filtered
  }, [features, searchQuery, sortConfig])

  // Pagination
  const paginatedFeatures = useMemo(() => {
    if (!pagination) return processedFeatures

    const startIndex = (pagination.page - 1) * pagination.pageSize
    return processedFeatures.slice(startIndex, startIndex + pagination.pageSize)
  }, [processedFeatures, pagination])

  const handleSort = (key: keyof FeatureResponse) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectAll = () => {
    if (!onSelectionChange) return

    const isAllSelected = selectedIds.length === paginatedFeatures.length
    const newSelection = isAllSelected 
      ? selectedIds.filter(id => !paginatedFeatures.some(f => f.featureId === id))
      : [...new Set([...selectedIds, ...paginatedFeatures.map(f => f.featureId)])]

    onSelectionChange(newSelection)
  }

  const handleSelectFeature = (featureId: string) => {
    if (!onSelectionChange) return

    const newSelection = selectedIds.includes(featureId)
      ? selectedIds.filter(id => id !== featureId)
      : [...selectedIds, featureId]

    onSelectionChange(newSelection)
  }

  const getCategoryStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'free':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'paid':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'premium':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
  }

  const getSortIcon = (key: keyof FeatureResponse) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="text-gray-400">↕</span>
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const isAllSelected = paginatedFeatures.length > 0 && 
    paginatedFeatures.every(feature => selectedIds.includes(feature.featureId))

  const isSomeSelected = paginatedFeatures.some(feature => selectedIds.includes(feature.featureId))

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="w-80">
          <Input
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<HiSearch className="text-gray-400" />}
          />
        </div>
        {selectable && selectedIds.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedIds.length} feature{selectedIds.length > 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <Table>
          <THead>
            <Tr>
              {selectable && (
                <Th className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </Th>
              )}
              <Th>
                <button
                  className="flex items-center space-x-1 font-medium hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => handleSort('featureName')}
                >
                  <span>Name</span>
                  {getSortIcon('featureName')}
                </button>
              </Th>
              <Th>
                <button
                  className="flex items-center space-x-1 font-medium hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => handleSort('featureKey')}
                >
                  <span>Key</span>
                  {getSortIcon('featureKey')}
                </button>
              </Th>
              <Th>
                <button
                  className="flex items-center space-x-1 font-medium hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => handleSort('category')}
                >
                  <span>Category</span>
                  {getSortIcon('category')}
                </button>
              </Th>
              <Th>
                <button
                  className="flex items-center space-x-1 font-medium hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => handleSort('isActive')}
                >
                  <span>Status</span>
                  {getSortIcon('isActive')}
                </button>
              </Th>
              <Th>Menu Path</Th>
              <Th>
                <button
                  className="flex items-center space-x-1 font-medium hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => handleSort('updatedAt')}
                >
                  <span>Last Updated</span>
                  {getSortIcon('updatedAt')}
                </button>
              </Th>
              <Th className="w-32">Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {loading ? (
              <Tr>
                <Td colSpan={selectable ? 8 : 7} className="text-center py-12">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Loading features...</span>
                  </div>
                </Td>
              </Tr>
            ) : paginatedFeatures.length === 0 ? (
              <Tr>
                <Td colSpan={selectable ? 8 : 7} className="text-center py-12 text-gray-500">
                  {searchQuery ? 'No features found matching your search' : 'No features available'}
                </Td>
              </Tr>
            ) : (
              paginatedFeatures.map((feature) => (
                <Tr key={feature.featureId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {selectable && (
                    <Td>
                      <Checkbox
                        checked={selectedIds.includes(feature.featureId)}
                        onChange={() => handleSelectFeature(feature.featureId)}
                      />
                    </Td>
                  )}
                  <Td>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {feature.featureName}
                      </div>
                      {feature.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {feature.description}
                        </div>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {feature.featureKey}
                    </code>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getCategoryStyle(feature.category)}`}>
                      {feature.category}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center">
                      <StatusIcon type={feature.isActive ? 'success' : 'danger'} />
                      <span className="ml-2 text-sm">
                        {feature.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                      {feature.menuPath || '-'}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(feature.updatedAt).toLocaleDateString()}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center space-x-1">
                      {onView && (
                        <Button
                          variant="plain"
                          size="sm"
                          icon={<HiEye />}
                          onClick={() => onView(feature)}
                          className="hover:bg-blue-100 dark:hover:bg-blue-800"
                        />
                      )}
                      {onEdit && (
                        <Button
                          variant="plain"
                          size="sm"
                          icon={<HiPencil />}
                          onClick={() => onEdit(feature)}
                          className="hover:bg-yellow-100 dark:hover:bg-yellow-800"
                        />
                      )}
                      <Button
                        variant="plain"
                        size="sm"
                        icon={feature.isActive ? <HiStop /> : <HiPlay />}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={feature.isActive ? 'Deactivate' : 'Activate'}
                      />
                      {onDelete && (
                        <Button
                          variant="plain"
                          size="sm"
                          icon={<HiTrash />}
                          onClick={() => onDelete(feature)}
                          className="hover:bg-red-100 dark:hover:bg-red-800 text-red-600"
                        />
                      )}
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </TBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && paginatedFeatures.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, processedFeatures.length)} of{' '}
            {processedFeatures.length} features
          </div>
          <Pagination
            currentPage={pagination.page}
            total={processedFeatures.length}
            pageSize={pagination.pageSize}
            onChange={(page) => onPaginationChange?.({ ...pagination, page })}
          />
        </div>
      )}
    </div>
  )
}

export default FeatureTable
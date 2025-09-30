import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Checkbox from '@/components/ui/Checkbox'
import Dropdown from '@/components/ui/Dropdown'
import StatusIcon from '@/components/ui/StatusIcon'
import Tooltip from '@/components/ui/Tooltip'
import { HiDotsVertical, HiPencil, HiTrash, HiEye, HiPlay, HiStop } from 'react-icons/hi'
import type { FeatureCardProps } from '@/@types/featureManagement'

const FeatureCard = ({
  feature,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
  isSelected = false,
  onSelect
}: FeatureCardProps) => {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleEdit = () => {
    onEdit?.(feature)
  }

  const handleDelete = () => {
    onDelete?.(feature)
  }

  const handleToggleStatus = () => {
    onToggleStatus?.(feature)
  }

  const handleSelect = () => {
    onSelect?.(feature.featureId)
  }

  const getCategoryColor = (category: string): string => {
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

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 
      <StatusIcon type="success" className="mr-2" /> : 
      <StatusIcon type="danger" className="mr-2" />
  }

  const dropdownItems = [
    {
      key: 'view',
      label: 'View Details',
      icon: <HiEye />,
      onClick: () => {/* TODO: Implement view details */}
    },
    {
      key: 'edit',
      label: 'Edit Feature',
      icon: <HiPencil />,
      onClick: handleEdit,
      hidden: !onEdit
    },
    {
      key: 'toggle',
      label: feature.isActive ? 'Deactivate' : 'Activate',
      icon: feature.isActive ? <HiStop /> : <HiPlay />,
      onClick: handleToggleStatus,
      hidden: !onToggleStatus
    },
    {
      key: 'delete',
      label: 'Delete Feature',
      icon: <HiTrash />,
      onClick: handleDelete,
      hidden: !onDelete,
      className: 'text-red-600 hover:text-red-700'
    }
  ]

  return (
    <Card 
      className={`
        relative transition-all duration-200 hover:shadow-lg
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-200' : ''}
        ${!feature.isActive ? 'opacity-75' : ''}
      `}
      bodyClass="p-4"
    >
      {/* Selection checkbox */}
      {onSelect && (
        <div className="absolute top-3 left-3">
          <Checkbox
            checked={isSelected}
            onChange={handleSelect}
            className="z-10"
          />
        </div>
      )}

      {/* Actions buttons */}
      {showActions && (
        <div className="absolute top-3 right-3 flex gap-1">
          {onEdit && (
            <Button
              variant="plain"
              size="sm"
              icon={<HiPencil />}
              onClick={handleEdit}
              className="hover:bg-blue-100 dark:hover:bg-blue-800"
            />
          )}
          {onToggleStatus && (
            <Button
              variant="plain"
              size="sm"
              icon={feature.isActive ? <HiStop /> : <HiPlay />}
              onClick={handleToggleStatus}
              className="hover:bg-yellow-100 dark:hover:bg-yellow-800"
            />
          )}
          {onDelete && (
            <Button
              variant="plain"
              size="sm"
              icon={<HiTrash />}
              onClick={handleDelete}
              className="hover:bg-red-100 dark:hover:bg-red-800 text-red-600"
            />
          )}
        </div>
      )}

      <div className={`${onSelect ? 'ml-8' : ''} ${showActions ? 'mr-8' : ''}`}>
        {/* Feature status and category */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {getStatusIcon(feature.isActive)}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {feature.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getCategoryColor(feature.category)}`}>
            {feature.category}
          </span>
        </div>

        {/* Feature name and key */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {feature.featureName}
          </h3>
          <code className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {feature.featureKey}
          </code>
        </div>

        {/* Description */}
        <div className="mb-3">
          <Tooltip
            title={feature.description}
            disabled={!showTooltip}
          >
            <p 
              className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {feature.description || 'No description available'}
            </p>
          </Tooltip>
        </div>

        {/* Menu path */}
        {feature.menuPath && (
          <div className="mb-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Menu Path:</span>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-mono">
              {feature.menuPath}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Date(feature.createdAt).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Updated:</span>{' '}
            {new Date(feature.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default FeatureCard
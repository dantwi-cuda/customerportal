import React, { useState, useEffect, useMemo } from 'react'
import {
    Card,
    Input,
    Button,
    Table,
    Pagination,
    Select,
    Tag,
    Notification,
    toast,
} from '@/components/ui'
import {
    HiOutlineSearch,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineAdjustments,
} from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import * as ShopAttributeService from '@/services/ShopAttributeService'
import type {
    ShopAttributeDto,
    AttributeCategoryDto,
    AttributeUnitDto,
} from '@/@types/shop'
import useAuth from '@/auth/useAuth'

interface TableColumn {
    header: string
    accessor: string
    sortable: boolean
    Cell?: (props: { row: ShopAttributeDto }) => React.ReactElement
}

const ShopAttributeListPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    // State management
    const [shopAttributes, setShopAttributes] = useState<ShopAttributeDto[]>([])
    const [categories, setCategories] = useState<AttributeCategoryDto[]>([])
    const [units, setUnits] = useState<AttributeUnitDto[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [selectedUnit, setSelectedUnit] = useState<string>('')

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10) // Check user permissions
    const hasPermissions = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    useEffect(() => {
        if (hasPermissions) {
            fetchData()
        }
    }, [hasPermissions])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [attributesData, categoriesData, unitsData] =
                await Promise.all([
                    ShopAttributeService.getShopAttributes(),
                    ShopAttributeService.getAttributeCategories(),
                    ShopAttributeService.getAttributeUnits(),
                ])

            setShopAttributes(attributesData)
            setCategories(categoriesData)
            setUnits(unitsData)
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to fetch shop attributes data
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    // Filter and search logic
    const filteredAttributes = useMemo(() => {
        let filtered = shopAttributes

        if (searchText) {
            filtered = filtered.filter(
                (attr) =>
                    attr.attributeName
                        ?.toLowerCase()
                        .includes(searchText.toLowerCase()) ||
                    attr.attributeType
                        ?.toLowerCase()
                        .includes(searchText.toLowerCase()) ||
                    attr.attributeCategoryDescription
                        ?.toLowerCase()
                        .includes(searchText.toLowerCase()),
            )
        }

        if (selectedCategory) {
            filtered = filtered.filter(
                (attr) =>
                    attr.attributeCategoryId === parseInt(selectedCategory),
            )
        }

        if (selectedUnit) {
            filtered = filtered.filter(
                (attr) => attr.attributeUnitId === parseInt(selectedUnit),
            )
        }

        return filtered
    }, [shopAttributes, searchText, selectedCategory, selectedUnit])

    // Pagination logic
    const totalItems = filteredAttributes.length
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedAttributes = filteredAttributes.slice(startIndex, endIndex)

    const handleDelete = async (id: number) => {
        if (
            window.confirm(
                'Are you sure you want to delete this shop attribute?',
            )
        ) {
            try {
                await ShopAttributeService.deleteShopAttribute(id)
                toast.push(
                    <Notification type="success" title="Success">
                        Shop attribute deleted successfully
                    </Notification>,
                )
                fetchData()
            } catch (error) {
                console.error('Error deleting shop attribute:', error)
                toast.push(
                    <Notification type="danger" title="Error">
                        Failed to delete shop attribute
                    </Notification>,
                )
            }
        }
    }

    const columns: TableColumn[] = [
        {
            header: 'Name',
            accessor: 'attributeName',
            sortable: true,
            Cell: ({ row }) => (
                <div>
                    <div className="font-semibold">
                        {row.attributeName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                        Type: {row.attributeType || 'N/A'}
                    </div>
                </div>
            ),
        },
        {
            header: 'Category',
            accessor: 'attributeCategoryDescription',
            sortable: true,
            Cell: ({ row }) => (
                <Tag className="bg-blue-100 text-blue-800">
                    {row.attributeCategoryDescription || 'N/A'}
                </Tag>
            ),
        },
        {
            header: 'Unit',
            accessor: 'attributeUnitType',
            sortable: true,
            Cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span>{row.attributeUnitType || 'N/A'}</span>
                    {row.attributeUnitIsTable && (
                        <Tag className="bg-green-100 text-green-800">Table</Tag>
                    )}
                </div>
            ),
        },
        {
            header: 'Sort Order',
            accessor: 'sortOrder',
            sortable: true,
            Cell: ({ row }) => (
                <span className="font-mono">{row.sortOrder}</span>
            ),
        },
        {
            header: 'Actions',
            accessor: 'actions',
            sortable: false,
            Cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<HiOutlinePencil />}
                        onClick={() =>
                            navigate(`/admin/shop-attributes/edit/${row.id}`)
                        }
                    >
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="plain"
                        color="red"
                        icon={<HiOutlineTrash />}
                        onClick={() => handleDelete(row.id)}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ]

    if (!hasPermissions) {
        return (
            <div className="p-4">
                <Card className="text-center p-8">
                    <h4 className="mb-2">Access Denied</h4>
                    <p>
                        You need CS-Admin or CS-User permissions to access shop
                        attribute management.
                    </p>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-2 sm:p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <HiOutlineAdjustments className="text-2xl text-blue-600" />
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Shop Attributes
                    </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage shop attributes, categories, and units
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 min-w-0">
                    <Input
                        prefix={<HiOutlineSearch className="text-lg" />}
                        placeholder="Search attributes..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Select
                        placeholder="All Categories"
                        value={
                            categories.find(
                                (cat) => cat.id.toString() === selectedCategory,
                            ) || null
                        }
                        options={categories.map((cat) => ({
                            value: cat.id.toString(),
                            label: cat.description || 'N/A',
                        }))}
                        onChange={(option) =>
                            setSelectedCategory(option?.value || '')
                        }
                        className="min-w-[200px]"
                    />
                    <Select
                        placeholder="All Units"
                        value={
                            units.find(
                                (unit) => unit.id.toString() === selectedUnit,
                            ) || null
                        }
                        options={units.map((unit) => ({
                            value: unit.id.toString(),
                            label: unit.type || 'N/A',
                        }))}
                        onChange={(option) =>
                            setSelectedUnit(option?.value || '')
                        }
                        className="min-w-[200px]"
                    />
                    <Button
                        variant="solid"
                        icon={<HiOutlinePlus />}
                        onClick={() =>
                            navigate('/admin/shop-attributes/create')
                        }
                    >
                        Add Attribute
                    </Button>
                </div>
            </div>

            {/* Management Links */}
            <div className="flex gap-4 mb-6">
                <Button
                    variant="twoTone"
                    color="blue"
                    onClick={() => navigate('/admin/attribute-categories')}
                >
                    Manage Categories
                </Button>
                <Button
                    variant="twoTone"
                    color="green"
                    onClick={() => navigate('/admin/attribute-units')}
                >
                    Manage Units
                </Button>
            </div>

            {/* Table */}
            <Card>
                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        <Table>
                            <Table.THead>
                                <Table.Tr>
                                    {columns.map((column) => (
                                        <Table.Th key={column.accessor}>
                                            {column.header}
                                        </Table.Th>
                                    ))}
                                </Table.Tr>
                            </Table.THead>
                            <Table.TBody>
                                {paginatedAttributes.length === 0 ? (
                                    <Table.Tr>
                                        <Table.Td
                                            colSpan={columns.length}
                                            className="text-center py-8"
                                        >
                                            <div className="text-gray-500">
                                                {searchText ||
                                                selectedCategory ||
                                                selectedUnit
                                                    ? 'No attributes match your filters'
                                                    : 'No shop attributes found'}
                                            </div>
                                        </Table.Td>
                                    </Table.Tr>
                                ) : (
                                    paginatedAttributes.map((attribute) => (
                                        <Table.Tr key={attribute.id}>
                                            {columns.map((column) => (
                                                <Table.Td key={column.accessor}>
                                                    {column.Cell ? (
                                                        <column.Cell
                                                            row={attribute}
                                                        />
                                                    ) : (
                                                        attribute[
                                                            column.accessor as keyof ShopAttributeDto
                                                        ]
                                                    )}
                                                </Table.Td>
                                            ))}
                                        </Table.Tr>
                                    ))
                                )}
                            </Table.TBody>
                        </Table>

                        {/* Pagination */}
                        {totalItems > pageSize && (
                            <div className="flex items-center justify-between mt-4 px-4 pb-4">
                                <div className="text-sm text-gray-500">
                                    Showing {startIndex + 1} to{' '}
                                    {Math.min(endIndex, totalItems)} of{' '}
                                    {totalItems} entries
                                </div>{' '}
                                <Pagination
                                    currentPage={currentPage}
                                    total={totalItems}
                                    pageSize={pageSize}
                                    onChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    )
}

export default ShopAttributeListPage

import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { Loading } from '@/components/shared'
import { HiOutlineArrowUp, HiOutlineArrowDown } from 'react-icons/hi'
import type { SalesByShop } from '@/@types/dashboard'

const { Tr, Th, Td, THead, TBody, Sorter } = Table

interface SalesTableProps {
    data: SalesByShop[]
    loading: boolean
}

const SalesTable = ({ data = [], loading }: SalesTableProps) => {
    const formatCurrency = (value: number) => {
        return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <THead>
                    <Tr>
                        <Th>
                            <Sorter>Shop Name</Sorter>
                        </Th>
                        <Th>
                            <Sorter>Revenue</Sorter>
                        </Th>
                        <Th>
                            <Sorter>RO Count</Sorter>
                        </Th>
                        <Th>
                            <Sorter>Labor Cost</Sorter>
                        </Th>
                        <Th>
                            <Sorter>Labor Hours</Sorter>
                        </Th>
                        <Th>
                            <Sorter>Growth</Sorter>
                        </Th>
                    </Tr>
                </THead>
                <TBody>
                    {loading ? (
                        <Tr>
                            <Td colSpan={6} className="text-center">
                                <Loading loading={true} size={40} />
                            </Td>
                        </Tr>
                    ) : data.length === 0 ? (
                        <Tr>
                            <Td colSpan={6} className="text-center">
                                No data available
                            </Td>
                        </Tr>
                    ) : (
                        data.map((shop) => (
                            <Tr key={shop.id}>
                                <Td>{shop.name}</Td>
                                <Td>{formatCurrency(shop.revenue)}</Td>
                                <Td>{shop.roCount.toLocaleString()}</Td>
                                <Td>{formatCurrency(shop.laborCost)}</Td>
                                <Td>{shop.laborHours.toLocaleString()}</Td>
                                <Td>
                                    <Badge
                                        className="flex items-center gap-1"
                                        innerClass={
                                            shop.growth >= 0
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-red-100 text-red-600'
                                        }
                                    >
                                        {shop.growth >= 0 ? (
                                            <HiOutlineArrowUp className="text-sm" />
                                        ) : (
                                            <HiOutlineArrowDown className="text-sm" />
                                        )}
                                        {Math.abs(shop.growth)}%
                                    </Badge>
                                </Td>
                            </Tr>
                        ))
                    )}
                </TBody>
            </Table>
        </div>
    )
}

export default SalesTable

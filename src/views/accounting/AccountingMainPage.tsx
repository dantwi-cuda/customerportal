import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '@/components/ui'
import { HiOutlineUpload, HiOutlineDocument } from 'react-icons/hi'

const AccountingMainPage = () => {
    const navigate = useNavigate()

    return (
        <div className="p-2 sm:p-4 space-y-4">
            <Card className="p-4 sm:p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    Accounting
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Chart of Accounts */}
                    <Card
                        className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() =>
                            navigate('/accounting/shop-chart-of-account')
                        }
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <HiOutlineDocument className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Chart of Accounts
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Manage and map shop chart of accounts
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Upload General Ledger */}
                    <Card
                        className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate('/accounting/upload-gl')}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <HiOutlineUpload className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Upload General Ledger
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Import general ledger entries from Excel
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </Card>
        </div>
    )
}

export default AccountingMainPage

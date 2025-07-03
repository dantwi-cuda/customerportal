import React, { useState, useEffect } from 'react'
import { Dialog, Button, Select, Notification, toast } from '@/components/ui'
import { Loading } from '@/components/shared'
import { UserDto } from '@/@types/user'
import { Shop } from '@/@types/shop'
import ShopService from '@/services/ShopService'

interface AssignShopsModalProps {
    isOpen: boolean
    onClose: () => void
    user: UserDto | null
    onSuccess?: () => void
}

interface ShopOption {
    value: number
    label: string
}

const AssignShopsModal: React.FC<AssignShopsModalProps> = ({
    isOpen,
    onClose,
    user,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false)
    const [shops, setShops] = useState<Shop[]>([])
    const [selectedShopIds, setSelectedShopIds] = useState<number[]>([])
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchShops()
        }
    }, [isOpen])    
    const fetchShops = async () => {
        setLoading(true)
        try {
            const shops = await ShopService.getShopsList()
            setShops(shops || [])
        } catch (error) {
            console.error('Failed to fetch shops:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to fetch shops
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!user?.id || selectedShopIds.length === 0) {
            toast.push(
                <Notification title="Warning" type="warning">
                    Please select at least one shop
                </Notification>,
            )
            return
        }

        setSubmitting(true)
        try {
            await ShopService.assignShopsToUser(user.id, selectedShopIds)
            toast.push(
                <Notification title="Success" type="success">
                    Shops assigned successfully
                </Notification>,
            )
            onSuccess?.()
            onClose()
        } catch (error) {
            console.error('Failed to assign shops:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to assign shops
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const shopOptions: ShopOption[] = shops.map((shop) => ({
        value: shop.id,
        label: `${shop.name} - ${shop.city}, ${shop.state}`,
    }))

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            width={600}
        >
            <div className="p-6">
                <h4 className="mb-4">
                    Assign Shops to {user?.name || user?.email}
                </h4>

                {loading ? (
                    <Loading loading={true} />
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Select Shops
                            </label>
                            <Select
                                isMulti
                                placeholder="Select shops to assign..."
                                options={shopOptions}
                                value={shopOptions.filter((option) =>
                                    selectedShopIds.includes(option.value),
                                )}
                                onChange={(selectedOptions) => {
                                    const shopIds =
                                        (selectedOptions as ShopOption[])?.map(
                                            (option) => option.value,
                                        ) || []
                                    setSelectedShopIds(shopIds)
                                }}
                            />
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                variant="plain"
                                onClick={onClose}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                onClick={handleSubmit}
                                loading={submitting}
                                disabled={
                                    submitting || selectedShopIds.length === 0
                                }
                            >
                                Assign Shops
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    )
}

export default AssignShopsModal

import { Dialog } from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import { HiExclamation } from 'react-icons/hi'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    content: string
    confirmButtonText?: string
    cancelButtonText?: string
    confirmButtonColor?: string
    danger?: boolean
}

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    content,
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    confirmButtonColor = 'red',
    danger = true,
}: ConfirmDialogProps) => {
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            title={title}
        >
            <div className="flex flex-col items-center gap-4 py-4">
                {danger && (
                    <div className="rounded-full bg-red-100 p-3 text-red-500 text-xl">
                        <HiExclamation />
                    </div>
                )}

                <div className="text-center">
                    <p className="mb-4">{content}</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="plain" onClick={onClose}>
                        {cancelButtonText}
                    </Button>
                    <Button
                        variant="solid"
                        color={danger ? confirmButtonColor : 'primary'}
                        onClick={onConfirm}
                    >
                        {confirmButtonText}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default ConfirmDialog

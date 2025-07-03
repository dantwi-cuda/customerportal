import React, { forwardRef } from 'react'
import classNames from 'classnames'
import { InputProps } from './Input' // Assuming similar props to Input

export type TextareaProps = InputProps &
    React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (props, ref) => {
        const { className, disabled, invalid, ...rest } = props

        const textareaClass = classNames(
            'form-textarea block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none',
            disabled && 'bg-gray-100 cursor-not-allowed',
            invalid && 'border-red-500',
            className,
        )

        return (
            <textarea
                ref={ref}
                className={textareaClass}
                disabled={disabled}
                {...rest}
            />
        )
    },
)

Textarea.displayName = 'Textarea'

export default Textarea

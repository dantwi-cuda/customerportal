import { cloneElement } from 'react'
import type { ReactNode } from 'react'
import type { CommonProps } from '@/@types/common'

interface SplitProps extends CommonProps {
    content?: ReactNode
}

const Split = ({ children, content, ...rest }: SplitProps) => {
    return (
        <div className="grid lg:grid-cols-2 h-full p-6 bg-white dark:bg-gray-800">
            <div className="bg-no-repeat bg-cover py-6 px-16 flex-col justify-end items-center hidden lg:flex bg-primary rounded-3xl overflow-hidden relative">
                <img
                    className="absolute inset-0 w-full h-full object-cover rounded-3xl"
                    src="/img/others/background3.png"
                    alt="Auth split illustration"
                />
                <div className="relative z-10 flex flex-col items-center justify-end h-full">
                    <div className="text-center max-w-[550px] flex-shrink-0 bg-primary/80 backdrop-blur-sm rounded-2xl p-6">
                        <h1 className="text-neutral">
                            <span className="font-bold">ClaimsCorp</span> Single
                            Source Portal
                        </h1>
                        <p className="text-neutral opacity-80 mx-auto mt-8 font-semibold">
                            ClaimsCorp Platform for Reporting, analytics, and
                            more.
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col justify-center items-center ">
                <div className="w-full xl:max-w-[450px] px-8 max-w-[380px]">
                    <div className="mb-8">{content}</div>
                    {children
                        ? cloneElement(children as React.ReactElement, {
                              ...rest,
                          })
                        : null}
                </div>
            </div>
        </div>
    )
}

export default Split

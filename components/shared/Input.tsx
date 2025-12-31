import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    icon?: React.ReactNode
    rightIcon?: React.ReactNode
    onRightIconClick?: () => void
}

export const Input = ({
    label,
    error,
    icon,
    rightIcon,
    onRightIconClick,
    className = '',
    id,
    ...props
}: InputProps) => {
    const inputId = id || props.name

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-text-sub">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
            block w-full rounded-xl border-2 bg-surface-light text-text-main placeholder-text-light
            focus:border-brand-500 focus:ring-0 transition-colors
            ${icon ? 'pl-10' : 'pl-4'}
            ${rightIcon ? 'pr-10' : 'pr-4'}
            ${error ? 'border-status-error' : 'border-surface-off'}
            py-2.5
          `}
                    {...props}
                />
                {rightIcon && (
                    <div
                        className={`absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted ${onRightIconClick ? 'cursor-pointer hover:text-text-main' : 'pointer-events-none'}`}
                        onClick={onRightIconClick}
                    >
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-xs text-status-error mt-1">{error}</p>
            )}
        </div>
    )
}

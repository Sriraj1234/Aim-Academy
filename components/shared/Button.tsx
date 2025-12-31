import React from 'react'
import { ImSpinner2 } from 'react-icons/im'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    fullWidth?: boolean
    loading?: boolean
    icon?: React.ReactNode
}

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    icon,
    className = '',
    disabled,
    ...props
}: ButtonProps) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95'

    const variants = {
        primary: 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-700 hover:to-brand-600 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50',
        secondary: 'bg-accent-500 text-white hover:bg-accent-600 shadow-lg shadow-accent-500/30 hover:shadow-accent-500/50',
        outline: 'border-2 border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-300',
        ghost: 'text-text-sub hover:bg-surface-off hover:text-brand-600',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
        xl: 'px-8 py-4 text-xl font-bold',
    }

    return (
        <button
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ImSpinner2 className="animate-spin mr-2" />
            ) : icon ? (
                <span className="mr-2">{icon}</span>
            ) : null}
            {children}
        </button>
    )
}

import React from 'react'
import { cn } from '@/lib/utils'

interface ClarityInputProps {
  label?: string
  id?: string
  name?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  error?: string
  helpText?: string
  className?: string
  inputClassName?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const ClarityInput: React.FC<ClarityInputProps> = ({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  error,
  helpText,
  className,
  inputClassName,
  icon,
  iconPosition = 'left'
}) => {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-')
  
  const containerClasses = cn('space-y-2', className)
  
  const inputClasses = cn(
    'w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-cardinal focus:border-cardinal transition-colors',
    error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
    icon && iconPosition === 'left' && 'pl-12',
    icon && iconPosition === 'right' && 'pr-12',
    disabled && 'opacity-60 cursor-not-allowed',
    inputClassName
  )
  
  const iconClasses = cn(
    'absolute top-1/2 transform -translate-y-1/2 text-gray-600',
    'pointer-events-none',
    iconPosition === 'left' ? 'left-4' : 'right-4'
  )
  
  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-800">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className={iconClasses}>
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : 
            helpText ? `${inputId}-help` : undefined
          }
          className={inputClasses}
        />
      </div>
      
      {error && (
        <div id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div id={`${inputId}-help`} className="text-sm text-gray-600 mt-1">
          {helpText}
        </div>
      )}
    </div>
  )
}

export default ClarityInput

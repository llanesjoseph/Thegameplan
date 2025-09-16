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
  
  const containerClasses = cn(
    'clarity-input-container',
    className
  )
  
  const inputClasses = cn(
    'clarity-input',
    error && 'error',
    icon && iconPosition === 'left' && 'pl-12',
    icon && iconPosition === 'right' && 'pr-12',
    disabled && 'opacity-60 cursor-not-allowed',
    inputClassName
  )
  
  const iconClasses = cn(
    'absolute top-1/2 transform -translate-y-1/2 text-clarity-text-secondary',
    'pointer-events-none',
    iconPosition === 'left' ? 'left-4' : 'right-4'
  )
  
  return (
    <div className={containerClasses}>
      {label && (
        <label 
          htmlFor={inputId}
          className="clarity-label"
        >
          {label}
          {required && <span className="text-clarity-error ml-1">*</span>}
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
        <div 
          id={`${inputId}-error`}
          className="clarity-input-error"
          role="alert"
        >
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div 
          id={`${inputId}-help`}
          className="text-caption text-clarity-text-secondary mt-1"
        >
          {helpText}
        </div>
      )}
    </div>
  )
}

export default ClarityInput

import { forwardRef } from 'react'

const Input = forwardRef(
  ({ label, error, helpText, className = '', ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg text-gray-900
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

export const Textarea = forwardRef(
  ({ label, error, helpText, className = '', rows = 3, ...props }, ref) => {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`
            w-full px-3 py-2 border rounded-lg text-gray-900
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed resize-none
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

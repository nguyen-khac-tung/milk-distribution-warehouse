import React, { useState, useEffect, useRef } from "react"
import { ComponentIcon } from "../IconComponent/Icon"

export default function CustomDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  loading, 
  className = "",
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`h-8 w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-orange-500 focus:outline-none bg-white hover:border-orange-500 hover:shadow-sm transition-all duration-200 text-left flex items-center justify-between text-sm ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className={selectedOption ? "text-slate-900" : "text-slate-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ComponentIcon 
          name={isOpen ? "up" : "down"} 
          size={10} 
          color="#6b7280" 
        />
      </button>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-slate-500">Đang tải...</div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 text-left hover:bg-orange-500 hover:text-white transition-colors duration-200 ${
                  value === option.value ? "bg-orange-500 text-white" : "text-slate-900"
                }`}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

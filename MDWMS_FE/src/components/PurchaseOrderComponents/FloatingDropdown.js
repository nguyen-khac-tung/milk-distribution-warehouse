import React, { useState, useEffect, useRef } from "react";

const FloatingDropdown = ({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    loading, 
    disabled = false 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const selectedOption = options.find(option => option.value === value);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`h-[38px] w-full px-3 py-2 border border-slate-300 rounded-md focus:border-orange-500 focus:ring-orange-500 focus:outline-none bg-white hover:border-orange-500 hover:shadow-sm transition-all duration-200 text-left flex items-center justify-between text-sm ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
            >
                <span className={selectedOption ? "text-slate-900" : "text-slate-500"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
            </button>
            
            {isOpen && !disabled && (
                <div 
                    className="absolute z-[999999] w-full mt-1 bg-white border border-slate-300 rounded-md shadow-2xl max-h-60 overflow-auto"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 999999
                    }}
                >
                    {loading ? (
                        <div className="px-3 py-2 text-slate-500">Đang tải...</div>
                    ) : (
                        options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
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
    );
};

export default FloatingDropdown;

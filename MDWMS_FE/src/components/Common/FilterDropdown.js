import React, { useState, useEffect } from "react";
import { Filter, ChevronDown } from "lucide-react";

const FilterDropdown = ({ 
    type, 
    value, 
    onFilterChange, 
    onClearFilter, 
    options = [], 
    placeholder = "Tất cả",
    className = "",
    title = ""
}) => {
    const [showDropdown, setShowDropdown] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest(`.${className}`)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown, className]);

    const handleOptionClick = (optionValue) => {
        onFilterChange(optionValue);
        setShowDropdown(false);
    };

    const handleClearClick = () => {
        onClearFilter();
        setShowDropdown(false);
    };

    const getDisplayValue = () => {
        if (!value) return placeholder;
        const option = options.find(opt => opt.value === value);
        return option ? option.label : placeholder;
    };

    const getButtonStyle = () => {
        const baseStyle = {
            padding: "4px",
            borderRadius: "4px",
            border: "none",
            background: value ? "rgba(255,255,255,0.3)" : "transparent",
            cursor: "pointer",
            color: "white"
        };

        if (type === "pageSize") {
            return {
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                background: "white",
                cursor: "pointer",
                color: "#374151"
            };
        }

        return baseStyle;
    };

    const getDropdownStyle = () => {
        const baseStyle = {
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            width: "192px",
            backgroundColor: "white",
            borderRadius: "6px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            border: "1px solid #e2e8f0",
            zIndex: 10
        };

        if (type === "pageSize") {
            return {
                ...baseStyle,
                top: "auto",
                bottom: "100%",
                marginTop: 0,
                marginBottom: "4px",
                width: "80px"
            };
        }

        return baseStyle;
    };

    const getOptionStyle = (optionValue) => {
        const isSelected = value === optionValue;
        const baseStyle = {
            width: "100%",
            textAlign: "left",
            padding: "8px 16px",
            fontSize: "14px",
            color: "#374151",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
        };

        if (type === "pageSize") {
            return {
                ...baseStyle,
                padding: "8px 12px",
                background: isSelected ? "#237486" : "white",
                color: isSelected ? "white" : "#374151"
            };
        }

        return baseStyle;
    };

    return (
        <div style={{ position: "relative" }} className={className}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={getButtonStyle()}
                title={title}
            >
                {type === "pageSize" ? (
                    <>
                        <span>{getDisplayValue()}</span>
                        <ChevronDown style={{ height: "16px", width: "16px" }} />
                    </>
                ) : (
                    <Filter style={{ height: "16px", width: "16px" }} />
                )}
            </button>

            {showDropdown && (
                <div style={getDropdownStyle()}>
                    <div style={{ padding: "4px 0" }}>
                        {/* Clear/All option - only show for non-pageSize types */}
                        {type !== "pageSize" && (
                            <button
                                onClick={handleClearClick}
                                style={getOptionStyle(null)}
                            >
                                {placeholder}
                                {!value && <span style={{ color: "#237486" }}>✓</span>}
                            </button>
                        )}

                        {/* Filter options */}
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleOptionClick(option.value)}
                                style={getOptionStyle(option.value)}
                            >
                                {option.label}
                                {value === option.value && (
                                    <span style={{ color: type === "pageSize" ? "white" : "#237486" }}>✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterDropdown;

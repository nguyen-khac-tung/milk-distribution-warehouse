import React from "react";
import { X, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";

export default function ClearFiltersButton({
  onClear,
  hasActiveFilters = false,
  buttonText = "Bỏ lọc",
  variant = "outline",
  size = "sm",
  showIcon = true,
  className = ""
}) {

  const handleClick = () => {
    
    if (onClear) {
      console.log("Calling onClear function");
      onClear();
    } else {
      console.log("No onClear function provided");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`flex items-center space-x-2 text-slate-600 hover:text-orange-500 hover:border-orange-500 transition-colors ${className}`}
    >
      {showIcon && (
        <RotateCcw className="h-4 w-4" />
      )}
      <span>{buttonText}</span>
    </Button>
  );
}

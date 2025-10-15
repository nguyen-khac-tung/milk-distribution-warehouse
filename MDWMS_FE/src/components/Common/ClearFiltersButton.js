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

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClear}
      className={`flex items-center space-x-2 text-slate-600 hover:text-orange-500 hover:border-orange-500 transition-colors ${className}`}
    >
      {showIcon && (
        <RotateCcw className="h-4 w-4" />
      )}
      <span>{buttonText}</span>
    </Button>
  );
}

import React from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function DisableFieldWrapper({ 
  isDisabled, 
  label, 
  id, 
  placeholder, 
  value, 
  onChange, 
  type = "text",
  required = false,
  className = ""
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label} {required && "*"}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={isDisabled ? "Không thể chỉnh sửa" : placeholder}
        value={value}
        onChange={onChange}
        disabled={isDisabled}
        className={`h-[38px] border-slate-300 focus:border-orange-500 focus:ring-orange-500 focus-visible:ring-orange-500 rounded-lg ${
          isDisabled 
            ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200" 
            : ""
        } ${className}`}
        required={required}
      />
      {isDisabled && (
        <p className="text-xs text-gray-500 mt-1">
          Trường này không thể chỉnh sửa
        </p>
      )}
    </div>
  );
}

import React from "react"
import { Button } from "../ui/button"

export default function EmptyState({
  icon: Icon,
  title = "Không tìm thấy dữ liệu",
  description = "Chưa có dữ liệu nào trong hệ thống",
  actionText = "Xóa bộ lọc",
  onAction,
  showAction = false,
  colSpan = 6,
  className = ""
}) {
  return (
    <tr>
      <td colSpan={colSpan} className={`text-center py-16 ${className}`}>
        <div className="flex flex-col items-center justify-center space-y-4">
          {Icon && (
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Icon className="h-8 w-8 text-slate-400" />
            </div>
          )}
          <div className="text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500">{description}</p>
          </div>
          {showAction && onAction && (
            <Button
              onClick={onAction}
              variant="outline"
              className="mt-4"
            >
              {actionText}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

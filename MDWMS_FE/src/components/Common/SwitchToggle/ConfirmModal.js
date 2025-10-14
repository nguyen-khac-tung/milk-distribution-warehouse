import { cn } from "../../../utils/cn"

export function ConfirmModal({ isOpen, onConfirm, onCancel, message }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl p-5 w-[90%] max-w-xs animate-in fade-in zoom-in duration-200">
        <h3 className="text-base font-semibold text-slate-900 mb-1.5">Xác nhận</h3>
        <p className="text-sm text-slate-600 mb-5">{message}</p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            style={{backgroundColor:"#cbbbb3ff",  border: "2px solid #9c9e9eff",}}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              "bg-slate-100 text-white hover:bg-slate-200",
              "active:scale-95",
            )}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            style={{backgroundColor:"#237486"}}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              "bg-blue-500 text-white",
              "active:scale-95",
            )}
          >
            Chấp nhận
          </button>
        </div>
      </div>
    </div>
  )
}

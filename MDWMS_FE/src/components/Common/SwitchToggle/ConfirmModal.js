import { cn } from "../../../utils/cn"

export function ConfirmModal({ isOpen, onConfirm, onCancel, message }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-lg shadow-2xl p-6 w-[90%] max-w-md">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Xác nhận</h3>
        <p className="text-sm text-slate-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="h-8 px-6 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="h-8 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Chấp nhận
          </button>
        </div>
      </div>
    </div>
  )
}

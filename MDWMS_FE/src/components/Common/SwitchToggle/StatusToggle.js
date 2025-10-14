import { useState } from "react"
import { ToggleSwitch } from "./Switch"
import { ConfirmModal } from "./ConfirmModal"

export function StatusToggle({ 
  status, 
  onStatusChange, 
  supplierId, 
  supplierName,
  disabled = false 
}) {
  const [showModal, setShowModal] = useState(false)
  const [pendingValue, setPendingValue] = useState(false)

  // Convert status (1 = active, 2 = inactive) to boolean (true = active, false = inactive)
  const isActive = status === 1

  const handleToggleRequest = (newValue) => {
    if (disabled) return
    
    setPendingValue(newValue)
    setShowModal(true)
  }

  const handleConfirm = () => {
    // Convert boolean back to status (true = 1, false = 2)
    const newStatus = pendingValue ? 1 : 2
    onStatusChange(supplierId, newStatus)
    setShowModal(false)
  }

  const handleCancel = () => {
    setShowModal(false)
  }

  return (
    <>
      <ToggleSwitch 
        checked={isActive} 
        onChange={handleToggleRequest} 
        variant="minimal"
        disabled={disabled}
      />
      
      <ConfirmModal
        isOpen={showModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        message={
          pendingValue 
            ? `Bạn có chắc muốn kích hoạt nhà cung cấp "${supplierName}"?` 
            : `Bạn có chắc muốn ngừng hoạt động nhà cung cấp "${supplierName}"?`
        }
      />
    </>
  )
}

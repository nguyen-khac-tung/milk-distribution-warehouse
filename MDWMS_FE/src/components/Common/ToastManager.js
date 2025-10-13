import React, { useState, useCallback } from 'react'
import Toast from './Toast'

const ToastManager = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, duration }
    setToasts(prevToasts => [...prevToasts, newToast])
    
    return id
  }, [])
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }, [])

  // Expose methods globally
  React.useEffect(() => {
    window.showToast = addToast
    window.removeToast = removeToast
  }, [addToast, removeToast])

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

export default ToastManager

import { cn } from "../../../utils/cn"

export function ToggleSwitch({ checked, onChange, variant = "minimal", disabled = false }) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ease-in-out cursor-pointer",
        checked ? "bg-orange-500" : "bg-slate-300",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

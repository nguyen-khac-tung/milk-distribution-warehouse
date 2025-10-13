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
        "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out cursor-pointer",
        checked ? "bg-[#237486]" : "bg-slate-300",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out",
          checked ? "translate-x-6" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

import movementIcon from '../assets/movementcard.svg'
import multiIcon from '../assets/multicard.svg'

const OPTIONS = [
  { value: 'movement', label: 'Following card', icon: movementIcon },
  { value: 'multi', label: 'Popping images', icon: multiIcon },
]

// Switches the hero between the cursor-following card and the pop-up images.
// The unselected option is ~30% duller and shorter.
export default function CursorModeToggle({ mode, onChange, className = '' }) {
  return (
    <div className={`flex items-end gap-2 ${className}`} role="group" aria-label="Hero cursor style">
      {OPTIONS.map(({ value, label, icon }) => {
        const active = mode === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={label}
            onClick={() => onChange(value)}
            className="flex cursor-pointer items-end p-1"
          >
            <img
              src={icon}
              alt=""
              draggable={false}
              className="origin-bottom transition-all duration-200"
              style={{ opacity: active ? 1 : 0.7, transform: active ? 'none' : 'scale(0.85)' }}
            />
          </button>
        )
      })}
    </div>
  )
}

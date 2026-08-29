import { COMMIT_THRESHOLD } from '../lib/chargeGate'

// Secondary feedback for the scene charge gates (see chargeGate.js) — the
// scene itself scrubs with the charge (forward or backward), this bar is
// just a quiet progress cue right below the scroll-hint text (see
// PosterGallery's shared centered wrapper). Charge is signed; the bar only
// cares about magnitude. Normalized against COMMIT_THRESHOLD so it reads
// 0-100% over the range that actually matters — full at the point the gate
// commits, not stuck looking half-empty right when it fires.
export default function ScrollChargeIndicator({ visible, charge }) {
  const pct = Math.round(Math.min(1, Math.abs(charge || 0) / COMMIT_THRESHOLD) * 100)

  return (
    <div
      className="pointer-events-none flex justify-center"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }}
    >
      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white"
          style={{
            width: `${pct}%`,
            transition: pct === 0 ? 'width 0.4s ease' : 'none',
          }}
        />
      </div>
    </div>
  )
}

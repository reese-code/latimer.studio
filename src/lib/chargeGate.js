// Shared "charge and release" physics for the scroll gates between homepage
// scenes (scene_1 -> scene_2, scene_2 -> posters). Charge is signed: forward
// scroll builds it toward +1 (against resistance that grows as it nears
// full), backward scroll builds it toward -1 the same way. Scrolling against
// the current charge releases it quickly back toward 0 first, rather than
// fighting the resistance curve in the new direction. Idle time decays
// charge of either sign back to 0 (the spring-back). Tuned in one place so
// both gates feel consistent in both directions.
//
// The gate doesn't require a full charge of 1 to commit — crossing
// COMMIT_THRESHOLD is the point of no return, same idea as a swipe-to-
// dismiss gesture: get it about halfway and it carries through on its own,
// let go short of that and it's slung back to rest. The 0..COMMIT_THRESHOLD
// range still maps to the gate's full visual scrub (see the peek-drawing
// effects in PosterGallery), so it *reads* as scrolling further per pixel
// of input, not less.
const CHARGE_PER_PIXEL = 0.0034
const RESISTANCE = 0.45
const RELEASE_MULTIPLIER = 1.4
export const COMMIT_THRESHOLD = 0.5
export const GATE_IDLE_MS = 90
// Exponential decay constant (per second) for the spring-back once a gate
// goes idle without committing — charge falls fast at first (the "sling")
// and eases smoothly into zero as it gets close, rather than ticking down
// at a constant linear rate.
const DECAY_RATE = 3.4

export function nextCharge(charge, deltaY) {
  if (deltaY === 0) return charge

  const dir = deltaY > 0 ? 1 : -1
  const magnitude = Math.abs(deltaY)

  // Scrolling opposite to the current charge — release it back toward 0
  // fast rather than resisting into the new direction immediately.
  if (charge !== 0 && Math.sign(charge) !== dir) {
    const released = charge + dir * magnitude * CHARGE_PER_PIXEL * RELEASE_MULTIPLIER
    return Math.sign(released) === Math.sign(charge) ? released : 0
  }

  const gain = magnitude * CHARGE_PER_PIXEL * (1 - Math.abs(charge) * RESISTANCE)
  const next = charge + dir * gain
  return Math.max(-1, Math.min(1, next))
}

export function decayCharge(charge, dt) {
  if (charge === 0) return 0
  const eased = charge * Math.exp(-DECAY_RATE * dt)
  return Math.abs(eased) < 0.004 ? 0 : eased
}

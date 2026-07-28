// Shared "charge and release" physics for the scroll gates between homepage
// scenes (scene_1 -> scene_2, scene_2 -> posters). Charge is signed: forward
// scroll builds it toward +1 (against resistance that grows as it nears
// full), backward scroll builds it toward -1 the same way. Scrolling against
// the current charge releases it quickly back toward 0 first, rather than
// fighting the resistance curve in the new direction. Idle time decays
// charge of either sign back to 0 (the spring-back). Tuned in one place so
// both gates feel consistent in both directions.
const CHARGE_PER_PIXEL = 0.0034
const RESISTANCE = 0.45
const RELEASE_MULTIPLIER = 1.4
export const DECAY_PER_SECOND = 1.5
export const GATE_IDLE_MS = 90

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
  if (charge > 0) return Math.max(0, charge - DECAY_PER_SECOND * dt)
  if (charge < 0) return Math.min(0, charge + DECAY_PER_SECOND * dt)
  return charge
}

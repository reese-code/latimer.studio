// Shared with HomePage's scroll-jack lock (see HomePage.jsx) so the nav
// ticket's PROJECTS link can jump straight to the poster gallery at the
// same scroll position the lock itself settles at.
export const POSTER_LOCK_PROGRESS = 0.6

export function getPosterLockY() {
  return (document.body.scrollHeight - window.innerHeight) * POSTER_LOCK_PROGRESS
}

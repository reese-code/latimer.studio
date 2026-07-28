// The homepage experience (scene_1 -> scene_2 -> poster gallery) lives
// entirely inside PosterGallery and is driven by scroll-charge gates, not
// document scroll position — there's nothing for TicketMenu's HOME/PROJECTS
// links to scroll to anymore. PosterGallery registers a small imperative
// control surface here instead, so code outside its component tree can
// still reset it or jump straight to the poster gallery. Same pattern as
// useLenis's getLenis().
let controls = null

export function setGalleryControls(c) {
  controls = c
}

export function getGalleryControls() {
  return controls
}

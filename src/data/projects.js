import ciaoPoster from '../assets/ciao_poster.png'
import forgePoster from '../assets/forge_poster.png'
import studioRoPoster from '../assets/studioro_poster.png'

// Single source of truth for project metadata — used by both the
// poster gallery / ticket UI and the individual project pages.
export const PROJECTS = [
  {
    id: 'ciao',
    label: 'CIAO',
    number: '01',
    year: '2024',
    type: 'Brand Identity',
    poster: ciaoPoster,
    tags: ['Identity', 'Typography', 'Print'],
    description:
      'A warm, expressive identity rooted in Italian culture and modernist craft. Ciao brings together typographic warmth and considered simplicity.',
  },
  {
    id: 'studioro',
    label: 'STUDIO RO',
    number: '02',
    year: '2023',
    type: 'Creative Direction',
    poster: studioRoPoster,
    tags: ['Direction', 'Spatial', 'Graphic'],
    description:
      'Creative direction for a multidisciplinary design practice. Studio RO operates across interior, graphic, and spatial design disciplines.',
  },
  {
    id: 'forge',
    label: 'FORGE',
    number: '03',
    year: '2024',
    type: 'Digital Product',
    poster: forgePoster,
    tags: ['Product', 'UI/UX', 'Digital'],
    description:
      'A product studio building tools at the intersection of craft and technology. Forge is built for makers who think with their hands.',
  },
]

export function projectById(id) {
  return PROJECTS.find((p) => p.id === id)
}

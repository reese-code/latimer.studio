import ciaoPoster from '../assets/ciao_poster.png'
import forgePoster from '../assets/forge_poster.png'
import studioRoPoster from '../assets/studioro_poster.png'

// Single source of truth for project metadata — used by both the
// poster gallery / ticket UI and the individual project pages.
export const PROJECTS = [
  {
    id: 'ciao',
    label: 'Ciao',
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
    label: 'Studio Ro',
    number: '02',

    year: '2025',
    type: 'Creative Direction',
    industry: 'Dance',
    category: 'Personal Portfolio',
    date: '2025',
    tagline: 'A dance and creative platform based in Los Angeles',
    siteUrl: '#',
    poster: studioRoPoster,
    tags: ['Direction', 'Spatial', 'Graphic'],
    description:
      'Creative direction for a multidisciplinary design practice. Studio RO operates across interior, graphic, and spatial design disciplines.',
    overview: [
      'Founded by Rocío Colomer Jordà — a multidisciplinary artist blending technique, Latin rhythm, and powerful feminine energy. Professional dancer, choreographer, instructor, and creative director, brought together under one vision.',
      'Helping dancers connect with their sensuality, strength, and artistic identity. As a choreographer and creative director, she develops concepts that highlight personality, texture, and a cinematic approach to movement.',
    ],
    tools: ['GSAP', 'Figma', 'Sanity', 'React'],
    services: ['Branding', 'Strategy', 'UX/UI', 'Web Development'],
    storySections: [
      {
        number: '01',
        title: 'Bringing the studio to the web',
        paragraph:
          'Founded by Rocío Colomer Jordà — a multidisciplinary artist blending technique, Latin rhythm, and powerful feminine energy. Professional dancer, choreographer, instructor, and creative director, brought together under one vision.',
        image: studioRoPoster,
      },
      {
        number: '02',
        title: 'A cinematic approach to movement',
        paragraph:
          'Helping dancers connect with their sensuality, strength, and artistic identity. As a choreographer and creative director, she develops concepts that highlight personality, texture, and a cinematic approach to movement.',
        image: studioRoPoster,
      },
      {
        number: '03',
        title: 'Direction across every discipline',
        paragraph:
          'Creative direction for a multidisciplinary design practice. Studio RO operates across interior, graphic, and spatial design disciplines — unified by one consistent, considered point of view.',
        image: studioRoPoster,
      },
    ],
    testimonial: {
      name: 'Rocío Colomer Jordà',
      quote:
        'Helping dancers connect with their sensuality, strength, and artistic identity. As a choreographer and creative director, she develops concepts that highlight personality, texture, and a cinematic approach to movement.',
    },
  },
  {
    id: 'forge',
    label: 'Forge',
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

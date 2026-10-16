// Shared by the homepage Services list and the /services/:slug pages.
// Copy is placeholder — replace with the real thing.
export const SERVICES = [
  {
    slug: 'art-direction',
    label: 'Art Direction',
    blurb: 'Shaping the look',
    paragraphs: [
      'Art direction is where your site gets its point of view. We define the visual language — type, color, imagery, and motion — so every page feels like it came from one confident voice.',
      'You get a clear creative direction backed by references and rationale, not just a pretty mood board. Every choice is tied back to how your customers shop and what makes them buy.',
    ],
  },
  {
    slug: 'development',
    label: 'Development',
    blurb: 'Building the site',
    paragraphs: [
      'We build fast, custom sites in React with an easy-to-edit CRM, so you can update products, copy, and images without calling a developer.',
      'Performance, accessibility, and clean code come standard. Your site loads quickly, works on every device, and is ready to grow with your business.',
    ],
  },
  {
    slug: 'ui-ux-design',
    label: 'UI/UX Design',
    blurb: 'Designing the site',
    paragraphs: [
      'Good design guides visitors from landing page to checkout without making them think. We map the journey, then design every screen around it.',
      'Layouts are tested against real behavior and refined with data, so decisions come from how people actually use your site, not guesswork.',
    ],
  },
  {
    slug: 'seo-audit',
    label: 'SEO Audit',
    blurb: 'Getting you found',
    paragraphs: [
      'A beautiful site only works if people can find it. We audit your structure, content, speed, and metadata to uncover what is holding your rankings back.',
      'You receive a prioritized action list in plain language, with the quick wins first, so you know exactly what to fix and why it matters.',
    ],
  },
  {
    slug: 'branding',
    label: 'Branding',
    blurb: 'Defining the identity',
    paragraphs: [
      'Your brand is more than a logo. We shape the name, voice, and visual identity that make your business recognizable and trusted at a glance.',
      'The result is a flexible identity system that carries across your website, packaging, and social, built to stay consistent as you scale.',
    ],
  },
]

export const getService = (slug) => SERVICES.find((s) => s.slug === slug)

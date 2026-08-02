// GROQ queries. Image fields are flattened to a plain URL string
// (`asset->url`) at query time so consuming components can keep doing
// `<img src={project.poster} />` exactly as they did with the old static
// `src/data/projects.js` imports — no `urlFor()` needed at every call site.
const PROJECT_FIELDS = `
  "id": slug.current,
  title,
  "label": title,
  number,
  year,
  type,
  industry,
  category,
  date,
  tagline,
  siteUrl,
  "poster": poster.asset->url,
  tags,
  description,
  overview,
  tools,
  services,
  "storySections": storySections[]{
    number,
    title,
    paragraph,
    "image": image.asset->url,
  },
  testimonial,
`

export const projectsQuery = `*[_type == "project"] | order(orderRank asc) { ${PROJECT_FIELDS} }`

export const projectBySlugQuery = `*[_type == "project" && slug.current == $slug][0] { ${PROJECT_FIELDS} }`

export const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  aboutCopy,
  footerTaglines,
  contactLinks,
  typeformId,
}`

export const privacyPolicyQuery = `*[_type == "privacyPolicy"][0]{
  title,
  sections,
}`

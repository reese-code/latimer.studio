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
    combos[]{
      paragraph,
      "image": image.asset->url,
      "video": video.asset->url,
    },
  },
  testimonial,
`

export const projectsQuery = `*[_type == "project"] | order(orderRank asc) { ${PROJECT_FIELDS} }`

export const projectBySlugQuery = `*[_type == "project" && slug.current == $slug][0] { ${PROJECT_FIELDS} }`

export const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  aboutCopy,
  "aboutImage": aboutImage.asset->url,
  "heroTrailImages": heroTrailImages[].asset->url,
  footerTaglines,
  contactLinks,
  typeformId,
}`

export const privacyPolicyQuery = `*[_type == "privacyPolicy"][0]{
  title,
  sections,
}`

export const homeQuery = `*[_type == "home"][0]{
  "hero": hero{
    "images": images[].asset->url,
    text,
  },
  "pricing": pricing{
    ...,
    "plans": plans[]{ ..., "durationIcon": durationIcon.asset->url },
  },
  "about": about{
    label,
    paragraphs,
    buttonLabel,
    buttonHref,
    "slides": slides[]{ "image": image.asset->url },
  },
  "faqs": faqs{
    label,
    title,
    buttonLabel,
    buttonHref,
    "items": items[]{ _key, question, overview, buttonLabel, "slug": article->slug.current },
  },
}`

export const aboutPageQuery = `*[_type == "aboutPage"][0]{
  "founderLetter": founderLetter{
    label,
    title,
    paragraphs,
    "image": image.asset->url,
    buttonLabel,
    buttonHref,
  },
}`

export const infoPageQuery = `*[_type == "infoPage"][0]{
  heading,
  subheading,
}`

// Flattened list fields only — enough for the Info listing (and the
// "related articles" strip), which just needs title/date/preview image.
const ARTICLE_LIST_FIELDS = `
  "id": slug.current,
  title,
  date,
  "previewImage": previewImage.asset->url,
`

export const articlesQuery = `*[_type == "article"] | order(date desc) { ${ARTICLE_LIST_FIELDS} }`

const ARTICLE_STORY_SECTIONS = `
  "storySections": storySections[]{
    number,
    title,
    combos[]{
      paragraph,
      "image": image.asset->url,
      "video": video.asset->url,
    },
  },
`

export const articleBySlugQuery = `*[_type == "article" && slug.current == $slug][0]{
  ${ARTICLE_LIST_FIELDS}
  subheading,
  author,
  "authorIcon": authorIcon.asset->url,
  excerpt,
  storyRatio,
  ${ARTICLE_STORY_SECTIONS}
}`

export const servicesQuery = `*[_type == "service"] | order(order asc) {
  "slug": slug.current,
  "label": title,
  blurb,
  "image": image.asset->url,
  "about": about{
    label,
    paragraphs,
    buttonLabel,
    buttonHref,
    "slides": slides[]{ "image": image.asset->url },
  },
}`

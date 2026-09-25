import { defineField, defineType } from 'sanity'

// The same numbered-section "combo" shape used by project.js's storySections
// — kept in sync deliberately so an article's accordion behaves and edits
// identically to a case study's.
const storySection = {
  type: 'object',
  name: 'storySection',
  fields: [
    defineField({ name: 'number', title: 'Number', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'combos',
      title: 'Image/video + paragraph combos',
      description: 'Each combo needs a paragraph, plus either an image or a video.',
      type: 'array',
      validation: (Rule) => Rule.min(1).required(),
      of: [
        {
          type: 'object',
          name: 'combo',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'video',
              title: 'Video',
              type: 'file',
              description: 'Used instead of the image when set.',
              options: { accept: 'video/*' },
            }),
            defineField({
              name: 'paragraph',
              title: 'Paragraph',
              type: 'text',
              validation: (Rule) => Rule.required(),
            }),
          ],
          validation: (Rule) =>
            Rule.custom((combo) => {
              if (combo?.image && combo?.video) return 'Use either an image or a video, not both.'
              if (!combo?.image && !combo?.video) return 'Add an image or a video.'
              return true
            }),
          preview: {
            select: { title: 'paragraph', media: 'image', video: 'video' },
            prepare({ title, media, video }) {
              return { title, subtitle: video ? 'Video' : undefined, media }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'number', media: 'combos.0.image' },
  },
}

export default defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (H1)',
      type: 'string',
      description: 'Shown as the big heading on the article page, and as the title in the Info list.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Used in the URL, e.g. /info/how-to-brief-a-designer',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading (H3)',
      type: 'string',
      description: 'Shown centered below the title on the article page.',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Written by',
      type: 'string',
    }),
    defineField({
      name: 'authorIcon',
      title: 'Author icon',
      type: 'image',
      description: 'Small icon shown inline next to "Written by".',
    }),
    defineField({
      name: 'previewImage',
      title: 'Preview / hover image',
      type: 'image',
      options: { hotspot: true },
      description: 'Shown following the cursor when this article is hovered in a list, and expands full-screen when clicked into.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      description: 'Optional short summary — not shown on the site yet, but handy for search/SEO.',
    }),
    defineField({
      name: 'storyRatio',
      title: 'Accordion image / text ratio',
      type: 'string',
      options: {
        list: [
          { title: 'Default (1/3 text — 2/3 image)', value: 'default' },
          { title: '50 / 50', value: 'half' },
        ],
        layout: 'radio',
      },
      initialValue: 'default',
    }),
    defineField({
      name: 'contentWidth',
      title: 'Article content width',
      description: 'Controls the width of the accordion/story content below the title. The title itself is always full-width up to a laptop-sized cap.',
      type: 'string',
      options: {
        list: [
          { title: 'Full width', value: 'full' },
          { title: 'Contained', value: 'contained' },
        ],
        layout: 'radio',
      },
      initialValue: 'full',
    }),
    defineField({
      name: 'storySections',
      title: 'Story sections (accordion)',
      type: 'array',
      of: [storySection],
    }),
  ],
  orderings: [
    {
      title: 'Date, newest first',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'date', media: 'previewImage' },
  },
})

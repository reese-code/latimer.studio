import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Used in the URL, e.g. /projects/ciao',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'orderRank',
      title: 'Order',
      type: 'number',
      description: 'Lower numbers appear first in the gallery.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'number',
      title: 'Project number',
      type: 'string',
      description: 'Displayed as-is, e.g. "01"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'year', title: 'Year', type: 'string' }),
    defineField({ name: 'type', title: 'Type', type: 'string' }),
    defineField({ name: 'industry', title: 'Industry', type: 'string' }),
    defineField({ name: 'category', title: 'Category', type: 'string' }),
    defineField({ name: 'date', title: 'Date', type: 'string' }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
    defineField({ name: 'siteUrl', title: 'Site URL', type: 'url' }),
    defineField({
      name: 'poster',
      title: 'Poster image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'overview',
      title: 'Overview paragraphs',
      type: 'array',
      of: [{ type: 'text' }],
    }),
    defineField({
      name: 'tools',
      title: 'Tools',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'storySections',
      title: 'Story sections',
      type: 'array',
      of: [
        {
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
        },
      ],
    }),
    defineField({
      name: 'testimonial',
      title: 'Testimonial',
      type: 'object',
      fields: [
        defineField({ name: 'name', title: 'Name', type: 'string' }),
        defineField({ name: 'quote', title: 'Quote', type: 'text' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'number', media: 'poster' },
  },
  orderings: [
    {
      title: 'Display order',
      name: 'orderRankAsc',
      by: [{ field: 'orderRank', direction: 'asc' }],
    },
  ],
})

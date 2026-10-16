import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (H1)',
      type: 'string',
      description: 'Shown as the big heading on the service page, and as the row label in the homepage Services list.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Used in the URL, e.g. /services/art-direction',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'blurb',
      title: 'Short blurb',
      type: 'string',
      description: 'Small note shown beside the title when hovering it in the homepage Services list.',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Position in the homepage Services list (1 = first).',
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: 'image',
      title: 'Hover image',
      type: 'image',
      options: { hotspot: true },
      description: 'Optional. Shown behind the row in the homepage Services list; without one a maroon placeholder card shows.',
    }),
    defineField({
      name: 'about',
      title: 'About the Service',
      type: 'object',
      description: 'The "About the Service" section on this service page.',
      options: { collapsible: false },
      fields: [
        defineField({ name: 'label', title: 'Section label', type: 'string', initialValue: 'About the Service' }),
        defineField({
          name: 'paragraphs',
          title: 'Paragraphs',
          type: 'array',
          of: [{ type: 'text', rows: 4 }],
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({ name: 'buttonLabel', title: 'Button label', type: 'string', initialValue: 'Let’s talk' }),
        defineField({ name: 'buttonHref', title: 'Button link', type: 'string', initialValue: '/contact' }),
        defineField({
          name: 'slides',
          title: 'Carousel images',
          type: 'array',
          description: 'Shown 500×700 in an infinite loop. Slides without an image are not shown.',
          of: [
            {
              type: 'object',
              name: 'slide',
              fields: [
                defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true }, validation: (Rule) => Rule.required() }),
              ],
              preview: { select: { media: 'image' }, prepare: ({ media }) => ({ title: 'Slide', media }) },
            },
          ],
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'List order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'blurb', media: 'image' },
  },
})

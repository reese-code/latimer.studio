import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'aboutPage',
  title: 'About',
  type: 'document',
  // Singleton — same pattern as infoPage (see deskStructure.js).
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading (H1)',
      type: 'string',
      initialValue: 'Latimer Studio is a Denver based design studio specializing in e-com',
    }),
    defineField({
      name: 'metaTitle',
      title: 'SEO title',
      type: 'string',
      description: 'Browser tab / search result title. Leave empty for the default.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'SEO description',
      type: 'text',
      rows: 3,
      description: 'Search result description. Leave empty for the default.',
    }),
    defineField({
      name: 'about',
      title: 'About the Studio',
      type: 'object',
      options: { collapsible: false },
      fields: [
        defineField({ name: 'label', title: 'Section label', type: 'string', initialValue: 'About the Studio' }),
        defineField({
          name: 'paragraphs',
          title: 'Paragraphs',
          type: 'array',
          of: [{ type: 'text', rows: 4 }],
        }),
        defineField({ name: 'buttonLabel', title: 'Button label', type: 'string', initialValue: 'Let’s talk' }),
        defineField({ name: 'buttonHref', title: 'Button link', type: 'string', initialValue: '/contact' }),
        defineField({
          name: 'slides',
          title: 'Carousel slides',
          type: 'array',
          description: 'Shown 500×700 in an infinite loop. Leave empty to use the homepage slides.',
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
    defineField({
      name: 'founderLetter',
      title: 'Founder Letter',
      type: 'object',
      options: { collapsible: false },
      fields: [
        defineField({ name: 'label', title: 'Section label', type: 'string', initialValue: 'Founder Letter' }),
        defineField({ name: 'title', title: 'Title (H3)', type: 'string', initialValue: 'Letter from Reese Latimer' }),
        defineField({
          name: 'paragraphs',
          title: 'Paragraphs',
          type: 'array',
          of: [{ type: 'text', rows: 4 }],
        }),
        defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
        defineField({ name: 'buttonLabel', title: 'Button label', type: 'string', initialValue: 'Learn more' }),
        defineField({ name: 'buttonHref', title: 'Button link', type: 'string', initialValue: '/info' }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'About' }) },
})

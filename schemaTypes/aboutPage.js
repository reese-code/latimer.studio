import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'aboutPage',
  title: 'About',
  type: 'document',
  // Singleton — same pattern as infoPage (see deskStructure.js).
  fields: [
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

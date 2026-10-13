import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'home',
  title: 'Home',
  type: 'document',
  // Singleton — same pattern as siteSettings/infoPage (see deskStructure.js).
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      options: { collapsible: false },
      fields: [
        defineField({
          name: 'images',
          title: 'Hero images',
          type: 'array',
          of: [{ type: 'image', options: { hotspot: true } }],
          description:
            'Upload once — used for the popping image cards (desktop and mobile) in place of the colored placeholder cards. Falls back to placeholder colors when empty.',
        }),
        defineField({
          name: 'text',
          title: 'Hero text',
          type: 'text',
          rows: 3,
          initialValue:
            'Creating e-commerce design in Denver, Colorado that actually converts through data-driven decisions.',
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Home' }) },
})

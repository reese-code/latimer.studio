import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'infoPage',
  title: 'Info Page',
  type: 'document',
  // Singleton — same pattern as siteSettings/privacyPolicy (see deskStructure.js).
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading (H1)',
      type: 'string',
      initialValue: 'Web Info',
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading (H3)',
      type: 'string',
      initialValue: 'The only place you need for info about websites.',
    }),
  ],
})

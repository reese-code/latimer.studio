import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // Singleton — the Studio structure hides the create/duplicate affordances
  // for this type (see deskStructure.js) so only one document ever exists.
  fields: [
    defineField({
      name: 'aboutCopy',
      title: 'About page copy',
      type: 'text',
      description: 'Main paragraph shown on the About page.',
    }),
    defineField({
      name: 'footerTaglines',
      title: 'Footer taglines',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Short lines under the footer logo, e.g. "A Creative Studio".',
    }),
    defineField({
      name: 'contactLinks',
      title: 'Contact links',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'contactLink',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({
              name: 'href',
              title: 'Link (leave blank for plain text, e.g. coordinates)',
              type: 'string',
            }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'href' },
          },
        },
      ],
    }),
    defineField({
      name: 'typeformId',
      title: 'Typeform ID',
      type: 'string',
      description: 'The live-form ID used by the Contact page embed.',
    }),
  ],
})

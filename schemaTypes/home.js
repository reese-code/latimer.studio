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
    defineField({
      name: 'pricing',
      title: 'Pricing',
      type: 'object',
      options: { collapsible: false },
      fields: [
        defineField({ name: 'label', title: 'Section label', type: 'string', initialValue: 'Pricing' }),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
          initialValue: 'You can choose between which service you want, or combine multiple',
        }),
        defineField({
          name: 'plans',
          title: 'Plans',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'plan',
              title: 'Plan',
              fields: [
                defineField({ name: 'name', title: 'Plan name', type: 'string', initialValue: 'Landing page' }),
                defineField({ name: 'duration', title: 'Duration', type: 'string', initialValue: '15 - 20 days' }),
                defineField({
                  name: 'durationIcon',
                  title: 'Duration icon',
                  type: 'image',
                  description: 'Shown left of the duration. Leave empty to use the default clock.',
                }),
                defineField({
                  name: 'basePrice',
                  title: 'Base price ($)',
                  type: 'number',
                  validation: (r) => r.required().min(0),
                }),
                defineField({
                  name: 'developmentLabel',
                  title: 'Development toggle label',
                  type: 'string',
                  initialValue: 'Add Development',
                }),
                defineField({
                  name: 'developmentPrice',
                  title: 'Development price ($)',
                  type: 'number',
                  description: 'Added to the total when the toggle is on.',
                  validation: (r) => r.min(0),
                }),
                defineField({
                  name: 'extras',
                  title: 'Extras',
                  type: 'array',
                  description: 'Informational rows, e.g. Extra Pages — +$500/PAGE.',
                  of: [
                    {
                      type: 'object',
                      name: 'extra',
                      fields: [
                        defineField({ name: 'label', title: 'Label', type: 'string' }),
                        defineField({ name: 'price', title: 'Price text', type: 'string', description: 'e.g. +$500/PAGE' }),
                      ],
                      preview: { select: { title: 'label', subtitle: 'price' } },
                    },
                  ],
                }),
                defineField({
                  name: 'features',
                  title: 'Bullet points',
                  type: 'array',
                  of: [{ type: 'string' }],
                }),
                defineField({
                  name: 'cardLabel',
                  title: 'Price card label',
                  type: 'string',
                  description: 'Shown above the price, e.g. "Landing page design". " + development" is appended when the toggle is on.',
                }),
                defineField({
                  name: 'developmentSuffix',
                  title: 'Price card suffix (toggle on)',
                  type: 'string',
                  description: 'Appended to the price card label when the development toggle is on.',
                  initialValue: ' + development',
                }),
                defineField({ name: 'startLabel', title: 'Start button label', type: 'string', initialValue: 'Start Project' }),
                defineField({ name: 'startHref', title: 'Start button link', type: 'string', initialValue: '/contact' }),
                defineField({ name: 'messageLabel', title: 'Message button label', type: 'string', initialValue: 'Send Message' }),
                defineField({ name: 'messageHref', title: 'Message button link', type: 'string', initialValue: '/contact' }),
              ],
              preview: { select: { title: 'name', subtitle: 'duration' } },
            },
          ],
        }),
      ],
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
        defineField({ name: 'buttonLabel', title: 'Button label', type: 'string', initialValue: 'Learn more' }),
        defineField({ name: 'buttonHref', title: 'Button link', type: 'string', initialValue: '/info' }),
        defineField({
          name: 'slides',
          title: 'Carousel slides',
          type: 'array',
          description: 'Shown 500×700 in an infinite loop. A slide with no image shows its color block.',
          of: [
            {
              type: 'object',
              name: 'slide',
              fields: [
                defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
                defineField({ name: 'color', title: 'Placeholder color (hex)', type: 'string', initialValue: '#1a1a1a' }),
              ],
              preview: { select: { media: 'image', title: 'color' } },
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'object',
      options: { collapsible: false },
      fields: [
        defineField({ name: 'label', title: 'Section label', type: 'string', initialValue: 'FAQs' }),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
          initialValue: 'Latimer Studio is here to answer all of your questions about how different designs can improve your conversion rates.',
        }),
        defineField({ name: 'buttonLabel', title: 'Button label', type: 'string', initialValue: 'View all articles' }),
        defineField({ name: 'buttonHref', title: 'Button link', type: 'string', initialValue: '/info' }),
        defineField({
          name: 'items',
          title: 'FAQs',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'faq',
              fields: [
                defineField({ name: 'question', title: 'Title', type: 'string', validation: (r) => r.required() }),
                defineField({ name: 'overview', title: 'Article overview', type: 'text', rows: 4 }),
                defineField({
                  name: 'article',
                  title: 'Article',
                  type: 'reference',
                  to: [{ type: 'article' }],
                  description: 'The "Learn more" button links here. Leave empty until the article is written (links to the articles page).',
                }),
                defineField({ name: 'buttonLabel', title: 'Button label', type: 'string', initialValue: 'Learn more' }),
              ],
              preview: { select: { title: 'question', subtitle: 'overview' } },
            },
          ],
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Home' }) },
})

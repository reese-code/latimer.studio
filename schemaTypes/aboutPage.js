import { defineField, defineType } from 'sanity'
import { contentBlocks } from './service'

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
          description: 'Plain paragraphs. Ignored when "Content" below has anything in it.',
          of: [{ type: 'text', rows: 4 }],
        }),
        defineField({
          name: 'content',
          title: 'Content',
          type: 'array',
          description:
            'Build the section from titles, paragraphs, paragraphs with a title at the start, title blocks, bullet lists and numbered lists. Takes priority over "Paragraphs".',
          of: contentBlocks,
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
        defineField({
          name: 'signature',
          title: 'Signature',
          type: 'image',
          description: 'Shown under the paragraphs. Leave empty to use the default Reese Latimer signature.',
        }),
        defineField({
          name: 'signatureText',
          title: 'Text under signature',
          type: 'text',
          rows: 3,
          description: 'Body text shown right below the signature.',
        }),
        defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
        defineField({ name: 'buttonLabel', title: 'Button label', type: 'string', initialValue: 'Learn more' }),
        defineField({ name: 'buttonHref', title: 'Button link', type: 'string', initialValue: '/info' }),
      ],
    }),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'object',
      description: 'Leave the questions empty to show the homepage FAQs.',
      options: { collapsible: false },
      fields: [
        defineField({ name: 'label', title: 'Section label', type: 'string', initialValue: 'FAQs' }),
        defineField({ name: 'title', title: 'Title', type: 'string' }),
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
  preview: { prepare: () => ({ title: 'About' }) },
})

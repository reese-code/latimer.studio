import { defineArrayMember, defineField, defineType } from 'sanity'

// Rich text (plain paragraphs + bold/italic + links) used by paragraph blocks.
const richText = (name = 'text', title = 'Text') =>
  defineField({
    name,
    title,
    type: 'array',
    description: 'Select text and click the link icon (or press Cmd/Ctrl+K) to turn it into a link. The link shows as the selected words, not the URL.',
    of: [
      {
        type: 'block',
        styles: [{ title: 'Normal', value: 'normal' }],
        lists: [],
        marks: {
          decorators: [
            { title: 'Bold', value: 'strong' },
            { title: 'Italic', value: 'em' },
          ],
          annotations: [
            {
              name: 'link',
              type: 'object',
              title: 'Link',
              fields: [
                defineField({
                  name: 'href',
                  title: 'URL',
                  type: 'url',
                  description: 'Full address (https://…), a page on this site (/contact), mailto: or tel:.',
                  validation: (Rule) =>
                    Rule.required().uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
                }),
                defineField({ name: 'newTab', title: 'Open in a new tab', type: 'boolean', initialValue: false }),
              ],
            },
          ],
        },
      },
    ],
    validation: (Rule) => Rule.required().min(1),
  })

const titleStyle = defineField({
  name: 'style',
  title: 'Title style',
  type: 'string',
  options: {
    list: [
      { title: 'Accordion title (like the project pages)', value: 'accordion' },
      { title: 'H3 title (24px)', value: 'h3' },
    ],
    layout: 'dropdown',
  },
  initialValue: 'accordion',
})

// Bullet and numbered lists are one block; the dropdown switches between them any time.
const listBlock = defineArrayMember({
  name: 'list',
  title: 'List (bullets / numbers)',
  type: 'object',
  fields: [
    defineField({
      name: 'listType',
      title: 'List type',
      type: 'string',
      options: {
        list: [
          { title: 'Bullet points', value: 'bullet' },
          { title: 'Numbered', value: 'numbered' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'bullet',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: { items: 'items', type: 'listType' },
    prepare: ({ items, type }) => ({
      title: `${type === 'numbered' ? 'Numbered list' : 'Bullet list'} (${items?.length || 0})`,
      subtitle: (items || []).join(' · '),
    }),
  },
})

const paragraphBlock = defineArrayMember({
  name: 'paragraph',
  title: 'Paragraph',
  type: 'object',
  fields: [richText()],
  preview: {
    select: { text: 'text' },
    prepare: ({ text }) => ({ title: text?.[0]?.children?.map((c) => c.text).join('') || 'Paragraph', subtitle: 'Paragraph' }),
  },
})

// Blocks usable inside a title block.
const bodyBlocks = [paragraphBlock, listBlock]

const contentBlocks = [
  defineArrayMember({
    name: 'heading',
    title: 'Title',
    type: 'object',
    fields: [
      defineField({ name: 'text', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
      titleStyle,
    ],
    preview: { select: { title: 'text', style: 'style' }, prepare: ({ title, style }) => ({ title, subtitle: style === 'h3' ? 'H3 title' : 'Accordion title' }) },
  }),
  paragraphBlock,
  defineArrayMember({
    name: 'titledParagraph',
    title: 'Paragraph with title at the start',
    type: 'object',
    fields: [
      defineField({ name: 'title', title: 'Title', type: 'string', description: 'Shown bold at the beginning of the paragraph.', validation: (Rule) => Rule.required() }),
      richText(),
    ],
    preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title, subtitle: 'Paragraph with title' }) },
  }),
  listBlock,
  defineArrayMember({
    name: 'titledSection',
    title: 'Title block (title above several paragraphs / lists)',
    type: 'object',
    fields: [
      defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() }),
      titleStyle,
      defineField({ name: 'body', title: 'Content', type: 'array', of: bodyBlocks, validation: (Rule) => Rule.required().min(1) }),
      defineField({ name: 'buttonLabel', title: 'Button label (optional)', type: 'string', description: 'Leave empty for no button. Shown after the content.' }),
      defineField({
        name: 'buttonHref',
        title: 'Button link',
        type: 'string',
        description: 'Page to open, e.g. /contact or /services/web-design.',
        hidden: ({ parent }) => !parent?.buttonLabel,
        validation: (Rule) => Rule.custom((v, { parent }) => (parent?.buttonLabel && !v ? 'Add a link for the button' : true)),
      }),
    ],
    preview: {
      select: { title: 'title', body: 'body', style: 'style' },
      prepare: ({ title, body, style }) => ({
        title,
        subtitle: `Title block · ${style === 'h3' ? 'H3' : 'accordion'} · ${body?.length || 0} item(s)`,
      }),
    },
  }),
]

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
      name: 'metaTitle',
      title: 'Google title (meta title)',
      type: 'string',
      description: 'The blue link title shown in Google results. Aim for 50–60 characters. Falls back to "<Title> — Latimer Studio Denver Web Design & Branding".',
      validation: (Rule) => Rule.max(70).warning('Google usually cuts titles off after ~60 characters.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Google description (meta description)',
      type: 'text',
      rows: 3,
      description: 'The snippet of text shown under the link in Google results. Aim for 140–160 characters.',
      validation: (Rule) => Rule.max(170).warning('Google usually cuts descriptions off after ~160 characters.'),
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
          title: 'Paragraphs (simple)',
          type: 'array',
          description: 'Plain paragraphs. Ignored when "Content" below has anything in it.',
          of: [{ type: 'text', rows: 4 }],
        }),
        defineField({
          name: 'content',
          title: 'Content',
          type: 'array',
          description:
            'Build the section from titles, paragraphs, paragraphs with a title at the start, title blocks (a title above multiple paragraphs/lists), bullet lists and numbered lists. Takes priority over "Paragraphs (simple)".',
          of: contentBlocks,
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

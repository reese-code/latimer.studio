import { defineField, defineType } from 'sanity'

// One tab of the pricing card. Created under Pricing → Plans in the desk.
export default defineType({
  name: 'pricingPlan',
  title: 'Pricing Plan',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Plan name',
      type: 'string',
      initialValue: 'Landing page',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'orderRank',
      title: 'Order',
      type: 'number',
      description: 'Lower numbers appear first in the tab selector.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tabLabel',
      title: 'Tab label',
      type: 'string',
      description: 'Shown in the selector above the card. Leave empty to use the plan name.',
    }),
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
      name: 'developmentColor',
      title: 'Development switch background',
      type: 'string',
      options: {
        list: [
          { title: 'Black', value: 'black' },
          { title: 'White (50%)', value: 'white' },
        ],
        layout: 'radio',
      },
      initialValue: 'black',
    }),
    defineField({
      name: 'developmentPrice',
      title: 'Development price ($)',
      type: 'number',
      description: 'Added to the total when the toggle is on.',
      validation: (r) => r.min(0),
    }),
    defineField({
      name: 'addOns',
      title: 'Extra offer switches',
      type: 'array',
      description: 'More switches like the development one. Each adds its price to the total when on.',
      of: [
        {
          type: 'object',
          name: 'addOn',
          fields: [
            defineField({ name: 'label', title: 'Switch label', type: 'string', validation: (r) => r.required() }),
            defineField({
              name: 'linkedPlan',
              title: 'Link to plan',
              type: 'string',
              description:
                'Type the exact name of another plan, e.g. Branding. Price and timeframe then come from that plan and stay in sync with it. Leave empty to set them below.',
            }),
            defineField({
              name: 'price',
              title: 'Price ($)',
              type: 'number',
              description: 'Ignored when linked to a plan.',
              hidden: ({ parent }) => !!parent?.linkedPlan,
              validation: (r) => r.custom((v, { parent }) => (parent?.linkedPlan || v >= 0 ? true : 'Add a price or link a plan')),
            }),
            defineField({
              name: 'color',
              title: 'Switch background',
              type: 'string',
              options: {
                list: [
                  { title: 'Black', value: 'black' },
                  { title: 'White (50%)', value: 'white' },
                ],
                layout: 'radio',
              },
              initialValue: 'black',
            }),
            defineField({
              name: 'days',
              title: 'Extra days',
              type: 'number',
              description: 'Added to every number in the duration when on. Ignored when linked to a plan.',
              hidden: ({ parent }) => !!parent?.linkedPlan,
              validation: (r) => r.min(0),
            }),
            defineField({
              name: 'suffix',
              title: 'Price card suffix (switch on)',
              type: 'string',
              description: 'Appended to the price card label when on, e.g. " + branding".',
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'price' } },
        },
      ],
    }),
    defineField({
      name: 'developmentDays',
      title: 'Development extra days',
      type: 'number',
      description: 'Added to every number in the duration when the toggle is on (15 - 20 days + 5 = 20 - 25 days).',
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
            defineField({
              name: 'devPrice',
              title: 'Price text with development',
              type: 'string',
              description: 'Shown instead when the development toggle is on, e.g. +$800/PAGE. Leave empty to keep the price the same.',
            }),
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
  preview: {
    select: { title: 'name', subtitle: 'duration' },
  },
  orderings: [
    {
      title: 'Display order',
      name: 'orderRankAsc',
      by: [{ field: 'orderRank', direction: 'asc' }],
    },
  ],
})

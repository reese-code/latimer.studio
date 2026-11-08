import { defineField, defineType } from 'sanity'

// Singleton — heading of the pricing section (the plans are `pricingPlan` docs).
export default defineType({
  name: 'pricingSettings',
  title: 'Pricing Section',
  type: 'document',
  fields: [
    defineField({ name: 'label', title: 'Section label', type: 'string', initialValue: 'Pricing' }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'You can choose between which service you want, or combine multiple',
    }),
  ],
  preview: { prepare: () => ({ title: 'Pricing Section' }) },
})

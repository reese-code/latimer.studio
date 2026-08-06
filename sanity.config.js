import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'
import { deskStructure } from './deskStructure'

export default defineConfig({
  name: 'default',
  title: 'Latimer Studio',
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'xw7lzt9e',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  basePath: '/studio',
  plugins: [structureTool({ structure: deskStructure }), visionTool()],
  schema: { types: schemaTypes },
})

import { createContext } from 'react'

// Shared context object — kept in its own plain-JS module (not a .jsx file)
// so neither this file nor the hook/provider that use it mix component and
// non-component exports, which breaks Fast Refresh.
export const SiteDataContext = createContext(null)

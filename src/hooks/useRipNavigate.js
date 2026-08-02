import { useNavigate } from 'react-router-dom'
import { triggerPageRip } from '../lib/pageRipTransition'

// Drop-in replacement for react-router's useNavigate() — same signature,
// but wraps every call in the paper-rip page transition (current page tears
// in half and falls away to reveal the next one underneath) instead of
// navigating instantly.
export default function useRipNavigate() {
  const navigate = useNavigate()
  return (to, options) => triggerPageRip(navigate, to, options)
}

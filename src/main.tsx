import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { hydrateDom } from '@/themes/use-theme-store'
import App from './App.tsx'

// Disabled: with the inspection chamber active, its overlay covered the whole
// page and nothing was visible. Still unresolved.
// if (import.meta.env.DEV) {
//   void import('@vtbag/inspection-chamber')
// }

// Before React mounts: nothing else writes data-theme / data-scheme on load
// since the anti-FOUC script was removed.
hydrateDom()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Disabled: with the inspection chamber active, its overlay covered the whole
// page and nothing was visible. Still unresolved.
// if (import.meta.env.DEV) {
//   void import('@vtbag/inspection-chamber')
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { HubRoute } from '@/routes/hub'
import { ThemeRoute } from '@/routes/theme-route'

function App() {
  return (
    // useTransitions={false} is load-bearing, not a preference. By default
    // BrowserRouter wraps its state update in React.startTransition, and a
    // transition is deliberately non-blocking: flushSync cannot force it. The
    // theme picker needs the route to commit inside the view transition's
    // mutation window, so the router has to update synchronously. Nothing is
    // lost here — this is the non-data router, so there is no pending state to
    // keep interruptible.
    <BrowserRouter useTransitions={false}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HubRoute />} />
          <Route path='theme/:themeId' element={<ThemeRoute />} />
        </Route>
        {/* Same answer theme-route gives an unknown themeId: anything that does
            not resolve goes to the hub. Without it an unmatched URL matches no
            route at all and renders an empty body. */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

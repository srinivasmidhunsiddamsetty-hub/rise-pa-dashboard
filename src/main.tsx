import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.css'
import Iteration1 from './pages/Iteration1'
import Iteration2 from './pages/Iteration2'

// Two iterations as two routes (PRD §14). Deployed root shows the shipped
// Iteration 2 (decision-support) build; Iteration 1 stays reachable at its path.
const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/iteration-2" replace /> },
  { path: '/iteration-1', element: <Iteration1 /> },
  { path: '/iteration-2', element: <Iteration2 /> },
  { path: '*', element: <Navigate to="/iteration-2" replace /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

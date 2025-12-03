import React from 'react'
import ReactDOM from 'react-dom/client'
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import Nav from './components/Nav'
import Login from './pages/Login'
import MenuPage from './pages/Menu'
import Orders from './pages/Orders'
import Register from './pages/Register'
import Settings from './pages/Settings'
import PublicHomePage from './pages/PublicHomePage'

const hasVendorToken = () =>
  typeof window !== 'undefined' && !!localStorage.getItem('vendor_token')

function RootRoute() {
  if (hasVendorToken()) {
    return <Navigate to="/orders" replace />
  }
  return <PublicHomePage />
}

function ProtectedLayout() {
  if (!hasVendorToken()) {
    return <Navigate to="/login" replace />
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <RootRoute /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/orders', element: <Orders /> },
      { path: '/menu', element: <MenuPage /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

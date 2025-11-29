import React from 'react'
import ReactDOM from 'react-dom/client'
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import Nav from './components/Nav'
import Login from './pages/Login'
import MenuPage from './pages/Menu'
import Orders from './pages/Orders'
import Register from './pages/Register'
import Settings from './pages/Settings'
import AdminLoginPage from './admin/AdminLoginPage'
import AdminRestaurantsPage from './admin/AdminRestaurantsPage'
import AdminOrdersPage from './admin/AdminOrdersPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Orders /> },
      { path: 'orders', element: <Orders /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 'settings', element: <Settings /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ],
  },
  { path: '/admin/login', element: <AdminLoginPage /> },
  { path: '/admin/restaurants', element: <AdminRestaurantsPage /> },
  { path: '/admin/orders', element: <AdminOrdersPage /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  )
}

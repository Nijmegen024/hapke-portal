import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import Nav from './components/Nav';
import Login from './pages/Login';
import MenuPage from './pages/Menu';
import Orders from './pages/Orders';
import Register from './pages/Register';
import Settings from './pages/Settings';
const router = createBrowserRouter([
    {
        path: '/',
        element: _jsx(AppLayout, {}),
        children: [
            { index: true, element: _jsx(Orders, {}) },
            { path: 'orders', element: _jsx(Orders, {}) },
            { path: 'menu', element: _jsx(MenuPage, {}) },
            { path: 'settings', element: _jsx(Settings, {}) },
            { path: 'login', element: _jsx(Login, {}) },
            { path: 'register', element: _jsx(Register, {}) },
        ],
    },
]);
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(RouterProvider, { router: router }) }));
function AppLayout() {
    return (_jsxs("div", { style: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fafafa' }, children: [_jsx(Nav, {}), _jsx("main", { style: { flex: 1 }, children: _jsx(Outlet, {}) })] }));
}

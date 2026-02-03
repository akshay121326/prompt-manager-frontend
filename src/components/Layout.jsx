import React from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow-sm h-16 flex items-center px-8">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-4">
                            <li>
                                <div>
                                    <Link to="/" className="text-gray-400 hover:text-gray-500">
                                        <span className="text-sm font-medium">Home</span>
                                    </Link>
                                </div>
                            </li>
                            {pathnames.map((value, index) => {
                                const last = index === pathnames.length - 1;
                                const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                                return (
                                    <li key={to}>
                                        <div className="flex items-center">
                                            <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                                            </svg>
                                            <Link
                                                to={to}
                                                className={`ml-4 text-sm font-medium ${last ? 'text-gray-700 pointer-events-none' : 'text-gray-400 hover:text-gray-500'
                                                    }`}
                                            >
                                                {value.charAt(0).toUpperCase() + value.slice(1)}
                                            </Link>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                </header>
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

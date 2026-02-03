import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Link } from 'react-router-dom';
import Pagination from './common/Pagination';

export default function PromptList() {
    const [prompts, setPrompts] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [order, setOrder] = useState('desc');
    const [activeMenu, setActiveMenu] = useState(null);

    useEffect(() => {
        fetchPrompts();
    }, [page, sortBy, order]);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const params = {
                skip: (page - 1) * size,
                limit: size,
                sort_by: sortBy,
                order: order,
                search: search || undefined
            };
            const response = await apiClient.get('/prompts/', { params });
            // Access .items from the paginated response
            setPrompts(response.data.items || []);
            setTotal(response.data.total || 0);
            setLoading(false);
        } catch (err) {
            setError("Failed to fetch prompts");
            setLoading(false);
            console.error(err);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchPrompts();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this prompt?")) return;
        try {
            await apiClient.delete(`/prompts/${id}`);
            fetchPrompts(); // Refresh to update count and pagination
        } catch (err) {
            alert("Error deleting prompt: " + err.message);
        }
    };

    if (loading && prompts.length === 0) return <div>Loading prompts...</div>;

    return (
        <div className="relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                <h2 className="text-2xl font-bold text-gray-900">Your Prompts</h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
                    <form onSubmit={handleSearch} className="flex flex-1">
                        <input
                            type="text"
                            placeholder="Search prompts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button type="submit" className="ml-2 px-4 py-2 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300">
                            Search
                        </button>
                    </form>
                    <Link
                        to="/prompts/new"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Create New Prompt
                    </Link>
                </div>
            </div>

            {/* Sorting Controls */}
            <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                <span>Sort by:</span>
                <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="border-none bg-transparent focus:ring-0 cursor-pointer font-semibold text-indigo-600"
                >
                    <option value="created_at">Date Created</option>
                    <option value="name">Name</option>
                </select>
                <select
                    value={order}
                    onChange={(e) => { setOrder(e.target.value); setPage(1); }}
                    className="border-none bg-transparent focus:ring-0 cursor-pointer font-semibold text-indigo-600"
                >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                </select>
            </div>

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="bg-white shadow sm:rounded-md"> {/* removed overflow-hidden */}
                <ul role="list" className="divide-y divide-gray-200">
                    {prompts.map((prompt) => (
                        <li key={prompt.id} className="relative">
                            <div className="block hover:bg-gray-50">
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <Link to={`/prompts/${prompt.id}?mode=view`} className="flex-1">
                                            <p className="text-sm font-medium text-indigo-600 truncate">
                                                {prompt.name || "Untitled Prompt"}
                                            </p>
                                        </Link>
                                        <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {prompt.versions ? prompt.versions.length : 0} Versions
                                            </p>

                                            {/* Action Menu */}
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setActiveMenu(activeMenu === prompt.id ? null : prompt.id);
                                                    }}
                                                    className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                                                >
                                                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                    </svg>
                                                </button>

                                                {activeMenu === prompt.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                                                        <div className="origin-top-right absolute right-0 mt-2 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                                                            <div className="py-1">
                                                                <Link to={`/prompts/${prompt.id}?mode=view`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View</Link>
                                                                <Link to={`/prompts/${prompt.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit</Link>
                                                                <button
                                                                    onClick={() => { handleDelete(prompt.id); setActiveMenu(null); }}
                                                                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                {prompt.description || "No description"}
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            <p>
                                                Created {prompt.created_at ? new Date(prompt.created_at).toLocaleString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {prompts.length === 0 && !loading && (
                        <li className="px-4 py-12 text-center text-gray-500">
                            No prompts found. Adjust your search or create a new one!
                        </li>
                    )}
                </ul>
            </div>

            <Pagination
                total={total}
                page={page}
                size={size}
                onPageChange={(p) => setPage(p)}
            />
        </div>
    );
}

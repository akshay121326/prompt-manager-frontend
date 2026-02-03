import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

export default function ProviderManager() {
    const [providers, setProviders] = useState([]);
    const [newProvider, setNewProvider] = useState({ name: '', api_key: '', base_url: '' });
    const [loading, setLoading] = useState(false);
    const [newModel, setNewModel] = useState({ provider_id: null, name: '' });
    const [editingProviderId, setEditingProviderId] = useState(null);
    const [editedProvider, setEditedProvider] = useState({ name: '', api_key: '', base_url: '' });

    useEffect(() => {
        fetchProviders();
    }, []);

    async function fetchProviders() {
        setLoading(true);
        try {
            const res = await apiClient.get('/providers/');
            setProviders(res.data);
        } catch (err) {
            console.error("Error fetching providers:", err);
        }
        setLoading(false);
    }

    async function handleAddProvider() {
        if (!newProvider.name) return;
        try {
            await apiClient.post('/providers/', newProvider);
            setNewProvider({ name: '', api_key: '', base_url: '' });
            fetchProviders();
        } catch (err) {
            alert("Error adding provider: " + err.message);
        }
    }

    async function handleUpdateProvider(id) {
        try {
            await apiClient.patch(`/providers/${id}`, editedProvider);
            setEditingProviderId(null);
            fetchProviders();
        } catch (err) {
            alert("Error updating provider: " + err.message);
        }
    }

    async function handleDeleteProvider(id) {
        if (!window.confirm("Are you sure? This will also delete all associated models.")) return;
        try {
            await apiClient.delete(`/providers/${id}`);
            fetchProviders();
        } catch (err) {
            alert("Error deleting provider: " + err.message);
        }
    }

    async function handleAddModel(providerId) {
        if (!newModel.name) return;
        try {
            await apiClient.post(`/providers/${providerId}/models`, { name: newModel.name });
            setNewModel({ provider_id: null, name: '' });
            fetchProviders();
        } catch (err) {
            alert("Error adding model: " + err.message);
        }
    }

    async function handleDeleteModel(providerId, modelId) {
        if (!window.confirm("Are you sure you want to delete this model?")) return;
        try {
            await apiClient.delete(`/providers/${providerId}/models/${modelId}`);
            fetchProviders();
        } catch (err) {
            alert("Error deleting model: " + err.message);
        }
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">LLM Provider Manager</h2>

            {/* Add Provider Form */}
            <div className="bg-white shadow sm:rounded-md p-6 mb-8">
                <h3 className="text-lg font-medium mb-4">Add New Provider</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Provider Name (e.g. OpenAI or Ollama)"
                        className="border rounded px-3 py-2 text-sm"
                        value={newProvider.name}
                        onChange={e => setNewProvider({ ...newProvider, name: e.target.value })}
                    />
                    <input
                        type="password"
                        placeholder="API Key (Optional)"
                        className="border rounded px-3 py-2 text-sm"
                        value={newProvider.api_key}
                        onChange={e => setNewProvider({ ...newProvider, api_key: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Base URL (e.g. http://localhost:11434)"
                        className="border rounded px-3 py-2 text-sm"
                        value={newProvider.base_url}
                        onChange={e => setNewProvider({ ...newProvider, base_url: e.target.value })}
                    />
                </div>
                <button
                    onClick={handleAddProvider}
                    className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                >
                    Add Provider
                </button>
            </div>

            {/* Providers List */}
            <div className="grid grid-cols-1 gap-6">
                {providers.map((p) => (
                    <div key={p.id} className="bg-white shadow sm:rounded-lg p-6">
                        {editingProviderId === p.id ? (
                            <div className="space-y-4 mb-4 border-b pb-4">
                                <h3 className="text-lg font-bold text-gray-900">Edit Provider</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        className="border rounded px-3 py-2 text-sm"
                                        value={editedProvider.name}
                                        onChange={e => setEditedProvider({ ...editedProvider, name: e.target.value })}
                                    />
                                    <input
                                        type="password"
                                        placeholder="API Key"
                                        className="border rounded px-3 py-2 text-sm"
                                        value={editedProvider.api_key}
                                        onChange={e => setEditedProvider({ ...editedProvider, api_key: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="border rounded px-3 py-2 text-sm"
                                        value={editedProvider.base_url}
                                        onChange={e => setEditedProvider({ ...editedProvider, base_url: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleUpdateProvider(p.id)}
                                        className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingProviderId(null)}
                                        className="bg-gray-200 text-gray-700 px-4 py-1 rounded text-sm hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start border-b pb-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                                    <p className="text-sm text-gray-500">{p.base_url || 'Default configuration'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingProviderId(p.id);
                                            setEditedProvider({ name: p.name, api_key: p.api_key || '', base_url: p.base_url || '' });
                                        }}
                                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProvider(p.id)}
                                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700">Models</h4>
                            <div className="flex flex-wrap gap-2">
                                {p.models.map(m => (
                                    <span key={m.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {m.name}
                                        <button
                                            onClick={() => handleDeleteModel(p.id, m.id)}
                                            className="ml-1.5 inline-flex flex-shrink-0 h-4 w-4 rounded-full items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                                        >
                                            <span className="sr-only">Remove {m.name}</span>
                                            <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                                {p.models.length === 0 && <span className="text-xs text-gray-400 italic">No models defined</span>}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add model (e.g. llama3)"
                                    className="border rounded px-2 py-1 text-xs flex-1"
                                    value={newModel.provider_id === p.id ? newModel.name : ''}
                                    onFocus={() => setNewModel({ ...newModel, provider_id: p.id })}
                                    onChange={e => setNewModel({ provider_id: p.id, name: e.target.value })}
                                />
                                <button
                                    onClick={() => handleAddModel(p.id)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {providers.length === 0 && !loading && (
                <p className="text-center text-gray-500 mt-8 italic">No providers added yet. Add OpenAI, Gemini, or a local Ollama instance!</p>
            )}
        </div>
    );
}

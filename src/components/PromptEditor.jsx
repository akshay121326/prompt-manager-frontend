import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/client';
import VersionHistory from './VersionHistory';

export default function PromptEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const isViewOnly = queryParams.get('mode') === 'view';
    const isNew = !id;

    const [promptData, setPromptData] = useState({ name: '', description: '', tags: '', active_version_id: null });
    const [currentVersion, setCurrentVersion] = useState({ template: '', model_config_json: '{}' });
    const [versions, setVersions] = useState([]);
    const [activeTab, setActiveTab] = useState('editor'); // editor, history
    const [variables, setVariables] = useState({}); // { varName: value }
    const [managedProviders, setManagedProviders] = useState([]);

    // Playground State
    const [selectedProviderId, setSelectedProviderId] = useState('');
    const [selectedModel, setSelectedModel] = useState('openai'); // fallback/legacy
    const [modelName, setModelName] = useState('gpt-3.5-turbo');
    const [executionResult, setExecutionResult] = useState('');
    const [executing, setExecuting] = useState(false);

    // Extract variables from template
    useEffect(() => {
        const regex = /{{(.*?)}}/g;
        const matches = [...currentVersion.template.matchAll(regex)];
        const varNames = [...new Set(matches.map(m => m[1].trim()))];

        setVariables(prev => {
            const next = {};
            varNames.forEach(name => {
                next[name] = prev[name] || '';
            });
            return next;
        });
    }, [currentVersion.template]);

    useEffect(() => {
        if (!isNew) {
            fetchPrompt();
        }
        fetchProviders();
    }, [id]);

    async function fetchProviders() {
        try {
            const res = await apiClient.get('/providers/');
            setManagedProviders(res.data);
            if (res.data.length > 0) {
                // If we have managed providers, set the first one by default if none selected
                if (!selectedProviderId) {
                    const first = res.data[0];
                    setSelectedProviderId(first.id);
                    if (first.models && first.models.length > 0) {
                        setModelName(first.models[0].name);
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching providers:", err);
        }
    }

    async function fetchPrompt() {
        try {
            const res = await apiClient.get(`/prompts/${id}`);
            const data = res.data;
            setPromptData(data);
            if (data.versions && data.versions.length > 0) {
                setVersions(data.versions);
                // Load active version or latest
                const active = data.versions.find(v => v.id === data.active_version_id) || data.versions[data.versions.length - 1];
                setCurrentVersion(active);
            }
        } catch (err) {
            console.error("Error fetching prompt:", err);
        }
    }

    async function handleSave() {
        const commitMessage = window.prompt("Enter a commit message for this version:", "Updated template");
        if (commitMessage === null) return; // Cancelled

        try {
            let promptId = id;
            if (isNew) {
                const res = await apiClient.post('/prompts/', promptData);
                promptId = res.data.id;
            } else {
                await apiClient.patch(`/prompts/${promptId}`, {
                    name: promptData.name,
                    description: promptData.description,
                    tags: promptData.tags
                });
            }

            // Save Version
            await apiClient.post(`/prompts/${promptId}/versions`, {
                version_number: versions.length + 1,
                template: currentVersion.template,
                model_config_json: currentVersion.model_config_json,
                commit_message: commitMessage,
                input_variables: JSON.stringify(Object.keys(variables))
            });

            if (isNew) {
                navigate(`/prompts/${promptId}`);
            } else {
                alert('Saved successfully!');
                fetchPrompt();
            }
        } catch (err) {
            alert('Error saving: ' + err.message);
        }
    }

    async function handleSetActive(versionId) {
        try {
            await apiClient.post(`/prompts/${id}/versions/${versionId}/set-active`);
            fetchPrompt();
        } catch (err) {
            alert("Error setting active version: " + err.message);
        }
    }

    async function handleDeleteVersion(versionId) {
        if (!window.confirm("Are you sure you want to delete this version?")) return;
        try {
            await apiClient.delete(`/prompts/${id}/versions/${versionId}`);
            fetchPrompt();
        } catch (err) {
            alert("Error deleting version: " + err.message);
        }
    }

    async function handleUpdateVersion() {
        if (!currentVersion.id) return;
        try {
            await apiClient.patch(`/prompts/${id}/versions/${currentVersion.id}`, {
                template: currentVersion.template,
                model_config_json: currentVersion.model_config_json,
                input_variables: JSON.stringify(Object.keys(variables))
            });
            alert('Version updated successfully!');
            fetchPrompt();
        } catch (err) {
            alert('Error updating version: ' + err.message);
        }
    }

    async function handleRun() {
        setExecuting(true);
        setExecutionResult('');
        try {
            // Perform substitution
            let finalPrompt = currentVersion.template;
            Object.entries(variables).forEach(([name, value]) => {
                const regex = new RegExp(`{{${name}}}`, 'g');
                finalPrompt = finalPrompt.replace(regex, value);
            });

            const payload = {
                provider_id: isNaN(parseInt(selectedProviderId)) ? null : parseInt(selectedProviderId),
                model_provider: isNaN(parseInt(selectedProviderId)) ? selectedProviderId : managedProviders.find(p => p.id === parseInt(selectedProviderId))?.name.toLowerCase(),
                model_name: modelName,
                prompt_text: finalPrompt,
                config: JSON.parse(currentVersion.model_config_json || '{}')
            };

            const res = await apiClient.post('/execute/', payload);
            setExecutionResult(res.data.response);
        } catch (err) {
            setExecutionResult('Error: ' + err.message);
        }
        setExecuting(false);
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="md:grid md:grid-cols-2 md:gap-6">

                {/* Left Column: Editor & History */}
                <div className="md:col-span-1">
                    <div className="shadow sm:rounded-md sm:overflow-hidden bg-white">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('editor')}
                                    className={`${activeTab === 'editor' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Editor
                                </button>
                                {!isNew && (
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        Version History
                                    </button>
                                )}
                            </nav>
                        </div>

                        <div className="px-4 py-5 space-y-6 sm:p-6">
                            {activeTab === 'editor' ? (
                                <>
                                    {/* Meta Data */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name</label>
                                        <input
                                            type="text"
                                            value={promptData.name}
                                            onChange={e => setPromptData({ ...promptData, name: e.target.value })}
                                            disabled={isViewOnly}
                                            className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${isViewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            value={promptData.description || ''}
                                            onChange={e => setPromptData({ ...promptData, description: e.target.value })}
                                            disabled={isViewOnly}
                                            rows={2}
                                            className={`mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${isViewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            placeholder="Briefly describe what this prompt does"
                                        />
                                    </div>

                                    {/* Template Editor */}
                                    <div>
                                        <div className="flex justify-between items-center">
                                            <label className="block text-sm font-medium text-gray-700">Prompt Template</label>
                                            {currentVersion.version_number && (
                                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                    Editing Version: V{currentVersion.version_number}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1">
                                            <textarea
                                                rows={10}
                                                disabled={isViewOnly}
                                                className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md ${isViewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                value={currentVersion.template}
                                                onChange={e => setCurrentVersion({ ...currentVersion, template: e.target.value })}
                                                placeholder="Write your prompt here. Use {{variable}} for inputs."
                                            />
                                        </div>
                                    </div>

                                    {!isViewOnly && (
                                        <div className="pt-4 flex justify-end space-x-3">
                                            {!isNew && currentVersion.id && (
                                                <button
                                                    onClick={handleUpdateVersion}
                                                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                                >
                                                    Update Version {currentVersion.version_number}
                                                </button>
                                            )}
                                            <button onClick={handleSave} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">
                                                {isNew ? 'Create Prompt' : 'Save as New Version'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <VersionHistory
                                    promptId={id}
                                    versions={versions}
                                    activeVersionId={promptData.active_version_id}
                                    onSetActive={handleSetActive}
                                    onDelete={handleDeleteVersion}
                                    onLoadVersion={(v) => { setCurrentVersion(v); setActiveTab('editor'); }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Playground */}
                <div className="md:col-span-1 mt-5 md:mt-0">
                    <div className="shadow sm:rounded-md sm:overflow-hidden bg-white">
                        <div className="px-4 py-5 space-y-6 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 border-b pb-2">Playground</h3>

                            {Object.keys(variables).length > 0 && (
                                <div className="space-y-4 pt-2">
                                    <h4 className="text-sm font-semibold text-gray-700">Variables</h4>
                                    <div className="grid grid-cols-1 gap-y-4">
                                        {Object.entries(variables).map(([name, value]) => (
                                            <div key={name}>
                                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{name}</label>
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={e => setVariables({ ...variables, [name]: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    placeholder={`Value for ${name}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Provider</label>
                                    <select
                                        value={selectedProviderId}
                                        onChange={e => {
                                            const pid = e.target.value;
                                            setSelectedProviderId(pid);
                                            const p = managedProviders.find(x => x.id === parseInt(pid));
                                            if (p && p.models.length > 0) {
                                                setModelName(p.models[0].name);
                                            }
                                        }}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    >
                                        {managedProviders.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                        {managedProviders.length === 0 && (
                                            <>
                                                <option value="openai">OpenAI (Default)</option>
                                                <option value="gemini">Gemini (Default)</option>
                                                <option value="ollama">Ollama (Default)</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Model Name</label>
                                    {managedProviders.find(x => x.id === parseInt(selectedProviderId))?.models.length > 0 ? (
                                        <select
                                            value={modelName}
                                            onChange={e => setModelName(e.target.value)}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        >
                                            {managedProviders.find(x => x.id === parseInt(selectedProviderId)).models.map(m => (
                                                <option key={m.id} value={m.name}>{m.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={modelName}
                                            onChange={e => setModelName(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="gpt-3.5-turbo"
                                        />
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleRun}
                                disabled={executing}
                                className={`w-full inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${executing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {executing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Running...
                                    </>
                                ) : 'Run Prompt'}
                            </button>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Result</label>
                                <div className="mt-1 p-3 bg-gray-100 rounded-md min-h-[200px] whitespace-pre-wrap text-sm border">
                                    {executionResult || <span className="text-gray-400">Execution results will appear here...</span>}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

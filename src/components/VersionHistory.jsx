import React, { useState } from 'react';
import apiClient from '../api/client';

export default function VersionHistory({ promptId, versions, activeVersionId, onSetActive, onDelete, onLoadVersion }) {
    const [comparing, setComparing] = useState(null); // { v1: version, v2: version }

    if (!versions || versions.length === 0) return <div className="text-gray-500 text-sm">No versions yet.</div>;

    const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-900">Version History</h4>
                {comparing && (
                    <button
                        onClick={() => setComparing(null)}
                        className="text-xs text-indigo-600 hover:text-indigo-500"
                    >
                        Exit Comparison
                    </button>
                )}
            </div>

            {comparing ? (
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-md border text-xs">
                        <div className="font-bold mb-2">Version {comparing.v1.version_number}</div>
                        <pre className="whitespace-pre-wrap">{comparing.v1.template}</pre>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md border text-xs">
                        <div className="font-bold mb-2">Version {comparing.v2.version_number}</div>
                        <pre className="whitespace-pre-wrap">{comparing.v2.template}</pre>
                    </div>
                </div>
            ) : (
                <div className="max-h-[300px] overflow-y-auto border rounded-md divide-y">
                    {sortedVersions.map((v) => (
                        <div key={v.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">V{v.version_number}</span>
                                    {v.id === activeVersionId && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-800 font-bold uppercase">Active</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">{v.commit_message || 'No message'}</p>
                                <p className="text-[10px] text-gray-400">{new Date(v.created_at).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => onLoadVersion(v)}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Load
                                </button>
                                {v.id !== activeVersionId && (
                                    <button
                                        onClick={() => onSetActive(v.id)}
                                        className="text-xs text-gray-600 hover:underline"
                                    >
                                        Make Active
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        const prev = sortedVersions.find(pv => pv.version_number < v.version_number);
                                        if (prev) setComparing({ v1: prev, v2: v });
                                        else alert("No previous version to compare with.");
                                    }}
                                    className="text-xs text-gray-600 hover:underline"
                                >
                                    Compare
                                </button>
                                <button
                                    onClick={() => onDelete(v.id)}
                                    className="text-xs text-red-600 hover:underline"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

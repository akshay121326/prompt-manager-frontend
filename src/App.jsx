import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import PromptList from './components/PromptList';
import PromptEditor from './components/PromptEditor';
import Layout from './components/Layout';
import ProviderManager from './components/ProviderManager';

function PrivateRoute({ children }) {
    const { currentUser } = useAuth();
    return currentUser ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                        <Route path="/" element={<Navigate to="/prompts" replace />} />
                        <Route path="/prompts" element={<PromptList />} />
                        <Route path="/prompts/new" element={<PromptEditor />} />
                        <Route path="/prompts/:id" element={<PromptEditor />} />
                        <Route path="/providers" element={<ProviderManager />} />
                        <Route path="/settings" element={<div className="p-8">Settings (Coming Soon)</div>} />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;

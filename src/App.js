import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));

    useEffect(() => {
        const handleStorageChange = () => {
            setIsAuthenticated(!!localStorage.getItem('authToken'));
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    return (
        <Router>
            <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
            <div style={{ display: 'flex' }}>
                <Routes>
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/sidebar" /> : <Login setIsAuthenticated={setIsAuthenticated} />} />
                    <Route path="/register" element={isAuthenticated ? <Navigate to="/sidebar" /> : <Register />} />
                    <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/sidebar" element={isAuthenticated ? <Sidebar /> : <Navigate to="/login" />} />
                    <Route path="/" element={isAuthenticated ? <Navigate to="/sidebar" /> : <Navigate to="/login" />} /> {/* Default route */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;

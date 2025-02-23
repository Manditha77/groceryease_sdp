import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if the user is authenticated
        const token = localStorage.getItem('authToken');
        setIsAuthenticated(!!token);
    }, []);

    return (
        <Router>
            <Navbar />
            <div style={{ display: 'flex' }}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/sidebar" element={<Sidebar />} />
                    <Route path="/" element={<Login />} /> {/* Default route */}
                </Routes>
            </div>
        </Router>


    );
}

export default App;
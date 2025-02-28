import {BrowserRouter as Router, Routes, Route, useNavigate, Navigate} from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ManageEmployee from './pages/ManageEmployee';
import Inventory from "./pages/Inventory";
import SupplierManagement from "./pages/SupplierManagement";
import Reports from "./pages/Reports";
import CreditCustomers from "./pages/CreditCustomers";
import Profile from "./pages/Profile";

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
                {isAuthenticated && <Sidebar />}
                <div style={{ flexGrow: 1, padding: '20px' }}>
                    <Routes>
                        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate  to="/login" />} />
                        <Route path="/manage-employees" element={isAuthenticated ? <ManageEmployee /> : <Navigate  to="/login" />} />
                        <Route path="/inventory" element={isAuthenticated ? <Inventory /> : <Navigate  to="/login" />} />
                        <Route path="/manage-suppliers" element={isAuthenticated ? <SupplierManagement /> : <Navigate  to="/login" />} />
                        <Route path="/reports" element={isAuthenticated ? <Reports /> : <Navigate  to="/login" />} />
                        <Route path="/credit-customers" element={isAuthenticated ? <CreditCustomers /> : <Navigate  to="/login" />} />
                        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate  to="/login" />} />
                        <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate  to="/login" />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;

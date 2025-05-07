import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ManageEmployee from './pages/ManageEmployee';
import Inventory from './pages/Inventory';
import SupplierManagement from './pages/SupplierManagement';
import Reports from './pages/Reports';
import CreditCustomers from './pages/CreditCustomers';
import Profile from './pages/Profile';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import PosTerminal from './pages/PosTerminal';
import MobileScanner from './pages/MobileScanner'; // Import MobileScanner
import { CartProvider } from './CartContext';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
    const userType = localStorage.getItem('userType');

    useEffect(() => {
        const handleStorageChange = () => {
            setIsAuthenticated(!!localStorage.getItem('authToken'));
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <CartProvider>
            <Router>
                <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
                <div style={{ display: 'flex' }}>
                    {isAuthenticated && (userType === 'OWNER' || userType === 'EMPLOYEE') && <Sidebar />}
                    <div style={{ flexGrow: 1, padding: '20px' }}>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/mobile-scan" element={<MobileScanner />} /> {/* Added public route for mobile scanning */}

                            {/* Routes for OWNER and EMPLOYEE */}
                            <Route
                                path="/dashboard"
                                element={
                                    isAuthenticated && (userType === 'OWNER' || userType === 'EMPLOYEE') ? (
                                        <Dashboard />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route
                                path="/manage-employees"
                                element={
                                    isAuthenticated && (userType === 'OWNER' || userType === 'EMPLOYEE') ? (
                                        <ManageEmployee />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route
                                path="/inventory"
                                element={
                                    isAuthenticated && (userType === 'OWNER' || userType === 'EMPLOYEE') ? (
                                        <Inventory />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route
                                path="/manage-suppliers"
                                element={
                                    isAuthenticated && (userType === 'OWNER' || userType === 'EMPLOYEE') ? (
                                        <SupplierManagement />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route
                                path="/reports"
                                element={
                                    isAuthenticated && (userType === 'OWNER' || userType === 'EMPLOYEE') ? (
                                        <Reports />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route
                                path="/credit-customers"
                                element={
                                    isAuthenticated && (userType === 'OWNER' || userType === 'EMPLOYEE') ? (
                                        <CreditCustomers />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    isAuthenticated && (userType === 'OWNER' || userType === 'EMPLOYEE') ? (
                                        <Profile />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route
                                path="/pos"
                                element={
                                    isAuthenticated && (userType === 'OWNER' || userType === 'EMPLOYEE') ? (
                                        <PosTerminal />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />

                            {/* Routes for CUSTOMER (E-commerce) */}
                            <Route
                                path="/product-list"
                                element={
                                    isAuthenticated && userType === 'CUSTOMER' ? (
                                        <ProductList />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route
                                path="/cart"
                                element={
                                    isAuthenticated && userType === 'CUSTOMER' ? (
                                        <Cart />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                            <Route
                                path="/checkout"
                                element={
                                    isAuthenticated && userType === 'CUSTOMER' ? (
                                        <Checkout />
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />

                            {/* Default route based on user type */}
                            <Route
                                path="/"
                                element={
                                    isAuthenticated ? (
                                        userType === 'CUSTOMER' ? (
                                            <Navigate to="/product-list" />
                                        ) : (
                                            <Navigate to="/dashboard" />
                                        )
                                    ) : (
                                        <Navigate to="/login" />
                                    )
                                }
                            />
                        </Routes>
                    </div>
                </div>
            </Router>
        </CartProvider>
    );
}

export default App;
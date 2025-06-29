import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import { CartProvider } from './pages/CartContext';
import Register from './pages/Register';
import MyOrders from './pages/MyOrders';
import CustomerProfile from './pages/CustomerProfile'; // Import the new component

const PublicRoute = ({ children }) => {
    return children;
};

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');

    if (!authToken || userType !== 'CUSTOMER') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

const DefaultRoute = () => {
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');

    if (authToken && userType === 'CUSTOMER') {
        return <Navigate to="/products" replace />;
    }

    return <Navigate to="/products" replace />;
};

function App() {
    return (
        <CartProvider>
            <Router>
                <Navbar />
                <Routes>
                    <Route path="/" element={<DefaultRoute />} />
                    <Route
                        path="/products"
                        element={
                            <PublicRoute>
                                <ProductList />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <Register />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/my-orders"
                        element={
                            <ProtectedRoute>
                                <MyOrders />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <CustomerProfile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/cart"
                        element={
                            <ProtectedRoute>
                                <Cart />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/checkout"
                        element={
                            <ProtectedRoute>
                                <Checkout />
                            </ProtectedRoute>
                        }
                    />
                    {/*<Route
                        path="/about-us"
                        element={
                            <PublicRoute>
                                <AboutUs />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/contact-us"
                        element={
                            <PublicRoute>
                                <ContactUs />
                            </PublicRoute>
                        }
                    />*/}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </CartProvider>
    );
}

export default App;
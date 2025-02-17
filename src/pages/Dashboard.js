import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login'); // Redirect to login if no token is found
                return;
            }

            try {
                const response = await axios.get('http://localhost:8080/api/users/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user data', error);
                navigate('/login'); // Redirect to login if token is invalid
            }
        };

        fetchUserData();
    }, [navigate]);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>Welcome, {user.username}!</h2>
            <p>Role: {user.role}</p>

            {user.role === 'OWNER' && (
                <div>
                    <h3>Owner Dashboard</h3>
                    <p>Manage inventory, view reports, and manage users.</p>
                </div>
            )}

            {user.role === 'EMPLOYEE' && (
                <div>
                    <h3>Employee Dashboard</h3>
                    <p>Process orders and manage inventory.</p>
                </div>
            )}

            {user.role === 'CUSTOMER' && (
                <div>
                    <h3>Customer Dashboard</h3>
                    <p>View products, place orders, and track order status.</p>
                </div>
            )}

            <button onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
            }}>
                Logout
            </button>
        </div>
    );
};

export default Dashboard;
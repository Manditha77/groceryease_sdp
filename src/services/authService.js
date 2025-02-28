// groceryease-frontend/src/services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    localStorage.setItem('authToken', response.data.token);

    return response.data;
};

const getEmployees = async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/employees`, {
        headers: {
            Authorization: `Bearer ${token}`, // Add token for authentication
        }
    });
    return response.data;
};

const register = async (firstName, lastName, email, phoneNo, address, userType, username, password) => {
    const response = await axios.post(`${API_URL}/register`, {
        firstName,
        lastName,
        email,
        phoneNo,
        address,
        userType,
        username,
        password,
    });
    return response.data;
};

export default {
    login,
    register,
    getEmployees,
};
// groceryease-frontend/src/services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data;
};

const register = async (firstName, lastName, email, phoneNo, userType, username, password) => {
    const response = await axios.post(`${API_URL}/register`, {
        firstName,
        lastName,
        email,
        phoneNo,
        userType,
        username,
        password,
    });
    return response.data;
};

export default {
    login,
    register,
};
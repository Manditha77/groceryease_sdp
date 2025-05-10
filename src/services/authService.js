import axios from 'axios';

const API_URL_USER = 'http://localhost:8080/api/auth';
const API_URL_SUPPLIER = 'http://localhost:8080/api/supplier';

const login = async (username, password) => {
    const response = await axios.post(`${API_URL_USER}/login`, { username, password });
    if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('username', username);
    }
    return response.data;
};

const getEmployees = async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL_USER}/employees`, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    return response.data;
};

const getUser = async (username) => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL_USER}/users/${username}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    return response.data;
};

const register = async (firstName, lastName, email, phoneNo, address, userType, username, password, customerType) => {
    const response = await axios.post(`${API_URL_USER}/register`, {
        firstName,
        lastName,
        email,
        phoneNo,
        address,
        userType,
        username,
        password,
        customerType,
    });
    return response.data;
};

const updateUser = async (userId, firstName, lastName, email, phoneNo, address, userType, username, password) => {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${API_URL_USER}/users/${userId}`, {
        firstName,
        lastName,
        email,
        phoneNo,
        address,
        userType,
        username,
        password,
    }, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

const deleteUser = async (userId) => {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${API_URL_USER}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

const getSuppliers = async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL_SUPPLIER}/all`, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    return response.data;
};

const registerSupplier = async (firstName, lastName, email, phoneNo, companyName, userType) => {
    const response = await axios.post(`${API_URL_SUPPLIER}/add`, {
        firstName,
        lastName,
        email,
        phoneNo,
        companyName,
        userType,
    });
    return response.data;
};

const updateSupplier = async (userId, firstName, lastName, email, phoneNo, companyName) => {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${API_URL_SUPPLIER}/update/${userId}`, {
        firstName,
        lastName,
        email,
        phoneNo,
        companyName,
    }, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

const deleteSupplier = async (userId) => {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${API_URL_SUPPLIER}/delete/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

export default {
    login,
    register,
    getEmployees,
    deleteUser,
    getSuppliers,
    registerSupplier,
    deleteSupplier,
    getUser,
    updateUser,
    updateSupplier,
};
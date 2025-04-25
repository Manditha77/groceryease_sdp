import axios from 'axios';

const API_URL = 'http://localhost:8080/api/orders';

// Create an Axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a response interceptor for global error handling
axiosInstance.interceptors.response.use(
    (response) => {
        // Return the response as-is for successful requests
        return response;
    },
    (error) => {
        // Handle specific HTTP errors globally
        if (error.response) {
            const { status } = error.response;
            if (status === 401) {
                // Handle unauthorized access (e.g., redirect to login)
                console.error('Unauthorized access - please log in.');
                // Optionally redirect to login page
                // window.location.href = '/login';
            } else if (status === 500) {
                // Handle server errors
                error.message = 'Server error occurred. Please try again later.';
            }
        } else if (!error.response) {
            // Handle network errors
            error.message = 'Network error. Please check your connection and try again.';
        }
        return Promise.reject(error);
    }
);

const orderServices = {
    createOrder: (order) => {
        return axiosInstance.post('', order); // Empty string because baseURL is set
    },
    getAllOrders: () => {
        return axiosInstance.get('');
    },
    updateOrderStatus: (orderId, status) => {
        return axiosInstance.put(`/${orderId}/status`, { status }); // Wrap status in an object
    },
};

export default orderServices;
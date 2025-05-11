import axios from 'axios';

const API_URL = 'http://localhost:8080/api/orders';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const { status } = error.response;
            if (status === 401) {
                console.error('Unauthorized access - please log in.');
            } else if (status === 500) {
                error.message = 'Server error occurred. Please try again later.';
            }
        } else if (!error.response) {
            error.message = 'Network error. Please check your connection and try again.';
        }
        return Promise.reject(error);
    }
);

const orderServices = {
    createOrder: (order) => {
        return axiosInstance.post('', order);
    },
    createPosOrder: (order) => {
        return axiosInstance.post('/pos', order);
    },
    getAllOrders: () => {
        return axiosInstance.get('');
    },
    getOrderById: (orderId) => {
        return axiosInstance.get(`/${orderId}`);
    },
    updateOrderStatus: (orderId, status) => {
        return axiosInstance.put(`/${orderId}/status`, { status });
    },
    getOrdersByCustomer: (customerName) => {
        return axiosInstance.get(`/customer/${customerName}`);
    },
    sendLoanNotification: (orderId) => {
        return axiosInstance.post(`/${orderId}/send-notification`);
    },
};

export default orderServices;
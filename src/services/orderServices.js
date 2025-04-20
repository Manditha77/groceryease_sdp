import axios from 'axios';

const orderServices = {
    createOrder: async (order) => {
        const response = await axios.post('http://localhost:8080/api/orders', order);
        return response.data;
    },
};

export default orderServices;
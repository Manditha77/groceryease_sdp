// groceryease-frontend/src/services/productServices.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/products';

const getAllProducts = () => {
    return axios.get(API_URL);
};

const addProduct = (product) => {
    return axios.post(API_URL, product);
};

const updateProduct = (productId, product) => {
    return axios.put(`${API_URL}/${productId}`, product);
};

const deleteProduct = (productId) => {
    return axios.delete(`${API_URL}/${productId}`);
};

export default {
    getAllProducts,
    addProduct,
    updateProduct,
    deleteProduct
};
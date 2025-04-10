// groceryease-frontend/src/services/productServices.js
import axios from 'axios';

const API_URL_PRODUCT = 'http://localhost:8080/api/products';

const getAllProducts = () => {
    return axios.get(API_URL_PRODUCT);
};

const addProduct = (product) => {
    return axios.post(API_URL_PRODUCT, product);
};

const updateProduct = (productId, product) => {
    return axios.put(`${API_URL_PRODUCT}/${productId}`, product);
};

const deleteProduct = (productId) => {
    return axios.delete(`${API_URL_PRODUCT}/${productId}`);
};


export default {
    getAllProducts,
    addProduct,
    updateProduct,
    deleteProduct
};
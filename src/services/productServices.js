// groceryease-frontend/src/services/productServices.js
import axios from 'axios';

const API_URL_PRODUCT = 'http://localhost:8080/api/products';

const getAllProducts = () => {
    return axios.get(API_URL_PRODUCT);
};

const addProduct = async (productData) => {
    const formData = new FormData();
    formData.append("productName", productData.productName);
    formData.append("categoryName", productData.categoryName);
    const quantity = parseInt(productData.quantity);
    formData.append("quantity", isNaN(quantity) ? 0 : quantity);

    const buyingPrice = parseFloat(productData.buyingPrice);
    formData.append("buyingPrice", isNaN(buyingPrice) ? 0.0 : buyingPrice);

    const sellingPrice = parseFloat(productData.sellingPrice);
    formData.append("sellingPrice", isNaN(sellingPrice) ? 0.0 : sellingPrice);

    formData.append("supplierCompanyName", productData.supplierCompanyName);
    formData.append("image", productData.productImage);

    return axios.post(API_URL_PRODUCT, formData);
};

const updateProduct = async (productId, productData) => {
    const formData = new FormData();
    formData.append("productName", productData.productName);
    formData.append("categoryName", productData.categoryName);
    formData.append("quantity", productData.quantity);
    formData.append("buyingPrice", productData.buyingPrice);
    formData.append("sellingPrice", productData.sellingPrice);
    formData.append("supplierCompanyName", productData.supplierCompanyName);
    if (productData.image) {
        formData.append("image", productData.image);
    }

    const response = await axios.put(`${API_URL_PRODUCT}/${productId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
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
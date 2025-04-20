// groceryease-frontend/src/services/productServices.js
import axios from 'axios';
import defaultImage from '../images/unnamed.jpg'; // Adjust the path as necessary

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

    let fileToUpload;
    if (productData.image instanceof File) {
        // User actually picked a file
        fileToUpload = productData.image;
    } else {
        // No user file → convert your defaultImage URL into a File
        const res  = await fetch(defaultImage);
        const blob = await res.blob();
        fileToUpload = new File([blob], "default.jpg", { type: blob.type });
    }
    formData.append("image", fileToUpload);

    const response = await axios.post(API_URL_PRODUCT, formData);
    return response.data;
};

const updateProduct = async (productId, productData) => {
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

    let fileToUpload;
    if (productData.image instanceof File) {
        // User actually picked a file
        fileToUpload = productData.image;
    } else {
        // No user file → convert your defaultImage URL into a File
        const res  = await fetch(defaultImage);
        const blob = await res.blob();
        fileToUpload = new File([blob], "default.jpg", { type: blob.type });
    }
    formData.append("image", fileToUpload);

    const response = await axios.put(`${API_URL_PRODUCT}/${productId}`, formData);
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
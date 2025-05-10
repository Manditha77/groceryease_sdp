import axios from 'axios';
import defaultImage from '../images/unnamed.jpg';

const API_URL_PRODUCT = 'http://localhost:8080/api/products';
const BARCODE_URL = 'http://localhost:8080/api/barcodes';

const getAllProducts = () => {
    return axios.get(API_URL_PRODUCT);
};

const getProductBatches = (productId) => {
    return axios.get(`${API_URL_PRODUCT}/${productId}/batches`);
};

const addProduct = async (productData) => {
    const formData = new FormData();
    formData.append("productName", productData.productName);
    formData.append("categoryName", productData.categoryName);
    formData.append("quantity", productData.quantity || 0);
    formData.append("buyingPrice", productData.buyingPrice || 0.0);
    formData.append("sellingPrice", productData.sellingPrice || 0.0);
    formData.append("supplierCompanyName", productData.supplierCompanyName);
    formData.append("barcode", productData.barcode || "");

    let fileToUpload;
    if (productData.image instanceof File) {
        fileToUpload = productData.image;
    } else {
        const res = await fetch(defaultImage);
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
    formData.append("quantity", productData.quantity || 0);
    formData.append("buyingPrice", productData.buyingPrice || 0.0);
    formData.append("sellingPrice", productData.sellingPrice || 0.0);
    formData.append("supplierCompanyName", productData.supplierCompanyName);
    formData.append("barcode", productData.barcode || "");

    let fileToUpload;
    if (productData.image instanceof File) {
        fileToUpload = productData.image;
    } else {
        const res = await fetch(defaultImage);
        const blob = await res.blob();
        fileToUpload = new File([blob], "default.jpg", { type: blob.type });
    }
    formData.append("image", fileToUpload);

    const response = await axios.put(`${API_URL_PRODUCT}/${productId}`, formData);
    return response.data;
};

const restockProduct = async (productId, quantity, buyingPrice, sellingPrice, batchId) => {
    const formData = new FormData();
    formData.append("quantity", quantity);
    formData.append("buyingPrice", buyingPrice);
    formData.append("sellingPrice", sellingPrice);
    if (batchId) {
        formData.append("batchId", batchId);
    }
    const response = await axios.post(`${API_URL_PRODUCT}/${productId}/restock`, formData);
    return response.data;
};

const deleteProduct = (productId) => {
    return axios.delete(`${API_URL_PRODUCT}/${productId}`);
};

const getLatestBarcode = () => {
    return axios.get(`${BARCODE_URL}/latest`);
};

const getProductByBarcode = (barcode) => {
    return axios.get(`${API_URL_PRODUCT}/barcode/${barcode}`);
};

const productService = {
    getAllProducts,
    getProductBatches,
    addProduct,
    updateProduct,
    restockProduct,
    deleteProduct,
    getLatestBarcode,
    getProductByBarcode,
};

export default productService;
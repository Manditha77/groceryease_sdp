import axios from 'axios';
import defaultImage from '../images/unnamed.jpg';

const API_URL_PRODUCT = 'http://localhost:8080/api/products';

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
    formData.append("units", Number(productData.units) || 0); // Changed from quantity to units
    formData.append("buyingPrice", Number(productData.buyingPrice) || 0.0);
    formData.append("sellingPrice", Number(productData.sellingPrice) || 0.0);
    formData.append("supplierCompanyName", productData.supplierCompanyName);
    formData.append("barcode", productData.barcode === '' ? '' : productData.barcode);
    formData.append("unitType", productData.unitType || "DISCRETE"); // Added unitType
    if (productData.expireDate) {
        formData.append("expireDate", productData.expireDate); // Added expireDate
    }

    let fileToUpload;
    if (productData.image instanceof File) {
        fileToUpload = productData.image;
    } else {
        const res = await fetch(defaultImage);
        const blob = await res.blob();
        fileToUpload = new File([blob], "default.jpg", { type: blob.type });
    }
    formData.append("image", fileToUpload);

    const response = await axios.post(API_URL_PRODUCT, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const updateProduct = async (productId, productData) => {
    const formData = new FormData();
    formData.append("productName", productData.productName);
    formData.append("categoryName", productData.categoryName);
    formData.append("units", Number(productData.units) || 0); // Changed from quantity to units
    formData.append("buyingPrice", Number(productData.buyingPrice) || 0.0);
    formData.append("sellingPrice", Number(productData.sellingPrice) || 0.0);
    formData.append("supplierCompanyName", productData.supplierCompanyName);
    formData.append("barcode", productData.barcode === '' ? null : productData.barcode);
    formData.append("unitType", productData.unitType || "DISCRETE"); // Added unitType
    if (productData.expireDate) {
        formData.append("expireDate", productData.expireDate); // Added expireDate
    }

    let fileToUpload;
    if (productData.image instanceof File) {
        fileToUpload = productData.image;
    } else {
        const res = await fetch(defaultImage);
        const blob = await res.blob();
        fileToUpload = new File([blob], "default.jpg", { type: blob.type });
    }
    formData.append("image", fileToUpload);

    const response = await axios.put(`${API_URL_PRODUCT}/${productId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const restockProduct = async (productId, units, buyingPrice, sellingPrice, batchId, expireDate) => { // Changed quantity to units, added expireDate
    const formData = new FormData();
    formData.append("units", Number(units)); // Changed from quantity to units
    formData.append("buyingPrice", Number(buyingPrice));
    formData.append("sellingPrice", Number(sellingPrice));
    if (batchId) {
        formData.append("batchId", batchId);
    }
    if (expireDate) {
        formData.append("expireDate", expireDate); // Added expireDate
    }
    const response = await axios.post(`${API_URL_PRODUCT}/${productId}/restock`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const updateBatch = async (batchId, units, buyingPrice, sellingPrice, expireDate) => { // Changed quantity to units, added expireDate
    const formData = new FormData();
    formData.append("units", Number(units)); // Changed from quantity to units
    formData.append("buyingPrice", Number(buyingPrice));
    formData.append("sellingPrice", Number(sellingPrice));
    if (expireDate) {
        formData.append("expireDate", expireDate); // Added expireDate
    }
    const response = await axios.put(`${API_URL_PRODUCT}/batches/${batchId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const deleteBatch = (batchId) => {
    return axios.delete(`${API_URL_PRODUCT}/batches/${batchId}`);
};

const deleteProduct = (productId) => {
    return axios.delete(`${API_URL_PRODUCT}/${productId}`);
};

const getProductByBarcode = (barcode) => {
    return axios.get(`${API_URL_PRODUCT}/barcode/${barcode}`);
};

const getProductByNameAndSupplier = async (productName, supplierCompanyName) => {
    try {
        const rawProductName = productName.replace(/\s*\([^)]+\)\s*$/, '').trim();
        const response = await axios.get(`${API_URL_PRODUCT}/name-supplier`, {
            params: { productName: rawProductName, supplierCompanyName }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getExpiringBatches = () => {
    return axios.get(`${API_URL_PRODUCT}/expiring-batches`);
};

const productService = {
    getAllProducts,
    getProductBatches,
    addProduct,
    updateProduct,
    restockProduct,
    updateBatch,
    deleteBatch, // Added new method
    deleteProduct,
    getProductByBarcode,
    getProductByNameAndSupplier,
    getExpiringBatches,
};

export default productService;
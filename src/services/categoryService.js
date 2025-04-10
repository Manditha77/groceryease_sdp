import axios from "axios";

const API_URL_CATEGORY = "http://localhost:8080/api/categories";

const getAllCategories = () => {
    return axios.get(API_URL_CATEGORY);
}

const addCategory = (category) => {
    return axios.post(API_URL_CATEGORY, category);
};

const updateCategory = (categoryId, category) => {
    return axios.put(`${API_URL_CATEGORY}/${categoryId}`, category);
}

const deleteCategory = (categoryId) => {
    return axios.delete(`${API_URL_CATEGORY}/${categoryId}`);
}

export default {
    getAllCategories,
    addCategory,
    updateCategory,
    deleteCategory
}
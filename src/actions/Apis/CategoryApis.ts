/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

// Main category CRUD operations
const createCategory = async (data: any) => {
    return ApiCalls.postResponse("/categories", data, getCookie("token"));
}

const getAllCategories = async (params?: any) => {
    return ApiCalls.getResponse("/categories", params || {}, getCookie("token"));
}

const getSingleCategory = async (id: string) => {
    return ApiCalls.getResponse(`/categories/${id}`, {}, getCookie("token"));
}

const updateCategory = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/categories/${id}`, data, getCookie("token"));
}

const deleteCategory = async (id: string) => {
    return ApiCalls.deleteResponse(`/categories/${id}`, null, getCookie("token"));
}

// Item management within categories
const addItemToCategory = async (categoryId: string, item: string) => {
    return ApiCalls.postResponse(
        `/categories/${categoryId}/items`, 
        { item }, 
        getCookie("token")
    );
}

const removeItemFromCategory = async (categoryId: string, item: string) => {
    return ApiCalls.deleteResponse(
        `/categories/${categoryId}/items`, 
        { item }, 
        getCookie("token")
    );
}

// Helper functions for specific category types (if needed)
const getCategoriesByType = async (type: string) => {
    return ApiCalls.getResponse("/categories", { type }, getCookie("token"));
}

const CategoryApis = {
    // Main CRUD operations
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory,
    
    // Item management
    addItemToCategory,
    removeItemFromCategory,
    
    // Helper functions
    getCategoriesByType,
    
    // Alias for backward compatibility
    updateCategories: updateCategory
}

export default CategoryApis;
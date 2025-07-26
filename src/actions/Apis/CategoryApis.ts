/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const createCategory = async (data: any) => {
    return ApiCalls.postResponse("/categories", data, getCookie("token"));
}

const getAllCategories = async () => {
    return ApiCalls.getResponse("/categories", {}, getCookie("token"));
}

const updateCategories = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/categories/${id}`, data, getCookie("token"));
}

const CategoryApis = {
    createCategory,
    getAllCategories,
    updateCategories
}

export default CategoryApis;
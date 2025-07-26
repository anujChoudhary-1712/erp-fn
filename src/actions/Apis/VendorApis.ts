/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const addVendors = async (data: any) => {
    return ApiCalls.postResponse("/vendors", data, getCookie("token"));
}

const getAllVendors = async () => {
    return ApiCalls.getResponse("/vendors", {}, getCookie("token"));
}

const updateVendor = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/vendors/${id}`, data, getCookie("token"));
}

const deleteVendor = async (id: string) => {
    return ApiCalls.deleteResponse(`/vendors/${id}`, null, getCookie("token"))
}

const getSingleVendor = async (id: string) => {
    return ApiCalls.getResponse(`/vendors/${id}`, {}, getCookie("token"))
}

// Rating related APIs
const rateVendor = async (id: string, ratingData: any) => {
    return ApiCalls.postResponse(`/vendors/${id}/rate`, ratingData, getCookie("token"));
}

const getVendorRatings = async (id: string) => {
    return ApiCalls.getResponse(`/vendors/${id}/ratings`, {}, getCookie("token"));
}

const VendorApis = {
    addVendors, 
    getAllVendors, 
    updateVendor, 
    deleteVendor, 
    getSingleVendor,
    rateVendor,
    getVendorRatings
}

export default VendorApis
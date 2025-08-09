/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const createPurchaseRequirement = async (data: any) => {
    return ApiCalls.postResponse("/purchase-requirements", data, getCookie("token"));
}

const getAllPurchases = async () => {
    return ApiCalls.getResponse("/purchase-requirements", {}, getCookie("token"));
}

const fulfillPurchase = async (id: string, data: any) => {
    return ApiCalls.patchResponse(`/purchase-requirements/${id}/fulfill`, data, getCookie("token"));
}

const verifyPurchase = async (id: string, data: any) => {
    return ApiCalls.patchResponse(`/purchase-requirements/${id}/verify`, data, getCookie("token"));
}

const updateStatus = async (id: string, status: string) => {
    return ApiCalls.patchResponse(`/purchase-requirements/${id}/status`, { status }, getCookie("token"))
}

const getSinglePurchase = async (id: string) => {
    return ApiCalls.getResponse(`/purchase-requirements/${id}`, {}, getCookie("token"))
}

const evaluateVendors = async (id: string, data: any) => {
    return ApiCalls.postResponse(`/purchase-requirements/${id}/vendor-evaluation`, data, getCookie("token"));
}

const selectVendor = async (id: string, data: any) => {
    return ApiCalls.patchResponse(`/purchase-requirements/${id}/vendor-selection`, data, getCookie("token"));
}

const purchaseReceived = async (id: string, data: any) => {
    return ApiCalls.patchResponse(`/purchase-requirements/${id}/purchase-received`, data, getCookie("token"));
}

const PurchaseReqApis = {
    createPurchaseRequirement,
    getAllPurchases,
    fulfillPurchase,
    verifyPurchase,
    updateStatus,
    getSinglePurchase, evaluateVendors, selectVendor, purchaseReceived
}

export default PurchaseReqApis;
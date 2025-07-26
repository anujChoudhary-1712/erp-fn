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

const updateStatus = async (id: string) => {
    return ApiCalls.patchResponse(`/purchase-requirements/${id}/status`, null, getCookie("token"))
}

const getSinglePurchase = async (id: string) => {
    return ApiCalls.getResponse(`/purchase-requirements/${id}`, {}, getCookie("token"))
}

const PurchaseReqApis = {
    createPurchaseRequirement,
    getAllPurchases,
    fulfillPurchase,
    verifyPurchase,
    updateStatus,
    getSinglePurchase
}

export default PurchaseReqApis;
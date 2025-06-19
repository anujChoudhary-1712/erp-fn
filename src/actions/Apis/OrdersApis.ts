/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const createOrder = async (data: any) => {
    return ApiCalls.postResponse("/orders", data, getCookie("token"));
}

const getAllOrders = async () => {
    return ApiCalls.getResponse("/orders", {}, getCookie("token"));
}

const getIndOrder = async (id: string) => {
    return ApiCalls.getResponse(`/orders/${id}`, {}, getCookie("token"));
}

const updateOrder = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/orders/${id}`, data, getCookie("token"));
}

const getPendingOrders = async () => {
    return ApiCalls.getResponse("/orders/pending", {}, getCookie("token"));
}

const getApprovedOrders = async () => {
    return ApiCalls.getResponse("/orders/approved", {}, getCookie("token"));
}

const getRejectedOrders = async () => {
    return ApiCalls.getResponse("/orders/rejected", {}, getCookie("token"));
}

const reviewOrder = async (id: string, data: any) => {
    return ApiCalls.postResponse(`/orders/review/${id}`, data, getCookie("token"));
}

const updateStatus = async(id:string,data:any) =>{
    return ApiCalls.patchResponse(`/orders/${id}/status`,data,getCookie("token"))
}

const OrderApis = {
    createOrder,
    getAllOrders,
    getIndOrder,
    updateOrder,
    getPendingOrders,
    getApprovedOrders,
    getRejectedOrders,
    reviewOrder,updateStatus
}

export default OrderApis;
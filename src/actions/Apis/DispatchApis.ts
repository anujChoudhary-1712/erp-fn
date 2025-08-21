/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const createDispatch = async (data: any) => {
    return ApiCalls.postResponse("/dispatches", data, getCookie("token"));
}

const getAllDispatches = async (params?: any) => {
    return ApiCalls.getResponse("/dispatches", params || {}, getCookie("token"));
}

const getSingleDispatch = async (id: string) => {
    return ApiCalls.getResponse(`/dispatches/${id}`, {}, getCookie("token"));
}

const updateDispatch = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/dispatches/${id}`, data, getCookie("token"));
}

const approveDispatch = async (id: string, data: any) => {
    return ApiCalls.postResponse(`/dispatches/${id}/approve`, data, getCookie("token"));
}

const markDispatched = async (id: string, data: any) => {
    return ApiCalls.postResponse(`/dispatches/${id}/mark-dispatched`, data, getCookie("token"));
}

const cancelDispatch = async (id: string, reason: string) => {
    return ApiCalls.postResponse(
        `/dispatches/${id}/cancel`, 
        { reason }, 
        getCookie("token")
    );
}

const DispatchApis = {
    createDispatch,
    getAllDispatches,
    getSingleDispatch,
    updateDispatch,
    approveDispatch,
    markDispatched,
    cancelDispatch
}

export default DispatchApis;
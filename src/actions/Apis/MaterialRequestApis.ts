/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const getAllMaterialRequests = async (params?: any) => {
    // Construct query string from params if they exist
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const url = `/material-requests${queryString ? `?${queryString}` : ''}`;
    return ApiCalls.getResponse(url, {}, getCookie("token"));
}

const getSingleMaterialRequest = async (id: string) => {
    return ApiCalls.getResponse(`/material-requests/${id}`, {}, getCookie("token"));
}

const MaterialRequestApis = {
    getAllMaterialRequests,
    getSingleMaterialRequest,
}

export default MaterialRequestApis;

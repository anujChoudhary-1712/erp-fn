/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const addQualityParameter = async (data: any) => {
    return ApiCalls.postResponse("/quality-parameters", data, getCookie("token"));
}

const getAllQualityParameters = async (params?: any) => {
    return ApiCalls.getResponse("/quality-parameters", params || {}, getCookie("token"));
}

const getSingleQualityParameter = async (id: string) => {
    return ApiCalls.getResponse(`/quality-parameters/${id}`, {}, getCookie("token"));
}

const updateQualityParameter = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/quality-parameters/${id}`, data, getCookie("token"));
}

const deleteQualityParameter = async (id: string) => {
    return ApiCalls.deleteResponse(`/quality-parameters/${id}`, null, getCookie("token"));
}

const QualityParameterApis = {
    addQualityParameter,
    getAllQualityParameters,
    getSingleQualityParameter,
    updateQualityParameter,
    deleteQualityParameter
}

export default QualityParameterApis;
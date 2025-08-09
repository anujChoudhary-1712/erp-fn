/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const createReport = async (data: any) => {
    return ApiCalls.postResponse("/reports", data, getCookie("token"));
}

const getAllReports = async () => {
    return ApiCalls.getResponse("/reports", {}, getCookie("token"));
}

const getSingleReports = async (id:string) =>{
    return ApiCalls.getResponse(`/reports/${id}`, {}, getCookie("token"));
}

const updateReport = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/reports/${id}`, data, getCookie("token"));
}

const deleteReport = async (id: string) => {
    return ApiCalls.deleteResponse(`/reports/${id}`, null, getCookie("token"))
}

const ReportApis = {
    createReport,
    getAllReports,
    getSingleReports,
    updateReport,
    deleteReport
}

export default ReportApis;
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const createMachinery = async (data: any) => {
    return ApiCalls.postResponse("/machinery", data, getCookie("token"));
}

const getAllMachinery = async () => {
    return ApiCalls.getResponse("/machinery", {}, getCookie("token"));
}

const getSingleMachinery = async (id:string) =>{
    return ApiCalls.getResponse(`/machinery/${id}`, {}, getCookie("token"));
}

const updateMachinery = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/machinery/${id}`, data, getCookie("token"));
}

const deleteMachinery = async (id: string) => {
    return ApiCalls.deleteResponse(`/machinery/${id}`, null, getCookie("token"))
}

const addMaintainaenaceHistory = async (id:string,data:any) => {
    return ApiCalls.postResponse(`/machinery/${id}/history`, data, getCookie("token"))
}

const MachineryApis = {
    createMachinery,
    getAllMachinery,
    getSingleMachinery,
    updateMachinery,
    deleteMachinery,
    addMaintainaenaceHistory
}

export default MachineryApis;
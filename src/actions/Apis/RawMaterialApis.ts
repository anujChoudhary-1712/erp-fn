/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const addMaterial = async (data: any) => {
    return ApiCalls.postResponse("/raw-materials", data, getCookie("token"));
}

const getAllMaterials = async () => {
    return ApiCalls.getResponse("/raw-materials", {}, getCookie("token"));
}

const updateRawMaterial = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/raw-materials/${id}`, data, getCookie("token"));
}

const deleteRawMaterial = async (id: string) => {
    return ApiCalls.deleteResponse(`/raw-materials/${id}`, null, getCookie("token"))
}

const getSingleRawMaterial = async (id: string) => {
    return ApiCalls.getResponse(`/raw-materials/${id}`, {}, getCookie("token"))
}

const updateWastage = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/raw-materials/${id}/wastage`, data, getCookie("token"));
}

const RawMaterialApis = {
    addMaterial, getAllMaterials, updateRawMaterial, deleteRawMaterial, getSingleRawMaterial,updateWastage
}

export default RawMaterialApis
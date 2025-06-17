/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const addUser = async (data: any) => {
    return ApiCalls.postResponse("/organization-users/add", data, getCookie("token"))
}

const deactivateUser = async (id: string) => {
    return ApiCalls.patchResponse(`/organization-users/deactivate/${id}`, {}, getCookie("token"))
}

const getAllUsers = async () => {
    return ApiCalls.getResponse("/organization-users", {}, getCookie("token"))
}

const activateUser = async (id: string) => {
    return ApiCalls.patchResponse(`/organization-users/activate/${id}`, {}, getCookie("token"))
}

const editUser = async (id: string, data: any) => {
    return ApiCalls.patchResponse(`/organization-users/${id}`, data, getCookie("token"))
}

const deleteUser = async (id: string) => {
    return ApiCalls.deleteResponse(`/organization-users/${id}`, {}, getCookie("token"))
}

const OrgUserApis = {
    addUser,
    deactivateUser,
    getAllUsers, activateUser, deleteUser, editUser
}

export default OrgUserApis;
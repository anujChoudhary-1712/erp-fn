/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const addUser = async (data: any) => {
    return ApiCalls.postResponse("/org-users/add", data, getCookie("token"))
}

const deactivateUser = async (id: string) => {
    return ApiCalls.patchResponse(`/org-users/deactivate/${id}`, {}, getCookie("token"))
}

const getAllUsers = async () => {
    return ApiCalls.getResponse("/org-users", {}, getCookie("token"))
}

const OrgUserApis = {
    addUser,
    deactivateUser,
    getAllUsers
}

export default OrgUserApis;
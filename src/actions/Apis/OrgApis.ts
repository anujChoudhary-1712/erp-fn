/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const createOrg = async (data: any) => {
    return ApiCalls.postResponse("/organizations/create", data, getCookie("token"))
}

const editOrg = async (data: any, id: string) => {
    return ApiCalls.putResponse(`/organizations/${id}`, data, getCookie("token"))
}

const deleteOrg = async (id: string) => {
    return ApiCalls.deleteResponse(`/organizations/${id}`, {}, getCookie("token"))
}

const getAllOrgs = async () => {
    return ApiCalls.getResponse("/organizations", {}, getCookie("token"))
}

const getIndOrg = async (id: string) => {
    return ApiCalls.getResponse(`/organizations/${id}`, {}, getCookie("token"))
}

const OrgApis = {
    createOrg, editOrg, deleteOrg, getAllOrgs, getIndOrg
}

export default OrgApis;
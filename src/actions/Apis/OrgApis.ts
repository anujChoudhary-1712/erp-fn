/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const createOrg = async (data: any) => {
    return ApiCalls.postResponse("/organizations/create", data, getCookie("token"))
}

// New function for creating org with FormData (for file uploads)
const createOrgWithFormData = async (formData: FormData) => {
    const token = getCookie("token");
    
    try {
        const response = await fetch(`${ApiCalls.APIBaseUrl}/organizations/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type header - let browser set it with boundary for FormData
            },
            body: formData,
        });

        const data = await response.json();
        
        return {
            status: response.status,
            data: data,
        };
    } catch (error) {
        console.error('Create org with FormData error:', error);
        throw error;
    }
}

const editOrg = async (data: any, id: string) => {
    return ApiCalls.putResponse(`/organizations/${id}`, data, getCookie("token"))
}

// New function for editing org with FormData (for file uploads)
const editOrgWithFormData = async (formData: FormData, id: string) => {
    const token = getCookie("token");
    
    try {
        const response = await fetch(`${ApiCalls.APIBaseUrl}/organizations/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type header - let browser set it with boundary for FormData
            },
            body: formData,
        });

        const data = await response.json();
        
        return {
            status: response.status,
            data: data,
        };
    } catch (error) {
        console.error('Edit org with FormData error:', error);
        throw error;
    }
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

const getAllUsers = async () => {
    return ApiCalls.getResponse("/users", {}, getCookie("token"))
}

const OrgApis = {
    createOrg, 
    createOrgWithFormData,
    editOrg, 
    editOrgWithFormData,
    deleteOrg, 
    getAllOrgs, 
    getIndOrg,
    getAllUsers
}

export default OrgApis;
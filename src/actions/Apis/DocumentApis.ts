/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";


const getAllDocuments = async () => {
    return ApiCalls.getResponse("/documents", {}, getCookie("token"));
}

const updateDocument = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/documents/${id}`, data, getCookie("token"));
}

const deleteDocument = async (id: string) => {
    return ApiCalls.deleteResponse(`/documents/${id}`, null, getCookie("token"))
}

const getSingleDocument = async (id: string) => {
    return ApiCalls.getResponse(`/documents/${id}`, {}, getCookie("token"))
}

const viewDocument = async (filename: string) => {
    return ApiCalls.getResponse(`/uploads/documents/${filename}`, {}, getCookie("token"))
}

const updateStatus = async (id: string, docId: string, status: string) => {
    return ApiCalls.putResponse(`/documents/${id}/${docId}`, { status }, getCookie("token"));
}

const DocumentApis = {
    getAllDocuments,
    updateDocument,
    deleteDocument,
    getSingleDocument,
    viewDocument, updateStatus
}

export default DocumentApis
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const addWorkflow = async (data: any) => {
    return ApiCalls.postResponse("/workflows", data, getCookie("token"));
}

const getAllWorkflows = async () => {
    return ApiCalls.getResponse("/workflows", {}, getCookie("token"));
}

const updateWorkflow = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/workflows/${id}`, data, getCookie("token"));
}

const deleteWorkflow = async (id: string) => {
    return ApiCalls.deleteResponse(`/workflows/${id}`, null, getCookie("token"))
}

const getSingleWorkflow = async (id: string) => {
    return ApiCalls.getResponse(`/workflows/${id}`, {}, getCookie("token"))
}

const WorkflowApis = {
    addWorkflow, getAllWorkflows, updateWorkflow, deleteWorkflow, getSingleWorkflow
}

export default WorkflowApis
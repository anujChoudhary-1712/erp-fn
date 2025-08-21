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

// New functions for quality parameters
const getStageQualityParameters = async (workflowId: string, stageId: string) => {
    return ApiCalls.getResponse(
        `/workflows/${workflowId}/stages/${stageId}/parameters`, 
        {}, 
        getCookie("token")
    );
}

const addStageQualityParameters = async (workflowId: string, stageId: string, data: any) => {
    return ApiCalls.postResponse(
        `/workflows/${workflowId}/stages/${stageId}/parameters`, 
        data, 
        getCookie("token")
    );
}

const removeStageQualityParameter = async (workflowId: string, stageId: string, paramName: string) => {
    return ApiCalls.deleteResponse(
        `/workflows/${workflowId}/stages/${stageId}/parameters/${paramName}`, 
        null, 
        getCookie("token")
    );
}

const WorkflowApis = {
    addWorkflow, 
    getAllWorkflows, 
    updateWorkflow, 
    deleteWorkflow, 
    getSingleWorkflow,
    getStageQualityParameters,
    addStageQualityParameters,
    removeStageQualityParameter
}

export default WorkflowApis;
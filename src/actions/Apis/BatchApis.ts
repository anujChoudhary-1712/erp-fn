/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const getAllManufacturingBatches = async (params?: any) => {
    // Construct query string from params if they exist
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const url = `/manufacturing-batches${queryString ? `?${queryString}` : ''}`;
    return ApiCalls.getResponse(url, {}, getCookie("token"));
}

const getSingleManufacturingBatch = async (id: string) => {
    return ApiCalls.getResponse(`/manufacturing-batches/${id}`, {}, getCookie("token"));
}

const updateBatchStage = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/manufacturing-batches/${id}/stage`, data, getCookie("token"));
}

const performQualityCheck = async (id: string, data: any) => {
    return ApiCalls.postResponse(
        `/manufacturing-batches/${id}/quality-check`, 
        data, 
        getCookie("token")
    );
}

const getQualityParameters = async (batchId: string, stageId: string) => {
    return ApiCalls.getResponse(
        `/manufacturing-batches/${batchId}/quality-parameters/${stageId}`, 
        {}, 
        getCookie("token")
    );
}

// NEW: Function to resolve a pending rework item
const resolveReworkItem = async (batchId: string, reworkId: string, data: any) => {
    return ApiCalls.postResponse(
        `/manufacturing-batches/${batchId}/rework/${reworkId}/resolve`,
        data,
        getCookie("token")
    );
}

const ManufacturingBatchApis = {
    getAllManufacturingBatches,
    getSingleManufacturingBatch,
    updateBatchStage,
    performQualityCheck,
    getQualityParameters,
    resolveReworkItem, // Added new function
}

export default ManufacturingBatchApis;
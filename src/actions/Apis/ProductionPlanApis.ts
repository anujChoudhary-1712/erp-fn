/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const createProductionPlan = async (data: any) => {
    return ApiCalls.postResponse("/production-plans", data, getCookie("token"));
}

const getAllProductionPlans = async (params?: any) => {
    return ApiCalls.getResponse("/production-plans", params || {}, getCookie("token"));
}

const getSingleProductionPlan = async (id: string) => {
    return ApiCalls.getResponse(`/production-plans/${id}`, {}, getCookie("token"));
}

const updateProductionPlan = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/production-plans/${id}`, data, getCookie("token"));
}

const activateProductionPlan = async (id: string) => {
    return ApiCalls.postResponse(`/production-plans/${id}/activate`, {}, getCookie("token"));
}

// New API call for requesting material issuance
const requestMaterialIssuance = async (planId: string, itemIndex: number, data: any) => {
    return ApiCalls.postResponse(
        `/production-plans/${planId}/items/${itemIndex}/request-materials`, 
        data, 
        getCookie("token")
    );
}

// New API call for approving material issuance
const approveMaterialIssuance = async (requestId: string, data: any) => {
    return ApiCalls.postResponse(
        `/production-plans/approve-materials/${requestId}`,
        data,
        getCookie("token")
    );
}

const cancelProductionPlan = async (id: string, reason: string) => {
    return ApiCalls.postResponse(
        `/production-plans/${id}/cancel`, 
        { reason }, 
        getCookie("token")
    );
}

const ProductionPlanApis = {
    createProductionPlan,
    getAllProductionPlans,
    getSingleProductionPlan,
    updateProductionPlan,
    activateProductionPlan,
    requestMaterialIssuance,
    approveMaterialIssuance,
    cancelProductionPlan
}

export default ProductionPlanApis;
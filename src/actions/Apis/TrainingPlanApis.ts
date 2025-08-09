/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const addTrainingPlan = async (data: any) => {
    return ApiCalls.postResponse("/training-plans", data, getCookie("token"));
};

const getAllTrainingPlans = async () => {
    return ApiCalls.getResponse("/training-plans", {}, getCookie("token"));
};

const getSingleTrainingPlan = async (id: string) => {
    return ApiCalls.getResponse(`/training-plans/${id}`, {}, getCookie("token"));
};

const updateTrainingPlan = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/training-plans/${id}`, data, getCookie("token"));
};

const updateTrainingPlanStatus = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/training-plans/status/${id}`, data, getCookie("token"));
};

const deleteTrainingPlan = async (id: string) => {
    return ApiCalls.deleteResponse(`/training-plans/${id}`, null, getCookie("token"));
};

const TrainingPlanApis = {
    addTrainingPlan,
    getAllTrainingPlans,
    getSingleTrainingPlan,
    updateTrainingPlan,
    updateTrainingPlanStatus,
    deleteTrainingPlan
};

export default TrainingPlanApis;

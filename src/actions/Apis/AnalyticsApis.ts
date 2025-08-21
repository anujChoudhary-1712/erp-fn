/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

// Dashboard Overview
const getDashboardOverview = async (params?: any) => {
    return ApiCalls.getResponse("/analytics/dashboard", params || {}, getCookie("token"));
};

// Detailed Order Analytics
const getOrderAnalytics = async (params?: any) => {
    return ApiCalls.getResponse("/analytics/orders", params || {}, getCookie("token"));
};

// Production Performance Analytics
const getProductionAnalytics = async (params?: any) => {
    return ApiCalls.getResponse("/analytics/production", params || {}, getCookie("token"));
};

// Inventory Insights
const getInventoryInsights = async () => {
    return ApiCalls.getResponse("/analytics/inventory", {}, getCookie("token"));
};

// Financial Analytics
const getFinancialAnalytics = async (params?: any) => {
    return ApiCalls.getResponse("/analytics/financial", params || {}, getCookie("token"));
};

const AnalyticsApis = {
    getDashboardOverview,
    getOrderAnalytics,
    getProductionAnalytics,
    getInventoryInsights,
    getFinancialAnalytics
};

export default AnalyticsApis;
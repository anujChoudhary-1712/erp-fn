/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const createFinishedGood = async (data: any) => {
    return ApiCalls.postResponse("/finished-goods", data, getCookie("token"));
}

const getAllGoods = async () => {
    return ApiCalls.getResponse("/finished-goods", {}, getCookie("token"));
}

const getSingleGood = async (id:string) =>{
    return ApiCalls.getResponse(`/finished-goods/${id}`, {}, getCookie("token"));
}

const updateFinishedGood = async (id: string, data: any) => {
    return ApiCalls.putResponse(`/finished-goods/${id}`, data, getCookie("token"));
}

const deleteFinishedGood = async (id: string) => {
    return ApiCalls.deleteResponse(`/finished-goods/${id}`, null, getCookie("token"))
}

const checkGoodAvailability = async (data: any) => {
    return ApiCalls.postResponse(`/finished-goods/check-availability`, data, getCookie("token"))
}

const GoodsApis = {
    createFinishedGood, getAllGoods, updateFinishedGood, deleteFinishedGood, checkGoodAvailability,getSingleGood
}

export default GoodsApis
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";

const createCustomer = async (data: any) => {
    return ApiCalls.postResponse("/customers", data, getCookie("token"));
}

const getAllCustomers = async () => {
    return ApiCalls.getResponse("/customers", {}, getCookie("token"));
}

const CustomerApis = {
    createCustomer,
    getAllCustomers
}

export default CustomerApis;
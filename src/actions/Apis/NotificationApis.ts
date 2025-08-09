/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ApiCalls from "../ApiCalls";
import { getCookie } from "../CookieUtils";


const getAllNotifications = async (query?:string) => {
    return ApiCalls.getResponse(query ? `/in-app-notifications?${query}` : "/in-app-notifications", {}, getCookie("token"));
}

const updateNotification = async (id: string) => {
    return ApiCalls.patchResponse(`/in-app-notifications/${id}`, {}, getCookie("token"));
}

const NotificationApis = {
    getAllNotifications,
    updateNotification
}

export default NotificationApis;
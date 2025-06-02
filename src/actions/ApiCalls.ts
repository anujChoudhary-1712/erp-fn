/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { getCookie, removeCookie, setCookie } from "./CookieUtils";

export const APIBaseUrl = process.env.NEXT_PUBLIC_API_URL;

// Create a custom axios instance
const axiosInstance = axios.create({
  baseURL: APIBaseUrl,
  withCredentials: true,
});

const getHeader = (formData: boolean, token: string | null) => {
  const headers: {
    Accept: string;
    "Content-Type": string;
    Authorization?: string;
  } = {
    Accept: formData ? "multipart/form-data" : "application/json",
    "Content-Type": formData ? "multipart/form-data" : "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// Track if a token refresh is in progress
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let pendingRequests: Array<{
  config: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

// Process pending requests after token refresh
const processPendingRequests = (token: string) => {
  pendingRequests.forEach(({ config, resolve, reject }) => {
    // Update with the new token
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Retry the request
    axios(config)
      .then((response) => resolve(response))
      .catch((error) => reject(error));
  });
  
  // Clear the queue
  pendingRequests = [];
};
const currentToken = getCookie("accessToken");

// Function to refresh the token
const refreshAuthToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${APIBaseUrl}/auth/refresh`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${currentToken}`
      },
    });
    
    if (response.status === 200 && response.data?.result?.accessToken) {
      const newToken = response.data.result.accessToken;
      setCookie("accessToken", newToken);
      return newToken;
    }
    throw new Error("Token refresh failed");
  } catch (error) {
    console.error("Error refreshing token:", error);
    removeCookie("accessToken");
    // // Handle refresh failure (e.g., logout user)
    window.location.href = "/"; // Redirect to login
    throw error;
  }
};

// Add an interceptor for response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!isRefreshing) {
        // Set flag to true to avoid multiple refresh calls
        isRefreshing = true;
        originalRequest._retry = true;

        try {
          // Refresh the token
          const newToken = await refreshAuthToken();
          isRefreshing = false;
          
          // Update the token in the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          // Process any pending requests
          processPendingRequests(newToken);
          
          // Retry the original request
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          return Promise.reject(refreshError);
        }
      } else {
        // If refresh is already in progress, add request to pending queue
        return new Promise((resolve, reject) => {
          pendingRequests.push({
            config: originalRequest,
            resolve,
            reject,
          });
        });
      }
    }

    return Promise.reject(error);
  }
);

// Modified API call functions to use the axios instance
export const getResponse = (url: string, params: any, token: string | null) => {
  const headers = getHeader(false, token);
  return axiosInstance({
    url,
    params,
    method: "GET",
    headers,
  })
    .then((response) => response)
    .catch((error) => {
      console.error("GET request error:", error);
      return error;
    });
};

export const getResponseWithNoCache = (
  url: string,
  params: any,
  token: string | null
) => {
  return axiosInstance({
    url,
    params,
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
      Authorization: token ? `Bearer ${token}` : "",
    },
  })
    .then((response) => response)
    .catch((error) => {
      console.error("GET request with no cache error:", error);
      return error;
    });
};

export const putResponse = async (
  url: string,
  payload: any,
  token: string | null
) => {
  const headers = await getHeader(false, token);
  return axiosInstance({
    url,
    method: "PUT",
    headers,
    data: payload,
  })
    .then((response) => response)
    .catch((error) => {
      console.error("PUT request error:", error);
      return error;
    });
};

export const deleteResponse = async (
  url: string,
  params: any,
  token: string | null
) => {
  const headers = await getHeader(false, token);
  return axiosInstance({
    url,
    params,
    method: "DELETE",
    headers,
  })
    .then((response) => response)
    .catch((error) => {
      console.error("DELETE request error:", error);
      return error;
    });
};

export const postResponse = async (
  url: string,
  payload: any,
  token: string | null
) => {
  const headers = getHeader(false, token);
  return axiosInstance({
    url,
    method: "POST",
    headers,
    data: payload,
  })
    .then((response) => response)
    .catch((error) => {
      console.error("POST request error:", error);
      return error;
    });
};

export const postResponseFormData = async (
  url: string,
  payload: any,
  token: string | null
) => {
  const headers = await getHeader(true, token);
  return axiosInstance({
    url,
    method: "POST",
    headers,
    data: payload,
  })
    .then((response) => response)
    .catch((error) => {
      console.error("POST form data request error:", error);
      return error;
    });
};

export const patchResponse = async (
  url: string,
  payload: any,
  token: string | null
) => {
  const headers = await getHeader(false, token);
  return axiosInstance({
    url,
    method: "PATCH",
    headers,
    data: payload,
  })
    .then((response) => response)
    .catch((error) => {
      console.error("PATCH request error:", error);
      return error;
    });
};

export const patchResponseFormData = async (
  url: string,
  payload: any,
  token: string | null
) => {
  const headers = await getHeader(true, token);
  return axiosInstance({
    url,
    method: "PATCH",
    headers,
    data: payload,
  })
    .then((response) => response)
    .catch((error) => {
      console.error("PATCH form data request error:", error);
      return error;
    });
};
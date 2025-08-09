/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { ChangeEvent, FormEvent, useState } from "react";
import Button from "../ReusableComponents/Button";
import Input from "../ReusableComponents/InputField";
import AuthApis from "@/actions/Apis/AuthApis";
import { useRouter } from "next/navigation";
import { setCookie } from "@/actions/CookieUtils";
import { useUser } from "@/context/UserContext";
import { AlertCircle, CheckCircle, X } from "lucide-react";

interface FormData {
  email: string;
  password: string;
}

interface Errors {
  [key: string]: string;
}

interface ApiError {
  response?: {
    data?: {
      error: string;
      message?: string;
      errors?: { [key: string]: string };
    };
    status?: number;
  };
  message?: string;
}

const LoginForm = ({ userType }: { userType: "internal" | "organization" }) => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const router = useRouter();
  const { decodeAndSetUser } = useUser();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear API error when user starts typing
    if (apiError) {
      setApiError("");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApiError = (error: ApiError) => {
    console.error("Login failed:", error);

    // Handle different types of API errors
    if (error.response?.data) {
      const { data } = error.response;
      
      // Handle field-specific errors
      if (data.errors) {
        setErrors(data.errors);
        return;
      }

      // Handle general API error messages
      if (data.error) {
        setApiError(data.error);
        return;
      }
    }
    // Handle HTTP status codes
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          setApiError("Invalid email or password. Please check your credentials.");
          break;
        case 401:
          setApiError("Invalid email or password. Please try again.");
          break;
        case 403:
          setApiError("Access denied. Your account may be deactivated.");
          break;
        case 404:
          setApiError("Account not found. Please check your email address.");
          break;
        case 429:
          setApiError("Too many login attempts. Please try again later.");
          break;
        case 500:
          setApiError("Server error. Please try again later.");
          break;
        case 503:
          setApiError("Service temporarily unavailable. Please try again later.");
          break;
        default:
          setApiError("An unexpected error occurred. Please try again.");
      }
      return;
    }

    // Handle network errors
    if (error.message?.includes("Network")) {
      setApiError("Network error. Please check your internet connection.");
      return;
    }

    // Handle timeout errors
    if (error.message?.includes("timeout")) {
      setApiError("Request timeout. Please try again.");
      return;
    }

    // Generic error fallback
    setApiError("Login failed. Please try again.");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setApiError("");
    setSuccessMessage("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await AuthApis.loginUser({
        email: formData.email.trim(),
        password: formData.password,
        userType,
      });

      if (res.status === 200) {
        console.log("Login successful:", res.data);
        
        // Show success message
        setSuccessMessage("Login successful! Redirecting...");

        // Set authentication cookie
        try {
          setCookie("token", res.data.token, {
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
          });
        } catch (cookieError) {
          console.error("Failed to set cookie:", cookieError);
          setApiError("Failed to save login session. Please try again.");
          setLoading(false);
          return;
        }

        // Decode and set user
        try {
          decodeAndSetUser(res.data.token);
        } catch (decodeError) {
          console.error("Failed to decode user:", decodeError);
          setApiError("Invalid authentication token. Please try again.");
          setLoading(false);
          return;
        }

        // Redirect based on user type
        try {
          if (userType === "organization") {
            router.push("/dashboard");
          } else {
            router.push("/internal/organizations");
          }
        } catch (routerError) {
          console.error("Navigation failed:", routerError);
          setApiError("Navigation failed. Please refresh the page.");
          setLoading(false);
          return;
        }

      } else {
        // Handle unexpected successful response
        setApiError("Unexpected response from server. Please try again.");
      }
    } catch (error) {
      console.log("Login error:", error);
      handleApiError(error as ApiError);
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setApiError("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-md min-w-[300px] w-10/12 max-w-[500px]">
        <h2 className="text-xl font-semibold mb-6 text-center">Login</h2>
        
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 rounded-md bg-green-50 border border-green-200 flex items-start">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
            <button
              onClick={clearMessage}
              className="text-green-400 hover:text-green-600 ml-2"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* API Error Message */}
        {apiError && (
          <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 text-sm">{apiError}</p>
            </div>
            <button
              onClick={clearMessage}
              className="text-red-400 hover:text-red-600 ml-2"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            required
            error={errors.email}
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
            required
            error={errors.password}
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            disabled={loading || !!successMessage}
            className="w-full"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
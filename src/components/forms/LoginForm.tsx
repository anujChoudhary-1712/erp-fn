/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { ChangeEvent, FormEvent, useState } from "react";
import Button from "../ReusableComponents/Button";
import Input from "../ReusableComponents/InputField";
import AuthApis from "@/actions/Apis/AuthApis";
import { useRouter } from "next/navigation";
import { setCookie } from "@/actions/CookieUtils";
import { useUser } from "@/context/UserContext";
import {
  ShoppingCart,
  Calendar,
  Package,
  Users,
  Factory,
  CheckCircle,
  FileText,
  Home,
  MoreHorizontal,
  User,
  Wrench,
  ClipboardList,
  AlertCircle,
  X,
} from "lucide-react";

const allNavigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <Home size={20} />,
    href: "/dashboard",
    requiredRoles: ["dashboard", "admin"],
  },
  {
    id: "orders",
    label: "Orders",
    icon: <ShoppingCart size={20} />,
    href: "/dashboard/orders",
    requiredRoles: ["orders", "admin"],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: <Package size={20} />,
    href: "/dashboard/inventory",
    requiredRoles: ["store_finished_goods", "store_raw_materials", "store_general", "machinery", "admin"],
    children: [
      {
        id: "finished-goods",
        label: "Finished Goods",
        icon: <Package size={16} />,
        href: "/dashboard/inventory/finished-goods",
        requiredRoles: ["store_finished_goods", "admin"],
      },
      {
        id: "raw-materials",
        label: "Raw Materials",
        icon: <Package size={16} />,
        href: "/dashboard/inventory/materials",
        requiredRoles: ["store_raw_materials", "admin"],
      },
      {
        id: "general",
        label: "General",
        icon: <Package size={16} />,
        href: "/dashboard/inventory/general",
        requiredRoles: ["store_general", "admin"],
      },
      {
        id: "machinery",
        label: "Machinery",
        icon: <Wrench size={16} />,
        href: "/dashboard/inventory/machinery",
        requiredRoles: ["machinery", "admin"],
      },
    ],
  },
  {
    id: "purchase-request",
    label: "Purchase Request",
    icon: <ClipboardList size={20} />,
    href: "/dashboard/purchases",
    requiredRoles: ["purchase_request", "admin"],
  },
  {
    id: "vendors",
    label: "Vendors",
    icon: <Users size={20} />,
    href: "/dashboard/vendors",
    requiredRoles: ["vendors", "admin"],
  },
  {
    id: "production",
    label: "Production",
    icon: <Factory size={20} />,
    href: "/dashboard/production",
    requiredRoles: ["production_plans", "production_batch_mgt", "admin"],
    children: [
      {
        id: "production-plans",
        label: "Production plans",
        icon: <CheckCircle size={16} />,
        href: "/dashboard/planning",
        requiredRoles: ["production_plans", "admin"],
      },
      {
        id: "batch-management",
        label: "Batch management",
        icon: <Factory size={16} />,
        href: "/dashboard/production",
        requiredRoles: ["production_batch_mgt", "admin"],
      },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    icon: <FileText size={20} />,
    href: "/dashboard/documents",
    requiredRoles: ["documents", "admin"],
  },
  // Removed old 'machinery' top-level item since it's now a child of 'inventory'
  {
    id: "report-n-complaint",
    label: "Report & Complaint",
    icon: <FileText size={20} />,
    href: "/dashboard/report",
    requiredRoles: ["reports", "admin"],
  },
  {
    id: "personnel",
    label: "Personnel",
    icon: <User size={20} />,
    href: "/dashboard/personnel",
    requiredRoles: ["personnel_team", "personnel_training", "admin"],
    children: [
      {
        id: "personnel-team",
        label: "Team",
        icon: <Users size={16} />,
        href: "/dashboard/personnel/team",
        requiredRoles: ["personnel_team", "admin"],
      },
      {
        id: "training-plans",
        label: "Training plans",
        icon: <Calendar size={16} />,
        href: "/dashboard/personnel/training-plan",
        requiredRoles: ["personnel_training", "admin"],
      },
    ],
  },
];

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

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (apiError) {
      setApiError("");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

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

    if (error.response?.data) {
      const { data } = error.response;

      if (data.errors) {
        setErrors(data.errors);
        return;
      }

      if (data.error) {
        setApiError(data.error);
        return;
      }
    }
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          setApiError(
            "Invalid email or password. Please check your credentials."
          );
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
          setApiError(
            "Service temporarily unavailable. Please try again later."
          );
          break;
        default:
          setApiError("An unexpected error occurred. Please try again.");
      }
      return;
    }

    if (error.message?.includes("Network")) {
      setApiError("Network error. Please check your internet connection.");
      return;
    }

    if (error.message?.includes("timeout")) {
      setApiError("Request timeout. Please try again.");
      return;
    }

    setApiError("Login failed. Please try again.");
  };

  const getRedirectPathBasedOnRole = (roles: string[]): string => {
    if (roles.includes("admin")) {
      return "/dashboard";
    }

    const allNavItems = allNavigationItems.flatMap((item) => [
      item,
      ...(item.children || []),
    ]);

    // Priority order for redirection
    const priorityRoles = [
      "dashboard",
      "orders",
      "store_finished_goods",
      "store_raw_materials",
      "store_general",
      "machinery",
      "purchase_request",
      "vendors",
      "production_plans",
      "production_batch_mgt",
      "documents",
      "reports",
      "personnel_team",
      "personnel_training",
    ];

    for (const role of priorityRoles) {
      const matchedItem = allNavItems.find((item) =>
        item.requiredRoles.includes(role)
      );
      if (matchedItem) {
        return matchedItem.href;
      }
    }

    return "/dashboard"; // Fallback to dashboard
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setApiError("");
    setSuccessMessage("");

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
        setSuccessMessage("Login successful! Redirecting...");

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

        const decodedToken: any = decodeAndSetUser(res.data.token);

        try {
          if (userType === "organization") {
            const redirectToPath = getRedirectPathBasedOnRole(
              decodedToken.roles || []
            );
            router.push(redirectToPath);
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
        if (res.status === 401) {
          setApiError("Invalid email or password. Please try again.");
        } else if (res.status === 403) {
          setApiError("Access denied. Your account may be deactivated.");
        } else {
          setApiError("Unexpected response from server. Please try again.");
        }
      }
    } catch (error) {
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
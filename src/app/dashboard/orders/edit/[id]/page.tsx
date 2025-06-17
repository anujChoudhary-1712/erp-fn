/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import OrderApis from "@/actions/Apis/OrdersApis";
import { useUser } from "@/context/UserContext";
import EditOrderForm from "@/components/forms/EditOrderForm";

// TypeScript interfaces
interface Customer {
  name: string;
  phone: string;
  address: string;
}

interface OrderItem {
  name: string;
  unit: string;
  unit_price: number;
  quantity: number;
}

interface OrderFormData {
  expected_delivery_date: string;
  order_date: string;
  customer: Customer;
  order_items: OrderItem[];
  total_amount: number;
}

// Helper function to format ISO date to YYYY-MM-DD
const formatDateForInput = (isoDateString: string): string => {
  if (!isoDateString) return "";
  try {
    const date = new Date(isoDateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

const EditOrderPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingOrder, setFetchingOrder] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [initialData, setInitialData] = useState<OrderFormData | null>(null);
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  
  const orderId = params?.id as string;

  // Fetch existing order data
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setError("Order ID is required");
        setFetchingOrder(false);
        return;
      }

      try {
        setFetchingOrder(true);
        setError("");
        
        const response = await OrderApis.getIndOrder(orderId);
        
        if (response.status === 200 && response.data) {
          const orderData = response.data.order;
          
          // Transform the API response to match the form data structure
          const formData: OrderFormData = {
            expected_delivery_date: formatDateForInput(orderData.expected_delivery_date),
            order_date: formatDateForInput(orderData.order_date),
            customer: {
              name: orderData.customer?.name || "",
              phone: orderData.customer?.phone || "",
              address: orderData.customer?.address || "",
            },
            order_items: orderData.order_items?.map((item: any) => ({
              name: item.name || "",
              unit: item.unit || "piece",
              unit_price: Number(item.unit_price) || 0,
              quantity: Number(item.quantity) || 1,
            })) || [
              {
                name: "",
                unit: "piece",
                unit_price: 0,
                quantity: 1,
              }
            ],
            total_amount: Number(orderData.total_amount) || 0,
          };
          
          setInitialData(formData);
        } else {
          throw new Error(response.data?.message || "Failed to fetch order data");
        }
      } catch (error: any) {
        console.error("Error fetching order:", error);
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load order data. Please try again."
        );
      } finally {
        setFetchingOrder(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  const handleUpdateOrder = async (data: OrderFormData): Promise<void> => {
    if (!orderId) {
      setError("Order ID is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Format the data to match the API requirements
      const orderData = {
        expected_delivery_date: data.expected_delivery_date,
        order_date: data.order_date,
        customer: {
          name: data.customer.name.trim(),
          phone: data.customer.phone.trim(),
          address: data.customer.address.trim(),
        },
        order_items: data.order_items.map((item) => ({
          name: item.name.trim(),
          unit: item.unit,
          unit_price: Number(item.unit_price),
          quantity: Number(item.quantity),
        })),
        total_amount: Number(data.total_amount),
        org_id: user?.organizationId || "", // Ensure org_id is set
      };

      const response = await OrderApis.updateOrder(orderId, orderData);

      if (response.status === 200 || response.status === 201) {
        setSuccess("Order updated successfully!");
        // Redirect after a short delay to show success message
        setTimeout(() => {
          router.push("/dashboard/orders");
        }, 1500);
      } else {
        throw new Error(response.data?.message || "Failed to update order");
      }
    } catch (error: any) {
      console.error("Error updating order:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while updating the order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while fetching order data
  if (fetchingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                Loading order data...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if failed to fetch order data
  if (!initialData && error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="Go back"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Edit Order
                </h1>
              </div>
            </div>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Edit Order
              </h1>
              <p className="text-gray-600 mt-1">
                Update the order details below
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        {initialData && (
          <EditOrderForm 
            onSubmit={handleUpdateOrder} 
            loading={loading}
            initialData={initialData}
          />
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                Updating order...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditOrderPage;
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import OrderApis from "@/actions/Apis/OrdersApis";
import CreateOrderForm from "@/components/forms/CreateOrderForm";
import { useUser } from "@/context/UserContext";

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

const CreateOrderPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const router = useRouter();
  const { user } = useUser();

  const handleCreateOrder = async (data: OrderFormData): Promise<void> => {
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

      const response = await OrderApis.createOrder(orderData);

      if (response.status === 200 || response.status === 201) {
        router.push("/dashboard/orders");
      } else {
        throw new Error(response.data?.message || "Failed to create order");
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while creating the order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
                Create New Order
              </h1>
              <p className="text-gray-600 mt-1">
                Fill in the details below to create a new purchase order
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
        <CreateOrderForm onSubmit={handleCreateOrder} loading={loading} />

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                Creating order...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateOrderPage;

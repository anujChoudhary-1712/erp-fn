"use client";
import OrderApis from "@/actions/Apis/OrdersApis";
import Button from "@/components/ReusableComponents/Button";
import { formatDate } from "@/utils/date";
import { formatCurrency, getStatusColor } from "@/utils/order";
import { useRouter, useParams } from "next/navigation";
import React, { useState, useEffect } from "react";

// TypeScript interfaces
interface Customer {
  name: string;
  phone: string;
  address: string;
}

interface OrderItem {
  _id: string;
  name: string;
  unit: string;
  unit_price: number;
  quantity: number;
}

interface Order {
  _id: string;
  customer: Customer;
  expected_delivery_date: string;
  status: string;
  order_items: OrderItem[];
  total_amount: number;
  org_id: string;
  order_date: string;
  created_date: string;
  last_modified_date: string;
  po_number: string;
  __v: number;
}

const OrderDetailsPage: React.FC = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [reason, setReason] = useState<string>("");
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await OrderApis.getIndOrder(orderId);
      if (res.status === 200) {
        setOrder(res.data.order);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!order) return;

    const confirmMessage = reason 
      ? `Are you sure you want to approve this order?\nReason: ${reason}`
      : "Are you sure you want to approve this order?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await OrderApis.reviewOrder(order._id, {
        action: "approve",
        reason: reason,
      });
      if (res.status === 200) {
        setOrder({ ...order, status: "approve" });
        setReason(""); // Clear reason after successful action
      }
    } catch (error) {
      console.error("Error approving order:", error);
      // Optionally show error message
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!order) return;

    const confirmMessage = reason 
      ? `Are you sure you want to reject this order?\nReason: ${reason}`
      : "Are you sure you want to reject this order?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await OrderApis.reviewOrder(order._id, {
        action: "reject",
        reason: reason,
      });
      if (res.status === 200) {
        setOrder({ ...order, status: "rejected" });
        setReason(""); // Clear reason after successful action
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      // Optionally show error message
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Order not found
          </h3>
          <p className="text-gray-600 mb-4">
            The order you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push("/dashboard/orders")}
          >
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/orders")}
            className="flex items-center space-x-2 w-fit"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Order Details - {order.po_number}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Created on {formatDate(order.created_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <span
            className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(
              order.status
            )}`}
          >
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Items ({order.order_items?.length || 0})
            </h2>
            <div className="space-y-4">
              {order.order_items?.map((item: OrderItem, index: number) => (
                <div
                  key={item._id || index}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      {item.quantity} {item.unit} ×{" "}
                      {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Amount:
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-green-600">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Name:
                </label>
                <p className="text-gray-900 break-words">{order.customer?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Phone:
                </label>
                <p className="text-gray-900 break-all">{order.customer?.phone}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <label className="text-sm font-medium text-gray-600">
                  Address:
                </label>
                <p className="text-gray-900 break-words">{order.customer?.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                <span className="text-gray-600 text-sm sm:text-base">Order Date:</span>
                <span className="text-gray-900 text-sm sm:text-base">
                  {formatDate(order.order_date)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                <span className="text-gray-600 text-sm sm:text-base">Expected Delivery:</span>
                <span className="text-gray-900 text-sm sm:text-base">
                  {formatDate(order.expected_delivery_date)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                <span className="text-gray-600 text-sm sm:text-base">Last Modified:</span>
                <span className="text-gray-900 text-sm sm:text-base">
                  {formatDate(order.last_modified_date)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                <span className="text-gray-600 text-sm sm:text-base">Total Items:</span>
                <span className="text-gray-900 text-sm sm:text-base">
                  {order.order_items?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Actions - Only show when status is pending */}
          {order.status === "pending" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h2>
              <div className="space-y-4">
                {/* Reason Input */}
                <div>
                  <label 
                    htmlFor="reason" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Reason (Optional)
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for your decision..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={actionLoading}
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "Approve Order"}
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "Reject Order"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
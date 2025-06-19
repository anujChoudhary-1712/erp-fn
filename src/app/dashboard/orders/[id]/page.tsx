"use client";
import GoodsApis from "@/actions/Apis/GoodsApis";
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
  productId: string;
}

interface OrderItemWithStock extends OrderItem {
  isAvailable?: boolean;
  stockLoading?: boolean;
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
  review_checklist?: {
    availability_check: boolean;
    capability_check: boolean;
    delivery_feasible: boolean;
    price_approved: boolean;
  };
  reason?: string;
  __v: number;
}

const OrderDetailsPage: React.FC = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItemsWithStock, setOrderItemsWithStock] = useState<OrderItemWithStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [reason, setReason] = useState<string>("");
  const [reviewChecklist, setReviewChecklist] = useState({
    availability_check: false,
    capability_check: false,
    delivery_feasible: false,
    price_approved: false
  });
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchStockAvailability = async (productId: string, quantity: number) => {
    try {
      const res = await GoodsApis.checkGoodAvailability({
        _id: productId,
        stock_required: quantity
      });
      if (res.status === 200) {
        return res.data.is_available;
      }
      return false;
    } catch (error) {
      console.error("Error checking stock availability:", error);
      return false;
    }
  };

  const moveToDispatch = async () => {
    if (!window.confirm("Are you sure you want to move this order to dispatch?")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await OrderApis.updateStatus(orderId, {
        status: "dispatched",
      });
      if (res.status === 200) {
        setOrder({ ...order!, status: "dispatched" });
        console.log(res.data);
      }
    } catch (error) {
      console.error("Error moving to dispatch:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const moveToProduction = async () => {
    if (!window.confirm("Are you sure you want to move this order to production?")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await OrderApis.updateStatus(orderId, {
        status: "production",
      });
      if (res.status === 200) {
        setOrder({ ...order!, status: "production" });
        console.log(res.data);
      }
    } catch (error) {
      console.error("Error moving to production:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const checkAllItemsStock = async (items: OrderItem[]) => {
    const itemsWithStock: OrderItemWithStock[] = items.map(item => ({
      ...item,
      stockLoading: true,
      isAvailable: undefined
    }));
    
    setOrderItemsWithStock(itemsWithStock);

    // Check stock for each item
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        const isAvailable = await fetchStockAvailability(item.productId, item.quantity);
        return {
          ...item,
          isAvailable,
          stockLoading: false
        };
      })
    );

    setOrderItemsWithStock(updatedItems);
  };

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await OrderApis.getIndOrder(orderId);
      if (res.status === 200) {
        setOrder(res.data.order);
        // Check stock availability for all items
        await checkAllItemsStock(res.data.order.order_items);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistChange = (field: keyof typeof reviewChecklist) => {
    setReviewChecklist(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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
        review_checklist: reviewChecklist
      });
      if (res.status === 200) {
        setOrder({ ...order, status: "approve" });
        setReason(""); // Clear reason after successful action
        // Reset checklist
        setReviewChecklist({
          availability_check: false,
          capability_check: false,
          delivery_feasible: false,
          price_approved: false
        });
        // Fetch updated order details to get the review_checklist data
        await fetchOrderDetails();
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
        review_checklist: reviewChecklist
      });
      if (res.status === 200) {
        setOrder({ ...order, status: "rejected" });
        setReason(""); // Clear reason after successful action
        // Reset checklist
        setReviewChecklist({
          availability_check: false,
          capability_check: false,
          delivery_feasible: false,
          price_approved: false
        });
        // Fetch updated order details to get the review_checklist data
        await fetchOrderDetails();
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      // Optionally show error message
    } finally {
      setActionLoading(false);
    }
  };

  const getStockBadge = (item: OrderItemWithStock) => {
    if (item.stockLoading) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600 mr-1"></div>
          Checking...
        </span>
      );
    }

    if (item.isAvailable === true) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
          In Stock
        </span>
      );
    }

    if (item.isAvailable === false) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
          Out of Stock
        </span>
      );
    }

    return null;
  };

  // Check if all items are in stock
  const allItemsInStock = orderItemsWithStock.every(item => item.isAvailable === true);
  const hasOutOfStockItems = orderItemsWithStock.some(item => item.isAvailable === false);

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
              Order Items ({orderItemsWithStock?.length || 0})
            </h2>
            <div className="space-y-4">
              {orderItemsWithStock?.map((item: OrderItemWithStock, index: number) => (
                <div
                  key={item._id || index}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-4 px-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      {getStockBadge(item)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {item.quantity} {item.unit} ×{" "}
                      {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right sm:ml-4">
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

          {/* Review Details - Show when order has been reviewed */}
          {(order.status === "approve" || order.status === "rejected") && order.review_checklist && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Review Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Availability Check:</span>
                  <span className={`text-sm font-medium ${order.review_checklist.availability_check ? 'text-green-600' : 'text-red-600'}`}>
                    {order.review_checklist.availability_check ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Capability Check:</span>
                  <span className={`text-sm font-medium ${order.review_checklist.capability_check ? 'text-green-600' : 'text-red-600'}`}>
                    {order.review_checklist.capability_check ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Delivery Feasible:</span>
                  <span className={`text-sm font-medium ${order.review_checklist.delivery_feasible ? 'text-green-600' : 'text-red-600'}`}>
                    {order.review_checklist.delivery_feasible ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price Approved:</span>
                  <span className={`text-sm font-medium ${order.review_checklist.price_approved ? 'text-green-600' : 'text-red-600'}`}>
                    {order.review_checklist.price_approved ? 'Yes' : 'No'}
                  </span>
                </div>
                {order.reason && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Review Reason:</span>
                    <p className="text-sm text-gray-600 mt-1">{order.reason}</p>
                  </div>
                )}
              </div>
            </div>
                      )}

          {/* Production Actions - Show when status is approve */}
          {order.status === "approve" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Production Actions
              </h2>
              <div className="space-y-4">
                {/* Stock Status Alert */}
                {hasOutOfStockItems && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          Some items are out of stock. Dispatch is not available until all items are in stock.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={moveToProduction}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Processing..." : "Move to Production"}
                  </Button>
                  
                  {/* Only show Move to Dispatch if all items are in stock */}
                  {allItemsInStock && (
                    <Button
                      variant="success"
                      className="w-full"
                      onClick={moveToDispatch}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Processing..." : "Move to Dispatch"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions - Only show when status is pending */}
          {order.status === "pending" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h2>
              <div className="space-y-4">
                {/* Review Checklist */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Review Checklist
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="availability_check"
                        type="checkbox"
                        checked={reviewChecklist.availability_check}
                        onChange={() => handleChecklistChange('availability_check')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={actionLoading}
                      />
                      <label htmlFor="availability_check" className="ml-2 text-sm text-gray-900">
                        Availability Check
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="capability_check"
                        type="checkbox"
                        checked={reviewChecklist.capability_check}
                        onChange={() => handleChecklistChange('capability_check')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={actionLoading}
                      />
                      <label htmlFor="capability_check" className="ml-2 text-sm text-gray-900">
                        Capability Check
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="delivery_feasible"
                        type="checkbox"
                        checked={reviewChecklist.delivery_feasible}
                        onChange={() => handleChecklistChange('delivery_feasible')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={actionLoading}
                      />
                      <label htmlFor="delivery_feasible" className="ml-2 text-sm text-gray-900">
                        Delivery Feasible
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="price_approved"
                        type="checkbox"
                        checked={reviewChecklist.price_approved}
                        onChange={() => handleChecklistChange('price_approved')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={actionLoading}
                      />
                      <label htmlFor="price_approved" className="ml-2 text-sm text-gray-900">
                        Price Approved
                      </label>
                    </div>
                  </div>
                </div>

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
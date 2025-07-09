"use client";
import OrderApis from "@/actions/Apis/OrdersApis";
import Button from "@/components/ReusableComponents/Button";
import { formatDate } from "@/utils/date";
import { formatCurrency, getStatusColor } from "@/utils/order";
import { useRouter } from "next/navigation";
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

interface Tab {
  id: string;
  label: string;
  count: number;
}

const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // Store all orders for counting
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  // Calculate counts for each tab
  const getTabCounts = (orders: Order[]) => {
    const counts = {
      all: orders.length,
      pending: orders.filter(
        (order) => order.status?.toLowerCase() === "pending"
      ).length,
      rejected: orders.filter(
        (order) => order.status?.toLowerCase() === "reject"
      ).length,
      approved: orders.filter(
        (order) => order.status?.toLowerCase() === "approved"
      ).length,
    };
    return counts;
  };

  const tabCounts = getTabCounts(allOrders);

  const tabs: Tab[] = [
    { id: "all", label: "All Orders", count: tabCounts.all },
    { id: "pending", label: "Pending", count: tabCounts.pending },
    { id: "rejected", label: "Rejected", count: tabCounts.rejected },
    { id: "approved", label: "Approved", count: tabCounts.approved },
  ];

  const fetchOrders = async (type: string): Promise<void> => {
    setLoading(true);
    try {
      let res;
      switch (type) {
        case "all":
          res = await OrderApis.getAllOrders();
          break;
        case "pending":
          res = await OrderApis.getPendingOrders();
          break;
        case "rejected":
          res = await OrderApis.getRejectedOrders();
          break;
        case "approved":
          res = await OrderApis.getApprovedOrders();
          break;
        default:
          res = await OrderApis.getAllOrders();
      }

      if (res.status === 200) {
        setOrders(res.data.orders || []);

        // If this is the first load or all orders, store all orders for counting
        if (type === "all" || allOrders.length === 0) {
          setAllOrders(res.data.orders || []);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type} orders:`, error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all orders on component mount to get counts
  useEffect(() => {
    const fetchAllOrdersForCounts = async () => {
      try {
        const res = await OrderApis.getAllOrders();
        if (res.status === 200) {
          setAllOrders(res.data.orders || []);
        }
      } catch (error) {
        console.error("Error fetching all orders for counts:", error);
      }
    };

    fetchAllOrdersForCounts();
  }, []);

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const handleViewDetails = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  const OrderCard: React.FC<{ order: Order }> = ({ order }) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
      {/* Header with PO Number and Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">
            {order.po_number}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
              order.status
            )}`}
          >
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </span>
        </div>
      </div>

      {/* Order Details */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Order Date:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatDate(order.order_date)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Customer:</span>
          <span className="text-sm font-medium text-gray-900">
            {order.customer?.name}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Amount:</span>
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(order.total_amount)}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          className="w-full mb-2 text-sm"
          onClick={() => router.push(`/dashboard/orders/edit/${order._id}`)}
        >
          Edit Order
        </Button>
        <Button
          variant="primary"
          className="w-full text-sm"
          onClick={() => handleViewDetails(order._id)}
        >
          View Details
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-0">
          Purchase Orders
        </h1>
        <Button
          variant="primary"
          className="w-full md:w-auto"
          onClick={() => {
            router.push("/dashboard/orders/create");
          }}
        >
          + Add Order
        </Button>
      </div>

      {/* Summary Stats */}
      {allOrders.length > 0 && (
        <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {allOrders.length}
              </p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  allOrders.reduce(
                    (sum: number, order: Order) => sum + order.total_amount,
                    0
                  )
                )}
              </p>
              <p className="text-sm text-gray-600">Total Value</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {allOrders.reduce(
                  (sum: number, order: Order) =>
                    sum + (order.order_items?.length || 0),
                  0
                )}
              </p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {allOrders.length > 0
                  ? formatCurrency(
                      allOrders.reduce(
                        (sum: number, order: Order) => sum + order.total_amount,
                        0
                      ) / allOrders.length
                    )
                  : formatCurrency(0)}
              </p>
              <p className="text-sm text-gray-600">Avg. Order Value</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === "all"
                ? "No orders have been created yet."
                : `No ${activeTab} orders found.`}
            </p>
            {activeTab === "all" && (
              <Button
                variant="primary"
                onClick={() => {
                  router.push("/dashboard/orders/create");
                }}
              >
                Create Your First Order
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order: Order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;

"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AnalyticsApis from "@/actions/Apis/AnalyticsApis";
import { useUser } from "@/context/UserContext";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// MODIFIED: Added wastageTrends to the interface
interface DashboardStats {
  orders: {
    total: number;
    recent: number;
    byStatus: Array<{ _id: string; count: number; totalValue?: number }>;
    valueStats: {
      totalValue: number;
      avgOrderValue: number;
      maxOrderValue: number;
      minOrderValue: number;
    };
  };
  production: {
    total: number;
    active: number;
    recent: number;
    byStatus: Array<{ _id: string; count: number }>;
    items: Array<{
      _id: string;
      count: number;
      totalPlanned: number;
      totalProduced: number;
    }>;
  };
  purchases: {
    total: number;
    recent: number;
    byStatus: Array<{ _id: string; count: number }>;
    byType: Array<{ _id: string; count: number }>;
  };
  batches: {
    total: number;
    active: number;
    recent: number;
    byStatus: Array<{ _id: string; count: number }>;
    completionStats: {
      totalProduced: number;
      avgBatchSize: number;
      totalBatches: number;
    };
  };
  dispatches: {
    total: number;
    recent: number;
    byStatus: Array<{ _id: string; count: number; totalValue?: number }>;
    valueStats: {
      totalValue: number;
      avgDispatchValue: number;
      totalDispatches: number;
    };
  };
  inventory: {
    finishedGoods: {
      totalProducts: number;
      totalStock: number;
      totalValue: number;
      avgStock: number;
    };
    rawMaterials: {
      totalMaterials: number;
      totalStock: number;
      totalValue: number;
      avgStock: number;
    };
    lowStock: { finishedGoods: number; rawMaterials: number; total: number };
  };
  orderTrends?: Array<{ date: string; orders: number; revenue: number }>;
  productionTrends?: Array<{ date: string; planned: number; produced: number }>;
  wastageTrends?: Array<{
    date: string;
    rejectedQuantity: number;
    financialLoss: number;
  }>;
}

interface InventoryAlert {
  finishedGoods: Array<{
    _id: string;
    product_name: string;
    current_stock: number;
    trigger_value: number;
    unit: string;
  }>;
  rawMaterials: Array<{
    _id: string;
    material_name: string;
    current_stock: number;
    trigger_value: number;
    unit: string;
  }>;
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert | null>(
    null
  );
  const [ordersTrendData, setOrdersTrendData] = useState<any[]>([]);
  const [productionTrendsData, setProductionTrendsData] = useState<any[]>([]);
  const [wastageTrendData, setWastageTrendData] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [period, setPeriod] = useState<string>("month");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const fetchDashboardData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const params: any = { period };
      if (period === "custom" && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const [overviewResponse, inventoryResponse] = await Promise.all([
        AnalyticsApis.getDashboardOverview(params),
        AnalyticsApis.getInventoryInsights(),
      ]);

      if (overviewResponse.status === 200) {
        const data = overviewResponse.data.data;
        setStats(data);
        setOrdersTrendData(data.orderTrends || []);
        setProductionTrendsData(data.productionTrends || []);
        setWastageTrendData(data.wastageTrends || []);
      }

      if (inventoryResponse.status === 200) {
        setInventoryAlerts(inventoryResponse.data.data.alerts.lowStock);
      }

      setError("");
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period, customStartDate, customEndDate]);

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "N/A";
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      active: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      dispatched: "bg-purple-100 text-purple-800 border-purple-200",
      "in progress": "bg-blue-100 text-blue-800 border-blue-200",
    };
    return (
      statusColors[status.toLowerCase()] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.name || "User"}! Here&apos;s your business
                overview.
              </p>
            </div>
            <div className="flex flex-wrap items-center space-x-2 mt-4 md:mt-0">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>

              {period === "custom" && (
                <div className="flex flex-wrap items-center space-x-2 mt-2 md:mt-0">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center mt-2 md:mt-0"
              >
                <svg
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Purchase Requests
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats?.purchases.total)}
                </p>
                <p className="text-sm text-orange-600">
                  +{stats?.purchases.recent} this {period}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Manufacturing Batches
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats?.batches.total)}
                </p>
                <p className="text-sm text-purple-600">
                  {stats?.batches.active} in progress
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  +{stats?.batches.recent} this {period}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats?.orders.total)}
                </p>
                <p className="text-sm text-blue-600">
                  +{stats?.orders.recent} this {period}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Value: {formatCurrency(stats?.orders.valueStats.totalValue)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Production Plans
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stats?.production.total)}
                </p>
                <p className="text-sm text-green-600">
                  {stats?.production.active} active plans
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  +{stats?.production.recent} this {period}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Wastage Analytics
          </h3>
          {wastageTrendData.length > 0 ? (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={wastageTrendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(tick) =>
                      new Date(tick).toLocaleDateString()
                    }
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    stroke="#8884d8"
                    label={{
                      value: "Quantity",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#82ca9d"
                    label={{
                      value: "Loss (INR)",
                      angle: -90,
                      position: "insideRight",
                    }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    labelFormatter={(label) =>
                      `Date: ${new Date(label).toLocaleDateString()}`
                    }
                    formatter={(value: number, name: string) => {
                      console.log({ value, name });
                      if (name === "financialLoss") {
                        return [formatCurrency(Number(value)), name];
                      }
                      return [formatNumber(Number(value)), name];
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="rejectedQuantity"
                    fill="#8884d8"
                    name="Rejected Quantity"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="financialLoss"
                    fill="#82ca9d"
                    name="Financial Loss"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No wastage data recorded for the selected period.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Orders and Revenue Trend
          </h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={ordersTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) =>
                    `Date: ${new Date(label).toLocaleDateString()}`
                  }
                  formatter={(value: number, name: string) => [
                    name === "revenue"
                      ? formatCurrency(Number(value))
                      : formatNumber(Number(value)),
                    name,
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#8884d8"
                  name="Total Orders"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  name="Total Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Production Planned vs. Produced
          </h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={productionTrendsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) =>
                    `Date: ${new Date(label).toLocaleDateString()}`
                  }
                  formatter={(value: number, name: string) => [
                    formatNumber(value),
                    name,
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="planned"
                  stroke="#ffc658"
                  name="Planned Quantity"
                />
                <Line
                  type="monotone"
                  dataKey="produced"
                  stroke="#007bff"
                  name="Produced Quantity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Orders by Status
              </h3>
              <button
                onClick={() => router.push("/dashboard/orders")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {stats?.orders.byStatus.map((status) => (
                <div
                  key={status._id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        status._id
                      )}`}
                    >
                      {status._id}
                    </span>
                    <span className="text-sm text-gray-600">
                      {status.count} orders
                    </span>
                  </div>
                  {status.totalValue && (
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(status.totalValue)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Production Plans
              </h3>
              <button
                onClick={() => router.push("/dashboard/planning")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {stats?.production.byStatus.map((status) => (
                <div
                  key={status._id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        status._id
                      )}`}
                    >
                      {status._id}
                    </span>
                    <span className="text-sm text-gray-600">
                      {status.count} plans
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Inventory Alerts
              </h3>
              {stats?.inventory.lowStock.total > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  {stats?.inventory.lowStock.total} alerts
                </span>
              )}
            </div>
            {stats?.inventory.lowStock.total === 0 ? (
              <div className="text-center py-4">
                <div className="text-green-500 text-2xl mb-2">✅</div>
                <p className="text-sm text-gray-600">
                  All inventory levels are healthy
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Low Stock Finished Goods
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    {stats?.inventory.lowStock.finishedGoods}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Low Stock Raw Materials
                  </span>
                  <span className="text-sm font-medium text-red-600">
                    {stats?.inventory.lowStock.rawMaterials}
                  </span>
                </div>
                <button
                  onClick={() => router.push("/dashboard/inventory")}
                  className="w-full mt-3 px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  View Inventory Alerts
                </button>
              </div>
            )}
          </div>
        </div>

        {inventoryAlerts &&
          (inventoryAlerts.finishedGoods.length > 0 ||
            inventoryAlerts.rawMaterials.length > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-4">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-red-800">
                  Low Stock Alerts
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {inventoryAlerts.finishedGoods.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-red-700 mb-3">
                      Finished Goods
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {inventoryAlerts.finishedGoods.slice(0, 5).map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center justify-between p-3 bg-white rounded border"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.product_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Current: {item.current_stock} {item.unit} |
                              Trigger: {item.trigger_value} {item.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              Low Stock
                            </span>
                          </div>
                        </div>
                      ))}
                      {inventoryAlerts.finishedGoods.length > 5 && (
                        <p className="text-sm text-red-600 text-center py-2">
                          +{inventoryAlerts.finishedGoods.length - 5} more items
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {inventoryAlerts.rawMaterials.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-red-700 mb-3">
                      Raw Materials
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {inventoryAlerts.rawMaterials.slice(0, 5).map((item) => (
                        <div
                          key={item._id}
                          className="flex items-center justify-between p-3 bg-white rounded border"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.material_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Current: {item.current_stock} {item.unit} |
                              Trigger: {item.trigger_value} {item.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              Low Stock
                            </span>
                          </div>
                        </div>
                      ))}
                      {inventoryAlerts.rawMaterials.length > 5 && (
                        <p className="text-sm text-red-600 text-center py-2">
                          +{inventoryAlerts.rawMaterials.length - 5} more items
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => router.push("/dashboard/inventory")}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  View All Inventory
                </button>
              </div>
            </div>
          )}

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push("/dashboard/orders/create")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">New Order</p>
                  <p className="text-xs text-gray-600">Create purchase order</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push("/dashboard/planning/create")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Production Plan</p>
                  <p className="text-xs text-gray-600">Plan production</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push("/dashboard/purchase-requests/create")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Purchase Request</p>
                  <p className="text-xs text-gray-600">Request materials</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push("/dashboard/inventory")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Inventory</p>
                  <p className="text-xs text-gray-600">Check stock levels</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(stats?.orders.recent)}
              </p>
              <p className="text-sm text-gray-600">New Orders</p>
              <p className="text-xs text-gray-500">This {period}</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(stats?.production.recent)}
              </p>
              <p className="text-sm text-gray-600">Production Plans</p>
              <p className="text-xs text-gray-500">This {period}</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {formatNumber(stats?.purchases.recent)}
              </p>
              <p className="text-sm text-gray-600">Purchase Requests</p>
              <p className="text-xs text-gray-500">This {period}</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {formatNumber(stats?.batches.recent)}
              </p>
              <p className="text-sm text-gray-600">New Batches</p>
              <p className="text-xs text-gray-500">This {period}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductionPlanApis from "@/actions/Apis/ProductionPlanApis";
import Button from "@/components/ReusableComponents/Button";
import { formatDate } from "@/utils/date";

// TypeScript interfaces
interface FinishedGood {
  _id: string;
  product_name: string;
  unit: string;
  unit_price: number;
}

interface RawMaterial {
  _id: string;
  material_name: string;
  unit: string;
  current_stock: number;
}

interface ProductionItem {
  _id?: string;
  finished_good_id: FinishedGood;
  quantity_planned: number;
  quantity_produced: number;
  workflow_id: {
    _id: string;
    workflow_name: string;
  };
  status: string;
  raw_materials: {
    material_id: RawMaterial;
    quantity_required: number;
    quantity_issued: number;
    status: string;
  }[];
}

interface ProductionPlan {
  _id: string;
  plan_name: string;
  plan_type: "Monthly" | "Weekly" | "Daily";
  start_date: string;
  end_date: string;
  status: "Draft" | "Active" | "Completed" | "Cancelled";
  production_items: ProductionItem[];
  created_by: {
    _id: string;
    name: string;
    email: string;
  };
  org_id: string;
  createdAt: string;
  updatedAt: string;
}

interface Tab {
  id: string;
  label: string;
  count: number;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "draft":
      return "border-gray-300 text-gray-700 bg-gray-50";
    case "active":
      return "border-blue-300 text-blue-700 bg-blue-50";
    case "completed":
      return "border-green-300 text-green-700 bg-green-50";
    case "cancelled":
      return "border-red-300 text-red-700 bg-red-50";
    case "pending":
      return "border-yellow-300 text-yellow-700 bg-yellow-50";
    case "in progress":
      return "border-purple-300 text-purple-700 bg-purple-50";
    case "on hold":
      return "border-orange-300 text-orange-700 bg-orange-50";
    case "insufficient":
      return "border-red-300 text-red-700 bg-red-50";
    case "issued":
      return "border-green-300 text-green-700 bg-green-50";
    default:
      return "border-gray-300 text-gray-700 bg-gray-50";
  }
};

const ProductionPlans: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [allPlans, setAllPlans] = useState<ProductionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Calculate counts for each tab
  const getTabCounts = (plans: ProductionPlan[]) => {
    const filteredByType = typeFilter === "all" 
      ? plans 
      : plans.filter(plan => plan.plan_type.toLowerCase() === typeFilter.toLowerCase());
    
    const counts = {
      all: filteredByType.length,
      draft: filteredByType.filter(plan => plan.status.toLowerCase() === "draft").length,
      active: filteredByType.filter(plan => plan.status.toLowerCase() === "active").length,
      completed: filteredByType.filter(plan => plan.status.toLowerCase() === "completed").length,
      cancelled: filteredByType.filter(plan => plan.status.toLowerCase() === "cancelled").length,
    };
    return counts;
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Set up any query parameters based on filters
      const params: any = {};
      
      // If type filter is set to something other than "all"
      if (typeFilter !== "all") {
        params.plan_type = typeFilter;
      }
      
      // If status filter is set to something other than "all"
      if (activeTab !== "all") {
        params.status = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      }
      
      const response = await ProductionPlanApis.getAllProductionPlans(params);
      
      if (response.status === 200) {
        const fetchedPlans = response.data.productionPlans || [];
        setPlans(fetchedPlans);
        
        // If this is the first load or all plans, store all plans for counting
        if ((activeTab === "all" && typeFilter === "all") || allPlans.length === 0) {
          setAllPlans(fetchedPlans);
        }
      }
    } catch (error) {
      console.error("Error fetching production plans:", error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all plans initially and when filters change
  useEffect(() => {
    fetchPlans();
  }, [activeTab, typeFilter]);

  // If we just need all plans for counts
  useEffect(() => {
    const fetchAllPlansForCounts = async () => {
      try {
        const response = await ProductionPlanApis.getAllProductionPlans();
        if (response.status === 200) {
          setAllPlans(response.data.productionPlans || []);
        }
      } catch (error) {
        console.error("Error fetching all production plans for counts:", error);
      }
    };

    fetchAllPlansForCounts();
  }, []);

  const tabCounts = getTabCounts(allPlans);

  const tabs: Tab[] = [
    { id: "all", label: "All Plans", count: tabCounts.all },
    { id: "draft", label: "Draft", count: tabCounts.draft },
    { id: "active", label: "Active", count: tabCounts.active },
    { id: "completed", label: "Completed", count: tabCounts.completed },
    { id: "cancelled", label: "Cancelled", count: tabCounts.cancelled },
  ];

  const handleViewDetails = (planId: string) => {
    router.push(`/dashboard/planning/${planId}`);
  };

  // REFACTORED: This button will now link to the new material request page
  const handleCreateBatch = (planId: string, itemIndex: number) => {
    router.push(`/dashboard/planning/create-batch?planId=${planId}`);
  };

  // Calculate material status for a plan
  const getMaterialStatus = (plan: ProductionPlan) => {
    const allMaterials = plan.production_items.flatMap(item => item.raw_materials);
    const insufficientCount = allMaterials.filter(m => m.status === "Insufficient").length;
    
    if (insufficientCount === 0) return { status: "Ready", color: "text-green-600" };
    if (insufficientCount === allMaterials.length) return { status: "All materials insufficient", color: "text-red-600" };
    return { status: `${insufficientCount} materials insufficient`, color: "text-orange-600" };
  };

  // Card component for each production plan
  const PlanCard: React.FC<{ plan: ProductionPlan }> = ({ plan }) => {
    const materialStatus = getMaterialStatus(plan);
    const totalItems = plan.production_items.length;
    const completedItems = plan.production_items.filter(item => 
      item.status === "Completed" || item.quantity_produced >= item.quantity_planned
    ).length;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
        {/* Header with Plan Name and Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {plan.plan_name}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                plan.status
              )}`}
            >
              {plan.status}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              plan.plan_type === "Daily" 
                ? "border-green-300 text-green-700 bg-green-50" 
                : plan.plan_type === "Weekly"
                ? "border-blue-300 text-blue-700 bg-blue-50"
                : "border-purple-300 text-purple-700 bg-purple-50"
            }`}
          >
            {plan.plan_type}
          </span>
        </div>

        {/* Plan Details */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Date Range:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Progress:</span>
            <span className="text-sm font-medium text-gray-900">
              {completedItems}/{totalItems} items
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${totalItems > 0 ? (completedItems / totalItems * 100) : 0}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Materials:</span>
            <span className={`text-sm font-medium ${materialStatus.color}`}>
              {materialStatus.status}
            </span>
          </div>
        </div>

        {/* Products Preview */}
        {plan.production_items.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Products</h4>
            <div className="space-y-2">
              {plan.production_items.slice(0, 2).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-800 truncate">
                    {item.finished_good_id.product_name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {item.quantity_produced}/{item.quantity_planned}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
              {plan.production_items.length > 2 && (
                <div className="text-xs text-blue-600 font-medium">
                  +{plan.production_items.length - 2} more products
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-100 flex flex-col space-y-2">
          {plan.status === "Active" && (
            <Button
              variant="primary"
              className="w-full text-sm"
              onClick={() => handleCreateBatch(plan._id, 0)}
            >
              Create Manufacturing Batch
            </Button>
          )}
          
          <Button
            variant="outline"
            className="w-full text-sm"
            onClick={() => handleViewDetails(plan._id)}
          >
            View Details
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-0">
          Production Plans
        </h1>
        <Button
          variant="primary"
          className="w-full md:w-auto"
          onClick={() => {
            router.push("/dashboard/planning/create");
          }}
        >
          + Create Production Plan
        </Button>
      </div>

      {/* Summary Stats */}
      {allPlans.length > 0 && (
        <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {allPlans.length}
              </p>
              <p className="text-sm text-gray-600">Total Plans</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {allPlans.filter(plan => plan.status === "Active").length}
              </p>
              <p className="text-sm text-gray-600">Active Plans</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {allPlans.reduce(
                  (sum, plan) => sum + plan.production_items.length,
                  0
                )}
              </p>
              <p className="text-sm text-gray-600">Total Products</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {allPlans.filter(plan => plan.status === "Completed").length}
              </p>
              <p className="text-sm text-gray-600">Completed Plans</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 md:mb-0">Filters</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

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
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No production plans found
            </h3>
            <p className="text-gray-600 mb-4">
              {typeFilter !== "all"
                ? `No ${typeFilter.toLowerCase()} plans found.`
                : activeTab !== "all"
                ? `No ${activeTab} plans found.`
                : "No production plans have been created yet."}
            </p>
            {activeTab === "all" && typeFilter === "all" && (
              <Button
                variant="primary"
                onClick={() => {
                  router.push("/dashboard/planning/create");
                }}
              >
                Create Your First Production Plan
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard key={plan._id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionPlans;
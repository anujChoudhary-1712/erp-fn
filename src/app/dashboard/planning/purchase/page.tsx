/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import PurchaseReqApis from "@/actions/Apis/PurchaseReqApis";
import Button from "@/components/ReusableComponents/Button";
import { formatDate } from "@/utils/date";
import { getStatusColor } from "@/utils/order";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

// TypeScript interfaces
interface Material {
  _id: string;
  material_name: string;
  description: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
  product_id: string;
  created_at: string;
  updated_at: string;
  __v: number;
}

interface Vendor {
  _id: string;
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  org_id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface PurchaseMaterial {
  materialId: Material;
  quantity: number;
  vendorId: Vendor;
  notes: string;
}

interface TimelineEntry {
  status: string;
  date: string;
  by: string;
  notes: string;
}

interface Purchase {
  _id: string;
  materials: PurchaseMaterial[];
  requiredBy: string;
  estimatedDate: string;
  status: string;
  instructions: string;
  documents: any[];
  timeline: TimelineEntry[];
  org_id: string;
  fulfillment: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Tab {
  id: string;
  label: string;
  count: number;
}

const PurchasePlanningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]); // Store all purchases for counting
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  // Calculate counts for each tab
  const getTabCounts = (purchases: Purchase[]) => {
    const counts = {
      all: purchases.length,
      pending: purchases.filter(
        (purchase) => purchase.status?.toLowerCase() === "pending"
      ).length,
      verification: purchases.filter(
        (purchase) => purchase.status?.toLowerCase() === "verification needed"
      ).length,
      approved: purchases.filter(
        (purchase) => purchase.status?.toLowerCase() === "approved"
      ).length,
      rejected: purchases.filter(
        (purchase) => purchase.status?.toLowerCase() === "rejected"
      ).length,
    };
    return counts;
  };

  const tabCounts = getTabCounts(allPurchases);

  const tabs: Tab[] = [
    { id: "all", label: "All Purchases", count: tabCounts.all },
    { id: "pending", label: "Pending", count: tabCounts.pending },
    { id: "verification", label: "Verification Needed", count: tabCounts.verification },
    { id: "approved", label: "Approved", count: tabCounts.approved },
    { id: "rejected", label: "Rejected", count: tabCounts.rejected },
  ];

  const fetchPurchases = async (type: string): Promise<void> => {
    setLoading(true);
    try {
      const res = await PurchaseReqApis.getAllPurchases();

      if (res.status === 200) {
        const allPurchaseData = res.data || [];
        
        // Filter based on type
        let filteredPurchases = allPurchaseData;
        if (type !== "all") {
          const statusToFilter = type === "verification" ? "verification needed" : type;
          filteredPurchases = allPurchaseData.filter(
            (purchase: Purchase) => purchase.status?.toLowerCase() === statusToFilter
          );
        }

        setPurchases(filteredPurchases);

        // If this is the first load or all purchases, store all purchases for counting
        if (type === "all" || allPurchases.length === 0) {
          setAllPurchases(allPurchaseData);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type} purchases:`, error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all purchases on component mount to get counts
  useEffect(() => {
    const fetchAllPurchasesForCounts = async () => {
      try {
        const res = await PurchaseReqApis.getAllPurchases();
        if (res.status === 200) {
          setAllPurchases(res.data || []);
        }
      } catch (error) {
        console.error("Error fetching all purchases for counts:", error);
      }
    };

    fetchAllPurchasesForCounts();
  }, []);

  useEffect(() => {
    fetchPurchases(activeTab);
  }, [activeTab]);

  const handleViewDetails = (purchaseId: string) => {
    router.push(`/dashboard/planning/purchase/${purchaseId}`);
  };

  // Helper function to get materials display string
  const getMaterialsDisplay = (materials: PurchaseMaterial[]): string => {
    if (materials.length === 0) return "No materials";
    if (materials.length === 1) {
      return `${materials[0].materialId.material_name} (${materials[0].quantity})`;
    }
    return `${materials[0].materialId.material_name} (${materials[0].quantity}) +${materials.length - 1} more`;
  };

  // Helper function to calculate total estimated cost
  const calculateEstimatedCost = (materials: PurchaseMaterial[]): number => {
    return materials.reduce((total, material) => {
      return total + (material.materialId.unit_cost * material.quantity);
    }, 0);
  };

  const PurchaseCard: React.FC<{ purchase: Purchase; index: number }> = ({ purchase, index }) => (
    <div 
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 cursor-pointer"
      onClick={() => handleViewDetails(purchase._id)}
    >
      {/* Header with Serial Number and Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">
            PR-{String(index + 1).padStart(3, '0')}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
              purchase.status
            )}`}
          >
            {purchase.status?.charAt(0).toUpperCase() + purchase.status?.slice(1)}
          </span>
        </div>
      </div>

      {/* Purchase Details */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-600">Materials (qty):</span>
          <span className="text-sm font-medium text-gray-900 text-right max-w-48 truncate">
            {getMaterialsDisplay(purchase.materials)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Estimated Date:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatDate(purchase.estimatedDate)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Created:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatDate(purchase.createdAt)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Materials:</span>
          <span className="text-sm font-medium text-gray-900">
            {purchase.materials.length}
          </span>
        </div>
      </div>

      {/* Instructions Preview */}
      {purchase.instructions && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600 mb-1">Instructions:</p>
          <p className="text-sm text-gray-800 line-clamp-2">
            {purchase.instructions.length > 100 
              ? `${purchase.instructions.substring(0, 100)}...` 
              : purchase.instructions}
          </p>
        </div>
      )}

      {/* Action Hover Effect */}
      <div className="pt-4 border-t border-gray-100">
        <div className="text-center">
          <span className="text-sm text-blue-600 font-medium">
            Click to view details →
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-0">
          Purchase Requirements
        </h1>
        <Button
          variant="primary"
          className="w-full md:w-auto"
          onClick={() => {
            router.push("/dashboard/planning/purchase/create");
          }}
        >
          + Create Purchase Requirement
        </Button>
      </div>

      {/* Summary Stats */}
      {allPurchases.length > 0 && (
        <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {allPurchases.length}
              </p>
              <p className="text-sm text-gray-600">Total Requirements</p>
            </div>
            {/* <div>
              <p className="text-2xl font-bold text-blue-600">
                {allPurchases.reduce(
                  (sum: number, purchase: Purchase) =>
                    sum + (purchase.materials?.length || 0),
                  0
                )}
              </p>
              <p className="text-sm text-gray-600">Total Materials</p>
            </div> */}
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {tabCounts.pending}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {tabCounts.approved}
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {tabCounts.rejected}
              </p>
              <p className="text-sm text-gray-600">Rejected</p>
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
        ) : purchases.length === 0 ? (
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
              No purchase requirements found
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === "all"
                ? "No purchase requirements have been created yet."
                : `No ${activeTab} purchase requirements found.`}
            </p>
            {activeTab === "all" && (
              <Button
                variant="primary"
                onClick={() => {
                  router.push("/dashboard/planning/purchase/create");
                }}
              >
                Create Your First Purchase Requirement
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {purchases.map((purchase: Purchase, index: number) => (
              <PurchaseCard key={purchase._id} purchase={purchase} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasePlanningPage;
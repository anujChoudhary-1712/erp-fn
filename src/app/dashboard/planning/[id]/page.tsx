"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductionPlanApis from '@/actions/Apis/ProductionPlanApis';
import ManufacturingBatchApis from '@/actions/Apis/BatchApis';
import MaterialRequestApis from '@/actions/Apis/MaterialRequestApis';
import Button from '@/components/ReusableComponents/Button';
import { formatDate } from '@/utils/date';

// TypeScript interfaces
interface FinishedGood {
  _id: string;
  product_name: string;
  unit: string;
  current_stock: number;
  unit_price: number;
}

interface Workflow {
  _id: string;
  workflow_name: string;
  stages: WorkflowStage[];
}

interface WorkflowStage {
  stage_name: string;
  sequence_order: number;
  quality_check_required: boolean;
}

interface RawMaterial {
  material_id: {
    _id: string;
    material_name: string;
    unit: string;
    current_stock: number;
  };
  quantity_required: number;
  quantity_issued: number;
  status: string; // This will now be ignored in favor of a frontend calculation
  _id: string;
}

interface ProductionItem {
  finished_good_id: FinishedGood;
  quantity_planned: number;
  quantity_produced: number;
  workflow_id: Workflow;
  status: string;
  raw_materials: RawMaterial[];
  _id: string;
  batches_created?: string[];
}

interface ProductionPlan {
  _id: string;
  plan_name: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  status: string;
  production_items: ProductionItem[];
  created_by: string;
  org_id: string;
  createdAt: string;
  updatedAt: string;
}

interface MaterialIssuanceRequest {
  _id: string;
  request_number: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  requested_by: { _id: string; name: string } | string;
  quantity_planned: number;
  created_at?: string;
  createdAt?: string;
  production_item_id: string;
}

interface ManufacturingBatch {
  _id: string;
  batch_number: string;
  status: string;
  quantity_planned: number;
  createdAt: string;
  finished_good_id?: { product_name: string; unit: string } | string;
  current_stage?: { status: string; stage_name: string } | string;
}

const SinglePlanPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [plan, setPlan] = useState<ProductionPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  const [issuanceRequests, setIssuanceRequests] = useState<MaterialIssuanceRequest[]>([]);
  const [batches, setBatches] = useState<ManufacturingBatch[]>([]);
  const [insufficientMaterials, setInsufficientMaterials] = useState<string[]>([]);

  const fetchPlanDetails = async () => {
    setLoading(true);
    setError("");
    
    try {
      const planResponse = await ProductionPlanApis.getSingleProductionPlan(params.id);
      if (planResponse.status !== 200) {
        throw new Error(planResponse.data?.message || "Failed to fetch production plan");
      }
      const fetchedPlan = planResponse.data.productionPlan;
      setPlan(fetchedPlan);

      // Fetch related data
      try {
        const requestsResponse = await MaterialRequestApis.getAllMaterialRequests({ planId: params.id });
        if (requestsResponse.status === 200 && requestsResponse.data?.requests) {
          setIssuanceRequests(requestsResponse.data.requests);
        }
      } catch (reqError) {
        console.warn("Failed to fetch material requests:", reqError);
        setIssuanceRequests([]);
      }
      
      try {
        const batchesResponse = await ManufacturingBatchApis.getAllManufacturingBatches({ planId: params.id });
        if (batchesResponse.status === 200 && batchesResponse.data?.batches) {
          setBatches(batchesResponse.data.batches);
        }
      } catch (batchError) {
        console.warn("Failed to fetch batches:", batchError);
        setBatches([]);
      }

    } catch (error: any) {
      console.error("Error fetching production plan data:", error);
      setError(error.message || "Failed to load plan details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchPlanDetails();
    } else {
      setError("No plan ID provided");
      setLoading(false);
    }
  }, [params?.id]);

  // --- MODIFIED: Effect to calculate insufficient materials based on live stock data ---
  useEffect(() => {
    if (plan) {
      const insufficient = plan.production_items
        .flatMap(item => item.raw_materials || [])
        // The check is now done on the frontend, ignoring the backend status
        .filter(m => m && m.material_id.current_stock < m.quantity_required)
        .map(m => m.material_id._id)
        // Get unique IDs
        .filter((id, index, self) => self.indexOf(id) === index);
      
      setInsufficientMaterials(insufficient);
    }
  }, [plan]);

  const handleActivatePlan = async () => {
    if (!plan) return;
    setLoading(true);
    try {
      const response = await ProductionPlanApis.activateProductionPlan(plan._id);
      if (response.status === 200) {
        await fetchPlanDetails();
      } else {
        throw new Error(response.data?.message || "Failed to activate plan");
      }
    } catch (error: any) {
      console.error("Error activating plan:", error);
      setError(error.message || "Failed to activate production plan");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPurchase = () => {
    if (insufficientMaterials.length === 0) return;
    const queryParams = new URLSearchParams({ type: 'material' });
    insufficientMaterials.forEach(id => {
      queryParams.append('material', id);
    });
    router.push(`/dashboard/purchases/create?${queryParams.toString()}`);
  };

  const handleCreateBatch = (itemIndex: number) => {
    if (!plan || !plan.production_items[itemIndex]) return;
    
    try {
      const pendingRequestsForThisItem = issuanceRequests.filter(req => 
        req.production_item_id?.toString() === plan.production_items[itemIndex]?._id?.toString() && 
        req.status === 'Pending'
      );
      
      if (pendingRequestsForThisItem.length > 0) {
        setError("Cannot request another batch. An outstanding material request needs approval.");
        return;
      }
      
      router.push(`/dashboard/planning/create-batch?planId=${plan._id}`);
    } catch (error) {
      console.error("Error in handleCreateBatch:", error);
      setError("Error processing batch creation request");
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return "border-gray-300 text-gray-700 bg-gray-50";
    switch (status.toLowerCase()) {
      case "draft": return "border-gray-300 text-gray-700 bg-gray-50";
      case "active": return "border-blue-300 text-blue-700 bg-blue-50";
      case "completed": return "border-green-300 text-green-700 bg-green-50";
      case "cancelled": return "border-red-300 text-red-700 bg-red-50";
      case "pending": return "border-yellow-300 text-yellow-700 bg-yellow-50";
      case "in progress": return "border-purple-300 text-purple-700 bg-purple-50";
      case "on hold": return "border-orange-300 text-orange-700 bg-orange-50";
      case "insufficient": return "border-red-300 text-red-700 bg-red-50";
      case "issued": return "border-green-300 text-green-700 bg-green-50";
      case "approved": return "border-blue-300 text-blue-700 bg-blue-50";
      default: return "border-gray-300 text-gray-700 bg-gray-50";
    }
  };

  const getMaterialStatus = () => {
    if (!plan || !plan.production_items) return { status: "Unknown", color: "text-gray-600" };
    if (insufficientMaterials.length === 0) return { status: "Ready", color: "text-green-600" };
    return { status: `${insufficientMaterials.length} material(s) insufficient`, color: "text-orange-600" };
  };

  const calculateProgress = () => {
    if (!plan || !plan.production_items) return { completed: 0, total: 0, percentage: 0 };
    const totalItems = plan.production_items.length;
    const completedItems = plan.production_items.filter(item => 
      item?.status === "Completed" || (item?.quantity_produced >= item?.quantity_planned)
    ).length;
    return { completed: completedItems, total: totalItems, percentage: totalItems > 0 ? (completedItems / totalItems * 100) : 0 };
  };

  const safeFormatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return formatDate(dateString);
  };

  const renderMaterialRequests = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Issuance Requests</h3>
      {issuanceRequests.length > 0 ? (
        <div className="space-y-4">
          {issuanceRequests.map(req => (
            <div key={req._id} className="p-4 bg-gray-50 rounded-lg border flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">Request #{req.request_number}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Requested at: {safeFormatDate(req.created_at || req.createdAt)}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}>
                {req.status}
              </span>
            </div>
          ))}
        </div>
      ) : <p className="text-gray-500">No material issuance requests for this plan yet.</p>}
    </div>
  );

  const renderCreatedBatches = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Created Manufacturing Batches</h3>
      {batches.length > 0 ? (
        <div className="space-y-4">
          {batches.map(batch => (
            <div key={batch._id} className="p-4 bg-gray-50 rounded-lg border flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">Batch #{batch.batch_number}</p>
                <p className="text-sm text-gray-600 mt-1">Status: {batch.status}</p>
              </div>
              <span className="text-sm text-gray-700">{batch.quantity_planned} units</span>
            </div>
          ))}
        </div>
      ) : <p className="text-gray-500">No manufacturing batches created for this plan yet.</p>}
    </div>
  );

  const renderOverviewTab = () => {
    if (!plan) return null;
    const progress = calculateProgress();
    const materialStatus = getMaterialStatus();
    
    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <div className="mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(plan.status)}`}>{plan.status}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date Range</p>
              <p className="text-sm font-medium">{safeFormatDate(plan.start_date)} - {safeFormatDate(plan.end_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  plan.plan_type === "Daily" ? "border-green-300 text-green-700 bg-green-50" 
                  : plan.plan_type === "Weekly" ? "border-blue-300 text-blue-700 bg-blue-50"
                  : "border-purple-300 text-purple-700 bg-purple-50"
                }`}>{plan.plan_type}</span>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completion</span>
              <span className="text-sm font-medium text-gray-900">{progress.completed}/{progress.total} items</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Materials</span>
              <span className={`text-sm font-medium ${materialStatus.color}`}>{materialStatus.status}</span>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          <div className="flex flex-wrap gap-3">
            {plan.status === "Draft" && (
              insufficientMaterials.length > 0 ? (
                <Button variant="warning" onClick={handleRequestPurchase} disabled={loading}>Request Purchase</Button>
              ) : (
                <Button variant="success" onClick={handleActivatePlan} disabled={loading}>{loading ? "Activating..." : "Activate Plan"}</Button>
              )
            )}
            {plan.status === "Active" && <Button variant="primary" onClick={() => setActiveTab("products")}>Create Manufacturing Batch</Button>}
            <Button variant="outline" onClick={() => router.push("/dashboard/planning")}>Back to Plans</Button>
          </div>
        </div>
      </div>
    );
  };

  const renderProductsTab = () => {
    if (!plan) return null;
    
    return (
      <div className="space-y-6">
        {renderMaterialRequests()}
        {renderCreatedBatches()}
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Items</h3>
          {!plan.production_items?.length ? (
            <p className="text-gray-500">No production items found in this plan.</p>
          ) : (
            <div className="space-y-6">
              {plan.production_items.map((item, index) => {
                if (!item) return null;
                return (
                  <div key={item._id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center">
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs mr-2">{index + 1}</span>
                          <h4 className="text-lg font-medium text-gray-900">{item.finished_good_id?.product_name || "N/A"}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Workflow: {item.workflow_id?.workflow_name || "N/A"}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>{item.status}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="text-sm font-medium">{item.quantity_produced || 0}/{item.quantity_planned || 0} {item.finished_good_id?.unit || "units"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Progress</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.quantity_planned > 0 ? ((item.quantity_produced || 0) / item.quantity_planned) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                    
                    {item.raw_materials?.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Raw Materials</h5>
                        <div className="bg-white border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Required</th>
                                <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Issued</th>
                                <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {item.raw_materials.map((material) => {
                                if (!material) return null;
                                // --- MODIFIED: Live calculation for status ---
                                const isInsufficient = material.material_id.current_stock < material.quantity_required;
                                const calculatedStatus = isInsufficient ? "Insufficient" : "Available";
                                return (
                                  <tr key={material._id}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{material.material_id?.material_name || "N/A"}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 text-right">{material.quantity_required || 0} {material.material_id?.unit}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 text-right">{material.quantity_issued || 0} {material.material_id?.unit}</td>
                                    <td className="px-4 py-2 text-sm text-center">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          isInsufficient ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                                        }`}>
                                        {calculatedStatus}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {plan.status === "Active" && item.status !== "Completed" && (
                      <div className="mt-4 flex justify-end">
                        <Button variant="primary" onClick={() => handleCreateBatch(index)} className="text-sm" disabled={loading}>Create Batch</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab("overview")}>Back to Overview</Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading production plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Plan</h2>
            <p className="text-red-600">{error}</p>
            <div className="mt-4 space-x-3">
              <Button variant="outline" onClick={() => fetchPlanDetails()}>Retry</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/planning")}>Back to Plans</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No plan data available</p>
          <Button variant="outline" onClick={() => router.push("/dashboard/planning")} className="mt-4">Back to Plans</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{plan.plan_name}</h1>
            <p className="text-gray-600 mt-1">Production Plan Details</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(plan.status)}`}>{plan.status}</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button onClick={() => setError("")} className="mt-2 text-sm text-red-500 hover:text-red-700">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab("overview")} className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>Overview</button>
            <button onClick={() => setActiveTab("products")} className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "products" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>Production Items</button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "products" && renderProductsTab()}
      </div>
    </div>
  );
};

export default SinglePlanPage;
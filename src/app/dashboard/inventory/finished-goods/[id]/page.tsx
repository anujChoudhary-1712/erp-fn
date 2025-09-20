"use client";
import GoodsApis from "@/actions/Apis/GoodsApis";
import WorkflowApis from "@/actions/Apis/WorkflowApis";
import OrgUserApis from "@/actions/Apis/OrgUserApis";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/order";
import { formatDate } from "@/utils/date";
import Link from "next/link";
import CreateWorkflowForm, { WorkflowData } from "@/components/forms/CreateWorkflowForm";

// Define interfaces based on your data structure
interface QualityParameter {
  parameter_name: string;
  specification: string;
  measurement_unit?: string;
  is_critical: boolean;
}

interface AssignedTo {
  name: string;
  email: string;
}

interface WorkflowStage {
  stage_id: string;
  stage_name: string;
  sequence_order: number;
  quality_check_required: boolean;
  quality_parameters?: QualityParameter[];
  assignedTo?: AssignedTo;
}

interface Workflow {
  _id: string;
  workflow_name: string;
  finished_product_id: string;
  stages: WorkflowStage[];
  org_id: string;
  createdAt: string;
  updatedAt: string;
}

interface VerificationParameter {
  parameter: string;
  specificationValue: string;
  _id: string;
}

interface WastageRecord {
  quantity_wasted: number;
  checking_date: string;
  reason_for_wastage: string;
  _id: string;
}

interface RawMaterial {
  _id: string;
  material_name: string;
  description: string;
  category: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
  stock_used: number;
  trigger_value: number;
  verificationParameters: VerificationParameter[];
  wastage_records?: WastageRecord[];
}

interface CreatedBy {
  _id: string;
  name: string;
  email: string;
}

interface FinishedGood {
  _id: string;
  product_name: string;
  description: string;
  unit: string;
  current_stock: number;
  unit_price: number;
  trigger_value: number;
  org_id: string;
  created_by: CreatedBy;
  workflows: Workflow[];
  raw_materials_used: RawMaterial[];
  createdAt: string;
  updatedAt: string;
}

const SingleGoodPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [finishedGood, setFinishedGood] = useState<FinishedGood | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    product_name: "",
    description: "",
    unit_price: 0,
    current_stock: 0,
    trigger_value: 0
  });
  const [showAddWorkflowModal, setShowAddWorkflowModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [workflowError, setWorkflowError] = useState("");

  const fetchFinishedGood = async () => {
    try {
      setLoading(true);
      const res = await GoodsApis.getSingleGood(params.id);
      if (res.status === 200) {
        setFinishedGood(res.data);
        setEditData({
          product_name: res.data.product_name,
          description: res.data.description || "",
          unit_price: res.data.unit_price,
          current_stock: res.data.current_stock,
          trigger_value: res.data.trigger_value
        });
      }
    } catch (error) {
      console.error("Error fetching finished good:", error);
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setLoading(true);
      const res = await GoodsApis.updateFinishedGood(params.id, {
        product_name: editData.product_name,
        description: editData.description,
        unit_price: editData.unit_price,
        current_stock: editData.current_stock,
        trigger_value: editData.trigger_value
      });
      
      if (res.status === 200) {
        await fetchFinishedGood();
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      setError("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        const res = await GoodsApis.deleteFinishedGood(params.id);
        if (res.status === 200) {
          router.push("/dashboard/inventory/finished-goods");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        setError("Failed to delete product");
      }
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await OrgUserApis.getAllUsers();
      if (res.status === 200) {
        // Filter users to only include those with production roles
        const productionMembers = res.data.users.filter((user: any) => 
          user.roles.includes('production_plans') || user.roles.includes('production_batch_mgt')
        );
        setTeamMembers(productionMembers);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const handleAddWorkflows = async (workflowData: WorkflowData) => {
    try {
      setLoading(true);
      setWorkflowError("");
      
      // Simply call the workflow creation API - backend will handle the association
      const response = await WorkflowApis.addWorkflow(workflowData);
      
      if (response.status === 200 || response.status === 201) {
        // Refresh the product data to show the new workflow
        await fetchFinishedGood();
        setShowAddWorkflowModal(false);
      } else {
        throw new Error(response.data?.message || "Failed to add workflow");
      }
    } catch (error: any) {
      console.error("Error adding workflow:", error);
      setWorkflowError(
        error.response?.data?.message ||
        error.message ||
        "An error occurred while adding workflow. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinishedGood();
    fetchTeamMembers();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!finishedGood) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link 
            href="/dashboard/inventory/finished-goods"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-4">
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0 mt-1"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                  {finishedGood.product_name}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Product Details & Management</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm w-full sm:w-auto"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm w-full sm:w-auto"
                  >
                    Edit Product
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm w-full sm:w-auto"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Product Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Basic Information */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Product Information
              </h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      value={editData.product_name}
                      onChange={(e) => setEditData({...editData, product_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                      <input
                        type="number"
                        value={editData.unit_price}
                        onChange={(e) => setEditData({...editData, unit_price: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                      <input
                        type="number"
                        value={editData.current_stock}
                        onChange={(e) => setEditData({...editData, current_stock: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Trigger Value</label>
                      <input
                        type="number"
                        value={editData.trigger_value}
                        onChange={(e) => setEditData({...editData, trigger_value: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-500">Description</label>
                      <p className="mt-1 text-sm sm:text-base text-gray-900 break-words">
                        {finishedGood.description || "No description provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-500">Unit</label>
                      <p className="mt-1 text-sm sm:text-base text-gray-900 capitalize">{finishedGood.unit}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-500">Unit Price</label>
                      <p className="mt-1 text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                        {formatCurrency(finishedGood.unit_price)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-500">Current Stock</label>
                      <p className="mt-1 text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                        {finishedGood.current_stock}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-500">Trigger Value</label>
                      <p className="mt-1 text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                        {finishedGood.trigger_value}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-500">Created By</label>
                      <p className="mt-1 text-sm sm:text-base text-gray-900 break-words">
                        {finishedGood.created_by.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 break-words">
                        {finishedGood.created_by.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-500">Created Date</label>
                      <p className="mt-1 text-sm sm:text-base text-gray-900">
                        {formatDate(finishedGood.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Workflows Section */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
                  Production Workflows
                </h2>
                <button
                  onClick={() => setShowAddWorkflowModal(true)}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs sm:text-sm w-full sm:w-auto"
                >
                  Add Workflow
                </button>
              </div>
              
              {finishedGood.workflows.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500 text-sm">No workflows defined for this product</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {finishedGood.workflows.map((workflow) => (
                    <div key={workflow._id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4 break-words">
                        {workflow.workflow_name}
                      </h3>
                      
                      <div className="space-y-3 sm:space-y-4">
                        {workflow.stages.map((stage) => (
                          <div key={stage.stage_id} className="pl-3 sm:pl-4 border-l-2 border-blue-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                              <h4 className="font-medium text-sm sm:text-base text-gray-900 flex items-center min-w-0 flex-1">
                                <span className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center mr-2 flex-shrink-0">
                                  {stage.sequence_order}
                                </span>
                                <span className="break-words">{stage.stage_name}</span>
                              </h4>
                              {stage.assignedTo && (
                                <span className="text-xs sm:text-sm text-gray-600 break-words">
                                  Assigned to: {stage.assignedTo.name}
                                </span>
                              )}
                            </div>
                            
                            {stage.quality_check_required && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                                  Quality Check Required
                                </span>
                                
                                {stage.quality_parameters && stage.quality_parameters.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                      Quality Parameters:
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                      {stage.quality_parameters.map((param, paramIndex) => (
                                        <div key={paramIndex} className="text-xs sm:text-sm bg-gray-50 p-2 rounded">
                                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                                            <span className="font-medium break-words">{param.parameter_name}</span>
                                            {param.is_critical && (
                                              <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full text-xs flex-shrink-0">
                                                Critical
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-gray-600 text-xs sm:text-sm break-words">
                                            {param.specification}
                                            {param.measurement_unit && ` (${param.measurement_unit})`}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Raw Materials */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Raw Materials Used
              </h2>
              
              {finishedGood.raw_materials_used.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-gray-500 text-sm">No raw materials defined</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {finishedGood.raw_materials_used.map((material) => (
                    <div key={material._id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 break-words min-w-0 flex-1">
                          {material.material_name}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize flex-shrink-0">
                          {material.category}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Stock Used:</span>
                          <span className="font-medium break-words">{material.stock_used} {material.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Current Stock:</span>
                          <span className="font-medium break-words">{material.current_stock} {material.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Unit Cost:</span>
                          <span className="font-medium">{formatCurrency(material.unit_cost)}</span>
                        </div>
                      </div>
                      
                      {material.verificationParameters.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Verification Parameters:
                          </p>
                          <div className="space-y-1">
                            {material.verificationParameters.map((param) => (
                              <div key={param._id} className="text-xs bg-gray-50 p-2 rounded">
                                <span className="font-medium break-words">{param.parameter}:</span>{" "}
                                <span className="break-words">{param.specificationValue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {material.wastage_records && material.wastage_records.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Wastage Records:
                          </p>
                          <div className="space-y-1">
                            {material.wastage_records.map((record) => (
                              <div key={record._id} className="text-xs bg-red-50 p-2 rounded">
                                <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                                  <span className="break-words">{formatDate(record.checking_date)}</span>
                                  <span className="font-medium">{record.quantity_wasted} wasted</span>
                                </div>
                                <div className="text-gray-600 mt-1 break-words">
                                  {record.reason_for_wastage}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stock Status Card */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Stock Status</h3>
              <div className="space-y-4">
                <div className={`p-3 sm:p-4 rounded-lg ${
                  finishedGood.current_stock > finishedGood.trigger_value 
                    ? 'bg-green-50 border border-green-200' 
                    : finishedGood.current_stock > 0 
                      ? 'bg-yellow-50 border border-yellow-200' 
                      : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm sm:text-base">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      finishedGood.current_stock > finishedGood.trigger_value 
                        ? 'bg-green-100 text-green-800' 
                        : finishedGood.current_stock > 0 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {finishedGood.current_stock > finishedGood.trigger_value 
                        ? 'In Stock' 
                        : finishedGood.current_stock > 0 
                          ? 'Low Stock' 
                          : 'Out of Stock'}
                    </span>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <p>Total Value: {formatCurrency(finishedGood.current_stock * finishedGood.unit_price)}</p>
                  <p>Last Updated: {formatDate(finishedGood.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Workflow Modal */}
        {showAddWorkflowModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[95vh] overflow-y-auto">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add New Workflow</h2>
                  <button
                    onClick={() => {
                      setShowAddWorkflowModal(false);
                      setWorkflowError("");
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Workflow Error Message */}
                {workflowError && (
                  <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{workflowError}</p>
                  </div>
                )}
                
                {/* Use the existing CreateWorkflowForm component */}
                <CreateWorkflowForm
                  productId={params.id}
                  loading={loading}
                  error={workflowError}
                  setError={setWorkflowError}
                  onSubmit={handleAddWorkflows}
                  onBack={() => {
                    setShowAddWorkflowModal(false);
                    setWorkflowError("");
                  }}
                  teamMembers={teamMembers}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleGoodPage;
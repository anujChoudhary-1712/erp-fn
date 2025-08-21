/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductionPlanApis from "@/actions/Apis/ProductionPlanApis";
import Button from "@/components/ReusableComponents/Button";
import { formatDate } from "@/utils/date";
import { useUser } from "@/context/UserContext";

// TypeScript interfaces (no changes here)
interface FinishedGood {
  current_stock: number;
  _id: string;
  product_name: string;
  unit: string;
  unit_price: number;
}

interface Workflow {
  _id: string;
  workflow_name: string;
  stages: WorkflowStage[];
}

interface WorkflowStage {
  stage_id: string;
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
  status: string; // Note: This field will be ignored for status display
}

interface ProductionItem {
  finished_good_id: FinishedGood;
  quantity_planned: number;
  quantity_produced: number;
  workflow_id: Workflow;
  status: string;
  raw_materials: RawMaterial[];
}

interface ProductionPlan {
  _id: string;
  plan_name: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  status: string;
  production_items: ProductionItem[];
}

const CreateManufacturingBatchPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const planId = searchParams.get("planId") || "";
    const itemIndex = parseInt(searchParams.get("itemIndex") || "0");

    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [productionPlan, setProductionPlan] = useState<ProductionPlan | null>(null);
    const [selectedItem, setSelectedItem] = useState<ProductionItem | null>(null);
    const [batchQuantity, setBatchQuantity] = useState<number>(1);
    const [maxQuantity, setMaxQuantity] = useState<number>(0);
    const [materialsForBatch, setMaterialsForBatch] = useState<any[]>([]);

    const calculateMaterialsForBatch = (quantity: number) => {
        if (!selectedItem || !selectedItem.raw_materials.length) {
            setMaterialsForBatch([]);
            return;
        }

        const calculatedMaterials = selectedItem.raw_materials.map(material => {
            const requirementForBatch = (material.quantity_required / selectedItem.quantity_planned) * quantity;
            return {
                ...material,
                requirementForBatch: requirementForBatch,
                // Live calculation of availability
                isAvailable: material.material_id.current_stock >= requirementForBatch,
            };
        });
        setMaterialsForBatch(calculatedMaterials);
    };

    useEffect(() => {
        const fetchProductionPlan = async () => {
            if (!planId) {
                setError("No production plan specified");
                setLoading(false);
                return;
            }

            try {
                const response = await ProductionPlanApis.getSingleProductionPlan(planId);
                
                if (response.status === 200) {
                    const plan = response.data.productionPlan;
                    setProductionPlan(plan);
                    
                    const item = plan.production_items[itemIndex];
                    if (!item) {
                        throw new Error("Production item not found");
                    }
                    
                    setSelectedItem(item);
                    
                    const max = item.quantity_planned - item.quantity_produced;
                    setMaxQuantity(max);
                    setBatchQuantity(max > 0 ? 1 : 0);
                    
                    calculateMaterialsForBatch(max > 0 ? 1 : 0);

                } else {
                    throw new Error(response.data?.message || "Failed to fetch production plan");
                }
            } catch (error: any) {
                console.error("Error fetching production plan:", error);
                setError(error.message || "Failed to load production plan details");
            } finally {
                setLoading(false);
            }
        };

        fetchProductionPlan();
    }, [planId, itemIndex]);
    
    const handleBatchQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const quantity = parseInt(e.target.value) || 0;
        const newQuantity = Math.max(0, Math.min(quantity, maxQuantity));
        setBatchQuantity(newQuantity);
        calculateMaterialsForBatch(newQuantity);
    };

    const handleRequestMaterials = async () => {
        if (!selectedItem || !productionPlan) {
            setError("No production item selected");
            return;
        }

        if (batchQuantity <= 0 || batchQuantity > maxQuantity) {
            setError("Invalid batch quantity. Please select a valid quantity.");
            return;
        }

        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            const response = await ProductionPlanApis.requestMaterialIssuance(
                productionPlan._id,
                itemIndex,
                { quantity: batchQuantity }
            );

            if (response.status === 201) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    router.push(`/dashboard/planning/${productionPlan._id}`);
                }, 2000);
            } else {
                throw new Error(response.data?.message || "Failed to request materials.");
            }
        } catch (error: any) {
            console.error("Error requesting materials:", error);
            setError(error.response?.data?.message || error.message || "An error occurred while requesting materials.");
        } finally {
            setSubmitting(false);
        }
    };

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
                           <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Request Manufacturing Batch
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Submit a request for material issuance to create a production batch
                            </p>
                        </div>
                    </div>
                </div>

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            <p className="text-green-800 font-medium">{success}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-gray-700">Loading production plan...</span>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-8">
                        {productionPlan && (
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Plan Details</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Plan Name:</p>
                                            <p className="text-sm font-medium">{productionPlan.plan_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Plan Type:</p>
                                            <p className="text-sm font-medium">{productionPlan.plan_type}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Date Range:</p>
                                        <p className="text-sm font-medium">{formatDate(productionPlan.start_date)} - {formatDate(productionPlan.end_date)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedItem && (
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Product:</p>
                                            <p className="text-sm font-medium">{selectedItem.finished_good_id.product_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Current Stock:</p>
                                            <p className="text-sm font-medium">
                                                {selectedItem.finished_good_id.current_stock} {selectedItem.finished_good_id.unit}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Workflow:</p>
                                            <p className="text-sm font-medium">{selectedItem.workflow_id.workflow_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Progress:</p>
                                            <p className="text-sm font-medium">
                                                {selectedItem.quantity_produced}/{selectedItem.quantity_planned} {selectedItem.finished_good_id.unit}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Configuration</h3>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                    Batch Quantity <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={maxQuantity}
                                    value={batchQuantity}
                                    onChange={handleBatchQuantityChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Maximum available quantity: {maxQuantity} {selectedItem?.finished_good_id.unit}
                                </p>
                            </div>
                        </div>

                        {selectedItem && selectedItem.raw_materials.length > 0 && (
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw Materials Required</h3>
                                <div className="space-y-4">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Required for Batch</th>
                                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Available Stock</th>
                                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {materialsForBatch.map((material) => (
                                                    <tr key={material.material_id._id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{material.material_id.material_name}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{material.requirementForBatch.toFixed(2)} {material.material_id.unit}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{material.material_id.current_stock} {material.material_id.unit}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                    !material.isAvailable
                                                                        ? "bg-red-100 text-red-800"
                                                                        : "bg-green-100 text-green-800"
                                                                }`}
                                                            >
                                                                {!material.isAvailable ? "Insufficient" : "Available"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-4">
                            <Button variant="outline" onClick={() => router.back()} className="px-4 py-2">
                                Cancel
                            </Button>
                            
                            <Button 
                                variant="primary"
                                onClick={handleRequestMaterials}
                                className="px-4 py-2"
                                disabled={submitting || batchQuantity <= 0 || batchQuantity > maxQuantity || materialsForBatch.some(m => !m.isAvailable)}
                            >
                                {submitting ? "Requesting..." : "Request Materials for Batch"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateManufacturingBatchPage;
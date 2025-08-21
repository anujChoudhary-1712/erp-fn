"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductionPlanApis from "@/actions/Apis/ProductionPlanApis";
import GoodsApis from "@/actions/Apis/GoodsApis";
import Button from "@/components/ReusableComponents/Button";
import { useUser } from "@/context/UserContext";

// TypeScript interfaces
interface FinishedGood {
  _id: string;
  product_name: string;
  unit: string;
  unit_price: number;
  current_stock: number;
  workflows: string[]; // Array of workflow IDs
  raw_materials_used: RawMaterial[];
}

interface RawMaterial {
  _id: string;
  material_name: string;
  description?: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
  stock_used: number;
  product_id?: string;
}

interface ProductionItem {
  finished_good_id: string;
  quantity_planned: number;
  workflow_id: string;
  raw_materials?: {
    material_id: string;
    quantity_required: number;
    status: string;
  }[];
}

interface ProductionPlanData {
  plan_name: string;
  plan_type: "Monthly" | "Weekly" | "Daily" | "Custom"; // Added Custom option
  start_date: string;
  end_date: string;
  production_items: ProductionItem[];
}

const CreateProductionPlanPage: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();

  // State for multi-step form
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Data fetching states
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // Generate a unique plan ID
  const generatePlanId = () => {
    const now = new Date();
    const year = now.getFullYear().toString().substr(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PLAN-${year}${month}${day}-${random}`;
  };

  // Function to calculate end date based on plan type and start date
  const calculateEndDate = (startDate: string, planType: "Daily" | "Weekly" | "Monthly" | "Custom"): string => {
    const start = new Date(startDate);
    const endDate = new Date(start);
    
    switch (planType) {
      case "Daily":
        endDate.setDate(start.getDate() + 1); // Next day
        break;
      case "Weekly":
        endDate.setDate(start.getDate() + 7); // 7 days from start
        break;
      case "Monthly":
        endDate.setDate(start.getDate() + 30); // 30 days from start
        break;
      case "Custom":
        // For custom, don't auto-calculate, return the start date (user will set manually)
        return startDate;
      default:
        endDate.setDate(start.getDate() + 1);
    }
    
    return endDate.toISOString().split("T")[0];
  };

  // Production plan data with auto-generated plan ID
  const [productionPlan, setProductionPlan] = useState<ProductionPlanData>(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      plan_name: generatePlanId(),
      plan_type: "Daily",
      start_date: today,
      end_date: calculateEndDate(today, "Daily"),
      production_items: [],
    };
  });

  // Fetch finished goods on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingProducts(true);
      try {
        // Fetch finished goods - this already includes workflows and raw materials
        const goodsResponse = await GoodsApis.getAllGoods();
        if (goodsResponse.status === 200) {
          setFinishedGoods(goodsResponse.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchData();
  }, []);

  // Handle basic plan info change
  const handlePlanInfoChange = (field: keyof ProductionPlanData, value: any) => {
    // Don't allow changing the plan_name (Plan ID) as it's auto-generated
    if (field === "plan_name") return;
    
    setProductionPlan(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Auto-calculate end date when plan type or start date changes (except for Custom)
      if (field === "plan_type") {
        if (value !== "Custom") {
          updated.end_date = calculateEndDate(prev.start_date, value);
        }
        // For Custom, keep the existing end_date or set it to start_date if not set
        else {
          updated.end_date = prev.end_date || prev.start_date;
        }
      } else if (field === "start_date") {
        if (prev.plan_type !== "Custom") {
          updated.end_date = calculateEndDate(value, prev.plan_type);
        }
      }

      return updated;
    });
  };

  // Add production item
  const handleAddProductionItem = () => {
    setProductionPlan(prev => ({
      ...prev,
      production_items: [
        ...prev.production_items,
        {
          finished_good_id: "",
          quantity_planned: 1,
          workflow_id: "",
          raw_materials: []
        }
      ]
    }));
  };

  // Update production item
  const handleProductionItemChange = (index: number, field: keyof ProductionItem, value: any) => {
    setProductionPlan(prev => {
      const updatedItems = [...prev.production_items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };

      // If the product changes, automatically select the first workflow
      if (field === "finished_good_id") {
        const selectedProduct = finishedGoods.find(p => p._id === value);
        
        // Set the workflow ID to the first workflow in the product's workflows array
        if (selectedProduct && selectedProduct.workflows && selectedProduct.workflows.length > 0) {
          updatedItems[index].workflow_id = selectedProduct.workflows[0];
        } else {
          updatedItems[index].workflow_id = "";
        }
        
        // Calculate raw materials based on the selected product
        if (selectedProduct && selectedProduct.raw_materials_used) {
          const quantity = updatedItems[index].quantity_planned;
          
          updatedItems[index].raw_materials = selectedProduct.raw_materials_used.map(material => {
            const requiredQuantity = material.stock_used * quantity;
            return {
              material_id: material._id,
              quantity_required: requiredQuantity,
              status: material.current_stock >= requiredQuantity ? "Pending" : "Insufficient"
            };
          });
        }
      }
      
      // If quantity changes, recalculate material requirements
      if (field === "quantity_planned") {
        const selectedProduct = finishedGoods.find(p => p._id === updatedItems[index].finished_good_id);
        
        if (selectedProduct && selectedProduct.raw_materials_used) {
          const quantity = value;
          
          updatedItems[index].raw_materials = selectedProduct.raw_materials_used.map(material => {
            const requiredQuantity = material.stock_used * quantity;
            return {
              material_id: material._id,
              quantity_required: requiredQuantity,
              status: material.current_stock >= requiredQuantity ? "Pending" : "Insufficient"
            };
          });
        }
      }

      return {
        ...prev,
        production_items: updatedItems
      };
    });
  };

  // Remove production item
  const handleRemoveProductionItem = (index: number) => {
    setProductionPlan(prev => {
      const updatedItems = [...prev.production_items];
      updatedItems.splice(index, 1);
      return {
        ...prev,
        production_items: updatedItems
      };
    });
  };

  // Submit production plan
  const handleSubmit = async () => {
    // Validate inputs
    if (!productionPlan.start_date || !productionPlan.end_date) {
      setError("Start and end dates are required");
      return;
    }

    if (new Date(productionPlan.start_date) > new Date(productionPlan.end_date)) {
      setError("End date must be after start date");
      return;
    }

    if (productionPlan.production_items.length === 0) {
      setError("At least one production item is required");
      return;
    }

    if (productionPlan.production_items.some(item => !item.finished_good_id)) {
      setError("All production items must have a product selected");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await ProductionPlanApis.createProductionPlan({
        ...productionPlan,
        org_id: user?.organizationId
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess("Production plan created successfully!");
        setTimeout(() => {
          router.push("/dashboard/planning");
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Failed to create production plan");
      }
    } catch (error: any) {
      console.error("Error creating production plan:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while creating the production plan. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {[1, 2].map((step) => (
            <React.Fragment key={step}>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep === step
                    ? "border-blue-600 bg-blue-600 text-white"
                    : currentStep > step
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 text-gray-500"
                }`}
              >
                {currentStep > step ? (
                  <svg
                    className="w-6 h-6"
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
                ) : (
                  <span>{step}</span>
                )}
              </div>
              {step < 2 && (
                <div
                  className={`w-[8rem] h-1 ${
                    currentStep > step ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <div className="flex justify-between w-[16rem] text-sm text-gray-600">
            <span
              className={
                currentStep === 1 ? "font-medium text-blue-600" : "font-medium"
              }
            >
              Plan Details
            </span>
            <span
              className={
                currentStep === 2 ? "font-medium text-blue-600" : "font-medium"
              }
            >
              Production Items
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Step 1: Plan Details Form
  const renderPlanDetailsForm = () => {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Production Plan Details
          </h3>
          <div className="space-y-4">
            {/* Plan ID (read-only) */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Plan ID
              </label>
              <input
                type="text"
                value={productionPlan.plan_name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                This ID is automatically generated and cannot be changed
              </p>
            </div>

            {/* Plan Type */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Plan Type <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={productionPlan.plan_type}
                onChange={(e) => handlePlanInfoChange("plan_type", e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Custom">Custom</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {productionPlan.plan_type === "Custom" 
                  ? "Custom plan allows you to set your own date range"
                  : `End date will automatically adjust based on plan type: Daily (+1 day), Weekly (+7 days), Monthly (+30 days)`
                }
              </p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Start Date <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={productionPlan.start_date}
                  onChange={(e) => handlePlanInfoChange("start_date", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  End Date <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={productionPlan.end_date}
                  onChange={(e) => handlePlanInfoChange("end_date", e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    productionPlan.plan_type === "Custom" ? "" : "bg-gray-50"
                  }`}
                  required
                  readOnly={productionPlan.plan_type !== "Custom"}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {productionPlan.plan_type === "Custom" 
                    ? "Select your custom end date"
                    : "Auto-calculated based on plan type and start date"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => setCurrentStep(2)}
            className="px-4 py-2"
            disabled={!productionPlan.start_date || !productionPlan.end_date}
          >
            Next: Add Products
          </Button>
        </div>
      </div>
    );
  };

  // Step 2: Production Items Form
  const renderProductionItemsForm = () => {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Production Items
            </h3>
            <Button
              variant="outline"
              onClick={handleAddProductionItem}
              className="text-sm"
            >
              + Add Item
            </Button>
          </div>

          {productionPlan.production_items.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No items added
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Click &quot;Add Item&quot; to add products to your production plan.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {productionPlan.production_items.map((item, index) => {
                // Get the selected product for display
                const selectedProduct = finishedGoods.find(
                  (product) => product._id === item.finished_good_id
                );

                return (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-md bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs mr-2">
                          {index + 1}
                        </span>
                        <h5 className="text-sm font-medium text-gray-700">
                          Production Item
                        </h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProductionItem(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Product Selection */}
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">
                          Product <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={item.finished_good_id}
                          onChange={(e) =>
                            handleProductionItemChange(
                              index,
                              "finished_good_id",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select a product</option>
                          {finishedGoods.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.product_name} ({product.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">
                          Quantity <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity_planned}
                          onChange={(e) =>
                            handleProductionItemChange(
                              index,
                              "quantity_planned",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {selectedProduct && (
                          <p className="text-xs text-gray-500 mt-1">
                            Current stock: {selectedProduct.current_stock} {selectedProduct.unit}
                          </p>
                        )}
                      </div>

                      {/* Raw Materials (if any) */}
                      {item.raw_materials && item.raw_materials.length > 0 && (
                        <div className="mt-4">
                          <h6 className="text-xs font-medium text-gray-700 mb-2">
                            Required Raw Materials
                          </h6>
                          <div className="border border-gray-200 rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th
                                    scope="col"
                                    className="px-4 py-2 text-xs font-medium text-gray-500 text-left"
                                  >
                                    Material
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 py-2 text-xs font-medium text-gray-500 text-right"
                                  >
                                    Required
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 py-2 text-xs font-medium text-gray-500 text-right"
                                  >
                                    Available
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-4 py-2 text-xs font-medium text-gray-500 text-center"
                                  >
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {item.raw_materials.map((material, matIndex) => {
                                  // Get material details from the selected product's raw_materials_used
                                  const materialDetails = selectedProduct?.raw_materials_used.find(
                                    m => m._id === material.material_id
                                  );
                                  
                                  return (
                                    <tr key={matIndex}>
                                      <td className="px-4 py-2 text-xs text-gray-900">
                                        {materialDetails?.material_name || "Unknown Material"}
                                      </td>
                                      <td className="px-4 py-2 text-xs text-gray-900 text-right">
                                        {material.quantity_required} {materialDetails?.unit}
                                      </td>
                                      <td className="px-4 py-2 text-xs text-gray-900 text-right">
                                        {materialDetails?.current_stock} {materialDetails?.unit}
                                      </td>
                                      <td className="px-4 py-2 text-xs text-center">
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            material.status === "Insufficient"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-green-100 text-green-800"
                                          }`}
                                        >
                                          {material.status}
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between space-x-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(1)}
            className="px-4 py-2"
          >
            Back
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="px-4 py-2"
            disabled={
              loading || 
              productionPlan.production_items.length === 0 ||
              productionPlan.production_items.some(item => !item.finished_good_id)
            }
          >
            {loading ? "Creating..." : "Create Production Plan"}
          </Button>
        </div>
      </div>
    );
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
                Create Production Plan
              </h1>
              <p className="text-gray-600 mt-1">
                {currentStep === 1
                  ? "Define basic details for your production plan"
                  : "Add products and specify quantities for production"}
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

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

        {/* Loading indicator for products data */}
        {loadingProducts ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-700">Loading product data...</span>
          </div>
        ) : (
          // Step Content
          <div>
            {currentStep === 1 && renderPlanDetailsForm()}
            {currentStep === 2 && renderProductionItemsForm()}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                Creating production plan...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProductionPlanPage;
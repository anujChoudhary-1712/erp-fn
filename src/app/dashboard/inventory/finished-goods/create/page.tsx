/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GoodsApis from "@/actions/Apis/GoodsApis";
import CreateGoodsForm, {
  FinishedGoodData,
} from "@/components/forms/CreateGoodsForm";
import { useUser } from "@/context/UserContext";
import RawMaterialApis from "@/actions/Apis/RawMaterialApis";
import WorkflowApis from "@/actions/Apis/WorkflowApis";

interface VerificationParameter {
  parameter: string;
  specificationValue: string;
}

interface Dimension {
  type: string; // stock_length, stock_width, usage_length, usage_width
  value: number;
  unit: string;
}

interface RawMaterialData {
  // Section 1: Basic Information
  material_name: string;
  category: string;
  description: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
  product_id: string;
  stock_used: number;
  trigger_value: number;

  // Section 2: Verification Report
  verificationParameters: VerificationParameter[];

  // Section 3: Stock & Dimensions
  hasDimensions: boolean;
  dimensions: Dimension[];
  // Additional fields for dimensional calculations
  total_area?: number;
  usage_area?: number;
}

interface WorkflowStage {
  stage_name: string;
  sequence_order: number;
  quality_check_required: boolean;
}

interface WorkflowData {
  workflow_name: string;
  finished_product_id: string;
  stages: WorkflowStage[];
}

const CreateProductPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Get product ID from URL params if exists
  const productId = searchParams.get("pId") || "";

  // State management
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Materials state
  const [materials, setMaterials] = useState<RawMaterialData[]>([]);
  const [currentMaterial, setCurrentMaterial] = useState<RawMaterialData>({
    // Section 1
    material_name: "",
    category: "",
    description: "",
    unit: "meter",
    current_stock: 0,
    unit_cost: 0,
    product_id: productId,
    stock_used: 0,
    trigger_value: 0,

    // Section 2
    verificationParameters: [],

    // Section 3
    hasDimensions: false,
    dimensions: [],
  });

  // Temporary states for adding verification parameters
  const [tempParameter, setTempParameter] = useState<VerificationParameter>({
    parameter: "",
    specificationValue: "",
  });

  // Temporary states for equipment and dimensions
  const [tempDimension, setTempDimension] = useState<Dimension>({
    type: "stock_length",
    value: 0,
    unit: "meter",
  });

  // Function to calculate area when length and width dimensions are present
  const calculateArea = (
    dimensions: Dimension[]
  ): { stockArea: number; usageArea: number } => {
    let stockLength = 0;
    let stockWidth = 0;
    let usageLength = 0;
    let usageWidth = 0;

    // Find the length and width values
    dimensions.forEach((dim) => {
      if (dim.type === "stock_length") stockLength = dim.value;
      if (dim.type === "stock_width") stockWidth = dim.value;
      if (dim.type === "usage_length") usageLength = dim.value;
      if (dim.type === "usage_width") usageWidth = dim.value;
    });

    // Calculate areas
    const stockArea =
      stockLength > 0 && stockWidth > 0 ? stockLength * stockWidth : 0;
    const usageArea =
      usageLength > 0 && usageWidth > 0 ? usageLength * usageWidth : 0;

    return { stockArea, usageArea };
  };

  // Workflow state (keeping the existing workflow logic)
  const [workflow, setWorkflow] = useState<WorkflowData>({
    workflow_name: "",
    finished_product_id: productId,
    stages: [
      {
        stage_name: "Cutting",
        sequence_order: 1,
        quality_check_required: true,
      },
    ],
  });

  // Handle Step 1: Create finished good (keeping existing logic)
  const handleCreateFinishedGood = async (
    data: FinishedGoodData
  ): Promise<void> => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const goodsData = {
        product_name: data.product_name.trim(),
        description: data.description.trim(),
        unit: data.unit,
        current_stock: Number(data.current_stock),
        unit_price: Number(data.unit_price),
        trigger_value: Number(data.trigger_value),
        org_id: user?.organizationId || "",
      };

      const response = await GoodsApis.createFinishedGood(goodsData);

      if (response.status === 200 || response.status === 201) {
        const id = response?.data?.finishedGood?._id;
        setSuccess("Finished good created successfully!");
        router.push(`?pId=${id}`);
        setCurrentMaterial((prev) => ({ ...prev, product_id: id }));
        setWorkflow((prev) => ({ ...prev, finished_product_id: id }));
        setCurrentStep(2);
      } else {
        throw new Error(
          response.data?.message || "Failed to create finished good"
        );
      }
    } catch (error: any) {
      console.error("Error creating finished good:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while creating the finished good. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Material Form Input Change
  const handleMaterialChange = (
    field: keyof RawMaterialData,
    value: string | number | boolean
  ): void => {
    if (typeof value === "string" && !isNaN(Number(value))) {
      const numericFields = [
        "current_stock",
        "unit_cost",
        "stock_used",
        "trigger_value",
      ];
      if (numericFields.includes(field as string)) {
        value = Number(value);
      }
    }

    setCurrentMaterial((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle adding verification parameter
  const handleAddVerificationParameter = (): void => {
    if (
      !tempParameter.parameter.trim() ||
      !tempParameter.specificationValue.trim()
    ) {
      setError("Both parameter and specification value are required");
      return;
    }

    setCurrentMaterial((prev) => ({
      ...prev,
      verificationParameters: [
        ...prev.verificationParameters,
        { ...tempParameter },
      ],
    }));

    setTempParameter({
      parameter: "",
      specificationValue: "",
    });
    setError("");
  };

  // Handle removing verification parameter
  const handleRemoveVerificationParameter = (index: number): void => {
    setCurrentMaterial((prev) => ({
      ...prev,
      verificationParameters: prev.verificationParameters.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // Handle adding dimension
  const handleAddDimension = (): void => {
    if (!tempDimension.type.trim() || tempDimension.value <= 0) {
      setError("Dimension type and value are required");
      return;
    }

    setCurrentMaterial((prev) => {
      // Add the dimension
      const newDimensions = [...prev.dimensions, { ...tempDimension }];

      // Calculate areas based on dimensions
      const { stockArea, usageArea } = calculateArea(newDimensions);

      // Update stock and usage values if areas are calculated
      const updatedMaterial = {
        ...prev,
        dimensions: newDimensions,
      };

      // If we have both stock dimensions, update the current_stock with the calculated area
      if (stockArea > 0) {
        updatedMaterial.total_area = stockArea;
        updatedMaterial.current_stock = stockArea;
      }

      // If we have both usage dimensions, update the stock_used with the calculated area
      if (usageArea > 0) {
        updatedMaterial.usage_area = usageArea;
        updatedMaterial.stock_used = usageArea;
      }

      return updatedMaterial;
    });

    setTempDimension({
      type: "stock_length",
      value: 0,
      unit: "meter",
    });
    setError("");
  };

  // Handle removing dimension
  const handleRemoveDimension = (index: number): void => {
    setCurrentMaterial((prev) => {
      // Remove the dimension
      const newDimensions = prev.dimensions.filter((_, i) => i !== index);

      // Recalculate areas
      const { stockArea, usageArea } = calculateArea(newDimensions);

      // Update the material with new values
      const updatedMaterial = {
        ...prev,
        dimensions: newDimensions,
      };

      // Update stock area if applicable
      if (stockArea > 0) {
        updatedMaterial.total_area = stockArea;
        updatedMaterial.current_stock = stockArea;
      } else if (prev.hasDimensions) {
        // Reset if no dimensions left
        updatedMaterial.total_area = 0;
        if (prev.total_area === prev.current_stock) {
          updatedMaterial.current_stock = 0;
        }
      }

      // Update usage area if applicable
      if (usageArea > 0) {
        updatedMaterial.usage_area = usageArea;
        updatedMaterial.stock_used = usageArea;
      } else if (prev.hasDimensions) {
        // Reset if no dimensions left
        updatedMaterial.usage_area = 0;
        if (prev.usage_area === prev.stock_used) {
          updatedMaterial.stock_used = 0;
        }
      }

      return updatedMaterial;
    });
  };

  // Add a material to the list
  // Add a material to the list
  const handleAddMaterial = (): void => {
    // Basic validation
    if (!currentMaterial.material_name.trim()) {
      setError("Material name is required");
      return;
    }
    if (!currentMaterial.category.trim()) {
      setError("Category is required");
      return;
    }
    if (currentMaterial.unit_cost <= 0) {
      setError("Unit cost must be greater than 0");
      return;
    }
    if (currentMaterial.stock_used <= 0) {
      setError("Stock used must be greater than 0");
      return;
    }

    // Add to materials array as is
    setMaterials((prev) => [...prev, { ...currentMaterial }]);

    // Reset form for next material
    setCurrentMaterial({
      material_name: "",
      category: "",
      description: "",
      unit: "meter",
      current_stock: 0,
      unit_cost: 0,
      product_id: productId || currentMaterial.product_id,
      stock_used: 0,
      trigger_value: 0,
      verificationParameters: [], // Make sure this matches what your API expects
      hasDimensions: false,
      dimensions: [],
    });

    setError("");
    setSuccess("Material added to the list");
  };

  // Remove a material from the list
  const handleRemoveMaterial = (index: number): void => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit all materials
  const handleSubmitMaterials = async (): Promise<void> => {
    if (materials.length === 0) {
      setError("Please add at least one material");
      return;
    }
  
    setLoading(true);
    setError("");
    setSuccess("");
  
    try {
      // Just validate the dimension types
      materials.forEach(material => {
        if (material.dimensions && material.dimensions.length > 0) {
          material.dimensions.forEach(dim => {
            if (!['stock_length', 'stock_width', 'usage_length', 'usage_width'].includes(dim.type)) {
              throw new Error(`Invalid dimension type: ${dim.type}`);
            }
          });
        }
      });
  
      // Submit materials as is
      const promises = materials.map((material) =>
        RawMaterialApis.addMaterial(material)
      );
  
      const results = await Promise.all(promises);
      const allSuccessful = results.every(
        (res) => res.status === 200 || res.status === 201
      );
  
      if (allSuccessful) {
        setSuccess("All materials added successfully!");
        setCurrentStep(3);
      } else {
        throw new Error("Some materials failed to be added");
      }
    } catch (error: any) {
      console.error("Error adding materials:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while adding materials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Workflow handlers (keeping existing logic)
  const handleWorkflowChange = (
    field: keyof WorkflowData,
    value: string
  ): void => {
    setWorkflow((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStageChange = (
    index: number,
    field: keyof WorkflowStage,
    value: any
  ): void => {
    setWorkflow((prev) => {
      const newStages = [...prev.stages];
      newStages[index] = {
        ...newStages[index],
        [field]: value,
      };
      return {
        ...prev,
        stages: newStages,
      };
    });
  };

  const handleAddStage = (): void => {
    setWorkflow((prev) => {
      const newStages = [...prev.stages];
      const nextOrder = newStages.length + 1;
      newStages.push({
        stage_name: "",
        sequence_order: nextOrder,
        quality_check_required: true,
      });
      return {
        ...prev,
        stages: newStages,
      };
    });
  };

  const handleRemoveStage = (index: number): void => {
    if (workflow.stages.length <= 1) {
      setError("At least one stage is required");
      return;
    }

    setWorkflow((prev) => {
      const newStages = prev.stages.filter((_, i) => i !== index);
      newStages.forEach((stage, i) => {
        stage.sequence_order = i + 1;
      });
      return {
        ...prev,
        stages: newStages,
      };
    });
  };

  const handleSubmitWorkflow = async (): Promise<void> => {
    if (!workflow.workflow_name.trim()) {
      setError("Workflow name is required");
      return;
    }

    if (workflow.stages.some((stage) => !stage.stage_name.trim())) {
      setError("All stages must have a name");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await WorkflowApis.addWorkflow(workflow);

      if (response.status === 200 || response.status === 201) {
        setSuccess("Workflow added successfully! Product setup is complete.");
        setTimeout(() => {
          router.push("/dashboard/inventory/finished-goods");
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Failed to add workflow");
      }
    } catch (error: any) {
      console.error("Error adding workflow:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "An error occurred while adding workflow. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Render the step indicator (keeping existing)
  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {[1, 2, 3].map((step) => (
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
              {step < 3 && (
                <div
                  className={`w-20 h-1 ${
                    currentStep > step ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <div className="flex justify-between w-64 text-sm text-gray-600">
            <span
              className={
                currentStep === 1 ? "font-medium text-blue-600" : "font-medium"
              }
            >
              Product
            </span>
            <span
              className={
                currentStep === 2 ? "font-medium text-blue-600" : "font-medium"
              }
            >
              Materials
            </span>
            <span
              className={
                currentStep === 3 ? "font-medium text-blue-600" : "font-medium"
              }
            >
              Workflow
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render the appropriate form based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CreateGoodsForm
            onSubmit={handleCreateFinishedGood}
            loading={loading}
          />
        );
      case 2:
        return (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Updated Materials Form with Three Sections */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Add Raw Material
              </h3>

              {/* Section 1: Basic Information */}
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  1. Basic Information
                </h4>

                <div className="space-y-4">
                  {/* Material Name and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Material Name{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={currentMaterial.material_name}
                        onChange={(e) =>
                          handleMaterialChange("material_name", e.target.value)
                        }
                        placeholder="Enter material name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Category <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={currentMaterial.category}
                        onChange={(e) =>
                          handleMaterialChange("category", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select category</option>
                        <option value="fabric">Fabric</option>
                        <option value="thread">Thread</option>
                        <option value="button">Button</option>
                        <option value="zipper">Zipper</option>
                        <option value="accessory">Accessory</option>
                        <option value="hardware">Hardware</option>
                        <option value="packaging">Packaging</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={currentMaterial.description}
                      onChange={(e) =>
                        handleMaterialChange("description", e.target.value)
                      }
                      placeholder="Enter material description"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Verification Report */}
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  2. Verification Report
                </h4>

                <div className="space-y-4">
                  {/* Add Verification Parameter */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Parameter
                      </label>
                      <input
                        type="text"
                        value={tempParameter.parameter}
                        onChange={(e) =>
                          setTempParameter((prev) => ({
                            ...prev,
                            parameter: e.target.value,
                          }))
                        }
                        placeholder="e.g., Tensile Strength"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Specification Value
                      </label>
                      <input
                        type="text"
                        value={tempParameter.specificationValue}
                        onChange={(e) =>
                          setTempParameter((prev) => ({
                            ...prev,
                            specificationValue: e.target.value,
                          }))
                        }
                        placeholder="e.g., 500 N/mm²"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleAddVerificationParameter}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Add Parameter
                      </button>
                    </div>
                  </div>

                  {/* Display Verification Parameters */}
                  {currentMaterial.verificationParameters.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Added Parameters (
                        {currentMaterial.verificationParameters.length})
                      </h5>
                      <div className="space-y-2">
                        {currentMaterial.verificationParameters.map(
                          (param, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-white p-3 rounded border"
                            >
                              <div>
                                <span className="font-medium text-gray-900">
                                  {param.parameter}:
                                </span>{" "}
                                <span className="text-gray-700">
                                  {param.specificationValue}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveVerificationParameter(index)
                                }
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Stock Information & Dimensions */}
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  3. Stock Information & Dimensions
                </h4>

                <div className="space-y-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Stock Information
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Unit <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={currentMaterial.unit}
                          onChange={(e) =>
                            handleMaterialChange("unit", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {!currentMaterial.hasDimensions ? (
                            <>
                              <option value="meter">Meter</option>
                              <option value="kg">Kilogram</option>
                              <option value="liter">Liter</option>
                              <option value="piece">Piece</option>
                              <option value="box">Box</option>
                              <option value="roll">Roll</option>
                              <option value="yard">Yard</option>
                              <option value="gram">Gram</option>
                            </>
                          ) : (
                            <>
                              <option value="square_meter">Square Meter</option>
                              <option value="square_feet">Square Feet</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          {currentMaterial.hasDimensions
                            ? "Current Total Area"
                            : "Current Stock"}{" "}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          value={currentMaterial.current_stock}
                          onChange={(e) =>
                            handleMaterialChange(
                              "current_stock",
                              e.target.value
                            )
                          }
                          placeholder="0"
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            currentMaterial.hasDimensions &&
                            currentMaterial.total_area !== undefined
                              ? "bg-gray-100"
                              : ""
                          }`}
                          min="0"
                          step="0.01"
                          readOnly={
                            currentMaterial.hasDimensions &&
                            currentMaterial.total_area !== undefined
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Unit Cost <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          value={currentMaterial.unit_cost}
                          onChange={(e) =>
                            handleMaterialChange("unit_cost", e.target.value)
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          {currentMaterial.hasDimensions
                            ? "Area Used per Product"
                            : "Stock Used per Unit"}{" "}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          value={currentMaterial.stock_used}
                          onChange={(e) =>
                            handleMaterialChange("stock_used", e.target.value)
                          }
                          placeholder="0"
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            currentMaterial.hasDimensions &&
                            currentMaterial.usage_area !== undefined
                              ? "bg-gray-100"
                              : ""
                          }`}
                          min="0"
                          step="0.01"
                          readOnly={
                            currentMaterial.hasDimensions &&
                            currentMaterial.usage_area !== undefined
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          {currentMaterial.hasDimensions
                            ? "Minimum Area Alert"
                            : "Alert Stock Value"}{" "}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          value={currentMaterial.trigger_value}
                          onChange={(e) =>
                            handleMaterialChange(
                              "trigger_value",
                              e.target.value
                            )
                          }
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dimensions Section */}
                  <div>
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        id="hasDimensions"
                        checked={currentMaterial.hasDimensions}
                        onChange={(e) => {
                          handleMaterialChange(
                            "hasDimensions",
                            e.target.checked
                          );
                          // If dimensions are enabled, default to square_meter unit
                          if (
                            e.target.checked &&
                            currentMaterial.unit !== "square_meter" &&
                            currentMaterial.unit !== "square_feet"
                          ) {
                            handleMaterialChange("unit", "square_meter");
                          } else if (
                            !e.target.checked &&
                            (currentMaterial.unit === "square_meter" ||
                              currentMaterial.unit === "square_feet")
                          ) {
                            // If dimensions are disabled, switch back to a non-area unit
                            handleMaterialChange("unit", "meter");
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="hasDimensions"
                        className="ml-2 text-sm font-medium text-gray-700"
                      >
                        This material needs to be tracked by area (fabric,
                        sheets, etc.)
                      </label>
                    </div>

                    {currentMaterial.hasDimensions && (
                      <div className="space-y-4">
                        {/* Inform user about automatic calculations */}
                        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                          <p>
                            Adding stock dimensions (length and width) will
                            automatically calculate the total area. Similarly,
                            adding usage dimensions will calculate the area used
                            per product.
                          </p>
                        </div>

                        {/* Add Dimension */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Dimension Type
                            </label>
                            <select
                              value={tempDimension.type}
                              onChange={(e) =>
                                setTempDimension((prev) => ({
                                  ...prev,
                                  type: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <optgroup label="Stock Dimensions">
                                <option value="stock_length">
                                  Stock Length
                                </option>
                                <option value="stock_width">Stock Width</option>
                              </optgroup>
                              <optgroup label="Usage Dimensions">
                                <option value="usage_length">
                                  Usage Length per Product
                                </option>
                                <option value="usage_width">
                                  Usage Width per Product
                                </option>
                              </optgroup>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Value
                            </label>
                            <input
                              type="number"
                              value={tempDimension.value}
                              onChange={(e) =>
                                setTempDimension((prev) => ({
                                  ...prev,
                                  value: parseFloat(e.target.value) || 0,
                                }))
                              }
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Unit
                            </label>
                            <select
                              value={tempDimension.unit}
                              onChange={(e) =>
                                setTempDimension((prev) => ({
                                  ...prev,
                                  unit: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="meter">Meter</option>
                              <option value="centimeter">Centimeter</option>
                              <option value="millimeter">Millimeter</option>
                              <option value="inch">Inch</option>
                              <option value="feet">Feet</option>
                              <option value="yard">Yard</option>
                              <option value="square_meter">Square Meter</option>
                              <option value="square_feet">Square Feet</option>
                            </select>
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={handleAddDimension}
                              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            >
                              Add Dimension
                            </button>
                          </div>
                        </div>

                        {/* Display Dimensions */}
                        {currentMaterial.dimensions.length > 0 && (
                          <div className="bg-gray-50 p-4 rounded-md">
                            <h6 className="text-sm font-medium text-gray-700 mb-3">
                              Material Dimensions (
                              {currentMaterial.dimensions.length})
                            </h6>

                            <div className="grid grid-cols-1 gap-4">
                              {/* Stock dimensions group */}
                              {currentMaterial.dimensions.some((d) =>
                                d.type.startsWith("stock_")
                              ) && (
                                <div className="border-l-4 border-green-500 pl-3">
                                  <h6 className="text-sm font-medium text-gray-700 mb-2">
                                    Stock Dimensions
                                  </h6>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {currentMaterial.dimensions
                                      .filter((d) =>
                                        d.type.startsWith("stock_")
                                      )
                                      .map((dimension) => {
                                        const dimensionIndex =
                                          currentMaterial.dimensions.findIndex(
                                            (d) => d.type === dimension.type
                                          );
                                        return (
                                          <div
                                            key={dimensionIndex}
                                            className="flex justify-between items-center bg-white p-3 rounded border"
                                          >
                                            <div>
                                              <span className="font-medium text-gray-900 capitalize">
                                                {dimension.type ===
                                                "stock_length"
                                                  ? "Length"
                                                  : dimension.type ===
                                                    "stock_width"
                                                  ? "Width"
                                                  : dimension.type}
                                                :
                                              </span>{" "}
                                              <span className="text-gray-700">
                                                {dimension.value}{" "}
                                                {dimension.unit}
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRemoveDimension(
                                                  dimensionIndex
                                                )
                                              }
                                              className="text-red-600 hover:text-red-800 text-sm ml-2"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        );
                                      })}
                                  </div>

                                  {/* Display calculated stock area if both dimensions present */}
                                  {currentMaterial.total_area !== undefined &&
                                    currentMaterial.total_area > 0 && (
                                      <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                                        <span className="font-medium">
                                          Calculated Total Area:
                                        </span>{" "}
                                        {currentMaterial.total_area.toFixed(2)}{" "}
                                        {currentMaterial.unit}
                                      </div>
                                    )}
                                </div>
                              )}

                              {/* Usage dimensions group */}
                              {currentMaterial.dimensions.some((d) =>
                                d.type.startsWith("usage_")
                              ) && (
                                <div className="border-l-4 border-blue-500 pl-3">
                                  <h6 className="text-sm font-medium text-gray-700 mb-2">
                                    Usage Dimensions (per product)
                                  </h6>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {currentMaterial.dimensions
                                      .filter((d) =>
                                        d.type.startsWith("usage_")
                                      )
                                      .map((dimension) => {
                                        const dimensionIndex =
                                          currentMaterial.dimensions.findIndex(
                                            (d) => d.type === dimension.type
                                          );
                                        return (
                                          <div
                                            key={dimensionIndex}
                                            className="flex justify-between items-center bg-white p-3 rounded border"
                                          >
                                            <div>
                                              <span className="font-medium text-gray-900 capitalize">
                                                {dimension.type ===
                                                "usage_length"
                                                  ? "Length"
                                                  : dimension.type ===
                                                    "usage_width"
                                                  ? "Width"
                                                  : dimension.type}
                                                :
                                              </span>{" "}
                                              <span className="text-gray-700">
                                                {dimension.value}{" "}
                                                {dimension.unit}
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRemoveDimension(
                                                  dimensionIndex
                                                )
                                              }
                                              className="text-red-600 hover:text-red-800 text-sm ml-2"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        );
                                      })}
                                  </div>

                                  {/* Display calculated usage area if both dimensions present */}
                                  {currentMaterial.usage_area !== undefined &&
                                    currentMaterial.usage_area > 0 && (
                                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                        <span className="font-medium">
                                          Calculated Area per Product:
                                        </span>{" "}
                                        {currentMaterial.usage_area.toFixed(2)}{" "}
                                        {currentMaterial.unit}
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Material Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Add Material to List
                </button>
              </div>
            </div>

            {/* Materials List - Enhanced Display */}
            {materials.length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Added Materials ({materials.length})
                </h3>

                <div className="space-y-4">
                  {materials.map((material, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {material.material_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Category:{" "}
                            <span className="capitalize">
                              {material.category}
                            </span>
                          </p>
                          {material.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {material.description}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(index)}
                          className="text-red-600 hover:text-red-900 px-3 py-1 border border-red-300 rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Verification Parameters */}
                        {material.verificationParameters.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              Verification Parameters:
                            </h5>
                            <div className="space-y-1">
                              {material.verificationParameters.map(
                                (param, paramIndex) => (
                                  <div
                                    key={paramIndex}
                                    className="text-xs bg-blue-50 p-2 rounded"
                                  >
                                    <span className="font-medium">
                                      {param.parameter}:
                                    </span>{" "}
                                    {param.specificationValue}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Stock Information */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Stock Details:
                          </h5>
                          <div className="text-xs bg-green-50 p-2 rounded space-y-1">
                            <div>
                              <span className="font-medium">
                                Current Stock:
                              </span>{" "}
                              {material.current_stock} {material.unit}
                            </div>
                            <div>
                              <span className="font-medium">Unit Cost:</span> ₹
                              {material.unit_cost}
                            </div>
                            <div>
                              <span className="font-medium">
                                Usage per Unit:
                              </span>{" "}
                              {material.stock_used} {material.unit}
                            </div>
                            <div>
                              <span className="font-medium">Alert Level:</span>{" "}
                              {material.trigger_value} {material.unit}
                            </div>
                          </div>
                        </div>

                        {/* Stock Dimensions */}
                        {material.hasDimensions &&
                          material.dimensions.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">
                                Dimensions:
                              </h5>
                              <div className="space-y-2">
                                {/* Stock dimensions */}
                                {material.dimensions.some((d) =>
                                  d.type.startsWith("stock_")
                                ) && (
                                  <div className="text-xs bg-green-50 p-2 rounded mb-2">
                                    <div className="font-medium mb-1">
                                      Stock Dimensions:
                                    </div>
                                    {material.dimensions
                                      .filter((d) =>
                                        d.type.startsWith("stock_")
                                      )
                                      .map((dim, dimIndex) => (
                                        <div key={dimIndex}>
                                          <span className="capitalize">
                                            {dim.type === "stock_length"
                                              ? "Length"
                                              : dim.type === "stock_width"
                                              ? "Width"
                                              : dim.type}
                                            :
                                          </span>{" "}
                                          {dim.value} {dim.unit}
                                        </div>
                                      ))}
                                    {material.total_area && (
                                      <div className="mt-1 font-medium">
                                        Total Area:{" "}
                                        {material.total_area.toFixed(2)}{" "}
                                        {material.unit}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Usage dimensions */}
                                {material.dimensions.some((d) =>
                                  d.type.startsWith("usage_")
                                ) && (
                                  <div className="text-xs bg-blue-50 p-2 rounded">
                                    <div className="font-medium mb-1">
                                      Usage per Product:
                                    </div>
                                    {material.dimensions
                                      .filter((d) =>
                                        d.type.startsWith("usage_")
                                      )
                                      .map((dim, dimIndex) => (
                                        <div key={dimIndex}>
                                          <span className="capitalize">
                                            {dim.type === "usage_length"
                                              ? "Length"
                                              : dim.type === "usage_width"
                                              ? "Width"
                                              : dim.type}
                                            :
                                          </span>{" "}
                                          {dim.value} {dim.unit}
                                        </div>
                                      ))}
                                    {material.usage_area && (
                                      <div className="mt-1 font-medium">
                                        Area per Product:{" "}
                                        {material.usage_area.toFixed(2)}{" "}
                                        {material.unit}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Materials Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmitMaterials}
                disabled={materials.length === 0 || loading}
                className={`px-4 py-2 ${
                  materials.length === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                {loading ? "Submitting..." : "Submit Materials & Continue"}
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Workflow Form - keeping existing workflow logic */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Production Workflow
              </h3>

              <div className="space-y-4">
                {/* Workflow Name */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Workflow Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={workflow.workflow_name}
                    onChange={(e) =>
                      handleWorkflowChange("workflow_name", e.target.value)
                    }
                    placeholder="Enter workflow name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Stages Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-medium text-gray-800">
                      Production Stages
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddStage}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
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
                      Add Stage
                    </button>
                  </div>

                  <div className="space-y-4">
                    {workflow.stages.map((stage, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-md bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs mr-2">
                              {stage.sequence_order}
                            </span>
                            <h5 className="text-sm font-medium text-gray-700">
                              Stage
                            </h5>
                          </div>
                          {workflow.stages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStage(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Stage Name */}
                          <div>
                            <label className="block text-xs font-medium mb-1 text-gray-700">
                              Stage Name{" "}
                              <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                              type="text"
                              value={stage.stage_name}
                              onChange={(e) =>
                                handleStageChange(
                                  index,
                                  "stage_name",
                                  e.target.value
                                )
                              }
                              placeholder="Enter stage name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>

                          {/* Quality Check */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`quality-check-${index}`}
                              checked={stage.quality_check_required}
                              onChange={(e) =>
                                handleStageChange(
                                  index,
                                  "quality_check_required",
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={`quality-check-${index}`}
                              className="ml-2 block text-sm text-gray-700"
                            >
                              Quality check required
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Workflow Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmitWorkflow}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {loading ? "Submitting..." : "Complete Setup"}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
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
                {currentStep === 1 && "Add New Product"}
                {currentStep === 2 && "Add Raw Materials"}
                {currentStep === 3 && "Setup Production Workflow"}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentStep === 1 &&
                  "Fill in the details to add a new product to your inventory"}
                {currentStep === 2 &&
                  "Specify the materials, verification parameters, equipment and dimensions"}
                {currentStep === 3 &&
                  "Define the production stages for manufacturing this product"}
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

        {/* Step Content */}
        {renderStepContent()}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 font-medium">
                {currentStep === 1 && "Adding product..."}
                {currentStep === 2 && "Submitting materials..."}
                {currentStep === 3 && "Setting up workflow..."}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProductPage;
